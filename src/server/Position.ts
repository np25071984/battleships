class Position
{
    readonly col: number
    readonly row: number

    constructor(col: number, row: number) {
        this.col = col;
        this.row = row;
    }

    isEqual(position: Position) {
        if (position.col !== this.col) {
            return false;
        }

        if (position.row !== this.row) {
            return false;
        }

        return true;
    }
}

export default Position