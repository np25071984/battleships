import * as express from 'express'
import Grid from './Grid'
import Player from './Player'
import Ship from '../common/Ship'
import Position from '../common/Position'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import ShipTypeFactory from '../common/ShipTypeFactory'
import Settings from './Settings'
import Game from './Game'

class App {
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
    public games: Game[]

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
            const gridCols = parseInt(req.body.cols)
            const gridRows = parseInt(req.body.rows)
            const gameType = req.body.type
            const shipTypes: ShipTypeAbstract[] = []

            const carrierAmount: number = parseInt(req.body.carrier)
            for (var i = 0; i < carrierAmount; i++) {
                shipTypes.push(ShipTypeFactory.getType(5))
            }

            const battleshipAmount: number = parseInt(req.body.battleship)
            for (var i = 0; i < battleshipAmount; i++) {
                shipTypes.push(ShipTypeFactory.getType(4))
            }

            const destroyerAmount: number = parseInt(req.body.destroyer)
            for (var i = 0; i < destroyerAmount; i++) {
                shipTypes.push(ShipTypeFactory.getType(3))
            }

            const patrolBoatAmount: number = parseInt(req.body.patrolboat)
            for (var i = 0; i < patrolBoatAmount; i++) {
                shipTypes.push(ShipTypeFactory.getType(2))
            }

            // TODO: check if shipTypes can fit into the given grid

            const settings = new Settings(gridCols, gridRows, gameType, shipTypes)

            const gameId = this.makeId(6)
            const game: Game = new Game(gameId, 1, settings)
            this.addGame(game)
            res.redirect(`/join/${gameId}`)
        })
        router.get('/join/:gameId', (req, res) => {
            const gameId: string = req.params.gameId
            if (!this.doesGameExist(gameId)) {
                res.send(`Game '${gameId}' not found`)
                return
            }
            const game = this.getGame(gameId)

            res.render('pages/join.ejs', {
                'gameId': req.params.gameId,
                'cols': game.settings.gridCols,
                'rows': game.settings.gridRows,
            })
        })
        router.post('/join/:gameId', (req, res) => {
            const gameId: string = req.params.gameId
            if (!this.doesGameExist(gameId)) {
                res.send(`Game '${gameId}' not found`)
                return
            }
            const game = this.getGame(gameId)
            const playerId: string = this.makeId(6)
            const grid = Grid.initGrid(game.settings.gridCols, game.settings.gridRows)

            const ships: Ship[] = [];
            // TODO: validate input
            for (const rawShip of req.body.ships) {
                const raw = JSON.parse(rawShip)
                const p = new Position(raw.col, raw.row)
                var type: ShipTypeAbstract = ShipTypeFactory.getType(raw.type)
                const ship = new Ship(p, raw.orientation, type)
                ships.push(ship)
            }
            const player = new Player(playerId, grid, ships)

            game.joinPlayer(player)
            res.redirect(`/${gameId}?playerId=${player.id}`)
        })
        router.get('/shuffle/:gameId', (req, res) => {
            const gameId: string = req.params.gameId
            if (!this.doesGameExist(gameId)) {
                res.send(`Game '${gameId}' not found`)
                return
            }
            const game = this.getGame(gameId)

            var ships: Ship[]|null = Grid.placeShips(
                game.settings.gridCols,
                game.settings.gridRows,
                [],
                game.settings.shipTypes
            )

            if (ships === null) {
                console.log("Couldn't place")
                res.json([]) // TODO: this shouldn't ever happen
            }

            const shipsData: Object[] = []
            ships.forEach((ship: Ship) => {
                shipsData.push({
                    'col': ship.position.col,
                    'row': ship.position.row,
                    'orientation': ship.orientation,
                    'size': ship.type.getSize(),
                })
            })

            res.json(shipsData)
        })
        router.get('/list', (req, res) => {
            res.render('pages/list.ejs')
        })
        router.get('/games', (req, res) => {
            const gameList = []
            for (const gameId in this.games) {
                const game: Game = this.games[gameId]
                if (game.settings.gameType !== Settings.GAME_TYPE_MULTIPLAYER_PUBLIC) {
                    continue
                }

                const ships = {}
                game.settings.shipTypes.forEach((shipType: ShipTypeAbstract) => {
                    const size = shipType.getSize()
                    if (!(size in ships)) {
                        ships[size] = 0
                    }
                    ships[size]++
                })

                gameList.push({
                    "gameId": gameId,
                    "cols": game.settings.gridCols,
                    "rows": game.settings.gridRows,
                    "ships": ships
                })
                if (gameList.length === 30) {
                    break
                }
            }
            res.json(gameList);
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

    purgeGameData(gameId: string): void {
        delete this.games[gameId]
    }
}

export default App