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

    generateKey() {
        return `${this.col}_${this.row}`;
    }

    getSurraund() {
        const res = {};
        if (this.row > 0) {
            var p = new Position(this.col, this.row - 1);
            res[p.generateKey()] = p;
            var p = new Position(this.col + 1, this.row - 1);
            res[p.generateKey()] = p;
        }
        if (this.col > 0) {
            var p = new Position(this.col - 1, this.row + 1);
            res[p.generateKey()] = p;
            var p = new Position(this.col - 1, this.row);
            res[p.generateKey()] = p;
        }
        if (this.row > 0 && this.col > 0) {
            var p = new Position(this.col - 1, this.row - 1);
            res[p.generateKey()] = p;
        }
        var p = new Position(this.col + 1, this.row);
        res[p.generateKey()] = p;
        var p = new Position(this.col + 1, this.row + 1);
        res[p.generateKey()] = p;
        var p = new Position(this.col, this.row + 1);
        res[p.generateKey()] = p;

        return res;
    }

}

export default Position