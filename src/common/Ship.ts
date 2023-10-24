import ShipSection from './ShipSection'
import Position from './Position'
import ShipTypeAbstract from './ShipTypeAbstract'
import ShotResult from './ShotResult'

class Ship
{
    public static readonly SHIP_ORIENTATION_VERTICAL: number = 1;
    public static readonly SHIP_ORIENTATION_HORIZONTAL: number = 2;

    public liveSectionCount: number
    public position: Position
    public orientation: number
    public type: ShipTypeAbstract
    public alive: boolean
    public sections: ShipSection[]

    constructor(position: Position, orientation: number, type: ShipTypeAbstract) {
        this.liveSectionCount = type.getSize()
        this.position = position
        this.orientation = orientation
        this.alive = true
        this.type = type
        this.sections = [] // TODO: hashed array
        for (var i = 0; i < this.type.getSize(); i++) {
            switch (orientation) {
                case Ship.SHIP_ORIENTATION_VERTICAL:
                    var c = new Position(position.col, position.row + i)
                    break
                case Ship.SHIP_ORIENTATION_HORIZONTAL:
                    var c = new Position(position.col + i, position.row)
                    break
                default:
                    throw new Error(`Unknown ship orientation(${orientation})`)
            }
            const s = new ShipSection(c, true)
            this.sections.push(s)
        }
    }

    isLocatedAt(position: Position) {
        for (var i = 0; i < this.sections.length; i++) {
            const section = this.sections[i]
            if (section.isLocatedAt(position)) {
                return true
            }
        }

        return false
    }

    hit(position: Position): ShotResult {
        for (var i = 0; i < this.sections.length; i++) {
            const section = this.sections[i]
            if (section.isLocatedAt(position)) {
                this.sections[i].isAlive = false
                this.liveSectionCount--
                if (this.liveSectionCount === 0) {
                    this.alive = false
                    return ShotResult.HIT_RESULT_SUNK
                } else {
                    return ShotResult.HIT_RESULT_DAMAGE
                }
            }
        }

        throw new Error(`Couldn't hit the ship at ${position.col}x${position.row}`)
    }

    getSurraund(): Position[] {
        const intermediateRes = {};
        for (var i = 0; i < this.sections.length; i++) {
            const section = this.sections[i];
            const surround = section.position.getSurraund();
            for (const position of surround) {
                const key = position.generateKey()
                if(!(key in intermediateRes) && !this.isLocatedAt(position)) {
                    intermediateRes[key] = position;
                }
            }
        }
        return Object.values(intermediateRes);
    }
}

export default Ship