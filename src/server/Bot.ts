import Ship from '../common/Ship'
import Grid from './Grid'
import Position from '../common/Position'
import Player from './Player'
import Cell from '../common/Cell'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import ShotResult from '../common/ShotResult'
import ShipTypeFactory from '../common/ShipTypeFactory'

class Bot extends Player {
    private decisionGrid: Grid
    private enemyShipTypes: ShipTypeAbstract[]
    private targetedShipSections: Position[]

    constructor(id: string, grid: Grid, ships: Ship[]) {
        super(id, grid, ships)
        this.decisionGrid = Grid.initGrid(grid.cols, grid.rows)
        this.targetedShipSections = []
        this.enemyShipTypes = []
        ships.forEach((ship) => {
            this.enemyShipTypes.push(ShipTypeFactory.getType(ship.type.getSize()))
        })
    }

    makeShot(round: number): void {
        const availableForShot: Position[] = []
        const damagedSections = this.targetedShipSections.length
        if (damagedSections === 0) {
            var smallestShipType: ShipTypeAbstract
            this.enemyShipTypes.forEach((shipType: ShipTypeAbstract) => {
                const shipSize: number = shipType.getSize()
                if (!smallestShipType || (smallestShipType.getSize() > shipType.getSize())) {
                    smallestShipType = shipType
                }
            })

            for (var r = 0; r < this.decisionGrid.rows; r++) {
                for (var c = 0; c < this.decisionGrid.cols; c++) {
                    const position: Position = new Position(c, r)
                    const cell = this.decisionGrid.getCell(position)
                    if (cell.getType() !== Cell.CELL_TYPE_FOG_OF_WAR) {
                        continue
                    }

                    if (this.doesPositionMakeSense(position, smallestShipType)) {
                        availableForShot.push(position)
                    } else {
                        const c = this.decisionGrid.getCell(position)
                        c.setType(Cell.CELL_TYPE_WATER)
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
            var tl: Position = new Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
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

        if (availableForShot.length === 0) {
            throw new Error("Didn't find any cells to shot at")
        }

        const randomIndex = Math.floor(Math.random() * availableForShot.length)
        const randomPosition = availableForShot[randomIndex]
        this.shots[round] = randomPosition
    }

    private doesPositionMakeSense(position: Position, shipType: ShipTypeAbstract): boolean {
        for (var i = 0; i < shipType.getSize(); i++) {
            if (position.col - i >= 0) {
                const ph = new Position(position.col - i, position.row)
                const horizontalShip: Ship = new Ship(ph, true, shipType)
                if (this.decisionGrid.canPlace(horizontalShip)) {
                    return true
                }
            }

            if (position.row - i >= 0) {
                const pv = new Position(position.col, position.row - i)
                const verticalShip: Ship = new Ship(pv, false, shipType)
                if (this.decisionGrid.canPlace(verticalShip)) {
                    return true
                }
            }
        }

        return false
    }

    syncDecisionBoard(result: ShotResult, updates): void {
        updates.forEach((upd) => {
            const p = new Position(upd.col, upd.row)
            this.decisionGrid.getCell(p).setType(upd.type)

            if (result.isDamage() && upd.type === Cell.CELL_TYPE_WRACKAGE) {
                this.targetedShipSections.push(p)
            }
        })

        if (result.isSunk()) {
            if (!('size' in result.details)) {
                throw new Error("Couldn't find 'size' property in ShotResult object")
            }
            for (var index = 0; index < this.enemyShipTypes.length; index++) {
                const type = this.enemyShipTypes[index]
                if (type.getSize() === result.details.size as number) {
                    this.enemyShipTypes.splice(index, 1)
                    break
                }
            }
            this.targetedShipSections = []
        }
    }
}

export default Bot