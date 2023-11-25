import Position from '../common/Position'
import Ship from '../common/Ship'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import Grid from './Grid'

class Randomizer
{
    private currentIter: number = 0
    private maxIteration: number
    private readonly CHUNK_SIZE: number = 500000

    constructor(maxIteration: number = 0) {
        this.maxIteration = maxIteration
    }

    async findShipsCombination(col: number, row: number, shipsToPlace: ShipTypeAbstract[]): Promise<Ship[]|null> {
        // TODO: order shipsToPlace by size desc
        this.currentIter = 0

        try {
            return await this.placeShips(col, row, [], shipsToPlace)
        } catch (e) {
            // took too long to find the combination
            return null
        }
    }

    /**
     * @see https://stackoverflow.com/questions/77539960/apply-partitioning-approach-for-dynamic-programming/77540108#77540108
     */
    private waitNextEventLoopCycle() {
        return new Promise(resolve => setTimeout(resolve, 0))
    }

    private async placeShips(col: number, row: number, placedShips: Ship[], shipsToPlace: ShipTypeAbstract[]): Promise<Ship[]|null> {
        if (shipsToPlace.length === 0) {
            return placedShips
        }

        if (this.maxIteration !== 0 && this.currentIter > this.maxIteration) {
            throw new Error(`In ${this.currentIter} iteration we weren't able to fit all ships`)
        }
        this.currentIter++

        if (this.currentIter % this.CHUNK_SIZE === 0) {
            await this.waitNextEventLoopCycle()
        }

        const grid = Grid.initGrid(col, row)
        placedShips.forEach((ship: Ship) => {
            grid.placeShipWithSurrounding(ship)
        })

        const types = [...shipsToPlace]
        const shipType = types.pop()
        const orientations = Math.random() > 0.5 ? [true, false] : [false, true]
        for (const isHorizontal of orientations) {
            const maxCol = isHorizontal ? grid.cols - shipType.getSize() : grid.cols
            const maxRow = isHorizontal ? grid.rows : grid.rows - shipType.getSize()
            const randomRowOffset = Math.floor(Math.random() * maxRow)
            for (var r = 0; r < maxRow; r++) {
                var rr = r + randomRowOffset
                if (rr >= maxRow) {
                    rr -= maxRow
                }
                const randomColOffset = Math.floor(Math.random() * maxCol)
                for (var c = 0; c < maxCol; c++) {
                    var cc = c + randomColOffset
                    if (cc >= maxCol) {
                        cc -= maxCol
                    }
                    const ship = new Ship(new Position(cc, rr), isHorizontal, shipType)

                    if (grid.canPlace(ship) === true) {
                        const pl = [...placedShips]
                        pl.push(ship)
                        const res = await this.placeShips(col, row, pl, [...types])
                        if (res !== null) {
                            return res
                        }
                    }
                }
            }
        }

        return null
    }
}

export default Randomizer