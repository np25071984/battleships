import Point from './Point'
import Rect from './Rect'
import Position from '../common/Position'
import BaseCell from '../common/Cell'
import BattleshipsEvent from './BattleshipsEvent'

class Cell extends BaseCell
{
    public static readonly CELL_TYPE_CLICKED: number = 5;
    public static readonly CELL_TYPE_SHIP_SELECTED: number = 6;

    public rect: Rect
    public isHover: boolean

    constructor(outerRect: Rect, position: Position, isHover: boolean, type: number, changed: boolean) {
        super(position, type, changed)
        this.rect = outerRect
        this.isHover = isHover
    }

    isInside(point: Point): boolean {
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

    mouseMove(point: Point): void {
        if (this.isInside(point)) {
            if (!this.isHover) {
                this.isHover = true;
                this.setChanged()
            }
        } else {
            if (this.isHover) {
                this.isHover = false;
                this.setChanged()
            }
        }
    }

    mouseClick(point: Point): void {
        if (!this.isInside(point)) {
            return;
        }

        if (this.getType() === Cell.CELL_TYPE_CLICKED) {
            return;
        }

        window.shotsBoard.active = false
        this.setType(Cell.CELL_TYPE_CLICKED)

        window.socket.emit('game', {
            'type': BattleshipsEvent.EVENT_TYPE_SHOT,
            'col': this.position.col,
            'row': this.position.row,
            'playerId': window.playerId,
            'gameId': window.gameId,
        });
    }

    mouseDown(point: Point) {
        if (!this.isInside(point)) {
            return;
        }

        window.mouseDownEvent(this.position)
    }

    mouseUp(point: Point) {
        if (!this.isInside(point)) {
            return;
        }

        window.mouseUpEvent(this.position)
    }
}

export default Cell