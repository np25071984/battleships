const cookie = require("cookie")
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {cookie: true});

const EVENT_CHANNEL_NAME_SYSTEM = 'system';
const EVENT_CHANNEL_NAME_GAME = 'game';
const EVENT_TYPE_CONNECTED = 'connected';
const EVENT_TYPE_WAITING = 'waiting';
const EVENT_TYPE_JOINED = 'joined';
const EVENT_TYPE_LEFT = 'left';
const EVENT_TYPE_SHOT = 'shot';
const EVENT_TYPE_HIT = 'hit';
const EVENT_TYPE_ANNOUNCE = 'announce';
const EVENT_TYPE_ROUND = 'round';
const EVENT_TYPE_WIN = 'win';
const EVENT_TYPE_DRAW = 'draw';
const EVENT_TYPE_DEFEAT = 'defeat';

app.set('view engine', 'ejs');
app.use(express.static('public'));

// TODO: in-memory storage for MVP purpose only
const Battleships = {
    'games': {},

    makeId(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }
        return result;
    },

    isGameExists(gameId) {
        return (gameId in this.games);
    },

    createGame(gameId) {
        this.games[gameId] = {
            'players': {},
            'shots': {}
        }
    },

    getPlayers(gameId) {
        return this.games[gameId]['players'];
    },

    joinPlayer(gameId, playerId, socketId) {
        this.games[gameId]['players'][playerId] = socketId;
    },

    resetShots(gameId) {
        this.games[gameId]['shots'] = {};
    },

    getShots(gameId) {
        return this.games[gameId]['shots'];
    },

    makeShot(gameId, event) {
        this.games[gameId]['shots'][event.playerId] = event;
    },

    doesPlayerMadeShot(gameId, playerId) {
        return (playerId in this.games[gameId]['shots']);
    },

    getCounterpartSocketId(gameId, playerId) {
        for (var pId in this.games[gameId]['players']) {
            if (pId !== playerId) {
                return this.games[gameId]['players'][pId];
            }
        }
    },

    getPlayerSocketId(gameId, playerId) {
        return this.games[gameId]['players'][playerId];
    }
};

app.get('/:gameId', (req, res) => {
    // TODO: how to handle this in a proper way
    if (req.url === '/favicon.ico') {
        res.writeHead(200, {'Content-Type': 'image/x-icon'} );
        res.end();
        console.log('favicon requested');
        return;
    }

    res.render('pages/index.ejs', {'gameId': req.params.gameId});
});

io.on('connection', (socket) => {
    var cookies = cookie.parse(socket.handshake.headers.cookie);
    if (!('gameId' in cookies)) {
        console.log("gameId is missing; exit");
        socket.disconnect();
        return;
    }

    // TODO: validate gameId value
    const gameId = cookie.gameId;
    if (!Battleships.isGameExists(gameId)) {
        Battleships.createGame(gameId);
    }

    var playerId = undefined;
    if ('playerId' in cookies) {
        // TODO: validate playerId value
        playerId = cookies.playerId;
        console.log('existing player reconnected: ' + playerId);
    } else {
        const players = Battleships.games[gameId]['players'];
        if (Object.keys(players).length === 2) {
            console.log("Too many players for the game!");
            throw new Error("Too many players");
        }

        playerId = Battleships.makeId(6);
        console.log('new player connected; playerId=' + playerId);
    }
    Battleships.joinPlayer(gameId, playerId, socket.id);

    io.sockets.to(socket.id).emit(EVENT_CHANNEL_NAME_SYSTEM, {
        'type': EVENT_TYPE_CONNECTED,
        'gameId': gameId,
        'playerId': playerId
    });

    if (Object.keys(Battleships.getPlayers(gameId)).length === 1) {
        io.sockets.to(socket.id).emit(EVENT_CHANNEL_NAME_GAME, {
            'type': EVENT_TYPE_WAITING,
            'socketId': socket.id
        });
    } else {
        socket.broadcast.emit(EVENT_CHANNEL_NAME_GAME, {
            'type': EVENT_TYPE_JOINED,
            'socketId': socket.id
        });

        io.emit(EVENT_CHANNEL_NAME_GAME, {
            'type': EVENT_TYPE_ROUND,
            'number': 1
        });
    }

    socket.on('disconnect', () => {
        socket.broadcast.emit(EVENT_CHANNEL_NAME_GAME, {
            'type': EVENT_TYPE_LEFT,
            'socketId': socket.id
        });
    });

    socket.on(EVENT_CHANNEL_NAME_GAME, (event) => {
        switch (event.type) {
            case EVENT_TYPE_SHOT:
                event.type = EVENT_TYPE_HIT;
                socket.broadcast.emit(EVENT_CHANNEL_NAME_GAME, event);
                break;
            case EVENT_TYPE_ANNOUNCE:
                if (!Battleships.doesPlayerMadeShot(gameId, event.playerId)) {
                    Battleships.makeShot(gameId, event);
                }

                var loserId = false;
                const shots = Battleships.getShots(gameId);
                if (Object.keys(shots).length === 2) {
                    for (p in shots) {
                        const e = shots[p];
                        const conterpartSocketId = Battleships.getCounterpartSocketId(gameId, p);
                        io.sockets.to(conterpartSocketId).emit(EVENT_CHANNEL_NAME_GAME, e);

                        if (!e.moreShips) {
                            if (loserId !== false) {
                                loserId = 'draw';
                            } else {
                                loserId = p
                            }
                        }
                    }

                    Battleships.resetShots(gameId);
                    if (!loserId) {
                        io.emit(EVENT_CHANNEL_NAME_GAME, {
                            'type': EVENT_TYPE_ROUND,
                            'number': 1
                        });
                    } else {
                        if (loserId == 'draw') {
                            const players = Battleships.getPlayers(gameId);
                            for (var pId in players) {
                                const socketId = Battleships.getPlayerSocketId(gameId, pId);
                                io.sockets.to(socketId).emit(EVENT_CHANNEL_NAME_GAME, {
                                    'type': EVENT_TYPE_DRAW
                                });
                            }
                        } else {
                            const socketId = Battleships.getPlayerSocketId(gameId, loserId);
                            io.sockets.to(socketId).emit(EVENT_CHANNEL_NAME_GAME, {
                                'type': EVENT_TYPE_DEFEAT
                            });
                            const conterpartSocketId = Battleships.getCounterpartSocketId(gameId, loserId);
                            io.sockets.to(conterpartSocketId).emit(EVENT_CHANNEL_NAME_GAME, {
                                'type': EVENT_TYPE_WIN
                            });
                        }
                    }
                }
                break;
            default:
                throw new Error(`Unknown system event type(${event.type})`);
        }
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});