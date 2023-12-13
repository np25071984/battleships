class ShotResult {
    public static readonly HIT_RESULT_MISS: number = 1
    public static readonly HIT_RESULT_DAMAGE: number = 2
    public static readonly HIT_RESULT_SUNK: number = 3

    public shotResult: number
    public details: Object

    constructor(result: number, details: Object = {}) {
        const availableValues: Array<number> = [ShotResult.HIT_RESULT_DAMAGE, ShotResult.HIT_RESULT_MISS, ShotResult.HIT_RESULT_SUNK]
        if (!availableValues.includes(result)) {
            throw new Error("Unknown result type")
        }
        this.shotResult = result
        this.details = details
    }

    isMiss(): boolean {
        return this.shotResult === ShotResult.HIT_RESULT_MISS
    }

    isDamage(): boolean {
        return this.shotResult === ShotResult.HIT_RESULT_DAMAGE
    }

    isSunk(): boolean {
        return this.shotResult === ShotResult.HIT_RESULT_SUNK
    }
}

export default ShotResult