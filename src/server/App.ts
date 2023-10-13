import * as express from 'express'
import Grid from './Grid'
import Ship from './Ship'
import Position from './Position'
import ShipTypeDestroyer from './ShipTypeDestroyer'
import ShipTypePatrolBoat from './ShipTypePatrolBoat'

class App {
    public static readonly EVENT_CHANNEL_NAME_SYSTEM: string = 'system';
    public static readonly EVENT_CHANNEL_NAME_GAME: string = 'game';
    public static readonly EVENT_TYPE_CONNECTED: string = 'connected';
    public static readonly EVENT_TYPE_WAITING: string = 'waiting';
    public static readonly EVENT_TYPE_JOINED: string = 'joined';
    public static readonly EVENT_TYPE_LEFT: string = 'left';
    public static readonly EVENT_TYPE_SHOT: string = 'shot';
    public static readonly EVENT_TYPE_HIT: string = 'hit';
    public static readonly EVENT_TYPE_ANNOUNCE: string = 'announce';
    public static readonly EVENT_TYPE_ROUND: string = 'round';
    public static readonly EVENT_TYPE_WIN: string = 'win';
    public static readonly EVENT_TYPE_DRAW: string = 'draw';
    public static readonly EVENT_TYPE_DEFEAT: string = 'defeat';
    public express
    private games

    constructor() {
        this.express = express()
        this.mountRoutes()
        this.games = {}
    }

    private mountRoutes(): void {
        const router = express.Router()
        router.get('/', (req, res) => {
            res.json({
                message: 'Hello World!'
            })
        })
        router.get('/:gameId', (req, res) => {
            // TODO: how to handle this in a proper way
            if (req.url === '/favicon.ico') {
                res.writeHead(200, {'Content-Type': 'image/x-icon'})
                res.end()
                console.log('favicon requested')
                return
            }

            res.render('pages/index.ejs', {'gameId': req.params.gameId});  
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

    public isGameExists(gameId: string) {
        return (gameId in this.games)
    }

    public createGame(gameId) {
        const grid = Grid.initGrid(10, 10)
        const ships1: Ship[] = [];
        ships1.push(new Ship(new Position(1, 2), Ship.SHIP_ORIENTATION_VERTICAL, new ShipTypeDestroyer()))
        ships1.push(new Ship(new Position(7, 8), Ship.SHIP_ORIENTATION_HORIZONTAL, new ShipTypePatrolBoat()))

        const ships2: Ship[] = [];
        ships2.push(new Ship(new Position(5, 7), Ship.SHIP_ORIENTATION_HORIZONTAL, new ShipTypeDestroyer()))
        ships2.push(new Ship(new Position(3, 1), Ship.SHIP_ORIENTATION_VERTICAL, new ShipTypePatrolBoat()))

        this.games[gameId] = {
            'players': {
                'b2uJJM': {
                    'ships': ships1,
                    'grid': grid,
                    'socketId': ''
                },
                'kH7YzI': {
                    'ships': ships2,
                    'grid': grid,
                    'socketId': ''
                }
            },
            'shots': {}
        }
    }

    public getPlayers(gameId: string) {
        return this.games[gameId]['players']
    }

    public joinPlayer(gameId: string, playerId: string, socketId: string) {
        this.games[gameId]['players'][playerId]['socketId'] = socketId
    }

    public resetShots(gameId: string) {
        this.games[gameId]['shots'] = {}
    }

    public getShots(gameId: string) {
        return this.games[gameId]['shots']
    }

    // TODO: bad naming
    public makeShot(gameId: string, event: any) {
        this.games[gameId]['shots'][event.playerId] = event
    }

    public doesPlayerMadeShot(gameId: string, playerId: string) {
        return (playerId in this.getShots(gameId))
    }

    public getCounterpartSocketId(gameId: string, playerId: string) {
        for (var pId in this.getPlayers(gameId)) {
            if (pId !== playerId) {
                return this.games[gameId]['players'][pId]['socketId']
            }
        }
    }

    public getPlayerSocketId(gameId: string, playerId: string) {
        return this.games[gameId]['players'][playerId]['socketId']
    }

    public isValidSocketId(gameId: string, targetSocketId: string): boolean {
        for (const playerId in this.games[gameId]['players']) {
            const socketId = this.games[gameId]['players'][playerId]['socketId']
            if (socketId === targetSocketId) {
                return true
            }
        }

        return false
    }
}

export default App