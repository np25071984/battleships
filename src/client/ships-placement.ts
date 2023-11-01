import Render from './Render'
import Position from '../common/Position'
import Point from './Point'
import Board from './Board'
import Cell from './Cell'
import type Window from './types/index.d.ts'
import Ship from './Ship'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import ShipSection from '../common/ShipSection'
import ShipTypeFactory from '../common/ShipTypeFactory'

window.canPlace = function(ship: Ship, position: Position): boolean {
    const tmpShip = new Ship(position, ship.orientation, ShipTypeFactory.getType(ship.type.getSize()))

    if (ship.orientation === Ship.SHIP_ORIENTATION_HORIZONTAL) {
        const rightSectionCol: number = tmpShip.position.col + tmpShip.type.getSize()
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

window.rotateShip = function(): void {
    for (const ship of window.shipsBoard.ships) {
        if (ship.isSelected()) {
            const oppositeOrientation: number = ship.orientation === Ship.SHIP_ORIENTATION_HORIZONTAL ? Ship.SHIP_ORIENTATION_VERTICAL : Ship.SHIP_ORIENTATION_HORIZONTAL
            const rotatedShip = new Ship(ship.position, oppositeOrientation, ShipTypeFactory.getType(ship.type.getSize()))
            if (window.canPlace(rotatedShip, rotatedShip.position)) {
                // clean up previously occupied space
                ship.sections.forEach((section: ShipSection) => {
                    window.shipsBoard.grid.getCell(section.position).setType(Cell.CELL_TYPE_FOG_OF_WAR)
                })

                ship.orientation = oppositeOrientation
                ship.move(ship.position)

                const shipsCanvas = document.getElementById("placement-board")
                if (shipsCanvas == null) {
                    throw Error("Can't find Board")
                }

                window.render.refreshGrid(shipsCanvas, window.shipsBoard)
            } else {
                console.log("this ship can't be rotated")
            }
            break
        }
    }
}

window.shuffleShip = function(): void {
    const shipsCanvas = document.getElementById("placement-board")
    if (shipsCanvas == null) {
        throw Error("Can't find Board")
    }

    window.shipsBoard.setReady(false)
    window.render.drawSubstrate(shipsCanvas, window.shipsBoard)
    window.shipsBoard.resetShips()

    sendShipsRequest()

    const shuffleButton = document.getElementById("shuffle-button") as HTMLButtonElement
    if (shuffleButton == null) {
        throw Error("Can't find Shubble button")
    }

    shuffleButton.disabled = true
}

function sendShipsRequest(): void {
    const shipsCanvas = document.getElementById("placement-board")
    if (shipsCanvas == null) {
        throw Error("Can't find Board")
    }

    var xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            const shipsData = JSON.parse(this.responseText)
            shipsData.forEach((shipData) => {
                const p: Position = new Position(shipData.col, shipData.row)
                const t: ShipTypeAbstract = ShipTypeFactory.getType(shipData.size)
                const s = new Ship(p, shipData.orientation, t)
                window.shipsBoard.loadShip(s)
            })

            window.shipsBoard.setReady(true)
            window.render.drawSubstrate(shipsCanvas, window.shipsBoard)
            window.render.refreshGrid(shipsCanvas, window.shipsBoard)

            const shuffleButton = document.getElementById("shuffle-button") as HTMLButtonElement
            if (shuffleButton == null) {
                throw Error("Can't find Shubble button")
            }

            shuffleButton.disabled = false
        }
    }
    xhttp.open("GET", `/shuffle/${window.gameId}`, true)
    xhttp.send()
}

window.mouseDownEvent = (position: Position) => {
    for (const ship of window.shipsBoard.ships) {
        if (ship.isLocatedAt(position)) {
            ship.select()

            window.offset = {
                col: position.col - ship.position.col,
                row: position.row - ship.position.row,
            }

            window.mouseMoveEvent = (position: Position) => {
                const cell = window.shipsBoard.grid.getCell(position)
                for (const ship of window.shipsBoard.ships) {
                    if (ship.isSelected()) {
                        const actualPosition = new Position(
                            position.col - window.offset.col,
                            position.row - window.offset.row
                        )

                        const shade: Ship = new Ship(actualPosition, ship.orientation, ShipTypeFactory.getType(ship.type.getSize()))
                        window.shadeShip = shade
                        break
                    }
                }
            }
        } else {
            ship.deselect()
        }

        // enable/disable Rotate button when a Ship was/wasn't selected
        var isSelectetShip: boolean = false
        for (const ship of window.shipsBoard.ships) {
            if (ship.isSelected()) {
                isSelectetShip = true
                break
            }
        }

        const rotateButton = document.getElementById("rotate-ship") as HTMLButtonElement
        if (rotateButton == null) {
            throw Error("Can't find Rotate button")
        }

        // TODO: check if it is possible to rotate the ship
        rotateButton.disabled = !isSelectetShip
    }

    const shipsCanvas = document.getElementById("placement-board")
    if (shipsCanvas == null) {
        throw Error("Can't find Board")
    }

    window.render.refreshGrid(shipsCanvas, window.shipsBoard)
}

window.mouseUpEvent = (position: Position) => {
    window.mouseMoveEvent = null

    if (window.shadeShip) {
        // remove shadow from the board
        window.shadeShip.sections.forEach((section: ShipSection) => {
            if (!window.shipsBoard.grid.doesCellExist(section.position)) {
                return
            }

            window.shipsBoard.grid.getCell(section.position).setType(Cell.CELL_TYPE_FOG_OF_WAR)
        })
        window.shadeShip = null
    }

    for (const ship of window.shipsBoard.ships) {
        if (ship.isSelected()) {
            const actualPosition = new Position(
                position.col - window.offset.col,
                position.row - window.offset.row
            )

            if (window.canPlace(ship, actualPosition)) {
                ship.sections.forEach((section: ShipSection) => {
                    window.shipsBoard.grid.getCell(section.position).setType(Cell.CELL_TYPE_FOG_OF_WAR)
                })

                ship.move(actualPosition)
            } else {
                console.log(`Ship can't be placed at ${position.col}x${position.row}`)
                if (!ship.isLocatedAt(position)) {
                    ship.deselect()
                }
            }
        }
    }

    const shipsCanvas = document.getElementById("placement-board")
    if (shipsCanvas == null) {
        throw Error("Can't find Board")
    }

    window.render.refreshGrid(shipsCanvas, window.shipsBoard)
}

window.onload = function () {
    window.render = new Render();

    const placementCanvas = document.getElementById("placement-board") as HTMLCanvasElement
    if (placementCanvas == null) {
        throw Error("Can't find Board")
    }

    placementCanvas.width = placementCanvas.getBoundingClientRect().width
    placementCanvas.height = placementCanvas.getBoundingClientRect().height
    const maxSide: number = Math.min(placementCanvas.width, placementCanvas.width)

    const startPoint = new Point(40, 40)
    window.shipsBoard = Board.getInstance(startPoint, maxSide, 1, window.cols, window.rows, true)
    window.shipsBoard.active = true
    window.render.drawEmptyBoard(placementCanvas, window.shipsBoard)

    function getMousePoint(canvasRect, clientX, clientY) {
        const x = clientX - canvasRect.left
        const y = clientY - canvasRect.top
        return new Point(x, y)
    }

    placementCanvas.addEventListener('mouseout', function (board, e) {
        window.mouseMoveEvent = null

        if (window.shadeShip) {
            // remove shadow from the board
            window.shadeShip.sections.forEach((section: ShipSection) => {
                if (!window.shipsBoard.grid.doesCellExist(section.position)) {
                    return
                }

                window.shipsBoard.grid.getCell(section.position).setType(Cell.CELL_TYPE_FOG_OF_WAR)
            })
            window.shadeShip = null
        }

        window.render.refreshGrid(this, board)
    }.bind(placementCanvas, window.shipsBoard))

    placementCanvas.addEventListener('mousemove', function (board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseMove(mousePoint)
        window.render.refreshGrid(this, board)
    }.bind(placementCanvas, window.shipsBoard))

    placementCanvas.addEventListener('click', function(board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseClick(mousePoint)
    }.bind(placementCanvas, window.shipsBoard))

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
            input.setAttribute('name', "ships[]")
            input.setAttribute('value', sh);
            input.setAttribute('type', "hidden")
            this.appendChild(input)
        }, this)
    })

    sendShipsRequest()
}