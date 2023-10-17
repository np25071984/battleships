import Render from './Render'
import Position from '../common/Position'
import Point from './Point'
import Board from './Board'
import Cell from './Cell'
import type Window from './types/index.d.ts'
import Ship from '../common/Ship'
import ShipTypeDestroyer from '../common/ShipTypeDestroyer'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import ShipTypeBattleShip from '../common/ShipTypeBattleShip'
import ShipTypeCarrier from '../common/ShipTypeCarrier'
import ShipTypePatrolBoat from '../common/ShipTypePatrolBoat'

window.onload = function() {
    console.log("Ships placement");
    console.log(window.initShips)

    window.render = new Render();

    const shipsCanvas = document.getElementById("ships-board")
    if (shipsCanvas == null) {
        throw Error("Can't find Ships board")
    }

    const startPoint = new Point(40, 40)
    const shipsBoard = Board.initFrom(startPoint, 40, 1, 10, 10, true)
    shipsBoard.active = true

    const ships: Ship[] = []
    const shipTypeCarrier: ShipTypeAbstract = new ShipTypeCarrier()
    const shipTypeBattleShip: ShipTypeAbstract = new ShipTypeBattleShip()
    const shipTypeDestroyer: ShipTypeAbstract = new ShipTypeDestroyer()
    const shipTypePatrolBoat: ShipTypeAbstract = new ShipTypePatrolBoat()

    window.initShips.forEach((shipData) => {
        const p = new Position(shipData.col, shipData.row)
        var t: ShipTypeAbstract
        switch (shipData.size) {
            case 5:
                t = shipTypeCarrier
                break
            case 4:
                t = shipTypeBattleShip
                break
            case 3:
                t = shipTypeDestroyer
                break
            case 2:
                t = shipTypePatrolBoat
                break
            default:
                throw new Error(`Unknown ship type ${shipData.type}`)
        }
        const s = new Ship(p, shipData.orientation, t)
        ships.push(s)
        shipsBoard.loadShip(s)
    })

    window.render.drawBoard(shipsCanvas, shipsBoard)

    function getMousePoint(canvasRect, clientX, clientY) {
        const x = clientX - canvasRect.left
        const y = clientY - canvasRect.top
        return new Point(x, y)
    }

    shipsCanvas.addEventListener('mousemove', function(board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseMove(mousePoint)
        window.render.refreshGrid(this, board)
    }.bind(shipsCanvas, shipsBoard))

    const submitButton = document.getElementById("submit-ships")
    if (submitButton == null) {
        throw Error("Can't find Sibmit button")
    }

    submitButton.addEventListener('click', function(event) {
        ships.forEach((ship: Ship) => {
            const sh: string = JSON.stringify({
                'col': ship.position.col,
                'row': ship.position.row,
                'type': ship.type.getSize(),
                'orientation': ship.orientation,
            })
            var input = document.createElement('input')
            input.setAttribute('name', "ships")
            input.setAttribute('value', sh);
            input.setAttribute('type', "hidden")
            this.appendChild(input);
        }, this)
    })

    // shipsCanvas.addEventListener('click', function(board, e) {
    //     const rect = this.getBoundingClientRect()
    //     const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
    //     board.mouseClick(mousePoint)
    //     window.render.refreshGrid(this, board)
    // }.bind(shipsCanvas, shipsBoard))
}

function placeShips(col: number, row: number, types: ShipTypeAbstract[]): Ship[] {
    /**
     * Return random ships positions for given parameters
     * Two question to answer:
     * 1. is it possible to place that many ships on the given board
     * 2. place the sips randomly
     *
     * For now it is hardcode
     */
    const ships: Ship[] = [];
    ships.push(new Ship(new Position(1, 2), Ship.SHIP_ORIENTATION_VERTICAL, new ShipTypeDestroyer()))
    ships.push(new Ship(new Position(7, 8), Ship.SHIP_ORIENTATION_HORIZONTAL, new ShipTypePatrolBoat()))
    return ships
}

function initGrid(col: number, row: number): object[][] {
    const grid: Object[][] = [];
    for (var r = 0; r < row; r++) {
        const rowData: Object[] = []
        for (var c = 0; c < col; c++) {
            rowData[c] = {
                'col': c,
                'row': r,
                'type': Cell.CELL_TYPE_FOG_OF_WAR
            }
        }
        grid[r] = rowData
    }
    return grid

}