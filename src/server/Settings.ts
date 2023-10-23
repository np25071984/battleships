class Settings {
    public static readonly GAME_TYPE_SINGLE: string = 'single'
    public static readonly GAME_TYPE_MULTIPLAYER_PUBLIC: string = 'multi-public'
    public static readonly GAME_TYPE_MULTIPLAYER_PRIVATE: string = 'multi-private'

    public gridCols: number
    public gridRows: number
    public gameType: string

    constructor(gridCols: number, gridRows: number, gameType: string) {
        this.gridCols = gridCols
        this.gridRows = gridRows
        this.gameType = gameType
    }
}

export default Settings