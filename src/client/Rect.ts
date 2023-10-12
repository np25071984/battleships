class Rect {
    public ltPoint
    public rbPoint

    constructor(ltPoint, rbPoint) {
        this.ltPoint = ltPoint;
        this.rbPoint = rbPoint;
    }

    getWidth() {
        return this.rbPoint.x - this.ltPoint.x;
    }

    getHeight() {
        return this.rbPoint.y - this.ltPoint.y;
    }
}

export default Rect