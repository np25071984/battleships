const cookie = require("cookie")
import App from './App'
import { Server } from "socket.io"
const port = process.env.PORT || 3000

const app = new App()
const server = app.express.listen(port, (err) => {
    if (err) {
        return console.log(err)
    }

    return console.log(`Server is listening on ${port}`)
})

const io = new Server(server, {cookie: true})
io.on("connection", (socket) => {
    const cookies = cookie.parse(socket.handshake.headers.cookie)
    if (!('gameId' in cookies)) {
        console.log("gameId is missing; exit")
        socket.disconnect()
        return
    }

    // TODO: validate gameId value
    const gameId = cookie.gameId
    if (!app.isGameExists(gameId)) {
        app.createGame(gameId)
    }

    var playerId = undefined
    if ('playerId' in cookies) {
        // TODO: validate playerId value
        playerId = cookies.playerId
        console.log('existing player reconnected: ' + playerId)
    } else {
        const players = app.getPlayers(gameId)
        if (Object.keys(players).length === 2) {
            console.log("Too many players for the game!")
            throw new Error("Too many players")
        }

        playerId = app.makeId(6)
        console.log('new player connected; playerId=' + playerId)
    }
    app.joinPlayer(gameId, playerId, socket.id)

    io.sockets.to(socket.id).emit(App.EVENT_CHANNEL_NAME_SYSTEM, {
        'type': App.EVENT_TYPE_CONNECTED,
        'gameId': gameId,
        'playerId': playerId
    })

    if (Object.keys(app.getPlayers(gameId)).length === 1) {
        io.sockets.to(socket.id).emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_WAITING,
            'socketId': socket.id
        })
    } else {
        socket.broadcast.emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_JOINED,
            'socketId': socket.id
        })

        io.emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_ROUND,
            'number': 1
        })
    }

    socket.on('disconnect', () => {
        socket.broadcast.emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_LEFT,
            'socketId': socket.id
        })
    })

    socket.on(App.EVENT_CHANNEL_NAME_GAME, (event) => {
        switch (event.type) {
            case App.EVENT_TYPE_SHOT:
                event.type = App.EVENT_TYPE_HIT
                socket.broadcast.emit(App.EVENT_CHANNEL_NAME_GAME, event)
                break
            case App.EVENT_TYPE_ANNOUNCE:
                if (!app.doesPlayerMadeShot(gameId, event.playerId)) {
                    app.makeShot(gameId, event)
                }

                var losers = []
                const shots = app.getShots(gameId)
                if (Object.keys(shots).length === 2) {
                    for (const p in shots) {
                        const e = shots[p]
                        const conterpartSocketId = app.getCounterpartSocketId(gameId, p)
                        io.sockets.to(conterpartSocketId).emit(App.EVENT_CHANNEL_NAME_GAME, e)

                        if (!e.moreShips) {
                            losers.push(p)
                        }
                    }

                    app.resetShots(gameId)
                    if (losers.length === 0) {
                        io.emit(App.EVENT_CHANNEL_NAME_GAME, {
                            'type': App.EVENT_TYPE_ROUND,
                            'number': 1
                        })
                    } else if (losers.length === 1) {
                        const socketId = app.getPlayerSocketId(gameId, losers.pop())
                        io.sockets.to(socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                            'type': App.EVENT_TYPE_DEFEAT
                        })
                        const conterpartSocketId = app.getCounterpartSocketId(gameId, losers.pop())
                        io.sockets.to(conterpartSocketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                            'type': App.EVENT_TYPE_WIN
                        })
                    } else {
                        const players = app.getPlayers(gameId)
                        for (var pId in players) {
                            const socketId = app.getPlayerSocketId(gameId, pId)
                            io.sockets.to(socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                                'type': App.EVENT_TYPE_DRAW
                            })
                        }
                    }
                }
                break
            default:
                throw new Error(`Unknown system event type(${event.type})`)
        }
    })
})
