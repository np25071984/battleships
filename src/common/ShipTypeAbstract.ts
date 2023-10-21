import ShipTypeDestroyer from '../common/ShipTypeDestroyer'
import ShipTypeBattleShip from '../common/ShipTypeBattleShip'
import ShipTypeCarrier from '../common/ShipTypeCarrier'
import ShipTypePatrolBoat from '../common/ShipTypePatrolBoat'

abstract class ShipTypeAbstract {
    protected SHIP_SIZE: number

    getSize(): number {
        return this.SHIP_SIZE
    }
}

export default ShipTypeAbstract