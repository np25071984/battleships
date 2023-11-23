import Point from './Point'
import Cell from './Cell'
import Position from '../common/Position'
import Ship from './Ship'

class Grid {
    private cells: Cell[][]
    readonly cols: number
    readonly rows: number

    constructor(cells: Cell[][]) {
        this.cells = cells
        this.cols = cells[0].length
        this.rows = cells.length
    }

    canPlace(ship: Ship): boolean {
        if (ship.isHorizontal) {
            const rightSectionCol: number = ship.position.col + ship.type.getSize()
            if (rightSectionCol > this.cols) {
                return false
            }
        } else {
            const bottomSectionRow: number = ship.position.row + ship.type.getSize()
            if (bottomSectionRow > this.rows) {
                return false
            }
        }

        for (const placedShip of window.shipsBoard.ships) {
            if (!placedShip.isSelected()) {
                for (const section of ship.sections) {
                    if (placedShip.occupies(section.position)) {
                        return false
                    }
                }
            }
        }

        return true
    }

    doesCellExist(position: Position): boolean {
        if (!(position.row in this.cells)) {
            return false
        }

        if (!(position.col in this.cells[position.row])) {
            return false
        }

        return true
    }

    getCell(position: Position): Cell {
        return this.cells[position.row][position.col]
    }

    mouseMove(point: Point): void {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                cell.mouseMove(point)
            }
        }
    }

    mouseClick(point: Point): void {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                cell.mouseClick(point)
            }
        }
    }

    mouseDown(point: Point) {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                cell.mouseDown(point)
            }
        }
    }

    mouseUp(point: Point) {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                cell.mouseUp(point)
            }
        }
    }
}

export default Grid