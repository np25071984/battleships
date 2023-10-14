const cookie = require("cookie")
import App from './App'
import { Server } from "socket.io"
import Position from './Position'
import Player from './Player'
import Game from './Game'
import Grid from './Grid'
import Ship from './Ship'
import ShipTypeDestroyer from './ShipTypeDestroyer'
import ShipTypePatrolBoat from './ShipTypePatrolBoat'
import HitResult from '../common/HitResult'

const port = process.env.PORT || 3000

const app = new App()

// TODO: create hardcoded games
const grid1 = Grid.initGrid(10, 10)
const ships1: Ship[] = [];
ships1.push(new Ship(new Position(1, 2), Ship.SHIP_ORIENTATION_VERTICAL, new ShipTypeDestroyer()))
ships1.push(new Ship(new Position(7, 8), Ship.SHIP_ORIENTATION_HORIZONTAL, new ShipTypePatrolBoat()))
const player1 = new Player('playerID1', grid1, ships1)

const grid2 = Grid.initGrid(10, 10)
const ships2: Ship[] = [];
ships2.push(new Ship(new Position(5, 5), Ship.SHIP_ORIENTATION_VERTICAL, new ShipTypeDestroyer()))
ships2.push(new Ship(new Position(2, 3), Ship.SHIP_ORIENTATION_HORIZONTAL, new ShipTypePatrolBoat()))
const player2 = new Player('playerID2', grid2, ships2)

const gameA: Game = new Game('gameA', 1, player1, player2)

app.addGame(gameA)

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

    const player = game.getPlayer(playerId)
    player.updateSocketId(socket.id)

    const opponent: Player = game.getOpponent(playerId)
    game.initClient(playerId)
    // global.io.sockets.to(player.socketId).emit(App.EVENT_CHANNEL_NAME_SYSTEM, {
    //     'type': App.EVENT_TYPE_CONNECTED,
    //     'playerId': playerId,
    //     'grid': player.getGridWithShips(),
    //     'opponent_grid': opponent.grid,
    // })

    if (opponent.socketId === '') {
        // the opponent isn't there yet; let's wait for they
        global.io.sockets.to(player.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_WAITING,
        })
    } else {
        // all players are in place; let's start the game
        global.io.sockets.to(opponent.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_JOINED,
            'playerId': player.id,
        })
        game.startRound()
    }

    socket.on('disconnect', () => {
        const game: Game = app.getGame(gameId)
        var playerId: string

        for (const p of game.players) {
            if (p.socketId === socket.id) {
                playerId = p.id
                p.updateSocketId('')
                break
            }
        }

        socket.broadcast.emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_LEFT,
            'socketId': socket.id,
            'playerId': playerId,
        })
    })

    socket.on(App.EVENT_CHANNEL_NAME_GAME, (event) => {
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

        switch (event.type) {
            case App.EVENT_TYPE_SHOT:
                const position = new Position(event.col, event.row)
                game.shot(position, playerId)

                if (game.roundShotsCounter !== 2) {
                    // wait for the second player
                    return
                }

                const losers = []
                game.players.forEach((player: Player) => {
                    const shotRes: HitResult = game.getShotResult(player.id)
                    const opponent: Player = game.getOpponent(player.id)

                    if (shotRes === HitResult.HIT_RESULT_SUNK && opponent.shipsCount === 0) {
                        console.log("Found loser")
                        losers.push(opponent.id)
                    }

                    global.io.sockets.to(player.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                        'type': App.EVENT_TYPE_ANNOUNCE,
                        'playerId': player.id,
                        'result': shotRes
                    })
                })

                if (losers.length === 0) {
                    game.nextRound()
                } else if (losers.length === 1) {
                    const loserId: string = losers[0]
                    const l = game.getPlayer(loserId)
                    global.io.sockets.to(l.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                        'type': App.EVENT_TYPE_DEFEAT,
                        'playerId': l.id,
                    })

                    const o = game.getOpponent(loserId)
                    global.io.sockets.to(o.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                        'type': App.EVENT_TYPE_WIN,
                        'playerId': o.id,
                    })
                } else {
                    game.players.forEach((player: Player) => {
                        global.io.sockets.to(player.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                            'type': App.EVENT_TYPE_DRAW,
                        })
                    })
                }
                break
            default:
                throw new Error(`Unknown system event type(${event.type})`)
        }
    })
})
