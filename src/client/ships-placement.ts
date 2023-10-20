import Render from './Render'
import Position from '../common/Position'
import Point from './Point'
import Board from './Board'
import Cell from './Cell'
import type Window from './types/index.d.ts'
import Ship from './Ship'
import ShipTypeDestroyer from '../common/ShipTypeDestroyer'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import ShipTypeBattleShip from '../common/ShipTypeBattleShip'
import ShipTypeCarrier from '../common/ShipTypeCarrier'
import ShipTypePatrolBoat from '../common/ShipTypePatrolBoat'


const ships: Ship[] = []
window.mouseDownEvent = (position: Position) => {
    console.log(`Down: ${position.col}x${position.row}`)
    for (const ship of ships) {
        if (ship.isLocatedAt(position)) {
            console.log("Ship was selected")
            ship.select()
        } else {
            ship.deselect()
        }
        window.shipsBoard.loadShip(ship)
    }
    const shipsCanvas = document.getElementById("ships-board")
    if (shipsCanvas == null) {
        throw Error("Can't find Ships board")
    }

    window.render.refreshGrid(shipsCanvas, window.shipsBoard)
}

window.mouseUpEvent = (position: Position) => {
    console.log(`Up: ${position.col}x${position.row}`)
    for (const ship of ships) {
        ship.deselect()
        window.shipsBoard.loadShip(ship)
    }
    const shipsCanvas = document.getElementById("ships-board")
    if (shipsCanvas == null) {
        throw Error("Can't find Ships board")
    }

    window.render.refreshGrid(shipsCanvas, window.shipsBoard)
}

window.mouseMoveEvent = (position: Position) => {
    console.log(`Mouse move event: ${position.col}x${position.row}`)
    const shipTypeCarrier: ShipTypeAbstract = new ShipTypeCarrier()
    const shipTypeBattleShip: ShipTypeAbstract = new ShipTypeBattleShip()
    const shipTypeDestroyer: ShipTypeAbstract = new ShipTypeDestroyer()
    const shipTypePatrolBoat: ShipTypeAbstract = new ShipTypePatrolBoat()

    for (const index in ships) {
        const ship = ships[index]
        if (ship.isSelected()) {
            var t: ShipTypeAbstract
            switch (ship.type.getSize()) {
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
                    throw new Error(`Unknown ship type ${ship.type.getSize()}`)
            }
            const s = new Ship(new Position(position.col, position.row), ship.orientation, t)
            const startPoint = new Point(40, 40)
            const b = Board.initFrom(startPoint, 40, 1, 10, 10, true)
            for (const ship of ships) {
                if (!ship.isSelected()) {
                    b.loadShip(ship, true)
                }
            }

            if (b.grid.canPlaceShip(s)) {
                console.log(`Ship moved to ${position.col}x${position.row}`)
                // clear old ship position
                for (const k in ship.sections) {
                    const sec = ship.sections[k]
                    window.shipsBoard.grid.setCellType(sec.position, Cell.CELL_TYPE_WATER)
                }
                ships[index] = s
                window.shipsBoard.loadShip(s)
            } else {
                console.log("The ship can't move")
                window.shipsBoard.loadShip(ship)
            }

        }

        const shipsCanvas = document.getElementById("ships-board")
        if (shipsCanvas == null) {
            throw Error("Can't find Ships board")
        }

        window.render.refreshGrid(shipsCanvas, window.shipsBoard)
    }

    const shipsCanvas = document.getElementById("ships-board")
    if (shipsCanvas == null) {
        throw Error("Can't find Ships board")
    }

    window.render.refreshGrid(shipsCanvas, window.shipsBoard)
}

window.onload = function() {
    window.render = new Render();

    const shipsCanvas = document.getElementById("ships-board")
    if (shipsCanvas == null) {
        throw Error("Can't find Ships board")
    }

    const startPoint = new Point(40, 40)
    window.shipsBoard = Board.initFrom(startPoint, 40, 1, 10, 10, true)
    window.shipsBoard.active = true

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
        window.shipsBoard.loadShip(s)
    })

    window.render.drawBoard(shipsCanvas, window.shipsBoard)

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
    }.bind(shipsCanvas, window.shipsBoard))

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

    shipsCanvas.addEventListener('click', function(board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseClick(mousePoint)
    }.bind(shipsCanvas, window.shipsBoard))

    shipsCanvas.addEventListener('mousedown', function(board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseDown(mousePoint)
    }.bind(shipsCanvas, window.shipsBoard))

    shipsCanvas.addEventListener('mouseup', function(board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseUp(mousePoint)
    }.bind(shipsCanvas, window.shipsBoard))

    shipsCanvas.addEventListener('mousemove', function(board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseMove(mousePoint)
    }.bind(shipsCanvas, window.shipsBoard))
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