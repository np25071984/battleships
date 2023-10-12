class Grid
{
    public cells
    public rows
    public cols

    constructor(cells, cols, rows) {
        this.cells = cells;
        this.rows = rows;
        this.cols = cols;
    }

    mouseMove(point) {
        for (const key in this.cells) {
            const cell = this.cells[key];
            cell.mouseMove(point);
        }
    }

    mouseClick(point) {
        for (const key in this.cells) {
            const cell = this.cells[key];
            cell.mouseClick(point);
        }
    }

    getCell(position) {
        const key = position.generateKey();
        return this.cells[key];
    }

    setCellType(position, cellType) {
        const key = position.generateKey();
        if (this.cells[key].type !== cellType) {
            this.cells[key].type = cellType;
            this.cells[key].changed = true;
        }
    }

    cellExists(position) {
        const key = position.generateKey();
        return key in this.cells;
    }
}

export default Grid