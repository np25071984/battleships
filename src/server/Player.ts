import Ship from '../common/Ship'
import Grid from './Grid'
import Position from '../common/Position'

interface Shots {
    [round: string]: Position
}

class Player {
    ships: Ship[]
    grid: Grid
    socketId: string
    shots: Shots
    id: string
    shipsCount: number

    constructor(id: string, grid: Grid, ships: Ship[]) {
        this.id = id
        this.socketId = ''
        this.grid = grid
        this.ships = ships
        this.shots = {}
        this.shipsCount = this.ships.length
    }

    updateSocketId(socketId: string) {
        // TODO: emit TERMINATE event to previous socket

        this.socketId = socketId
    }

    getUpdates(): object[] {
        const updates = []
        for (var r = 0; r < this.grid.rows; r++) {
            for (var c = 0; c < this.grid.cols; c++) {
                const p: Position = new Position(c, r)
                const cell = this.grid.getCell(p)
                if (cell.isChanged()) {
                    updates.push({
                        'col': p.col,
                        'row': p.row,
                        'type': cell.getType(),
                    })
                    cell.save()
                }
            }
        }

        return updates
    }

    getRemainingShipsSections(): object[] {
        const aliveSections: object[] = []
        for (const s in this.ships) {
            const ship: Ship = this.ships[s]
            if (ship.alive) {
                for (const section of ship.sections) {
                    if (section.isAlive) {
                        aliveSections.push({
                            'col': section.position.col,
                            'row': section.position.row,
                        })
                    }
                }
            }
        }

        return aliveSections
    }

    getRemainingShipsStat(): Object {
        const playerRemainingShips: Object = {}
        this.ships.forEach((ship: Ship) => {
            if (!ship.alive) {
                return
            }

            const size: number = ship.type.getSize()
            if (!(size in playerRemainingShips)) {
                playerRemainingShips[size] = 0
            }

            playerRemainingShips[size]++
        })

        return playerRemainingShips
    }
}

export default Player