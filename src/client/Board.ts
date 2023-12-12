import Position from '../common/Position'
import Point from './Point'
import Cell from './Cell'
import Rect from './Rect'
import Grid from './Grid'
import Ship from './Ship'
import ShipSection from '../common/ShipSection'

class Board
{
    public rect: Rect
    public grid: Grid
    public fontSize: number
    public round: number | undefined
    public active: boolean
    public showAgenda: boolean
    private isReady: boolean

    constructor(outerRect: Rect, grid: Grid, fontSize: number, showAgenda: boolean) {
        this.rect = outerRect
        this.grid = grid
        this.fontSize = fontSize
        this.round = undefined
        this.active = false
        this.showAgenda = showAgenda
        this.isReady = false
    }

    rotateShip(): boolean {
        for (const ship of this.grid.ships) {
            if (ship.isSelected()) {
                const rotatedShip = new Ship(ship.position, !ship.isHorizontal, ship.type)
                if (this.grid.canPlace(rotatedShip)) {
                    // clean up previously occupied space
                    ship.sections.forEach((section: ShipSection) => {
                        this.grid.getCell(section.position).setType(Cell.CELL_TYPE_FOG_OF_WAR)
                    })

                    ship.isHorizontal = !ship.isHorizontal
                    ship.move(ship.position)

                    return true
                }

                break
            }
        }

        return false
    }

    mouseMove(point: Point): void {
        if (this.active) {
            this.grid.mouseMove(point)
        }
    }

    mouseClick(point: Point): void {
        if (this.active) {
            this.grid.mouseClick(point)
        }
    }

    mouseDown(point: Point): void {
        if (this.active) {
            this.grid.mouseDown(point)
        }
    }

    mouseUp(point: Point): void {
        if (this.active) {
            this.grid.mouseUp(point)
        }
    }

    getIsReady(): boolean {
        return this.isReady
    }

    setReady(value: boolean): void {
        if (value) {
            for (var r = 0; r < this.grid.rows; r++) {
                for (var c = 0; c < this.grid.cols; c++) {
                    const p = new Position(c, r)
                    const cell = this.grid.getCell(p)
                    cell.setChanged()
                }
            }
        }
        this.isReady = value
    }

    roundStart(number: number) {
        this.active = true
        this.round = number
    }

    loadData(data: any) {
        for (var r = 0; r < data.length; r++) {
            for (var c = 0; c < data[r].length; c++) {
                if (data[r][c] === Cell.CELL_TYPE_FOG_OF_WAR) {
                    continue
                }
                const p = new Position(c, r)
                const cell = this.grid.getCell(p)
                cell.setType(data[r][c])
            }
        }
    }

    static getInstance(cols: number, rows: number, showAgenda: boolean): Board {
        const gap: number = 1
        const maxBoardWidth = 423 // the board width is less or equal to this number of pixels
        const boardWidth: number = Math.min(window.innerWidth, maxBoardWidth)
        const fontSize: number = Math.floor(boardWidth/(cols * 3))
        const ltPoint = new Point(fontSize + 2, fontSize + 2)
        // distance between any two similar points of adjacent cells
        const step: number = Math.floor((boardWidth - (ltPoint.x * 2)) / cols)

        const cells: Cell[][] = []
        for (var r = 0; r < rows; r++) {
            const gridRow: Cell[] = []
            for (var c = 0; c < cols; c++) {
                // add gap in order to get left border
                const x = ltPoint.x + step * c + gap
                // add gap in order to get right border
                const y = ltPoint.y + step * r + gap
                const ltP = new Point(x, y)
                // subtract gap in order to get right and bottom borders
                const rbP = new Point(x + step - gap, y + step - gap)
                const outerRect = new Rect(ltP, rbP)

                const pos = new Position(c, r)

                gridRow[c] = new Cell(outerRect, pos, false, Cell.CELL_TYPE_FOG_OF_WAR, false)
            }
            cells[r] = gridRow
        }

        const grid = new Grid(cells)
        const rbPoint = new Point(ltPoint.x + step * cols + gap, ltPoint.y + step * rows + gap)
        const boardOuterRect = new Rect(ltPoint, rbPoint)
        const board = new Board(boardOuterRect, grid, fontSize, showAgenda)

        return board
    }
}

export default Board