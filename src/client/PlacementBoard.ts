import Position from '../common/Position'
import Point from './Point'
import Cell from './Cell'
import Rect from './Rect'
import Grid from './Grid'
import Ship from './Ship'
import ShipSection from '../common/ShipSection'

class PlacementBoard
{
    public rect: Rect
    public grid: Grid
    public showAgenda: boolean
    public ships: Ship[]

    constructor(outerRect: Rect, grid: Grid, showAgenda: boolean) {
        this.rect = outerRect;
        this.grid = grid;
        this.showAgenda = showAgenda;
        this.ships = []
    }

    mouseMove(point: Point) {
        this.grid.mouseMove(point);
    }

    mouseClick(point: Point) {
        this.grid.mouseClick(point);
    }

    mouseDown(point: Point) {
        this.grid.mouseDown(point);
    }

    mouseUp(point: Point) {
        this.grid.mouseUp(point);
    }

    loadShip(ship: Ship) {
        this.ships.push(ship)
    }

    // canPlaceShip(ship: Ship): boolean {
    //     for (const section of ship.sections) {
    //         const cell = this.grid.getCell(section.position)
    //         if (cell.getType() !== Cell.CELL_TYPE_FOG_OF_WAR) {
    //             return false
    //         }
    //     }

    //     return true
    // }

    // loadShip(ship: Ship, surround: boolean = false): void {
        // ship.sections.forEach((section: ShipSection) => {
        //     const type = ship.isSelected() ? Cell.CELL_TYPE_SHIP_SELECTED : (section.isAlive ? Cell.CELL_TYPE_WRACKAGE : Cell.CELL_TYPE_SHIP)
        //     this.grid.getCell(section.position).setType(type)
        // }, this)

        // if (surround) {
        //     const s = ship.getSurraund()
        //     for (const k in s) {
        //         const p = s[k]
        //         const c = this.grid.getCell(p)
        //         if (c) {
        //             c.setType(Cell.CELL_TYPE_WATER)
        //         }
        //     }
        // }
    // }

    // static initFromServerData(ltPoint: Point, width: number, gap: number, data: any, showAgenda: boolean) {
    //     // TODO: col,row max value
    //     const xSt = ltPoint.x + gap;
    //     const ySt = ltPoint.y + gap;
    //     const col = data[0].length
    //     const row = data.length
    //     const step = width + gap;
    //     const totalWidth = gap + (step * col);
    //     const totalHeight = gap + (step * row);

    //     const cells: Cell[][] = []
    //     var positionY = 0;
    //     for (var y = ySt; y < ltPoint.y + totalHeight; y += step) {
    //         var positionX = 0;
    //         const gridRow: Cell[] = []
    //         for (var x = xSt; x < ltPoint.x + totalWidth; x += step) {
    //             const ltP = new Point(x, y);
    //             const pos = new Position(positionX, positionY);
    //             const rbP = new Point(x + width, y + width);
    //             const outerRect = new Rect(ltP, rbP);
    //             gridRow[positionX] = new Cell(outerRect, pos, false, data[positionX][positionY], false);
    //             positionX++;
    //         }
    //         cells[positionY] = gridRow
    //         positionY++;
    //     }

    //     const grid = new Grid(cells);
    //     const rbPoint = new Point(ltPoint.x + totalWidth, ltPoint.y + totalHeight);
    //     const boardOuterRect = new Rect(ltPoint, rbPoint);
    //     const board = new Board(boardOuterRect, grid, showAgenda);

    //     return board;
    // }

    static getInstance(ltPoint: Point, width: number, gap: number, row: number, col: number, showAgenda: boolean) {
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
        const board = new PlacementBoard(boardOuterRect, grid, showAgenda);

        return board;
    }
}

export default PlacementBoard