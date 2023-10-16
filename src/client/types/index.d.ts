declare global {
    interface Window {
        gameId: string
        playerId: string
        socket: any
        render: any
        io: any
        shotsBoard: any
        shotsCanvas: any
        shipsBoard: any
    }
}

export default Window