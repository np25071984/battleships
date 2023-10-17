import Ship from '../common/Ship'
import Grid from './Grid'
import Position from '../common/Position'
import ShipSection from '../common/ShipSection'

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
    isInitialized: boolean
    
    constructor(id: string, grid: Grid, ships: Ship[]) {
        this.id = id
        this.socketId = ''
        this.grid = grid
        this.ships = ships
        this.shots = {}
        this.shipsCount = this.ships.length
        this.isInitialized = false
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

    getAliveShips(): object[] {
        const aliveSections: object[] = []
        for (const s in this.ships) {
            const ship: Ship = this.ships[s]
            if (ship.alive) {
                for (const secId in ship.sections) {
                    const section: ShipSection = ship.sections[secId]
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
}

export default Player