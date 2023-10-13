declare global {
    interface Window {
        gameId: string
        playerId: string
        socket: any
        render: any
        io: any
    }
}

export default Window