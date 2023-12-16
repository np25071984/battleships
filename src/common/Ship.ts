import ShipSection from './ShipSection'
import Position from './Position'
import ShipTypeAbstract from './ShipTypeAbstract'
import ShotResult from './ShotResult'

class Ship
{
    private aliveSectionCount: number
    public position: Position
    public isHorizontal: boolean
    public type: ShipTypeAbstract
    public isAlive: boolean
    public sections: ShipSection[]

    constructor(position: Position, isHorizontal: boolean, type: ShipTypeAbstract) {
        this.aliveSectionCount = type.getSize()
        this.position = position
        this.isHorizontal = isHorizontal
        this.isAlive = true
        this.type = type
        this.sections = []
        for (var i = 0; i < this.type.getSize(); i++) {
            if (isHorizontal) {
                var p = new Position(position.col + i, position.row)
            } else {
                var p = new Position(position.col, position.row + i)
            }
            const s = new ShipSection(p, true)
            this.sections.push(s)
        }
    }

    isLocatedAt(position: Position) {
        for (const section of this.sections) {
            if (section.isLocatedAt(position)) {
                return true
            }
        }

        return false
    }

    hit(position: Position): ShotResult {
        for (const section of this.sections) {
            if (section.isLocatedAt(position)) {
                section.isAlive = false
                this.aliveSectionCount--
                if (this.aliveSectionCount === 0) {
                    this.isAlive = false
                    return new ShotResult(ShotResult.HIT_RESULT_SUNK, {
                        "size": this.type.getSize()
                    })
                } else {
                    return new ShotResult(ShotResult.HIT_RESULT_DAMAGE)
                }
            }
        }

        throw new Error(`Couldn't hit the ship at ${position.col}x${position.row}`)
    }

    getSurrounding(): Position[] {
        const intermediateRes = {}
        for (const section of this.sections) {
            const surrounding = section.position.getSurrounding()
            for (const position of surrounding) {
                const key = position.generateKey()
                if(!(key in intermediateRes) && !this.isLocatedAt(position)) {
                    intermediateRes[key] = position
                }
            }
        }
        return Object.values(intermediateRes)
    }
}

export default Ship