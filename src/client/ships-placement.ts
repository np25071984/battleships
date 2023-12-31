import Render from './Render'
import Position from '../common/Position'
import Point from './Point'
import Board from './Board'
import Cell from './Cell'
import type Window from './@types/index.d.ts'
import Ship from './Ship'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import ShipSection from '../common/ShipSection'
import ShipTypeFactory from '../common/ShipTypeFactory'

window.rotateShip = function(): void {
    if (window.shipsBoard.rotateShip()) {
        const shipsCanvas = document.getElementById("placement-board")
        if (shipsCanvas == null) {
            throw Error("Can't find Board")
        }

        window.render.refreshGrid(shipsCanvas, window.shipsBoard)
    }
}

window.shuffleShip = function(): void {
    const shipsCanvas = document.getElementById("placement-board")
    if (shipsCanvas == null) {
        throw Error("Can't find Board")
    }

    window.shipsBoard.setReady(false)
    window.shipsBoard.active = false
    window.render.drawEmptyBoard(shipsCanvas, window.shipsBoard)

    window.shipsBoard.grid.resetShips()

    sendShipsRequest()

    const shuffleButton = document.getElementById("shuffle-button") as HTMLButtonElement
    if (shuffleButton == null) {
        throw Error("Can't find Shuffle button")
    }
    shuffleButton.disabled = true

    const submitButton = document.getElementById("submit-ships") as HTMLButtonElement
    if (submitButton == null) {
        throw Error("Can't find Submit button")
    }
    submitButton.disabled = true
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
                const s = new Ship(p, shipData.isHorizontal, t)
                window.shipsBoard.grid.loadShip(s)
            })

            const shuffleButton = document.getElementById("shuffle-button") as HTMLButtonElement
            if (shuffleButton == null) {
                throw Error("Can't find Shubble button")
            }
            shuffleButton.disabled = false

            const submitButton = document.getElementById("submit-ships") as HTMLButtonElement
            if (submitButton == null) {
                throw Error("Can't find Submit button")
            }
            submitButton.disabled = false

            const placementCanvas = document.getElementById("placement-board") as HTMLCanvasElement
            if (placementCanvas == null) {
                throw Error("Can't find Board")
            }

            // set ready state and draw empty background instead "Loading..." message
            window.shipsBoard.setReady(true)
            window.render.drawEmptyBoard(placementCanvas, window.shipsBoard)

            // allow user events and draw the grid itself
            window.shipsBoard.active = true
            window.render.refreshGrid(shipsCanvas, window.shipsBoard)
        }
    }
    xhttp.open("GET", `/shuffle/${window.gameId}`, true)
    xhttp.send()
}

function checkIfShipCanBeRotated(ship: Ship): boolean {
    const rotatedShip: Ship = new Ship(ship.position, !ship.isHorizontal, ship.type)
    return window.shipsBoard.grid.canPlace(rotatedShip, rotatedShip.position)
}

window.mouseDownEvent = (position: Position) => {
    var selectedShip: Ship|null = null

    for (const ship of window.shipsBoard.grid.ships) {
        if (!ship.isLocatedAt(position)) {
            ship.deselect()
            continue
        }

        // ship clicked
        ship.select()
        selectedShip = ship

        window.offset = {
            col: position.col - ship.position.col,
            row: position.row - ship.position.row,
        }

        window.mouseMoveEvent = (position: Position) => {
            for (const ship of window.shipsBoard.grid.ships) {
                if (ship.isSelected()) {
                    const actualPosition = new Position(
                        position.col - window.offset.col,
                        position.row - window.offset.row
                    )

                    const shade: Ship = new Ship(
                        actualPosition,
                        ship.isHorizontal,
                        ShipTypeFactory.getType(ship.type.getSize())
                    )
                    window.shadeShip = shade
                    break
                }
            }
        }
    }

    const rotateButton = document.getElementById("rotate-ship") as HTMLButtonElement
    if (rotateButton == null) {
        throw Error("Can't find Rotate button")
    }

    if (selectedShip) {
        rotateButton.disabled = !checkIfShipCanBeRotated(selectedShip)
    } else {
        rotateButton.disabled = true
    }

    const shipsCanvas = document.getElementById("placement-board") as HTMLCanvasElement
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

    for (const ship of window.shipsBoard.grid.ships) {
        if (ship.isSelected()) {
            const actualPosition = new Position(
                position.col - window.offset.col,
                position.row - window.offset.row
            )

            const tmpShip = new Ship(actualPosition, ship.isHorizontal, ship.type)
            if (window.shipsBoard.grid.canPlace(tmpShip)) {
                ship.sections.forEach((section: ShipSection) => {
                    window.shipsBoard.grid.getCell(section.position).setType(Cell.CELL_TYPE_FOG_OF_WAR)
                })

                ship.move(actualPosition)

                const rotateButton = document.getElementById("rotate-ship") as HTMLButtonElement
                if (rotateButton == null) {
                    throw Error("Can't find Rotate button")
                }

                rotateButton.disabled = !checkIfShipCanBeRotated(ship)
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
    window.render = new Render()

    const placementCanvas = document.getElementById("placement-board") as HTMLCanvasElement
    if (placementCanvas == null) {
        throw Error("Can't find Board")
    }

    window.shipsBoard = Board.getInstance(window.cols, window.rows, true)
    placementCanvas.width = window.shipsBoard.getTotalWidth()
    placementCanvas.height = window.shipsBoard.getTotalHeight()
    // by this time the board's isReady state is equal to false; so let's draw "Loading..." message
    window.render.drawEmptyBoard(placementCanvas, window.shipsBoard)

    const submitButton = document.getElementById("submit-ships")
    if (submitButton == null) {
        throw Error("Can't find Sibmit button")
    }

    sendShipsRequest()
    setUpEventListeners(placementCanvas)

    submitButton.addEventListener('click', function () {
        window.shipsBoard.grid.ships.forEach((ship: Ship) => {
            const sh: string = JSON.stringify({
                'col': ship.position.col,
                'row': ship.position.row,
                'type': ship.type.getSize(),
                'isHorizontal': ship.isHorizontal,
            })
            var input = document.createElement('input')
            input.setAttribute('name', "ships[]")
            input.setAttribute('value', sh);
            input.setAttribute('type', "hidden")
            this.appendChild(input)
        }, this)
    })
}

function setUpEventListeners(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mouseout', function (board, e) {
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
    }.bind(canvas, window.shipsBoard))

    canvas.addEventListener('mousemove', function (board, e) {
        var isSelectedShip: boolean = false
        for (const ship of window.shipsBoard.grid.ships) {
            if (ship.isSelected()) {
                isSelectedShip = true
                break
            }
        }


        // there is nothing to move if we don't have a selected ship
        if (!isSelectedShip) {
            return
        }
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseMove(mousePoint)
        window.render.refreshGrid(this, board)
    }.bind(canvas, window.shipsBoard))

    canvas.addEventListener('touchmove', function (board, e) {
        for (const ship of window.shipsBoard.grid.ships) {
            if (ship.isSelected()) {
                e.preventDefault()
            }
        }

        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.touches[0].clientX, e.touches[0].clientY)
        board.mouseMove(mousePoint)
        window.render.refreshGrid(this, board)
    }.bind(canvas, window.shipsBoard))

    canvas.addEventListener('click', function(board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseClick(mousePoint)
    }.bind(canvas, window.shipsBoard))

    canvas.addEventListener('mousedown', function (board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseDown(mousePoint)
    }.bind(canvas, window.shipsBoard))

    canvas.addEventListener('touchstart', function (board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.touches[0].clientX, e.touches[0].clientY)
        board.mouseDown(mousePoint)
    }.bind(canvas, window.shipsBoard))

    canvas.addEventListener('mouseup', function (board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
        board.mouseUp(mousePoint)
    }.bind(canvas, window.shipsBoard))

    canvas.addEventListener('touchend', function (board, e) {
        const rect = this.getBoundingClientRect()
        const mousePoint = getMousePoint(rect, e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        board.mouseUp(mousePoint)
    }.bind(canvas, window.shipsBoard))
}

function getMousePoint(canvasRect, clientX: number, clientY: number) {
    const x = clientX - canvasRect.left
    const y = clientY - canvasRect.top
    return new Point(x, y)
}
