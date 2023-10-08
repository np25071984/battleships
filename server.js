const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require('fs');
const readline = require('readline');

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

io.on('connection', (socket) => {
    io.sockets.to(socket.id).emit('system', {
        'type': 'connected',
        'socketId': socket.id
    });
    
    socket.broadcast.emit('game', {
        'type': 'joined',
        'socketId': socket.id
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('game', {
            'type': 'left',
            'socketId': socket.id
        });
    });

    socket.on('game', (event) => {
        switch (event.type) {
            case 'shot':
                event.type = 'hit';
                socket.broadcast.emit('game', event);

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

                    io.emit('game', {
                        'type': 'round',
                        'number': 1
                    });
                }
                break;
            case 'announce':
                socket.broadcast.emit('game', event);
                if (!event.moreShips) {
                    socket.broadcast.emit('game', {
                        'type': 'win'
                    });
                    io.sockets.to(socket.id).emit('game', {
                        'type': 'lost',
                    });
                }
                break;
            default:
                throw new Error('Unknown system event type');
        }
    });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});