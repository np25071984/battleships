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
        initShips: any
    }
}

export default Window