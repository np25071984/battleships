import * as express from 'express'

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
        this.express.use('/static', express.static('public'))
        this.express.use('/static', express.static('dist/client'))
        this.express.use('/static', express.static('build'))
    }

    public makeId(length) {
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
        this.games[gameId] = {
            'players': {},
            'shots': {}
        }
    }

    public getPlayers(gameId) {
        return this.games[gameId]['players']
    }

    public joinPlayer(gameId, playerId, socketId) {
        this.games[gameId]['players'][playerId] = socketId
    }

    public resetShots(gameId) {
        this.games[gameId]['shots'] = {}
    }

    public getShots(gameId) {
        return this.games[gameId]['shots']
    }

    public makeShot(gameId, event) {
        this.games[gameId]['shots'][event.playerId] = event
    }

    public doesPlayerMadeShot(gameId, playerId) {
        return (playerId in this.games[gameId]['shots'])
    }

    public getCounterpartSocketId(gameId, playerId) {
        for (var pId in this.games[gameId]['players']) {
            if (pId !== playerId) {
                return this.games[gameId]['players'][pId]
            }
        }
    }

    public getPlayerSocketId(gameId, playerId) {
        return this.games[gameId]['players'][playerId]
    }
}

export default App