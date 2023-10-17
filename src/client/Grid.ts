import Point from './Point'
import Cell from './Cell'
import Position from '../common/Position'

class Grid
{
    public cells
    public rows: number
    public cols: number

    constructor(cells, cols: number, rows: number) {
        this.cells = cells
        this.rows = rows
        this.cols = cols
    }

    mouseMove(point: Point): void {
        for (const key in this.cells) {
            const cell = this.cells[key]
            cell.mouseMove(point)
        }
    }

    mouseClick(point: Point): void {
        for (const key in this.cells) {
            const cell = this.cells[key]
            cell.mouseClick(point)
        }
    }

    getCell(position: Position): Cell {
        const key = position.generateKey()
        return this.cells[key]
    }

    setCellType(position: Position, cellType: number): void {
        const key = position.generateKey()
        if (this.cells[key].type !== cellType) {
            this.cells[key].type = cellType
            this.cells[key].changed = true
        }
    }

    cellExists(position: Position): boolean {
        const key = position.generateKey()
        return key in this.cells
    }
}

export default Grid