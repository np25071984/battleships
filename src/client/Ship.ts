import BaseShip from '../common/Ship'
import Position from '../common/Position'
import ShipSection from '../common/ShipSection'

class Ship extends BaseShip {
    private selected: boolean = false

    isSelected(): boolean {
        return this.selected
    }

    select() {
        this.selected = true
    }

    deselect(): void {
        this.selected = false
    }

    move(position: Position): void {
        this.position = position
        this.sections = []
        for (var i = 0; i < this.type.getSize(); i++) {
            switch (this.orientation) {
                case Ship.SHIP_ORIENTATION_VERTICAL:
                    var c = new Position(position.col, position.row + i)
                    break
                case Ship.SHIP_ORIENTATION_HORIZONTAL:
                    var c = new Position(position.col + i, position.row)
                    break
                default:
                    throw new Error(`Unknown ship orientation(${this.orientation})`)
            }
            const s = new ShipSection(c, true)
            this.sections.push(s)
        }
    }

    occupies(position: Position): boolean {
        for (var i = 0; i < this.sections.length; i++) {
            const section = this.sections[i]
            if (section.isLocatedAt(position)) {
                return true
            }
        }

        for (const p of this.getSurraund()) {
            if (p.isEqual(position)) {
                return true
            }
        }

        return false
    }
}

export default Ship