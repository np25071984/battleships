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
        mouseClickEvent: any
        offset: any
        shadeShip: Ship|null
        canPlace: any
        rotateShip: any
        shuffleShip: any
        cols: number
        rows: number
    }
}

export default Window