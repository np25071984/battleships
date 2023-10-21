import Ship from '../../common/Ship'

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
        mouseDownEvent: any
        mouseUpEvent: any
        mouseMoveEvent: any
        offset: any
        shadeShip: Ship|null
        canPlace: any
    }
}

export default Window