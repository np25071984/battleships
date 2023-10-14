import Position from './Position'
import Point from './Point'
import Cell from './Cell'
import Rect from './Rect'
import Grid from './Grid'

class Board
{
    public round: number|undefined
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
            this.active = false;
        }
    }

    roundStart(number: number) {
        this.active = true;
        this.round = number;
    }

    setCellType(position: Position, cellType) {
        this.grid.setCellType(position, cellType)
    }

    static initFromServerData(ltPoint: Point, width: number, gap: number, data: any, showAgenda: boolean) {
        // TODO: col,row max value
        const xSt = ltPoint.x + gap;
        const ySt = ltPoint.y + gap;
        const col = data.cells[0].length
        const row = data.cells.length
        const step = width + gap;
        const totalWidth = gap + (step * col);
        const totalHeight = gap + (step * row);

        const cells = {};
        var positionY = 0;
        for (var y = ySt; y < ltPoint.y + totalHeight; y += step) {
            var positionX = 0;
            for (var x = xSt; x < ltPoint.x + totalWidth; x += step) {
                const ltP = new Point(x, y);
                const pos = new Position(positionX, positionY);
                const key = `${positionX}_${positionY}`;
                const rbP = new Point(x + width, y + width);
                const outerRect = new Rect(ltP, rbP);
                cells[key] = new Cell(outerRect, pos, false, data.cells[positionX][positionY].type, false);
                positionX++;
            }
            positionY++;
        }

        const grid = new Grid(cells, col, row);
        const rbPoint = new Point(ltPoint.x + totalWidth, ltPoint.y + totalHeight);
        const boardOuterRect = new Rect(ltPoint, rbPoint);
        const board = new Board(boardOuterRect, grid, showAgenda);
    
        return board;
    }

}

export default Board