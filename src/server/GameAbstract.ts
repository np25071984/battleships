import App from './App'
import Player from './Player'
import Grid from './Grid'
import Position from '../common/Position'
import Ship from '../common/Ship'
import ShotResult from '../common/ShotResult'
import Cell from '../common/Cell'
import ShipSection from '../common/ShipSection'
import Settings from './Settings'

abstract class GameAbstract {
    public id: string
    public round: number
    public players: Player[]
    public roundShotsCounter: number
    public settings: Settings

    constructor(gameId: string, round: number, settings: Settings) {
        this.id = gameId
        this.round = round
        this.players = []
        this.settings = settings
        // TODO: calculate playes shots in current round
        this.roundShotsCounter = 0
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

    abstract joinPlayer(player: Player): void

    abstract initClients(): void

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
            if (ship.alive) {
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
                for (const p of ship.getSurraund()) {
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

    nextRound() {
        this.round++
        this.roundShotsCounter = 0
        this.startRound()
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
    }

    getShotResult(playerId: string): ShotResult {
        const player: Player = this.getPlayer(playerId)
        const shotPosition = player.shots[this.round]

        const opponent: Player = this.getOpponent(playerId)
        var shotResult: ShotResult = ShotResult.HIT_RESULT_MISS
        let surraund = []
        for (const s in opponent.ships) {
            const ship: Ship = opponent.ships[s]
            if (ship.isLocatedAt(shotPosition)) {
                shotResult = ship.hit(shotPosition)
                if (shotResult === ShotResult.HIT_RESULT_SUNK) {
                    opponent.shipsCount--
                    surraund = ship.getSurraund()
                }
                break
            }
        }

        const cell = player.grid.getCell(shotPosition)
        switch (shotResult) {
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
            case ShotResult.HIT_RESULT_DAMAGE:
                cell.setType(Cell.CELL_TYPE_WRACKAGE)
                break
        }

        return shotResult
    }

    abstract announceShotResults()

    isOver(): boolean {
        for (const p of this.players) {
            if (p.shipsCount === 0) {
                return true
            }
        }

        return false
    }

    abstract announceGameResults()

    abstract isReadyForNextRound(): boolean

    startRound() {
        const player1: Player = this.players[0]
        global.io.sockets.to(player1.socketId).emit(App.EVENT_TYPE_ROUND, {'number': this.round})

        const player2: Player = this.players[1]
        if (player2.id === 'bot') {
            return
        }
        global.io.sockets.to(player2.socketId).emit(App.EVENT_TYPE_ROUND, {'number': this.round})
    }

    notifyOpponent(playerId: string, eventType: string, event): void {
        const opponent: Player = this.getOpponent(playerId)
        if (opponent.id === 'bot') {
            return
        }

        global.io.sockets.to(opponent.socketId).emit(eventType, event)
    }
}

export default GameAbstract