import Cell from '../common/Cell'
import Position from '../common/Position'
import Ship from '../common/Ship'
import ShipSection from '../common/ShipSection'
import AbstractGrid from '../common/AbstractGrid'

class Grid extends AbstractGrid
{
    static initGrid(col: number, row: number): Grid {
        const grid: Cell[][] = [];
        for (var r: number = 0; r < row; r++) {
            const rowItems: Cell[] = []
            for (var c: number = 0; c < col; c++) {
                const p = new Position(c, r)
                rowItems[c] = new Cell(p)
            }
            grid[r] = rowItems
        }

        return new Grid(grid)
    }

    typesOnly(): number[][] {
        const grid: number[][] = []
        for (var r = 0; r < this.cells.length; r++) {
            const row: number[] = []
            for (var c = 0; c < this.cells[r].length; c++) {
                row[c] = this.cells[r][c].getType()
            }
            grid[r] = row
        }

        return grid
    }

    placeShipWithSurrounding(ship: Ship): void {
        ship.sections.forEach((section: ShipSection) => {
            const cell = this.getCell(section.position)
            const type: number = section.isAlive ? Cell.CELL_TYPE_SHIP : Cell.CELL_TYPE_WRACKAGE
            cell.setType(type)
        }, this)

        const surrounding = ship.getSurrounding()
        for (const s of surrounding) {
            if (this.doesCellExist(s)) {
                this.getCell(s).setType(Cell.CELL_TYPE_WATER)
            }
        }
    }

    canPlace(ship: Ship): boolean {
        for (const section of ship.sections) {
            if (!this.doesCellExist(section.position)) {
                return false
            }

            const cell = this.getCell(section.position)
            if (cell.getType() !== Cell.CELL_TYPE_FOG_OF_WAR) {
                return false
            }
        }

        return true
    }
}

export default Grid