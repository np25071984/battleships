const cookie = require("cookie")
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {cookie: true});
const fs = require('fs');

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
const EVENT_TYPE_LOST = 'lost';

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('pages/index.ejs', {});
});

if (fs.existsSync('shots.txt')) {
    fs.unlink('shots.txt', (err) => {
        if (err) {
            throw err;
        }
    });
};

if (fs.existsSync('players.txt')) {
    fs.unlink('players.txt', (err) => {
        if (err) {
            throw err;
        }
    });
};

io.on('connection', (socket) => {
    var cookies = cookie.parse(socket.handshake.headers.cookie);
    console.log(cookies.playerId);

    io.sockets.to(socket.id).emit(EVENT_CHANNEL_NAME_SYSTEM, {
        'type': EVENT_TYPE_CONNECTED,
        'socketId': socket.id
    });
    
    socket.broadcast.emit(EVENT_CHANNEL_NAME_GAME, {
        'type': EVENT_TYPE_JOINED,
        'socketId': socket.id
    });

    if (!fs.existsSync('players.txt')) {
        io.sockets.to(socket.id).emit(EVENT_CHANNEL_NAME_GAME, {
            'type': EVENT_TYPE_WAITING,
            'socketId': socket.id
        });

        fs.writeFile('players.txt', `Socket: ${socket.id}\n`, err => {
            if (err) {
                console.error(err);
            }
        });
    } else {
        fs.unlink('players.txt', (err) => {
            if (err) {
                throw err;
            }
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
                // TODO: just for MVP purpose; it will be permanent storage solution later
                event.type = EVENT_TYPE_HIT;
                socket.broadcast.emit(EVENT_CHANNEL_NAME_GAME, event);

                if (!fs.existsSync('shots.txt')) {
                    fs.writeFile('shots.txt', `Socket: ${event.socketId}\n`, err => {
                        if (err) {
                            console.error(err);
                        }
                    });
                } else {
                    fs.unlink('shots.txt', (err) => {
                        if (err) {
                            throw err;
                        }
                    });

                    io.emit(EVENT_CHANNEL_NAME_GAME, {
                        'type': EVENT_TYPE_ROUND,
                        'number': 1
                    });
                }
                break;
            case EVENT_TYPE_ANNOUNCE:
                socket.broadcast.emit(EVENT_CHANNEL_NAME_GAME, event);
                if (!event.moreShips) {
                    socket.broadcast.emit(EVENT_CHANNEL_NAME_GAME, {
                        'type': EVENT_TYPE_WIN
                    });
                    io.sockets.to(socket.id).emit(EVENT_CHANNEL_NAME_GAME, {
                        'type': EVENT_TYPE_LOST
                    });
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