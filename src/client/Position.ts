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
}

export default Position