import Position from './Position'

class ShipSection
{
    public position
    public isAlive

    constructor(position, isAlive) {
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