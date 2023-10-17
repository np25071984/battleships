import App from './App'
import Player from './Player'
import Grid from './Grid'
import Position from '../common/Position'
import Ship from '../common/Ship'
import ShotResult from '../common/ShotResult'
import Cell from './Cell'
import ShipSection from '../common/ShipSection'

class Game {
    public id: string
    public round: number
    public players: Player[]
    public grid: Grid[]
    public roundShotsCounter: number
    public started: boolean

    constructor(gameId: string, round: number) {
        this.id = gameId
        this.round = round
        this.players = []
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

    joinPlayer(player: Player): void {
        // TODO: two players only
        this.players.push(player)
    }

    initClients() {
        const player1: Player = this.players[0]
        const player2: Player = this.players[1]

        if (!player1.isInitialized) {
            global.io.sockets.to(player1.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                'type': App.EVENT_TYPE_INIT,
                'playerId': player1.id,
                'round': this.round,
                'ships_grid': this.getGridWithOpponentShips(player2).typesOnly(),
                'shots_grid': player1.grid.typesOnly(),
            })
            player1.isInitialized = true
        }

        if (!player2.isInitialized) {
            global.io.sockets.to(player2.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                'type': App.EVENT_TYPE_INIT,
                'playerId': player2.id,
                'round': this.round,
                'ships_grid': this.getGridWithOpponentShips(player1).typesOnly(),
                'shots_grid': player2.grid.typesOnly(),
            })
            player2.isInitialized = true
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

        global.io.sockets.to(player1.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_ROUND,
            'number': this.round,
        })

        global.io.sockets.to(player2.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_ROUND,
            'number': this.round,
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
        let surrounding = {}
        for (const s in opponent.ships) {
            const ship: Ship = opponent.ships[s]
            if (ship.isLocatedAt(shotPosition)) {
                shotResult = ship.hit(shotPosition)
                if (shotResult === ShotResult.HIT_RESULT_SUNK) {
                    opponent.shipsCount--
                    surrounding = ship.getSurraund()
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
                for (const key in surrounding) {
                    const p = surrounding[key]
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

    announceShotResults() {
        this.roundShotsCounter = 0
        const player1: Player = this.players[0]
        const player2: Player = this.players[1]

        const player1ShotRes: ShotResult = this.getShotResult(player1.id)
        const player2ShotRes: ShotResult = this.getShotResult(player2.id)

        const player1Updates = player1.getUpdates()
        const player2Updates = player2.getUpdates()

        global.io.sockets.to(player1.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_ANNOUNCE,
            'playerId': player1.id,
            'result': player1ShotRes,
            'player_updates': player1Updates,
            'opponent_updates': player2Updates
        })

        global.io.sockets.to(player2.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
            'type': App.EVENT_TYPE_ANNOUNCE,
            'playerId': player2.id,
            'result': player2ShotRes,
            'player_updates': player2Updates,
            'opponent_updates': player1Updates
        })
    }

    isOver(): boolean {
        for (const p of this.players) {
            if (p.shipsCount === 0) {
                return true
            }
        }

        return false
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
            const l = this.getPlayer(loserId)
            const winner = this.getOpponent(loserId)
            global.io.sockets.to(l.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                'type': App.EVENT_TYPE_GAME_RESULT,
                'result': App.GAME_RESULT_DEFEAT,
                'playerId': l.id,
                'opponent_ships': winner.getAliveShips()
            })

            global.io.sockets.to(winner.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                'type': App.EVENT_TYPE_GAME_RESULT,
                'result': App.GAME_RESULT_WIN,
                'playerId': winner.id,
            })
        } else if (losers.length == 2) {
            this.players.forEach((player: Player) => {
                global.io.sockets.to(player.socketId).emit(App.EVENT_CHANNEL_NAME_GAME, {
                    'type': App.EVENT_TYPE_GAME_RESULT,
                    'result': App.GAME_RESULT_DRAW,
                    'playerId': player.id,
                })
            })
        } else {
            throw new Error(`Game ${this.id} doesn't look like it is over`)
        }
    }
}

export default Game