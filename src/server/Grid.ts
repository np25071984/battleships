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
        if (!(position.col in this.cells)) {
            return false
        }

        if (!(position.row in this.cells[position.col])) {
            return false
        }

        return true
    }

    getCell(position: Position): Cell {
        return this.cells[position.col][position.row]
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

    // const shipTypeCarrier = new ShipTypeCarrier()
    // const shipTypeBattleShip = new ShipTypeBattleShip()
    // const shipDestroyerType = new ShipTypeDestroyer()
    // const shipPatrolBoatType = new ShipTypePatrolBoat()
    // const shipTypes = [shipTypeCarrier, shipTypeBattleShip, shipTypeBattleShip, shipDestroyerType, shipDestroyerType, shipDestroyerType, shipPatrolBoatType, shipPatrolBoatType, shipPatrolBoatType, shipPatrolBoatType]

    // const res = Grid.arrangeShips(10, 10, [], shipTypes)
    // console.log(res)
    // for (const key in res) {
    //     console.log("Set:")
    //     const ships: Ship[] = res[key]
    //     ships.forEach((ship: Ship) => {
    //         const orientation: string = ship.orientation === Ship.SHIP_ORIENTATION_HORIZONTAL ? 'hr' : 'vr'
    //         console.log(`${ship.position.col}x${ship.position.row}: ${orientation} ${ship.type.getSize()}`)
    //     })
    // }
    // process.exit()

    /**
     * Dinamic programming + memorization approach to find all possible ships combinations for a given grid dimension
     * TODO: doesn't look like it is efficient...
     */
    static arrangeShips(col: number, row: number, placedShips: Ship[], shipsToPlace: ShipTypeAbstract[]) {
        const shipKeys: string[] = [];
        placedShips.forEach((ship: Ship) => {
            shipKeys.push(`${ship.position.col}x${ship.position.row}x${ship.orientation}x${ship.type.getSize()}`)
        })
        var typeKeys: number[] = [];
        shipsToPlace.forEach((type: ShipTypeAbstract) => {
            typeKeys.push(type.getSize())
        })
        shipKeys.sort()
        typeKeys.sort()
        const cacheKey: string = shipKeys.join("|") + '|' + typeKeys.join("|")

        if (cacheKey in Grid.memo) {
            console.log(cacheKey)
            return Grid.memo[cacheKey]
        }

        const res: PlacedShips = {}

        if (shipsToPlace.length === 0) {
            res[shipKeys.join("|")] = placedShips
        } else {
            const grid = Grid.initGrid(col, row)
            placedShips.forEach((ship: Ship) => {
                grid.placeShipWithSurrounding(ship)
            })

            const shipType = shipsToPlace.pop()
            for (const orientation of [Ship.SHIP_ORIENTATION_VERTICAL, Ship.SHIP_ORIENTATION_HORIZONTAL]) {
                const maxCol = orientation === Ship.SHIP_ORIENTATION_HORIZONTAL ? grid.cols - shipType.getSize() : grid.cols - 1
                const maxRow = orientation === Ship.SHIP_ORIENTATION_HORIZONTAL ? grid.rows - 1 : grid.rows - shipType.getSize()
                for (var r = 0; r <= maxRow; r++) {
                    for (var c = 0; c <= maxCol; c++) {
                        const ship = new Ship(new Position(c, r), orientation, shipType)

                        if (grid.canPlaceShip(ship) === true) {
                            const pl = [...placedShips]
                            pl.push(ship)
                            const r = Grid.arrangeShips(col, row, pl, [...shipsToPlace])
                            for (const k in r) {
                                res[k] = r[k]
                            }
                        }
                    }
                }
            }
        }

        Grid.memo[cacheKey] = res

        return res
    }
}

export default Grid