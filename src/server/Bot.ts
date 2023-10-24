import Ship from '../common/Ship'
import Grid from './Grid'
import Position from '../common/Position'
import ShipSection from '../common/ShipSection'
import Player from './Player'
import Cell from '../common/Cell'

class Bot extends Player {
    decisionGrid: Grid

    constructor(id: string, grid: Grid, ships: Ship[]) {
        super(id, grid, ships)
        this.decisionGrid = Grid.initGrid(grid.cols, grid.rows)
    }

    makeShot(round: number) {
        const availableForShot: Position[] = []
        for (var r = 0; r < this.decisionGrid.rows; r++) {
            for (var c = 0; c < this.decisionGrid.cols; c++) {
                const p = new Position(c, r)
                const cell = this.decisionGrid.getCell(p)
                if (cell.getType() === Cell.CELL_TYPE_FOG_OF_WAR) {
                    availableForShot.push(new Position(cell.position.col, cell.position.row))
                }
            }
        }

        const randomPosition = availableForShot[Math.floor(Math.random() * availableForShot.length)]
        this.shots[round] = new Position(randomPosition.col, randomPosition.row)
    }

    syncDecisionBoard(updates): void {
        updates.forEach((upd) => {
            this.decisionGrid.getCell(new Position(upd.col, upd.row)).setType(upd.type)
        })

        // TODO: find "dead" cells and mark them
    }
}

export default Bot