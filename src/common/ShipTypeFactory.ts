import ShipTypeDestroyer from '../common/ShipTypeDestroyer'
import ShipTypeBattleShip from '../common/ShipTypeBattleShip'
import ShipTypeCarrier from '../common/ShipTypeCarrier'
import ShipTypePatrolBoat from '../common/ShipTypePatrolBoat'
import ShipTypeAbstract from './ShipTypeAbstract'
import { ShipType } from './Enums'

class ShipTypeFactory
{
    static getType(shipType: ShipType): ShipTypeAbstract {
        switch (shipType) {
            case ShipType.Carrier:
                return new ShipTypeCarrier()
            case ShipType.Battleship:
                return new ShipTypeBattleShip()
            case ShipType.Destroyer:
                return new ShipTypeDestroyer()
            case ShipType.PatrolBoat:
                return new ShipTypePatrolBoat()
            default:
                throw new Error(`Unsupported ship type ${shipType}`)
        }
    }
}

export default ShipTypeFactory