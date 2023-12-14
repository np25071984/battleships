import CommonCell from './Cell'
import ClientCell from '../client/Cell'
import Position from './Position'
import Ship from './Ship'
import type Window from '../client/@types'

type AnyCell = CommonCell | ClientCell

abstract class AbstractGrid
{
    public cells: AnyCell[][]
    readonly cols: number
    readonly rows: number

    constructor(cells: AnyCell[][]) {
        this.cells = cells
        this.cols = cells[0].length
        this.rows = cells.length
    }

    doesCellExist(position: Position): boolean {
        if (!(position.row in this.cells)) {
            return false
        }

        if (!(position.col in this.cells[position.row])) {
            return false
        }

        return true
    }

    getCell(position: Position): AnyCell {
        return this.cells[position.row][position.col]
    }

    abstract canPlace(ship: Ship): boolean
}

export default AbstractGrid