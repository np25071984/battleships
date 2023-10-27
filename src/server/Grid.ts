import Cell from '../common/Cell'
import Position from '../common/Position'
import Ship from '../common/Ship'
import ShipSection from '../common/ShipSection'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import PlacedShips from './PlacedShips'

class Grid {
    private cells: Cell[][]
    readonly cols: number
    readonly rows: number

    constructor(cells: Cell[][]) {
        this.cells = cells
        this.cols = cells[0].length
        this.rows = cells.length
    }

    static initGrid(col: number, row: number): Grid {
        const grid: Cell[][] = [];
        for (var r: number = 0; r < row; r++) {
            const rowItems: Cell[] = [];
            for (var c: number = 0; c < col; c++) {
                const p = new Position(c, r)
                rowItems[c] = new Cell(p);
            }
            grid[r] = rowItems
        }

        return new Grid(grid)
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

    typesOnly(): number[][] {
        const grid: number[][] = [];
        for (var r = 0; r < this.cells.length; r++) {
            const row: number[] = [];
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

        const surround = ship.getSurraund();
        for (const k in surround) {
            const s = surround[k]
            if (this.doesCellExist(s)) {
                this.getCell(s).setType(Cell.CELL_TYPE_WATER)
            }
        }
    }

    canPlaceShip(ship: Ship): boolean {
        for (const section of ship.sections) {
            const cell = this.getCell(section.position)
            if (cell.getType() !== Cell.CELL_TYPE_FOG_OF_WAR) {
                return false
            }
        }

        return true
    }

    static memo = {}

    static placeShips(col: number, row: number, placedShips: Ship[], shipsToPlace: ShipTypeAbstract[]): Ship[]|null {
        if (shipsToPlace.length === 0) {
            return placedShips
        }
        const grid = Grid.initGrid(col, row)
        placedShips.forEach((ship: Ship) => {
            grid.placeShipWithSurrounding(ship)
        })

        const types = [...shipsToPlace]
        const shipType = types.pop()
        const orientations = Math.random() > 0.5
            ? [Ship.SHIP_ORIENTATION_VERTICAL, Ship.SHIP_ORIENTATION_HORIZONTAL]
            : [Ship.SHIP_ORIENTATION_HORIZONTAL, Ship.SHIP_ORIENTATION_VERTICAL]
        for (const orientation of orientations) {
            const maxCol = orientation === Ship.SHIP_ORIENTATION_HORIZONTAL ? grid.cols - shipType.getSize() : grid.cols
            const maxRow = orientation === Ship.SHIP_ORIENTATION_HORIZONTAL ? grid.rows : grid.rows - shipType.getSize()
            const randomRowOffset = Math.floor(Math.random() * maxRow)
            for (var r = 0; r < maxRow; r++) {
                var rr = r + randomRowOffset
                if (rr >= maxRow) {
                    rr -= maxRow
                }
                const randomColOffset = Math.floor(Math.random() * maxCol)
                for (var c = 0; c < maxCol; c++) {
                    var cc = c + randomColOffset
                    if (cc >= maxCol) {
                        cc -= maxCol
                    }
                    const ship = new Ship(new Position(cc, rr), orientation, shipType)

                    if (grid.canPlaceShip(ship) === true) {
                        const pl = [...placedShips]
                        pl.push(ship)
                        const res = Grid.placeShips(col, row, pl, [...types])
                        if (res !== null) {
                            return res
                        }
                    }
                }
            }
        }

        return null
    }
}

export default Grid