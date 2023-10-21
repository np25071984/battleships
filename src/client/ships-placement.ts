import PlacementRender from './PlacementRender'
import Position from '../common/Position'
import Point from './Point'
import PlacementBoard from './PlacementBoard'
import Cell from './Cell'
import type Window from './types/index.d.ts'
import Ship from './Ship'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import ShipSection from '../common/ShipSection'
import ShipTypeFactory from '../common/ShipTypeFactory'

window.mouseDownEvent = (position: Position) => {
    console.log(`Down: ${position.col}x${position.row}`)
    for (const ship of window.shipsBoard.ships) {
        if (ship.isLocatedAt(position)) {
            ship.select()
            window.offset = {
                col: position.col - ship.position.col,
                row: position.row - ship.position.row,
            }
            console.log(window.offset)
        } else {
            ship.deselect()
        }
    }
    const shipsCanvas = document.getElementById("placement-board")
    if (shipsCanvas == null) {
        throw Error("Can't find PlacementBboard")
    }

    window.render.refreshGrid(shipsCanvas, window.shipsBoard)
}

function canPlace(ship: Ship, position: Position): boolean {
    const tmpShip = new Ship(position, ship.orientation, ShipTypeFactory.getType(ship.type.getSize()))

    if (ship.orientation === Ship.SHIP_ORIENTATION_HORIZONTAL) {
        const rightSectionCol: number = tmpShip.position.col + tmpShip.type.getSize()
        console.log(rightSectionCol)
        console.log(window.shipsBoard.grid.cols)
        if (rightSectionCol > window.shipsBoard.grid.cols) {
            return false
        }
    }

    if (ship.orientation === Ship.SHIP_ORIENTATION_VERTICAL) {
        const bottomSectionRow: number = tmpShip.position.row + tmpShip.type.getSize()
        if (bottomSectionRow > window.shipsBoard.grid.rows) {
            return false
        }
    }

    for (const placedShip of window.shipsBoard.ships) {
        if (!placedShip.isSelected()) {
            for (const key in tmpShip.sections) {
                const section: ShipSection = tmpShip.sections[key]
                if (placedShip.occupies(section.position)) {
                    return false
                }
            }
        }
    }

    return true
}

window.mouseUpEvent = (position: Position) => {
    console.log(`Up: ${position.col}x${position.row}`)
    for (const ship of window.shipsBoard.ships) {
        if (ship.isSelected()) {

            const actualPosition = new Position(
                position.col - window.offset.col,
                position.row - window.offset.row
            )

            if (canPlace(ship, actualPosition)) {
                ship.sections.forEach((section: ShipSection) => {
                    console.log(`Position ${section.position.col}x${section.position.row} has been changed`)
                    window.shipsBoard.grid.getCell(section.position).setType(Cell.CELL_TYPE_FOG_OF_WAR)
                }, this)

                ship.move(actualPosition)
                ship.deselect()
            } else {
                console.log(`Ship can't be placed at ${position.col}x${position.row}`)
                ship.deselect()
            }
        }
    }

    const shipsCanvas = document.getElementById("placement-board")
    if (shipsCanvas == null) {
        throw Error("Can't find PlacementBboard")
    }

    window.render.refreshGrid(shipsCanvas, window.shipsBoard)
}

// window.mouseMoveEvent = (position: Position) => {
//     console.log(`Mouse move event: ${position.col}x${position.row}`)
//     window.render.refreshGrid(shipsCanvas, window.shipsBoard)
// }

window.onload = function () {
    window.render = new PlacementRender();

    const placementCanvas = document.getElementById("placement-board")
    if (placementCanvas == null) {
        throw Error("Can't find PlacementBoard")
    }

    const startPoint = new Point(40, 40)
    window.shipsBoard = PlacementBoard.getInstance(startPoint, 40, 1, 10, 10, true)

    window.initShips.forEach((shipData) => {
        const p: Position = new Position(shipData.col, shipData.row)
        const t: ShipTypeAbstract = ShipTypeFactory.getType(shipData.size)
        const s = new Ship(p, shipData.orientation, t)
        window.shipsBoard.loadShip(s)
    })

    window.render.drawBoard(placementCanvas, window.shipsBoard)

    function getMousePoint(canvasRect, clientX, clientY) {
        const x = clientX - canvasRect.left
        const y = clientY - canvasRect.top
        return new Point(x, y)
    }

    placementCanvas.addEventListener('mousemove', function (board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseMove(mousePoint)
        window.render.refreshGrid(this, board)
    }.bind(placementCanvas, window.shipsBoard))

    // placementCanvas.addEventListener('click', function(board, e) {
    //     const rect = this.getBoundingClientRect()
    //     const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
    //     board.mouseClick(mousePoint)
    // }.bind(placementCanvas, window.shipsBoard))

    placementCanvas.addEventListener('mousedown', function (board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseDown(mousePoint)
    }.bind(placementCanvas, window.shipsBoard))

    placementCanvas.addEventListener('mouseup', function (board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseUp(mousePoint)
    }.bind(placementCanvas, window.shipsBoard))

    const submitButton = document.getElementById("submit-ships")
    if (submitButton == null) {
        throw Error("Can't find Sibmit button")
    }

    submitButton.addEventListener('click', function (event) {
        window.shipsBoard.ships.forEach((ship: Ship) => {
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
}