import BattleshipsEvent from './BattleshipsEvent'
import ShotResult from '../common/ShotResult'
import Render from './Render'
import Position from '../common/Position'
import Point from './Point'
import Board from './Board'
import Cell from './Cell'
import type Window from './types/index.d.ts'

window.onload = function() {
    console.log("gameId: " + window.gameId);

    window.render = new Render();

    window.socket = window.io()
    window.socket.on(BattleshipsEvent.EVENT_CHANNEL_NAME_SYSTEM, function(event) {
        switch (event.type) {
            case BattleshipsEvent.EVENT_TYPE_CONNECTED:
                window.playerId = event.playerId
                const d = new Date()
                d.setTime(d.getTime() + (1*24*60*60*1000))
                let expires = "expires="+ d.toUTCString()
                document.cookie = "playerId=" + window.playerId + ";" + expires + ";path=/"

                console.dir("connected to the server")
                break;
            default:
                throw new Error(`Unknown system event type(${event.type})`)
        }
    });

    window.socket.on(BattleshipsEvent.EVENT_CHANNEL_NAME_GAME, function(event) {
        switch (event.type) {
            case BattleshipsEvent.EVENT_TYPE_INIT:
                console.dir("init client")

                const shotsCanvas = document.getElementById("shots-board")
                if (shotsCanvas == null) {
                    throw Error("Can't find Shots board")
                }
                const shipsCanvas = document.getElementById("ships-board")
                if (shipsCanvas == null) {
                    throw Error("Can't find Ships board")
                }

                const startPoint = new Point(40, 40)
                window.shotsBoard = Board.initFromServerData(startPoint, 40, 1, event.shots_grid, true)
                window.render.drawBoard(shotsCanvas, window.shotsBoard)
                window.shipsBoard = Board.initFromServerData(startPoint, 40, 1, event.ships_grid, true)
                window.render.drawBoard(shipsCanvas, window.shipsBoard)

                function getMousePoint(canvasRect, clientX, clientY) {
                    const x = clientX - canvasRect.left
                    const y = clientY - canvasRect.top
                    return new Point(x, y)
                }

                shotsCanvas.addEventListener('mousemove', function(board, e) {
                    const rect = this.getBoundingClientRect()
                    const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
                    board.mouseMove(mousePoint)
                    window.render.refreshGrid(this, board)
                }.bind(shotsCanvas, window.shotsBoard))

                shotsCanvas.addEventListener('click', function(board, e) {
                    const rect = this.getBoundingClientRect()
                    const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
                    board.mouseClick(mousePoint)
                    window.render.refreshGrid(this, board)
                }.bind(shotsCanvas, window.shotsBoard))
                break;
            case BattleshipsEvent.EVENT_TYPE_WAITING:
                console.log(`Waiting for the second player`)
                break
            case BattleshipsEvent.EVENT_TYPE_JOINED:
                console.log(`Player ${event.playerId} has joined the game`)
                break
            case BattleshipsEvent.EVENT_TYPE_LEFT:
                console.log(`Player ${event.playerId} has left the game`)
                break
            case BattleshipsEvent.EVENT_TYPE_ANNOUNCE:
                for (const u in event.ships_updates) {
                    const upd =  event.ships_updates[u]
                    window.shipsBoard.grid.getCell(new Position(upd.col, upd.row)).setType(upd.type)
                }
                window.render.refreshGrid(document.getElementById("ships-board"), window.shipsBoard)

                for (const u in event.shots_updates) {
                    const upd =  event.shots_updates[u]
                    window.shotsBoard.grid.getCell(new Position(upd.col, upd.row)).setType(upd.type)
                }
                window.render.refreshGrid(document.getElementById("shots-board"), window.shotsBoard)

                switch (event.result) {
                    case ShotResult.HIT_RESULT_MISS:
                        console.log("miss")
                        break
                    case ShotResult.HIT_RESULT_DAMAGE:
                        console.log("damage")
                        break
                    case ShotResult.HIT_RESULT_SUNK:
                        console.log("sunk")
                        break
                    default:
                        throw new Error(`Unknown hit result(${event.result})`)
                }
                break
            case BattleshipsEvent.EVENT_TYPE_ROUND:
                window.shotsBoard.roundStart(event.number)
                break
            case BattleshipsEvent.EVENT_TYPE_GAME_RESULT:
                switch (event.result) {
                    case BattleshipsEvent.GAME_RESULT_WIN:
                        console.log("Win")
                        break
                    case BattleshipsEvent.GAME_RESULT_DEFEAT:
                        for (const u in event.opponent_ships) {
                            const upd =  event.opponent_ships[u]
                            window.shotsBoard.grid.getCell(new Position(upd.col, upd.row)).setType(Cell.CELL_TYPE_SHIP)
                        }
                        window.render.refreshGrid(document.getElementById("shots-board"), window.shotsBoard)
                        console.log("Defaat")
                        break
                    case BattleshipsEvent.GAME_RESULT_DRAW:
                        console.log("Draw")
                        break
                    default:
                        throw new Error(`Unknown game result '${event.result}'`)
                }
                break
            default:
                throw new Error(`Unknown game event type(${event.type})`)
        }
    })
}