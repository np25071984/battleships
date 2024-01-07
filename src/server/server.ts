const cookie = require("cookie")
import App from './App'
import { Server } from "socket.io"
import Position from '../common/Position'
import Player from './Player'
import Game from './Game'
import {
    ClientToServerEvents,
    ServerToClientEvents,
    ConnectedEvent,
    ShotEvent,
    JoinedEvent,
    LeftEvent,
} from '../common/@types/socket'

const port = process.env.PORT || 3000
const app = new App()

const server = app.express.listen(port, (err: Error) => {
    if (err) {
        return console.log(err)
    }

    return console.log(`Server is listening on ${port}`)
})

global.io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {cookie: true})

global.io.on("connect", (socket) => {
    const cookies = cookie.parse(socket.handshake.headers.cookie)
    if (!('gameId' in cookies)) {
        console.log("gameId parameter is missing")
        socket.disconnect()
        return
    }

    const gameId = cookies.gameId
    var game: Game
    if (app.doesGameExist(gameId)) {
        game = app.getGame(gameId)
    } else {
        socket.disconnect()
        return
    }

    var playerId: string
    if ('playerId' in cookies) {
        playerId = cookies.playerId
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

    const connectedEvent: ConnectedEvent = {'playerId': playerId}
    global.io.sockets.to(socket.id).emit("connected", connectedEvent)

    const player: Player = game.getPlayer(playerId)
    player.updateSocketId(socket.id)

    if (game.doesOpponentExist(playerId)) {
        const opponent: Player = game.getOpponent(playerId)
        const joinedEvent: JoinedEvent = {'playerId': player.id}
        global.io.sockets.to(opponent.socketId).emit("joined", joinedEvent)

        // all players are in place; let's start the game
        game.initClients()
        game.startRound()
    } else {
        // the opponent isn't there yet; let's wait for them
        global.io.sockets.to(player.socketId).emit("waiting")
    }

    socket.on("disconnect", () => {
        if (!app.doesGameExist(gameId)) {
            // game finished or the server is after recovery
            return
        }

        const game: Game = app.getGame(gameId)
        if (game.isOver()) {
            // the game was finished
            app.purgeGameData(gameId)
            return
        }

        var playerId: string
        for (const p of game.players) {
            if (p.socketId === socket.id) {
                playerId = p.id
                p.updateSocketId('')
                break
            }
        }

        if (playerId && game.doesOpponentExist(playerId)) {
            const opponent: Player = game.getOpponent(playerId)
            const leftEvent: LeftEvent = {'playerId': playerId}
            global.io.sockets.to(opponent.socketId).emit("left", leftEvent)
        }
    })

    socket.on("shot", (event: ShotEvent) => {
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
    })
})
