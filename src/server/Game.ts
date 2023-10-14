import App from './App'
import Player from './Player'
import Grid from './Grid'
import Position from './Position'
import Ship from './Ship'
import HitResult from '../common/HitResult'
import Cell from './Cell'
import ShipSection from './ShipSection'

class Game {
    public id: string
    public round: number
    public players: Player[]
    public grid: Grid[]
    public roundShotsCounter: number

    constructor(gameId: string, round: number, player1: Player, player2: Player) {
        this.id = gameId
        this.round = round
        this.players = [
            player1,
            player2
        ]
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

    initClient(playerId: string) {
        const player: Player = this.getPlayer(playerId)
        const opponent: Player = this.getOpponent(playerId)

        global.io.sockets.to(player.socketId).emit(App.EVENT_CHANNEL_NAME_SYSTEM, {
            'type': App.EVENT_TYPE_CONNECTED,
            'playerId': playerId,
            'round': this.round,
            'ships_grid': this.getGridWithOpponentShips(opponent),
            'shots_grid': player.grid,
        })
    }

    getGridWithOpponentShips(player: Player): Grid {
        const cells: Cell[][] = [];
        for (var r: number = 0; r < player.grid.cells.length; r++) {
            const rowItems: Cell[] = [];
            for (var c: number = 0; c < player.grid.cells[0].length; c++) {
                const p = new Position(c, r)
                rowItems[c] = new Cell(p, player.grid.cells[r][c].type);
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
                        // TODO: add sunk ships
                        type = Cell.CELL_TYPE_WRACKAGE
                    }
                    const cell = grid.getCell(p)
                    cell.setType(type)
                }
            } else {
                const surround = ship.getSurraund()
                for (const key in surround) {
                    const cell = grid.getCell(surround[key])
                    cell.setType(Cell.CELL_TYPE_WATER)
                }
                for (const s of ship.sections) {
                    const cell = grid.getCell(new Position(s.position.col, s.position.row))
                    cell.setType(Cell.CELL_TYPE_WRACKAGE)
                }
            }
        }

        return grid
    }

    startRound() {
        const player1: Player = this.players[0]
        const player2: Player = this.players[1]

        const player1Updates = []
        for (var r = 0; r < player1.grid.cells.length; r++) {
            for (var c = 0; c < player1.grid.cells[0].length; c++) {
                const p: Position = new Position(c, r)
                const cell = player1.grid.getCell(p)
                if (cell.changed) {
                    player1Updates.push({
                        'position': p,
                        'type': cell.type,
                    })
                    cell.changed = false
                }
            }
        }

        const player2Updates = []
        for (var r = 0; r < player2.grid.cells.length; r++) {
            for (var c = 0; c < player2.grid.cells[0].length; c++) {
                const p: Position = new Position(c, r)
                const cell = player2.grid.getCell(p)
                if (cell.changed) {
                    player2Updates.push({
                        'position': p,
                        'type': cell.type,
                    })
                    cell.changed = false
                }
            }
        }

        global.io.sockets.to(player1.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_ROUND,
            'number': this.round,
            'player_updates': player1Updates,
            'opponent_updates': player2Updates
        })

        global.io.sockets.to(player2.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_ROUND,
            'number': this.round,
            'player_updates': player2Updates,
            'opponent_updates': player1Updates
        })
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

    shot(position: Position, playerId: string): void {
        const player = this.getPlayer(playerId)
        if (!(this.round in player.shots)) { 
            player.shots[this.round] = position
            this.roundShotsCounter++
        }
    }

    getShotResult(playerId: string): HitResult {
        const player: Player = this.getPlayer(playerId)
        const shotPosition = player.shots[this.round]
        
        const opponent: Player = this.getOpponent(playerId)
        var hitResult: HitResult = HitResult.HIT_RESULT_MISS
        let surrounding = {}
        for (const s in opponent.ships) {
            const ship: Ship = opponent.ships[s]
            if (ship.isLocatedAt(shotPosition)) {
                hitResult = ship.hit(shotPosition)
                if (hitResult === HitResult.HIT_RESULT_SUNK) {
                    opponent.shipsCount--
                    surrounding = ship.getSurraund()
                }
                break
            }
        }

        const cell = player.grid.getCell(shotPosition)
        switch (hitResult) {
            case HitResult.HIT_RESULT_MISS:
                cell.setType(Cell.CELL_TYPE_WATER)
                break
            case HitResult.HIT_RESULT_SUNK:
                for (const key in surrounding) {
                    const p = surrounding[key]
                    const c = player.grid.getCell(p)
                    c.setType(Cell.CELL_TYPE_WATER)
                }
            case HitResult.HIT_RESULT_DAMAGE:
                cell.setType(Cell.CELL_TYPE_WRACKAGE)
                break
        }

        return hitResult
    }
}

export default Game