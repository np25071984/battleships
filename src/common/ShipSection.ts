import Position from './Position'

class ShipSection
{
    public position: Position
    public isAlive: boolean

    constructor(position: Position, isAlive: boolean) {
        this.position = position;
        this.isAlive = isAlive;
    }

    isLocatedAt(position: Position) {
        if (this.position.isEqual(position)) {
            return true;
        }

        return false;
    }
}

export default ShipSection