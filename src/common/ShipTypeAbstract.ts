import { ShipType } from './Enums'

abstract class ShipTypeAbstract {
    protected abstract shipSize: number

    getSize(): number {
        return this.shipSize
    }

    isCarrier(): boolean {
        return this.shipSize === ShipType.Carrier
    }

    isBattleship(): boolean {
        return this.shipSize === ShipType.Battleship
    }

    isDestroyer(): boolean {
        return this.shipSize === ShipType.Destroyer
    }

    isPatrolBoat(): boolean {
        return this.shipSize === ShipType.PatrolBoat
    }
}

export default ShipTypeAbstract