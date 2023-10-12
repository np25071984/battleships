class ShipSection
{
    public position
    public isAlive

    constructor(position, isAlive) {
        this.position = position;
        this.isAlive = isAlive;
    }

    isLocatedAt(position) {
        if (this.position.isEqual(position)) {
            return true;
        }

        return false;
    }
}

export default ShipSection