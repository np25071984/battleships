import App from './App'
import Ship from './Ship'
import Grid from './Grid'
import Position from './Position'
import Cell from './Cell'
import ShipSection from './ShipSection'

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
        for (var r = 0; r < this.grid.cells.length; r++) {
            for (var c = 0; c < this.grid.cells[0].length; c++) {
                const p: Position = new Position(c, r)
                const cell = this.grid.getCell(p)
                if (cell.isChanged()) {
                    updates.push({
                        'col': p.col,
                        'row': p.row,
                        'type': cell.getType(),
                    })
                    cell.safe()
                }
            }
        }

        return updates
    }
}

export default Player