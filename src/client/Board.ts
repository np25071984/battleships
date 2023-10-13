import Position from './Position'
import Point from './Point'
import HitResult from '../common/HitResult'
import Cell from './Cell'
import BattleshipsEvent from './BattleshipsEvent'
import Rect from './Rect'
import Grid from './Grid'
import Ship from './Ship'
import ShipSection from './ShipSection'

class Board
{
    public round: number|undefined
    public active: boolean
    public rect: Rect
    public grid: Grid
    public ships: Ship[]
    public showAgenda: boolean

    constructor(outerRect: Rect, grid: Grid, showAgenda: boolean) {
        this.round = undefined;
        this.active = false;
        this.rect = outerRect;
        this.grid = grid;
        this.ships = [];
        this.showAgenda = showAgenda;
    }

    hit(position: Position) {
        const cell = this.grid.getCell(position)
        cell.hit()

        var moreShips: boolean = true;
        var hitResult: HitResult;
        const sunkShipSurround: Position[] = [];
        if (cell.type === Cell.CELL_TYPE_WATER) {
            hitResult = HitResult.HIT_RESULT_MISS;
        } else if (cell.type === Cell.CELL_TYPE_WRACKAGE) {
            var ship: Ship|undefined;
            for (var i = 0; i < this.ships.length; i++) {
                const s = this.ships[i];
                if (s.isLocatedAt(position)) {
                    ship = s
                    break
                }
            }
            if (ship === undefined) {
                throw new Error(`Couldn't find Ship at ${position.col}x${position.row}`)
            }

            hitResult = ship.hit(position);
            if (hitResult === HitResult.HIT_RESULT_SUNK) {
                const surround = ship.getSurraund();
                for (const key in surround) {
                    const position = surround[key];
                    if (this.grid.cellExists(position)) {
                        sunkShipSurround.push(position);
                        this.setCellType(position, Cell.CELL_TYPE_WATER);
                    }
                };

                var isAlive = false;
                for (var i = 0; i < this.ships.length; i++) {
                    const s = this.ships[i];
                    if (s.alive) {
                        isAlive = true;
                        break;
                    }
                }
                moreShips = isAlive;
            }
        } else {
            throw new Error(`Unexpected cell type ${cell.type}`)
        }

        window.socket.emit('game', {
            'type': BattleshipsEvent.EVENT_TYPE_ANNOUNCE,
            'playerId': window.playerId,
            'col': position.col,
            'row': position.row,
            'result': hitResult,
            'surround': sunkShipSurround,
            'moreShips': moreShips
        });
    }

    placeShips(ships: Ship[]) {
        this.ships = ships;
        this.ships.forEach(function(ship: Ship) {
            ship.sections.forEach(function(section: ShipSection) {
                const key = `${section.position.col}_${section.position.row}`;
                if (!(key in this.grid.cells)) {
                    return;
                }
                const cell = this.grid.cells[key];
                cell.type = section.isAlive ? Cell.CELL_TYPE_SHIP : Cell.CELL_TYPE_WRACKAGE;
                this.grid.cells[key] = cell;
            }, this);
        }, this);
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
                cells[key] = new Cell(outerRect, pos, false, Cell.CELL_TYPE_FOG_OF_WAR, false);
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