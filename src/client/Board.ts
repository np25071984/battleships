import Position from './Position'
import Point from './Point'
import HitResult from './HitResult'
import Cell from './Cell'
import BattleshipsEvent from './BattleshipsEvent'
import Rect from './Rect'
import Grid from './Grid'

class Board
{
    public round
    public active
    public rect
    public grid
    public ships
    public showAgenda

    constructor(outerRect, grid, showAgenda) {
        this.round = undefined;
        this.active = false;
        this.rect = outerRect;
        this.grid = grid;
        this.ships = [];
        this.showAgenda = showAgenda;
    }

    hit(position) {
        var moreShips = true;
        var ship = undefined;
        for (var i = 0; i < this.ships.length; i++) {
            const s = this.ships[i];
            if (s.isLocatedAt(position)) {
                ship = s
                break;
            }
        }

        var hitResult = undefined;
        var sunkShipSurround = [];
        if (ship === undefined) {
            hitResult = HitResult.HIT_RESULT_MISS;
            this.setCellType(position, Cell.CELL_TYPE_WATER);    
        } else {
            hitResult = ship.hit(position);
            this.setCellType(position, Cell.CELL_TYPE_WRACKAGE);
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

    placeShips(ships) {
        this.ships = ships;
        this.ships.forEach(function(ship) {
            ship.sections.forEach(function(section) {
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

    mouseMove(point) {
        if (this.active) {
            this.grid.mouseMove(point);
        }
    }

    mouseClick(point) {
        if (this.active) {
            this.grid.mouseClick(point);
            this.active = false;
        }
    }

    roundStart(number) {
        this.active = true;
        this.round = number;
    }

    setCellType(position, cellType) {
        this.grid.setCellType(position, cellType)
    }

    static initBoard(ltPoint, width, gap, col, row, showAgenda) {
        // TODO: col,row max value
        const xSt = ltPoint.x + gap;
        const ySt = ltPoint.y + gap;
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