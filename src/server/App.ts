import * as express from 'express'
import Game from './Game'
import Grid from './Grid'
import Player from './Player'
import Ship from '../common/Ship'
import Position from '../common/Position'
import ShipTypeDestroyer from '../common/ShipTypeDestroyer'
import ShipTypePatrolBoat from '../common/ShipTypePatrolBoat'
import ShipTypeAbstract from '../common/ShipTypeAbstract'

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
            // TODO: validate input
            for (const rawShip of req.body.ships) {
                const raw = JSON.parse(rawShip)
                const p = new Position(raw.col, raw.row)
                var type: ShipTypeAbstract
                switch (raw.type) {
                    case 3:
                        type = new ShipTypeDestroyer()
                        break
                    case 2:
                        type = new ShipTypePatrolBoat()
                        break
                    default:
                        throw new Error(`Unknown ship type '${raw.type}'`)
                }
                const ship = new Ship(p, raw.orientation,type)
                ships.push(ship)
            }
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

            // TODO: redirect on Join page

            // TODO: how to handle this in a proper way
            res.render('pages/game.ejs', {'gameId': req.params.gameId})
        })
        this.express.use(express.urlencoded({extended: true}));
        this.express.use(express.json()) // To parse the incoming requests with JSON payloads
        this.express.use('/static', express.static('build/client'))
        this.express.use('/', router)
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