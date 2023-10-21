import Position from '../common/Position'
import Point from './Point'
import Cell from './Cell'
import Rect from './Rect'
import Grid from './Grid'

class Board
{
    public round: number | undefined
    public active: boolean
    public rect: Rect
    public grid: Grid
    public showAgenda: boolean

    constructor(outerRect: Rect, grid: Grid, showAgenda: boolean) {
        this.round = undefined;
        this.active = false;
        this.rect = outerRect;
        this.grid = grid;
        this.showAgenda = showAgenda;
    }

    mouseMove(point: Point) {
        if (this.active) {
            this.grid.mouseMove(point);
        }
    }

    mouseClick(point: Point) {
        if (this.active) {
            this.grid.mouseClick(point);
        }
    }

    mouseDown(point: Point) {
        if (this.active) {
            this.grid.mouseDown(point);
        }
    }

    mouseUp(point: Point) {
        if (this.active) {
            this.grid.mouseUp(point);
        }
    }

    roundStart(number: number) {
        this.active = true;
        this.round = number;
    }

    static initFromServerData(ltPoint: Point, width: number, gap: number, data: any, showAgenda: boolean) {
        // TODO: col,row max value
        const xSt = ltPoint.x + gap;
        const ySt = ltPoint.y + gap;
        const col = data[0].length
        const row = data.length
        const step = width + gap;
        const totalWidth = gap + (step * col);
        const totalHeight = gap + (step * row);

        const cells: Cell[][] = []
        var positionY = 0;
        for (var y = ySt; y < ltPoint.y + totalHeight; y += step) {
            var positionX = 0;
            const gridRow: Cell[] = []
            for (var x = xSt; x < ltPoint.x + totalWidth; x += step) {
                const ltP = new Point(x, y);
                const pos = new Position(positionX, positionY);
                const rbP = new Point(x + width, y + width);
                const outerRect = new Rect(ltP, rbP);
                gridRow[positionX] = new Cell(outerRect, pos, false, data[positionX][positionY], false);
                positionX++;
            }
            cells[positionY] = gridRow
            positionY++;
        }

        const grid = new Grid(cells);
        const rbPoint = new Point(ltPoint.x + totalWidth, ltPoint.y + totalHeight);
        const boardOuterRect = new Rect(ltPoint, rbPoint);
        const board = new Board(boardOuterRect, grid, showAgenda);

        return board;
    }

    static initFrom(ltPoint: Point, width: number, gap: number, row: number, col: number, showAgenda: boolean) {
        // TODO: col,row max value
        const xSt = ltPoint.x + gap;
        const ySt = ltPoint.y + gap;
        const step = width + gap;
        const totalWidth = gap + (step * col);
        const totalHeight = gap + (step * row);

        const cells: Cell[][] = []
        var positionY = 0;
        for (var y = ySt; y < ltPoint.y + totalHeight; y += step) {
            var positionX = 0;
            const gridRow: Cell[] = []
            for (var x = xSt; x < ltPoint.x + totalWidth; x += step) {
                const ltP = new Point(x, y);
                const pos = new Position(positionX, positionY);
                const rbP = new Point(x + width, y + width);
                const outerRect = new Rect(ltP, rbP);
                gridRow[positionX] = new Cell(outerRect, pos, false, Cell.CELL_TYPE_FOG_OF_WAR, false);
                positionX++;
            }
            cells[positionY] = gridRow
            positionY++;
        }

        const grid = new Grid(cells);
        const rbPoint = new Point(ltPoint.x + totalWidth, ltPoint.y + totalHeight);
        const boardOuterRect = new Rect(ltPoint, rbPoint);
        const board = new Board(boardOuterRect, grid, showAgenda);

        return board;
    }
}

export default Board