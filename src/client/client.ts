import BattleshipsEvent from './BattleshipsEvent'
import HitResult from './HitResult'
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

// TODO: move it into types declaration directory
declare global {
    interface Window {
      gameId: string
      playerId: string
      socket: any
      render: any
      io: any
    }
}

window.onload = function() {
    console.log("gameId: " + window.gameId);

    window.socket = window.io()
    window.socket.on(BattleshipsEvent.EVENT_CHANNEL_NAME_SYSTEM, function(event) {
        switch (event.type) {
            case BattleshipsEvent.EVENT_TYPE_CONNECTED:
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
    });

    window.render = new Render();
    const actionCanvas = document.getElementById("action-board");
    const sheepsCanvas = document.getElementById("my-ships");

    const startPoint = new Point(40, 40);
    const actionBoard = Board.initBoard(startPoint, 40, 1, 10, 10, true);
    window.render.drawBoard(actionCanvas, actionBoard);

    const shipsBoard = Board.initBoard(startPoint, 40, 1, 10, 10, true);
    const ships = shuffleShips();
    shipsBoard.placeShips(ships);
    window.render.drawBoard(sheepsCanvas, shipsBoard);

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
                console.log("dont react on this")
                shipsBoard.hit(pos)
                window.render.refreshGrid(sheepsCanvas, shipsBoard)
                break
            case BattleshipsEvent.EVENT_TYPE_ANNOUNCE:
                console.log(`Got announce about ${event.col} x ${event.row}; there is ${event.result}`)
                var pos = new Position(event.col, event.row)
                switch (event.result) {
                    case HitResult.HIT_RESULT_MISS:
                        console.log("miss")
                        actionBoard.setCellType(pos, Cell.CELL_TYPE_WATER)
                        break
                    case HitResult.HIT_RESULT_DAMAGE:
                        console.log("damage")
                        actionBoard.setCellType(pos, Cell.CELL_TYPE_WRACKAGE)
                        break
                    case HitResult.HIT_RESULT_SUNK:
                        console.log("sunk")
                        actionBoard.setCellType(pos, Cell.CELL_TYPE_WRACKAGE)
                        event.surround.forEach((pos) => {
                            actionBoard.setCellType(new Position(pos.col, pos.row), Cell.CELL_TYPE_WATER)
                        });
                        break
                    default:
                        throw new Error(`Unknown hit result(${event.result})`)
                }
                console.log("refresh")
                window.render.refreshGrid(actionCanvas, actionBoard)
                break
            case BattleshipsEvent.EVENT_TYPE_ROUND:
                console.log("Round")
                actionBoard.roundStart(event.number)
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
    });

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
    }.bind(actionCanvas, actionBoard));

    actionCanvas.addEventListener('click', function(board, e) {
        const rect = this.getBoundingClientRect();
        const mousePoint = getMousePoint(rect, e.clientX, e.clientY);
        board.mouseClick(mousePoint);
        window.render.refreshGrid(this, board);
    }.bind(actionCanvas, actionBoard));
};

function shuffleShips() {
    const carrierShipType = new ShipTypeCarrier();
    const battleShipType = new ShipTypeBattleShip();
    const destroyerShipType = new ShipTypeDestroyer();
    const submarineShipType = new ShipTypeSubmarine();
    const patrolBoatShipType = new ShipTypePatrolBoat();
    
    const ships = [];
    // var c = new Position(0, 0);
    // var s = new Ship(c, Ship.SHIP_ORIENTATION_VERTICAL, carrierShipType);
    // ships.push(s);
    var c = new Position(2, 0);
    var s = new Ship(c, Ship.SHIP_ORIENTATION_VERTICAL, battleShipType);
    ships.push(s);
    var c = new Position(4, 0);
    var s = new Ship(c, Ship.SHIP_ORIENTATION_VERTICAL, destroyerShipType);
    ships.push(s);
    // var c = new Position(6, 0);
    // var s = new Ship(c, Ship.SHIP_ORIENTATION_VERTICAL, submarineShipType);
    // ships.push(s);
    // var c = new Position(8, 0);
    // var s = new Ship(c, Ship.SHIP_ORIENTATION_VERTICAL, patrolBoatShipType);
    // ships.push(s);
    // // var c = new Position(0, 6);
    // var s = new Ship(c, Ship.SHIP_ORIENTATION_HORIZONTAL, patrolBoatShipType);
    // ships.push(s);
    // var c = new Position(3, 6);
    // var s = new Ship(c, Ship.SHIP_ORIENTATION_HORIZONTAL, battleShipType);
    // ships.push(s);

    return ships;
}
