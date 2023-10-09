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
const games = {};
var gameId = undefined;

// TODO: serve static files (such as favicon.ico)
app.get('/:gameId', (req, res) => {
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
    if (!(gameId in games)) {
        games[gameId] = {
            'players': {}
        };
    }

    var playerId = undefined;
    if ('playerId' in cookies) {
        // TODO: validate playerId value
        playerId = cookies.playerId;
        console.log('existing player reconnected: ' + playerId);
    } else {
        const players = games[gameId]['players'];
        if (Object.keys(players).length === 2) {
            console.log("Too many players for the game!");
            throw new Error("Too many players");
        }

        playerId = makeId(6);
        console.log('new player connected; playerId=' + playerId);
    }
    games[gameId]['players'][playerId] = socket.id;

    io.sockets.to(socket.id).emit(EVENT_CHANNEL_NAME_SYSTEM, {
        'type': EVENT_TYPE_CONNECTED,
        'gameId': gameId,
        'playerId': playerId
    });

    if (Object.keys(games[gameId]['players']).length === 1) {
        io.sockets.to(socket.id).emit(EVENT_CHANNEL_NAME_GAME, {
            'type': EVENT_TYPE_WAITING,
            'socketId': socket.id
        });
    } else {
        socket.broadcast.emit(EVENT_CHANNEL_NAME_GAME, {
            'type': EVENT_TYPE_JOINED,
            'socketId': socket.id
        });

        games[gameId]['shots'] = {};
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
                if (!(event.playerId in games[gameId]['shots'])) {
                    games[gameId]['shots'][event.playerId] = event;
                }

                var loserId = false;
                if (Object.keys(games[gameId]['shots']).length === 2) {
                    for (p in games[gameId]['shots']) {
                        const e = games[gameId]['shots'][p];

                        for (var pId in games[gameId]['players']) {
                            if (pId !== p) {
                                io.sockets.to(games[gameId]['players'][pId]).emit(EVENT_CHANNEL_NAME_GAME, e);
                            }
                        }

                        if (!e.moreShips) {
                            if (loserId !== false) {
                                loserId = 'draw';
                            } else {
                                loserId = p
                            }
                        }
                    }

                    games[gameId]['shots'] = {};
                    if (!loserId) {
                        io.emit(EVENT_CHANNEL_NAME_GAME, {
                            'type': EVENT_TYPE_ROUND,
                            'number': 1
                        });
                    } else {
                        if (loserId == 'draw') {
                            for (var pId in games[gameId]['players']) {
                                const socketId = games[gameId]['players'][pId];
                                io.sockets.to(socketId).emit(EVENT_CHANNEL_NAME_GAME, {
                                    'type': EVENT_TYPE_DRAW
                                });
                            }
                        } else {
                            const socketId = games[gameId]['players'][loserId];
                            io.sockets.to(socketId).emit(EVENT_CHANNEL_NAME_GAME, {
                                'type': EVENT_TYPE_DEFEAT
                            });
                            for (var pId in games[gameId]['players']) {
                                if (pId !== loserId) {
                                    const socketId = games[gameId]['players'][pId];
                                    io.sockets.to(socketId).emit(EVENT_CHANNEL_NAME_GAME, {
                                        'type': EVENT_TYPE_WIN
                                    });
                                }
                            }
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

function makeId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}