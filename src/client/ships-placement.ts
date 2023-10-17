import BattleshipsEvent from './BattleshipsEvent'
import ShotResult from '../common/ShotResult'
import Render from './Render'
import Position from '../common/Position'
import Point from './Point'
import Board from './Board'
import Cell from './Cell'
import type Window from './types/index.d.ts'
import Ship from '../common/Ship'
import ShipTypeDestroyer from '../common/ShipTypeDestroyer'
import ShipTypePatrolBoat from '../common/ShipTypePatrolBoat'
import ShipTypeAbstract from '../common/ShipTypeAbstract'

window.onload = function() {
    console.log("Ships placement");

    window.render = new Render();

    const shipsCanvas = document.getElementById("ships-board")
    if (shipsCanvas == null) {
        throw Error("Can't find Ships board")
    }

    const startPoint = new Point(40, 40)
    const shipsBoard = Board.initFrom(startPoint, 40, 1, 10, 10, true)
    shipsBoard.active = true

    const shipDestroyerType = new ShipTypeDestroyer();
    const shipPatrolBoatType = new ShipTypePatrolBoat();
    const ships: Ship[] = placeShips(10, 10, [shipDestroyerType, shipPatrolBoatType])    
    ships.forEach((ship: Ship) => {
        shipsBoard.loadShip(ship)
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