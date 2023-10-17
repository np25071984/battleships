import Cell from './Cell'
import Position from '../common/Position'

class Grid {
    public cells: Cell[][]

    constructor(cells: Cell[][]) {
        this.cells = cells
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
}

export default Grid