import Player from './Player'
import Grid from './Grid'
import Position from '../common/Position'
import Ship from '../common/Ship'
import ShotResult from '../common/ShotResult'
import Cell from '../common/Cell'
import ShipSection from '../common/ShipSection'
import Settings from './Settings'
import Bot from './Bot'
import Randomizer from './Randomizer'
import {
    GameResultEvent,
    ShotResultEvent,
    InitEvent,
    RoundEvent,
} from '../common/@types/socket'
import { GameResult } from '../common/Enums'

class Game {
    public id: string
    public round: number
    public players: Player[]
    public roundShotsCounter: number
    public settings: Settings
    public fallbackShipsConfiguration: Ship[]

    constructor(gameId: string, round: number, settings: Settings, fallbackConfiguration: Ship[]) {
        this.id = gameId
        this.round = round
        this.players = []
        this.settings = settings
        this.roundShotsCounter = 0 // TODO: calculate playes shots in current round

        /**
         * During new game creation we try to generate random ships configuration in order to figure out
         * whether the chosen ships make sense for given game grid or not.
         * Once we succeed in this we store the configuration to be able use in the future. The generation algorithm
         * is time consuming and we don't want to waste much resources on it. This why there are cases when we use stored
         * configuration as a fallback solution.
         */
        this.fallbackShipsConfiguration = fallbackConfiguration
    }

    doesPlayerExist(playerId: string): boolean {
        for (const p in this.players) {
            const pl: Player = this.players[p]
            if (pl.id == playerId) {
                return true
            }
        }

        return false
    }

    joinPlayer(player: Player): void {
        this.players.push(player)

        if (this.settings.gameType === Settings.GAME_TYPE_SINGLE) {
            const playerId: string = 'bot'
            const grid = Grid.initGrid(this.settings.gridCols, this.settings.gridRows)

            const maxIterations: number = this.settings.gridCols * this.settings.gridRows * 1000
            const randomizer: Randomizer = new Randomizer(maxIterations)
            randomizer.findShipsCombination(
                this.settings.gridCols,
                this.settings.gridRows,
                this.settings.shipTypes
            ).then((ships: Ship[]|null) => {
                if (ships === null) {
                    // We were unable to find new random ships configuration. Let's use the fallback one
                    ships = this.fallbackShipsConfiguration
                }

                const bot = new Bot(playerId, grid, ships)
                bot.updateSocketId('null-socket')
                this.players.push(bot)
            })
        }
    }

    getGridWithOpponentShips(player: Player): Grid {
        const cells: Cell[][] = [];
        for (var r: number = 0; r < player.grid.rows; r++) {
            const rowItems: Cell[] = [];
            for (var c: number = 0; c < player.grid.cols; c++) {
                const p = new Position(c, r)
                rowItems[c] = new Cell(p, player.grid.getCell(p).getType());
            }
            cells[r] = rowItems
        }
        const grid: Grid = new Grid(cells)

        const opponent: Player = this.getOpponent(player.id)
        for (const s in opponent.ships) {
            const ship: Ship = opponent.ships[s]
            if (ship.isAlive) {
                for (const secId in ship.sections) {
                    const section: ShipSection = ship.sections[secId]
                    const p = new Position(section.position.col, section.position.row)
                    var type: number
                    if (section.isAlive) {
                        type = Cell.CELL_TYPE_SHIP
                    } else {
                        type = Cell.CELL_TYPE_WRACKAGE
                    }
                    const cell = grid.getCell(p)
                    cell.setType(type)
                }
            } else {
                for (const p of ship.getSurrounding()) {
                    if (grid.doesCellExist(p)) {
                        const cell = grid.getCell(p)
                        cell.setType(Cell.CELL_TYPE_WATER)
                    }
                }
                for (const s of ship.sections) {
                    const cell = grid.getCell(new Position(s.position.col, s.position.row))
                    cell.setType(Cell.CELL_TYPE_WRACKAGE)
                }
            }
        }

        return grid
    }

    isValidSocketId(targetSocketId: string): boolean {
        for (const p in this.players) {
            const pl: Player = this.players[p]
            if (pl.socketId == targetSocketId) {
                return true
            }
        }

        return false
    }

    getPlayer(playerId: string): Player {
        for (const p in this.players) {
            const pl: Player = this.players[p]
            if (pl.id == playerId) {
                return pl
            }
        }

        throw new Error(`Couldn't get player '${playerId}' in game '${this.id}'`)
    }

    getOpponent(playerId: string): Player {
        for (const p in this.players) {
            const pl: Player = this.players[p]
            if (pl.id !== playerId) {
                return pl
            }
        }

        throw new Error(`Couldn't find the opponent for '${playerId}' in game '${this.id}'`)
    }

    doesOpponentExist(playerId: string): boolean {
        for (const p in this.players) {
            const pl: Player = this.players[p]
            if (pl.id !== playerId && pl.socketId !== '') {
                return true
            }
        }

        return false
    }

    shot(position: Position, playerId: string): void {
        const player = this.getPlayer(playerId)
        if (!(this.round in player.shots)) {
            player.shots[this.round] = position
            this.roundShotsCounter++
        }

        if (this.settings.gameType === Settings.GAME_TYPE_SINGLE) {
            const bot: Bot = this.players[1] as Bot
            bot.makeShot(this.round)
        }
    }

    getShotResult(playerId: string): ShotResult {
        const player: Player = this.getPlayer(playerId)
        const shotPosition = player.shots[this.round]
        const opponent: Player = this.getOpponent(playerId)
        var shotResult: ShotResult = new ShotResult(ShotResult.HIT_RESULT_MISS)
        let surraund = []
        for (const s in opponent.ships) {
            const ship: Ship = opponent.ships[s]
            if (ship.isLocatedAt(shotPosition)) {
                shotResult = ship.hit(shotPosition)
                if (shotResult.isSunk()) {
                    opponent.shipsCount--
                    surraund = ship.getSurrounding()
                }
                break
            }
        }

        const cell = player.grid.getCell(shotPosition)
        switch (shotResult.shotResult) {
            case ShotResult.HIT_RESULT_MISS:
                cell.setType(Cell.CELL_TYPE_WATER)
                break
            case ShotResult.HIT_RESULT_SUNK:
                for (const p of surraund) {
                    if (player.grid.doesCellExist(p)) {
                        const c = player.grid.getCell(p)
                        c.setType(Cell.CELL_TYPE_WATER)
                    }
                }
                // no brake statement on purpose
            case ShotResult.HIT_RESULT_DAMAGE:
                cell.setType(Cell.CELL_TYPE_WRACKAGE)
                break
        }

        return shotResult
    }

    isOver(): boolean {
        for (const p of this.players) {
            if (p.shipsCount === 0) {
                return true
            }
        }

        return false
    }

    isReadyForNextRound(): boolean {
        if (this.settings.gameType === Settings.GAME_TYPE_SINGLE) {
            return this.roundShotsCounter === 1
        } else {
            return this.roundShotsCounter === 2
        }
    }

    initClients() {
        const player1: Player = this.players[0]
        const player2: Player = this.players[1]

        const initEvent: InitEvent = {
            'playerId': player1.id,
            'round': this.round,
            'ships_grid': this.getGridWithOpponentShips(player2).typesOnly(),
            'shots_grid': player1.grid.typesOnly(),
        }
        global.io.sockets.to(player1.socketId).emit("init", initEvent)

        if (player2.id !== 'bot') {
            const initEvent: InitEvent = {
                'playerId': player2.id,
                'round': this.round,
                'ships_grid': this.getGridWithOpponentShips(player1).typesOnly(),
                'shots_grid': player2.grid.typesOnly(),
            }
            global.io.sockets.to(player2.socketId).emit("init", initEvent)
        }
    }

    announceShotResults(): void {
        this.roundShotsCounter = 0
        const player1: Player = this.players[0]
        const player2: Player = this.players[1]

        const player1ShotRes: ShotResult = this.getShotResult(player1.id)
        const player2ShotRes: ShotResult = this.getShotResult(player2.id)

        const player1Updates = player1.getUpdates()
        const player2Updates = player2.getUpdates()

        const player1ShotResultObject: ShotResultEvent = {
            'playerId': player1.id,
            'result': player1ShotRes.shotResult,
            'shots_updates': player1Updates,
            'ships_updates': player2Updates,
        }

        if (player1ShotRes.isSunk()) {
            if (!('size' in player1ShotRes.details)) {
                throw new Error("Couldn't find details object")
            }
            player1ShotResultObject['size'] = player1ShotRes.details.size as number
        }

        global.io.sockets.to(player1.socketId).emit("announce", player1ShotResultObject)

        if (player2.id === 'bot') {
            const bot = player2 as Bot
            bot.syncDecisionBoard(player2ShotRes, player2Updates)
        } else {
            const player2ShotResultObject: ShotResultEvent = {
                'playerId': player2.id,
                'result': player2ShotRes.shotResult,
                'shots_updates': player2Updates,
                'ships_updates': player1Updates,
            }

            if (player2ShotRes.isSunk()) {
                if (!('size' in player2ShotRes.details)) {
                    throw new Error("Couldn't find details object")
                }
                player2ShotResultObject['size'] = player2ShotRes.details.size as number
            }

            global.io.sockets.to(player2.socketId).emit("announce", player2ShotResultObject)
        }
    }

    announceGameResults() {
        const losers = []
        for (const p of this.players) {
            if (p.shipsCount === 0) {
                losers.push(p.id)
            }
        }

        if (losers.length === 1) {
            const loserId: string = losers[0]
            const loser = this.getPlayer(loserId)
            const winner = this.getOpponent(loserId)
            if (loser.id !== 'bot') {
                const gameResultEvent: GameResultEvent = {
                    'result': GameResult.defeat,
                    'playerId': loser.id,
                    'opponent_ships': winner.getRemainingShipsSections()
                }
                global.io.sockets.to(loser.socketId).emit("game_result", gameResultEvent)
            }

            if (winner.id !== 'bot') {
                const gameResultEvent: GameResultEvent = {
                    'result': GameResult.win,
                    'playerId': winner.id,
                }
                global.io.sockets.to(winner.socketId).emit("game_result", gameResultEvent)
            }
        } else if (losers.length == 2) {
            this.players.forEach((player: Player) => {
                if (player.id === 'bot') {
                    return
                }

                const gameResultEvent: GameResultEvent = {
                    'result': GameResult.draw,
                    'playerId': player.id,
                }
                global.io.sockets.to(player.socketId).emit("game_result", gameResultEvent)
            })
        } else {
            throw new Error(`Game ${this.id} doesn't look like it is over`)
        }
    }

    startRound() {
        const player1: Player = this.players[0]
        const roundEvent: RoundEvent = {'number': this.round}
        global.io.sockets.to(player1.socketId).emit("round", roundEvent)

        const player2: Player = this.players[1]
        if (player2.id === 'bot') {
            return
        }
        global.io.sockets.to(player2.socketId).emit("round",roundEvent)
    }

    nextRound() {
        this.round++
        this.roundShotsCounter = 0
        this.startRound()
    }
}

export default Game