import Point from './Point'
import Cell from './Cell'
import Position from '../common/Position'
import Ship from './Ship'
import ShipSection from '../common/ShipSection'
import ShipTypeFactory from '../common/ShipTypeFactory'

class Grid {
    private cells: Cell[][]
    readonly cols: number
    readonly rows: number

    constructor(cells: Cell[][]) {
        this.cells = cells
        this.cols = cells[0].length
        this.rows = cells.length
    }

    canPlace(ship: Ship, position: Position): boolean {
        const tmpShip = new Ship(position, ship.orientation, ShipTypeFactory.getType(ship.type.getSize()))

        if (ship.orientation === Ship.SHIP_ORIENTATION_HORIZONTAL) {
            const rightSectionCol: number = tmpShip.position.col + tmpShip.type.getSize()
            if (rightSectionCol > window.shipsBoard.grid.cols) {
                return false
            }
        }

        if (ship.orientation === Ship.SHIP_ORIENTATION_VERTICAL) {
            const bottomSectionRow: number = tmpShip.position.row + tmpShip.type.getSize()
            if (bottomSectionRow > window.shipsBoard.grid.rows) {
                return false
            }
        }

        for (const placedShip of window.shipsBoard.ships) {
            if (!placedShip.isSelected()) {
                for (const key in tmpShip.sections) {
                    const section: ShipSection = tmpShip.sections[key]
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