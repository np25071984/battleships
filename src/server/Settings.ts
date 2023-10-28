import ShipTypeAbstract from "../common/ShipTypeAbstract"

class Settings {
    public static readonly GAME_TYPE_SINGLE: string = 'single'
    public static readonly GAME_TYPE_MULTIPLAYER_PUBLIC: string = 'multi-public'
    public static readonly GAME_TYPE_MULTIPLAYER_PRIVATE: string = 'multi-private'

    public static readonly GAME_MOEDE_CLASSIC: string = 'classic'
    public static readonly GAME_MOEDE_CUSTOM: string = 'custom'

    public gridCols: number
    public gridRows: number
    public gameType: string
    public gameMode: string
    public shipTypes: ShipTypeAbstract[]

    constructor(
        gridCols: number,
        gridRows: number,
        gameType: string,
        gameMode: string,
        shipTypes: ShipTypeAbstract[]
    ) {
        this.gridCols = gridCols
        this.gridRows = gridRows
        this.gameType = gameType
        this.gameMode = gameMode
        this.shipTypes = shipTypes
    }
}

export default Settings