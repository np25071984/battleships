import Point from './Point'
import Rect from './Rect'
import Position from '../common/Position'
import BaseCell from '../common/Cell'

class Cell extends BaseCell
{
    public static readonly CELL_TYPE_CLICKED: number = 5;
    public static readonly CELL_TYPE_SHIP_SELECTED: number = 6;
    public static readonly CELL_TYPE_SHADOW: number = 7;

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
            if (window.mouseMoveEvent) {
                window.mouseMoveEvent(this.position)
            }

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

        if (window.mouseClickEvent) {
            window.mouseClickEvent(this.position)
        }
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