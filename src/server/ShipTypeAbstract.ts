abstract class ShipTypeAbstract {
    protected SHIP_SIZE: number

    getSize(): number {
        return this.SHIP_SIZE;
    }
}

export default ShipTypeAbstract