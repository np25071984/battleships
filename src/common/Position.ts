class Position
{
    readonly col: number
    readonly row: number

    constructor(col: number, row: number) {
        this.col = col
        this.row = row
    }

    isEqual(position: Position) {
        if (position.col !== this.col) {
            return false
        }

        if (position.row !== this.row) {
            return false
        }

        return true
    }

    generateKey() {
        return `${this.col}_${this.row}`
    }

    getSurraund(): Position[] {
        const res = this.getAdjacents()
        if (this.row > 0) {
            var rt = new Position(this.col + 1, this.row - 1)
            res.push(rt)
        }
        if (this.col > 0) {
            var lb = new Position(this.col - 1, this.row + 1)
            res.push(lb)
        }
        if (this.row > 0 && this.col > 0) {
            var lt = new Position(this.col - 1, this.row - 1)
            res.push(lt)
        }
        var rb = new Position(this.col + 1, this.row + 1)
        res.push(rb)

        return res
    }

    getAdjacents(): Position[] {
        const res = []
        if (this.row > 0) {
            var ct = new Position(this.col, this.row - 1)
            res.push(ct)
        }
        if (this.col > 0) {
            var lc = new Position(this.col - 1, this.row)
            res.push(lc)
        }
        var rc = new Position(this.col + 1, this.row)
        res.push(rc)
        var cb = new Position(this.col, this.row + 1)
        res.push(cb)

        return res
    }

}

export default Position