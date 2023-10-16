import * as express from 'express'
import Game from './Game'
import Grid from './Grid'
import Player from './Player'
import Ship from './Ship'
import Position from './Position'
import ShipTypeDestroyer from './ShipTypeDestroyer'
import ShipTypePatrolBoat from './ShipTypePatrolBoat'

class App {
    public static readonly EVENT_CHANNEL_NAME_SYSTEM: string = 'system'
    public static readonly EVENT_CHANNEL_NAME_GAME: string = 'game'
    public static readonly EVENT_TYPE_CONNECTED: string = 'connected'
    public static readonly EVENT_TYPE_DISCONNECT: string = 'disconnect'
    public static readonly EVENT_TYPE_WAITING: string = 'waiting'
    public static readonly EVENT_TYPE_INIT: string = 'init'
    public static readonly EVENT_TYPE_JOINED: string = 'joined'
    public static readonly EVENT_TYPE_LEFT: string = 'left'
    public static readonly EVENT_TYPE_SHOT: string = 'shot'
    public static readonly EVENT_TYPE_ANNOUNCE: string = 'announce'
    public static readonly EVENT_TYPE_ROUND: string = 'round'
    public static readonly EVENT_TYPE_GAME_RESULT: string = 'game_result'
    public static readonly GAME_RESULT_WIN: string = 'win'
    public static readonly GAME_RESULT_DRAW: string = 'draw'
    public static readonly GAME_RESULT_DEFEAT: string = 'defeat'
    public express
    private games: Game[]

    constructor() {
        this.express = express()
        this.mountRoutes()
        this.games = []
    }

    private mountRoutes(): void {
        const router = express.Router()
        router.get('/', (req, res) => {
            if (req.url === '/favicon.ico') {
                res.writeHead(200, {'Content-Type': 'image/x-icon'})
                res.end()
                console.log('favicon requested')
                return
            }
            res.render('pages/main.ejs')
        })
        router.get('/create', (req, res) => {
            res.render('pages/create.ejs')
        })
        router.post('/create', (req, res) => {
            // TODO: get game settings
            const gameId = this.makeId(6)
            const game = new Game(gameId, 1)
            this.addGame(game)
            res.redirect(`/join/${gameId}`)
        })
        router.get('/join/:gameId', (req, res) => {
            const gameId: string = req.params.gameId
            if (!this.doesGameExist(gameId)) {
                res.send(`Game '${gameId}' not found`)
                return
            }
            res.render('pages/join.ejs', {'gameId': req.params.gameId})
        })
        router.post('/join/:gameId', (req, res) => {
            const gameId: string = req.params.gameId
            if (!this.doesGameExist(gameId)) {
                res.send(`Game '${gameId}' not found`)
                return
            }
            const game = this.getGame(gameId)

            const playerId: string = this.makeId(6)
            const grid = Grid.initGrid(10, 10)
            const ships: Ship[] = [];
            ships.push(new Ship(new Position(1, 2), Ship.SHIP_ORIENTATION_VERTICAL, new ShipTypeDestroyer()))
            ships.push(new Ship(new Position(7, 8), Ship.SHIP_ORIENTATION_HORIZONTAL, new ShipTypePatrolBoat()))
            const player = new Player(playerId, grid, ships)

            game.joinPlayer(player)
            res.redirect(`/${gameId}?playerId=${player.id}`)
        })
        router.get('/list', (req, res) => {
            res.render('pages/list.ejs')
        })
        router.get('/:gameId', (req, res) => {
            const gameId: string = req.params.gameId
            if (!(gameId in this.games)) {
                res.send(`Game '${gameId}' not found`)
                return
            }

            // TODO: redirect on placement

            // TODO: how to handle this in a proper way
            res.render('pages/game.ejs', {'gameId': req.params.gameId})
        })
        this.express.use('/', router)
        this.express.use('/static', express.static('build/client'))
    }

    public makeId(length: number) {
        let result = ''
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        const charactersLength = characters.length
        let counter = 0
        while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength))
          counter += 1
        }
        return result
    }

    doesGameExist(gameId: string): boolean {
        return (gameId in this.games)
    }

    addGame(game: Game): Game {
        this.games[game.id] = game
        return game
    }

    getGame(gameId: string): Game {
        return this.games[gameId]
    }
}

export default App