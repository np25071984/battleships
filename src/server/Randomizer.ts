import Position from '../common/Position'
import Ship from '../common/Ship'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import Grid from './Grid'

class Randomizer
{
    iter: number = 0

    async findShipsCombination(col: number, row: number, shipsToPlace: ShipTypeAbstract[]): Promise<Ship[]|null> {
        // TODO: order shipsToPlace by size desc
        this.iter = 0

        try {
            return await this.placeShips(col, row, [], shipsToPlace)
        } catch (e) {
            // took too long to find the combination
            return null
        }
    }

    private waitNextEventLoopCycle() {
        return new Promise(resolve => setTimeout(resolve, 0))
    }

    async placeShips(col: number, row: number, placedShips: Ship[], shipsToPlace: ShipTypeAbstract[]): Promise<Ship[]|null> {
        this.iter++
        if (this.iter % 5000 === 0) {
            await this.waitNextEventLoopCycle()
        }

        if (shipsToPlace.length === 0) {
            return placedShips
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
                    if (this.iter > row * col * 50) {
                        throw new Error(`In ${this.iter} iteration we weren't able to fit all ships`)
                    }

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