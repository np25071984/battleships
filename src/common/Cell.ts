import Position from './Position'

class Cell {
    public static readonly CELL_TYPE_FOG_OF_WAR: number = 1;
    public static readonly CELL_TYPE_WATER: number = 2;
    public static readonly CELL_TYPE_SHIP: number = 3;
    public static readonly CELL_TYPE_WRACKAGE: number = 4;

    public readonly position: Position
    private type: number
    private changed: boolean

    constructor(position: Position, type: number = Cell.CELL_TYPE_FOG_OF_WAR, changed: boolean = false) {
        this.position = position
        this.type = type
        this.changed = changed
    }

    setType(type: number): void {
        this.type = type
        this.changed = true
    }

    getType(): number {
        return this.type
    }

    save(): void {
        this.changed = false
    }

    isChanged(): boolean {
        return this.changed
    }

    setChanged(): void {
        this.changed = true
    }
}

export default Cell