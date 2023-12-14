import * as express from 'express'
import { Application, Request, Response, Router } from 'express'
import Grid from './Grid'
import Player from './Player'
import Ship from '../common/Ship'
import Position from '../common/Position'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import ShipTypeFactory from '../common/ShipTypeFactory'
import Settings from './Settings'
import Game from './Game'
import Randomizer from './Randomizer'
import { GameCreateValidator } from './Validators'
import { validationResult } from 'express-validator'

class App {
    public express: Application
    public games: Game[]

    constructor() {
        this.express = express()
        this.mountRoutes()
        this.games = []
    }

    private mountRoutes(): void {
        const router: Router = express.Router()
        router.get('/', (req: Request, res: Response) => {
            if (req.url === '/favicon.ico') {
                res.writeHead(200, {'Content-Type': 'image/x-icon'})
                res.end()
                console.log('favicon requested')
                return
            }

            const { version } = require('../../package.json')

            res.render('pages/main.ejs', {'version': version})
        })

        router.get('/create', (req: Request, res: Response) => {
            res.render('pages/create.ejs', {
                'cols': 10,
                'rows': 10,
                'carrier': 1,
                'battleship': 2,
                'destroyer': 3,
                'patrolboat': 4,
                'mode': 'classic',
                'type': 'single',
            })
        })

        router.post('/create', GameCreateValidator, (req: Request, res: Response) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                res.status(400).json({errors: errors.array()})
                return
            }

            const gridCols = parseInt(req.body.cols)
            const gridRows = parseInt(req.body.rows)
            const gameType = req.body.type
            const gameMode = req.body.mode
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

            const maxIterations: number = gridCols * gridRows * 10
            const randomizer: Randomizer = new Randomizer(maxIterations)
            randomizer.findShipsCombination(gridCols, gridRows, shipTypes)
                .then((ships: Ship[]|null) => {
                    if (ships === null) {
                        res.render('pages/create.ejs', {
                            'cols': gridCols,
                            'rows': gridRows,
                            'carrier': carrierAmount,
                            'battleship': battleshipAmount,
                            'destroyer': destroyerAmount,
                            'patrolboat': patrolBoatAmount,
                            'type': gameType,
                            'mode': gameMode,
                            'error': "There are too little (if any) ways to fit the ships into the grid. Please increase grid size or decrease ships amount."
                        })
                        return
                    }

                    const settings: Settings = new Settings(gridCols, gridRows, gameType, gameMode, shipTypes)
                    const gameId: string = this.makeId(6)
                    const game: Game = new Game(gameId, 1, settings, ships)
                    this.addGame(game)
                    res.redirect(`/join/${gameId}`)
                })
        })

        router.get('/join/:gameId', (req: Request, res: Response) => {
            const gameId: string = req.params.gameId
            if (!this.doesGameExist(gameId)) {
                res.send(`Game '${gameId}' not found`)
                return
            }
            const game: Game = this.getGame(gameId)
            const isMultiplayerPrivate: boolean = game.settings.gameType === Settings.GAME_TYPE_MULTIPLAYER_PRIVATE
            const isHostPlayer: boolean = game.players.length === 0 // show "share" message only for host player
            const showLink: boolean = (isMultiplayerPrivate && isHostPlayer) ? true : false
            res.render('pages/join.ejs', {
                'gameId': req.params.gameId,
                'cols': game.settings.gridCols,
                'rows': game.settings.gridRows,
                'showLink': showLink,
            })
        })

        router.post('/join/:gameId', (req: Request, res: Response) => {
            const gameId: string = req.params.gameId
            if (!this.doesGameExist(gameId)) {
                res.send(`Game '${gameId}' not found`)
                return
            }
            const game: Game = this.getGame(gameId)
            const playerId: string = this.makeId(6)
            const grid = Grid.initGrid(game.settings.gridCols, game.settings.gridRows)

            if  (!req.body.ships) {
                res.status(400).send(`No ships were placed on the grid`)
                return
            }

            const ships: Ship[] = [];
            // TODO: validate input
            for (const rawShip of req.body.ships) {
                const raw = JSON.parse(rawShip)
                const p: Position = new Position(raw.col, raw.row)
                var type: ShipTypeAbstract = ShipTypeFactory.getType(raw.type)
                const ship: Ship = new Ship(p, raw.isHorizontal, type)
                ships.push(ship)
            }
            const player: Player = new Player(playerId, grid, ships)

            game.joinPlayer(player)
            res.redirect(`/${gameId}?playerId=${player.id}`)
        })

        router.get('/shuffle/:gameId', (req: Request, res: Response) => {
            const gameId: string = req.params.gameId
            if (!this.doesGameExist(gameId)) {
                res.send(`Game '${gameId}' not found`)
                return
            }
            const game: Game = this.getGame(gameId)

            const maxIterations: number = game.settings.gridCols * game.settings.gridRows * 100
            const randomizer: Randomizer = new Randomizer(maxIterations)
            randomizer.findShipsCombination(
                game.settings.gridCols,
                game.settings.gridRows,
                game.settings.shipTypes
            ).then(
                (ships: Ship[]|null) => {
                    if (ships === null) {
                        // TODO: notify user that it is a pseudo random configuration
                        ships = game.fallbackShipsConfiguration
                    }

                    const shipsData: Object[] = []
                    ships.forEach((ship: Ship) => {
                        shipsData.push({
                            'col': ship.position.col,
                            'row': ship.position.row,
                            'isHorizontal': ship.isHorizontal,
                            'size': ship.type.getSize(),
                        })
                    })

                    res.json(shipsData)
                }
            )
        })

        router.get('/list', (req: Request, res: Response) => {
            res.render('pages/list.ejs')
        })

        router.get('/games', (req: Request, res: Response) => {
            const gameList = []
            for (const gameId in this.games) {
                const game: Game = this.games[gameId]

                // only multiplayer public games
                if (game.settings.gameType !== Settings.GAME_TYPE_MULTIPLAYER_PUBLIC) {
                    continue
                }

                // only started games
                if (game.players.length === 0) {
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
                    "ships": ships,
                    "mode": game.settings.gameMode,
                })
                if (gameList.length === 30) {
                    break
                }
            }
            res.json(gameList)
        })

        router.get('/:gameId', (req: Request, res: Response) => {
            const queryParams = req.query
            if (!('playerId' in queryParams)) {
                // TODO: redirect to main
                res.send("Didn't get playerId in the url query parameter list")
                return
            }

            const gameId: string = req.params.gameId
            if (!(gameId in this.games)) {
                // TODO: redirect on Join page
                res.send(`Game '${gameId}' not found`)
                return
            }
            const game: Game = this.games[gameId]

            var remainingShips: Object
            if (game.round === 1) {
                // game just started; the player isn't joined yet
                remainingShips = {}
                for (const type of game.settings.shipTypes) {
                    const size: number = type.getSize()
                    if (!(size in remainingShips)) {
                        remainingShips[type.getSize()] = 0
                    }

                    remainingShips[type.getSize()]++
                }
            } else {
                const playerId: string = queryParams.playerId
                const player: Player = game.getOpponent(playerId)
                remainingShips = player.getRemainingShipsStat()
            }

            res.render('pages/game.ejs', {
                'gameId': req.params.gameId,
                'remainingShips': remainingShips,
            })
        })

        this.express.use(express.urlencoded({extended: true}));
        this.express.use(express.json()) // To parse the incoming requests with JSON payloads
        this.express.use('/static', express.static('build/client'))
        this.express.use('/', router)
    }

    makeId(length: number): string {
        let result: string = ''
        const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        const charactersLength: number = characters.length
        let counter: number = 0
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