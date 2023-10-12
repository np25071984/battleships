class Position
{
    public col
    public row

    constructor(col, row) {
        this.col = col;
        this.row = row;
    }

    isEqual(position) {
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
        var p = new Position(this.col, this.row - 1);
        res[p.generateKey()] = p;
        var p = new Position(this.col + 1, this.row - 1);
        res[p.generateKey()] = p;
        var p = new Position(this.col + 1, this.row);
        res[p.generateKey()] = p;
        var p = new Position(this.col + 1, this.row + 1);
        res[p.generateKey()] = p;
        var p = new Position(this.col, this.row + 1);
        res[p.generateKey()] = p;
        var p = new Position(this.col - 1, this.row + 1);
        res[p.generateKey()] = p;
        var p = new Position(this.col - 1, this.row);
        res[p.generateKey()] = p;
        var p = new Position(this.col - 1, this.row - 1);
        res[p.generateKey()] = p;

        return res;
    }
}

export default Position