import Ship from '../common/Ship'
import Grid from './Grid'
import Position from '../common/Position'
import ShipSection from '../common/ShipSection'
import Player from './Player'
import Cell from '../common/Cell'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import ShipTypeFactory from '../common/ShipTypeFactory'
import ShotResult from '../common/ShotResult'

class Bot extends Player {
    decisionGrid: Grid
    enemyShipTypes: ShipTypeAbstract[]
    targetedShipSections: Position[]

    constructor(id: string, grid: Grid, ships: Ship[]) {
        super(id, grid, ships)
        this.decisionGrid = Grid.initGrid(grid.cols, grid.rows)
        this.targetedShipSections = []
        this.enemyShipTypes = []
        ships.forEach((ship) => {
            this.enemyShipTypes.push(ShipTypeFactory.getType(ship.type.getSize()))
        })
    }

    makeShot(round: number) {
        const availableForShot: Position[] = []
        const damagedSections = this.targetedShipSections.length
        if (damagedSections === 0) {
            for (var r = 0; r < this.decisionGrid.rows; r++) {
                for (var c = 0; c < this.decisionGrid.cols; c++) {
                    const p = new Position(c, r)
                    const cell = this.decisionGrid.getCell(p)
                    if (cell.getType() === Cell.CELL_TYPE_FOG_OF_WAR) {
                        availableForShot.push(p)
                    }
                }
            }
        } else if (damagedSections === 1) {
            const sectionPosition: Position = this.targetedShipSections[0]
            const adjacents = sectionPosition.getAdjacents()
            adjacents.forEach((pos: Position) => {
                if (this.decisionGrid.doesCellExist(pos)) {
                    const cell = this.decisionGrid.getCell(pos)
                    if (cell.getType() === Cell.CELL_TYPE_FOG_OF_WAR) {
                        availableForShot.push(pos)
                    }
                }
            })
        } else {
            var tl: Position = new Position(9999, 9999)
            var br: Position = new Position(0, 0)
            this.targetedShipSections.forEach((pos: Position) => {
                if (tl.col >= pos.col && tl.row >= pos.row) {
                    tl = pos
                }

                if (br.col <= pos.col && br.row <= pos.row) {
                    br = pos
                }
            })
            if (tl.col === br.col) {
                // vertical ship
                [new Position(tl.col, tl.row - 1), new Position(br.col,  br.row + 1)].forEach((pos: Position) => {
                    if (this.decisionGrid.doesCellExist(pos)) {
                        const cell = this.decisionGrid.getCell(pos)
                        if (cell.getType() === Cell.CELL_TYPE_FOG_OF_WAR) {
                            availableForShot.push(pos)
                        }
                    }
                })
            } else {
                // horizontal ship
                [new Position(tl.col - 1, tl.row), new Position(br.col + 1,  br.row)].forEach((pos: Position) => {
                    if (this.decisionGrid.doesCellExist(pos)) {
                        const cell = this.decisionGrid.getCell(pos)
                        if (cell.getType() === Cell.CELL_TYPE_FOG_OF_WAR) {
                            availableForShot.push(pos)
                        }
                    }
                })
            }
        }

        // TODO: try to fit the smallest of the ships into those positions
        const randomPosition = availableForShot[Math.floor(Math.random() * availableForShot.length)]
        this.shots[round] = new Position(randomPosition.col, randomPosition.row)
    }

    syncDecisionBoard(result: ShotResult, updates): void {
        updates.forEach((upd) => {
            const p = new Position(upd.col, upd.row)
            this.decisionGrid.getCell(p).setType(upd.type)

            if (result === ShotResult.HIT_RESULT_DAMAGE) {
                this.targetedShipSections.push(p)
            } else if (result === ShotResult.HIT_RESULT_SUNK) {
                for (var index = 0; index < this.enemyShipTypes.length; index++) {
                    const type = this.enemyShipTypes[index]
                    if (type.getSize() === this.targetedShipSections.length) {
                        this.enemyShipTypes.splice(index, 1);
                        break
                    }
                }
                this.targetedShipSections = []
            }
        })

        // TODO: find "dead" cells and mark them
    }
}

export default Bot