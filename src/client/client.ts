import BattleshipsEvent from './BattleshipsEvent'
import HitResult from '../common/HitResult'
import Render from './Render'
import Cell from './Cell'
import Ship from './Ship'
import Position from './Position'
import Point from './Point'
import Board from './Board'
import ShipTypeCarrier from './ShipTypeCarrier'
import ShipTypeBattleShip from './ShipTypeBattleShip'
import ShipTypeDestroyer from './ShipTypeDestroyer'
import ShipTypeSubmarine from './ShipTypeSubmarine'
import ShipTypePatrolBoat from './ShipTypePatrolBoat'
import type Window from '../types/index.d.ts'

window.onload = function() {
    console.log("gameId: " + window.gameId);
    const actionCanvas = document.getElementById("action-board");
    if (actionCanvas == null) {
        throw Error("Can't find Action board");
    }
    const sheepsCanvas = document.getElementById("my-ships");
    if (actionCanvas == null) {
        throw Error("Can't find Sheeps board");
    }

    window.socket = window.io()
    window.socket.on(BattleshipsEvent.EVENT_CHANNEL_NAME_SYSTEM, function(event) {
        switch (event.type) {
            case BattleshipsEvent.EVENT_TYPE_CONNECTED:
                const startPoint = new Point(40, 40);
                window.actionBoard = Board.initFromServerData(startPoint, 40, 1, event.grid, true);
                window.render.drawBoard(actionCanvas, window.actionBoard);
                window.shipsBoard = Board.initFromServerData(startPoint, 40, 1, event.grid, true);
                const ships: Ship[] = []
                event.ships.forEach((shipData) => {
                    const p = new Position(shipData.position.col, shipData.position.row)
                    var type;
                    switch (shipData.type.SHIP_SIZE) {
                        case 5:
                            type = new ShipTypeCarrier()
                            break
                        case 4:
                            type = new ShipTypeBattleShip()
                            break
                        case 3:
                            type = new ShipTypeDestroyer()
                            break
                        case 2:
                            type = new ShipTypePatrolBoat()
                            break
                    }
                    const s = new Ship(p, shipData.orientation, type)
                    ships.push(s)
                })
                window.shipsBoard.placeShips(ships);
                window.render.drawBoard(sheepsCanvas, window.shipsBoard);
                console.log(`We are connected to the server (playerId: ${event.playerId})`);
                window.playerId = event.playerId;
                const d = new Date();
                d.setTime(d.getTime() + (1*24*60*60*1000));
                let expires = "expires="+ d.toUTCString();
                document.cookie = "playerId=" + window.playerId + ";" + expires + ";path=/";
                break;
            default:
                throw new Error(`Unknown system event type(${event.type})`);
        }

        function getMousePoint(canvasRect, clientX, clientY) {
            const x = clientX - canvasRect.left;
            const y = clientY - canvasRect.top;
            return new Point(x, y);
        }

        actionCanvas.addEventListener('mousemove', function(board, e) {
            const rect = this.getBoundingClientRect();
            const mousePoint = getMousePoint(rect, e.clientX, e.clientY);
            board.mouseMove(mousePoint);
            window.render.refreshGrid(this, board);
        }.bind(actionCanvas, window.actionBoard));

        actionCanvas.addEventListener('click', function(board, e) {
            const rect = this.getBoundingClientRect();
            const mousePoint = getMousePoint(rect, e.clientX, e.clientY);
            board.mouseClick(mousePoint);
            window.render.refreshGrid(this, board);
        }.bind(actionCanvas, window.actionBoard));
    });
    window.render = new Render();

    window.socket.on(BattleshipsEvent.EVENT_CHANNEL_NAME_GAME, function(event) {
        switch (event.type) {
            case BattleshipsEvent.EVENT_TYPE_WAITING:
                console.log(`Waiting for the second player`)
                break
            case BattleshipsEvent.EVENT_TYPE_JOINED:
                console.log(`Player ${event.socketId} has joined the game`)
                break
            case BattleshipsEvent.EVENT_TYPE_LEFT:
                console.log(`Player ${event.socketId} has left the game`)
                break
            case BattleshipsEvent.EVENT_TYPE_HIT:
                console.log(`Hit at ${event.col} x ${event.row}`)
                var pos = new Position(event.col, event.row)
                window.shipsBoard.hit(pos)
                window.render.refreshGrid(sheepsCanvas, window.shipsBoard)
                break
            case BattleshipsEvent.EVENT_TYPE_ANNOUNCE:
                console.log(`Got announce about ${event.col} x ${event.row}; there is ${event.result}`)
                var pos = new Position(event.col, event.row)
                switch (event.result) {
                    case HitResult.HIT_RESULT_MISS:
                        console.log("miss")
                        window.actionBoard.setCellType(pos, Cell.CELL_TYPE_WATER)
                        break
                    case HitResult.HIT_RESULT_DAMAGE:
                        console.log("damage")
                        window.actionBoard.setCellType(pos, Cell.CELL_TYPE_WRACKAGE)
                        break
                    case HitResult.HIT_RESULT_SUNK:
                        console.log("sunk")
                        window.actionBoard.setCellType(pos, Cell.CELL_TYPE_WRACKAGE)
                        event.surround.forEach((pos) => {
                            window.actionBoard.setCellType(new Position(pos.col, pos.row), Cell.CELL_TYPE_WATER)
                        });
                        break
                    default:
                        throw new Error(`Unknown hit result(${event.result})`)
                }
                console.log("refresh")
                window.render.refreshGrid(actionCanvas, window.actionBoard)
                break
            case BattleshipsEvent.EVENT_TYPE_ROUND:
                console.log("Round")
                window.actionBoard.roundStart(event.number)
                break
            case BattleshipsEvent.EVENT_TYPE_WIN:
                console.log("Win")
                break
            case BattleshipsEvent.EVENT_TYPE_DEFEAT:
                console.log("Defeat")
                break
            case BattleshipsEvent.EVENT_TYPE_DRAW:
                console.log("Draw")
                break
            default:
                throw new Error(`Unknown game event type(${event.type})`)
        }
    })
}