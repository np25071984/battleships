import BaseShip from '../common/Ship'

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
}

export default Ship