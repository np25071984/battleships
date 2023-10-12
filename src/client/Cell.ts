import BattleshipsEvent from './BattleshipsEvent'

class Cell
{
    public static readonly CELL_TYPE_FOG_OF_WAR: number = 1;
    public static readonly CELL_TYPE_WATER: number = 2;
    public static readonly CELL_TYPE_SHIP: number = 3;
    public static readonly CELL_TYPE_WRACKAGE: number = 4;
    public static readonly CELL_TYPE_CLICKED: number = 5;

    public rect
    public position
    public isHover
    public type
    public changed
    public cells

    constructor(outerRect, position, isHover, type, changed) {
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

    mouseMove(point) {
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

    mouseClick(point) {
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
            'playerId': window.playerId
        });
    }

    hit(position) {
        const key = position.generateKey();
        const cell = this.cells[key];
        switch (cell.type) {
            case Cell.CELL_TYPE_SHIP:
                cell.type = Cell.CELL_TYPE_WRACKAGE;
                break;
            case Cell.CELL_TYPE_FOG_OF_WAR:
                cell.type = Cell.CELL_TYPE_WATER;
        }
        cell.changed = true;
        this.cells[key] = cell;
    }
}

export default Cell