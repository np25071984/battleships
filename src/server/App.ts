import * as express from 'express'
import Game from './Game'

class App {
    public static readonly EVENT_CHANNEL_NAME_SYSTEM: string = 'system'
    public static readonly EVENT_CHANNEL_NAME_GAME: string = 'game'
    public static readonly EVENT_TYPE_CONNECTED: string = 'connected'
    public static readonly EVENT_TYPE_DISCONNECT: string = 'disconnect'
    public static readonly EVENT_TYPE_WAITING: string = 'waiting'
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

    // public makeId(length: number) {
    //     let result = ''
    //     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    //     const charactersLength = characters.length
    //     let counter = 0
    //     while (counter < length) {
    //       result += characters.charAt(Math.floor(Math.random() * charactersLength))
    //       counter += 1
    //     }
    //     return result
    // }

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