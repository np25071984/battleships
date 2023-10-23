const cookie = require("cookie")
import App from './App'
import { Server } from "socket.io"
import Position from '../common/Position'
import Player from './Player'
import Game from './Game'

const port = process.env.PORT || 3000
const app = new App()

const server = app.express.listen(port, (err) => {
    if (err) {
        return console.log(err)
    }

    return console.log(`Server is listening on ${port}`)
})

global.io = new Server(server, {cookie: true})

global.io.on("connect", (socket) => {
    const cookies = cookie.parse(socket.handshake.headers.cookie)
    if (!('gameId' in cookies)) {
        console.log("gameId parameter is missing")
        socket.disconnect()
        return
    }

    // TODO: validate gameId value
    const gameId = cookies.gameId
    var game: Game
    if (app.doesGameExist(gameId)) {
        game = app.getGame(gameId)
    } else {
        console.log(`Game ${gameId} doesn't exists`)
        socket.disconnect()
        return
    }

    var playerId: string
    if ('playerId' in cookies) {
        // TODO: validate playerId value
        playerId = cookies.playerId
        console.log(`player connected; playerId: ${playerId}; socketId: ${socket.id}`)
    } else {
        console.log("Wrong request; playerId hasn't been specified")
        socket.disconnect()
        return
    }

    if (!game.doesPlayerExist(playerId)) {
        console.log(`Unknown player '${playerId}' for game ${gameId}`)
        socket.disconnect()
        return
    }

    global.io.sockets.to(socket.id).emit(App.EVENT_TYPE_CONNECTED, {'playerId': playerId})

    const player: Player = game.getPlayer(playerId)
    player.updateSocketId(socket.id)

    if (game.doesOpponentExist(playerId)) {
        const opponent: Player = game.getOpponent(playerId)
        global.io.sockets.to(opponent.socketId).emit(App.EVENT_TYPE_JOINED, {'playerId': player.id})

        // all players are in place; let's start the game
        game.initClients()
        game.startRound()
    } else {
        // the opponent isn't there yet; let's wait for they
        global.io.sockets.to(player.socketId).emit(App.EVENT_TYPE_WAITING)
    }


    socket.on(App.EVENT_TYPE_DISCONNECT, () => {
        const game: Game = app.getGame(gameId)

        var playerId: string
        for (const p of game.players) {
            if (p.socketId === socket.id) {
                playerId = p.id
                p.updateSocketId('')
                p.isInitialized = false
                break
            }
        }

        if (playerId && game.doesOpponentExist(playerId)) {
            const opponnet = game.getOpponent(playerId)
            socket.to(opponnet.socketId).emit(App.EVENT_TYPE_LEFT)
        }
    })

    socket.on(App.EVENT_TYPE_SHOT, (event) => {
        const socketId = socket.id;
        const gameId = event.gameId
        const playerId = event.playerId

        const game = app.getGame(gameId)
        if (!game.isValidSocketId(socketId)) {
            console.log('Invalid SocketId');
            /**
             * client with valid gameId and playerId but different socket.io connection
             * possible new browser tab
             * TODO: send DISABLE_CLIENT system event
             */
            return
        }

        const position = new Position(event.col, event.row)
        game.shot(position, playerId)

        if (game.roundShotsCounter !== 2) {
            // wait for the second player
            return
        }

        game.announceShotResults()
        if (game.isOver()) {
            game.announceGameResults()
            app.purgeGameData(gameId)
        } else {
            game.nextRound()
        }
    })
})
