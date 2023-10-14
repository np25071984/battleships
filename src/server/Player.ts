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
}

export default Player