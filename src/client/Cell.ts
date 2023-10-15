import BattleshipsEvent from './BattleshipsEvent'
import Point from './Point'
import Rect from './Rect'
import Position from './Position'

class Cell
{
    public static readonly CELL_TYPE_FOG_OF_WAR: number = 1;
    public static readonly CELL_TYPE_WATER: number = 2;
    public static readonly CELL_TYPE_SHIP: number = 3;
    public static readonly CELL_TYPE_WRACKAGE: number = 4;
    public static readonly CELL_TYPE_CLICKED: number = 5;

    public rect: Rect
    public position: Position
    public isHover: boolean
    public type: number
    public changed: boolean

    constructor(outerRect: Rect, position: Position, isHover: boolean, type: number, changed: boolean) {
        this.rect = outerRect;
        this.position = position;
        this.isHover = isHover;
        this.type = type;
        this.changed = changed;
    }

    isInside(point) {
        if (point.x < this.rect.ltPoint.x) {
            return false;
        }
    
        if (point.x > this.rect.rbPoint.x) {
            return false;
        }
    
        if (point.y < this.rect.ltPoint.y) {
            return false;
        }
    
        if (point.y > this.rect.rbPoint.y) {
            return false;
        }
    
        return true;
    }

    mouseMove(point: Point) {
        if (this.isInside(point)) {
            if (!this.isHover) {
                this.isHover = true;
                this.changed = true;
            }
        } else {
            if (this.isHover) {
                this.isHover = false;
                this.changed = true;
            }
        }
    }

    mouseClick(point: Point) {
        if (!this.isInside(point)) {
            return;
        }

        if (this.type === Cell.CELL_TYPE_CLICKED) {
            return;
        }

        this.type = Cell.CELL_TYPE_CLICKED;
        this.changed = true;

        window.socket.emit('game', {
            'type': BattleshipsEvent.EVENT_TYPE_SHOT,
            'col': this.position.col,
            'row': this.position.row,
            'playerId': window.playerId,
            'gameId': window.gameId,
        });
    }
}

export default Cell