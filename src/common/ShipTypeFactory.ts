import ShipTypeDestroyer from '../common/ShipTypeDestroyer'
import ShipTypeBattleShip from '../common/ShipTypeBattleShip'
import ShipTypeCarrier from '../common/ShipTypeCarrier'
import ShipTypePatrolBoat from '../common/ShipTypePatrolBoat'
import ShipTypeAbstract from './ShipTypeAbstract'

abstract class ShipTypeFactory {

    static getType(shipSize: number): ShipTypeAbstract {
        switch (shipSize) {
            case 5:
                return new ShipTypeCarrier()
            case 4:
                return new ShipTypeBattleShip()
            case 3:
                return new ShipTypeDestroyer()
            case 2:
                return new ShipTypePatrolBoat()
            default:
                throw new Error(`Unsupported ship size ${shipSize}`)
        }
    }
}

export default ShipTypeFactory