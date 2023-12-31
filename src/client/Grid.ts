import Point from './Point'
import Position from '../common/Position'
import Ship from './Ship'
import AbstractGrid from '../common/AbstractGrid'
import Cell from '../common/Cell'
import ShipSection from '../common/ShipSection'


class Grid extends AbstractGrid
{
    public ships: Ship[] = []

    loadShip(ship: Ship): void {
        this.ships.push(ship)
    }

    resetShips(): void {
        this.ships.forEach((ship: Ship) => {
            ship.sections.forEach((section: ShipSection) => {
                this.getCell(section.position).setType(Cell.CELL_TYPE_FOG_OF_WAR)
            })
        })

        this.ships = []
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

        for (const placedShip of this.ships) {
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

    mouseMove(point: Point): void {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                if ('mouseMove' in cell) {
                    cell.mouseMove(point)
                }
            }
        }
    }

    mouseClick(point: Point): void {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                if ('mouseClick' in cell) {
                    cell.mouseClick(point)
                }
            }
        }
    }

    mouseDown(point: Point) {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                if ('mouseDown' in cell) {
                    cell.mouseDown(point)
                }
            }
        }
    }

    mouseUp(point: Point) {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                if ('mouseUp' in cell) {
                    cell.mouseUp(point)
                }
            }
        }
    }
}

export default Grid