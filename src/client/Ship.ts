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
            if (this.isHorizontal) {
                var c = new Position(position.col + i, position.row)
            } else {
                var c = new Position(position.col, position.row + i)
            }
            const s = new ShipSection(c, true)
            this.sections.push(s)
        }
    }

    occupies(position: Position): boolean {
        for (const section of this.sections) {
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