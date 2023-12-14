import Render from './Render'
import Position from '../common/Position'
import Point from './Point'
import Cell from './Cell'
import type Window from './@types/index'
import Board from './Board'
import ShotResult from '../common/ShotResult'
import {
    ConnectedEvent,
    ShotEvent,
    JoinedEvent,
    LeftEvent,
    GameResultEvent,
    ShotResultEvent,
    InitEvent,
    RoundEvent,
} from '../common/@types/socket'
import { GameResult } from '../common/Enums'

window.mouseClickEvent = function(position: Position) {
    const cell: Cell = window.shotsBoard.grid.getCell(position)
    // only shot at CELL_TYPE_FOG_OF_WAR makes sense
    if (cell.getType() !== Cell.CELL_TYPE_FOG_OF_WAR) {
        return
    }

    window.shotsBoard.active = false
    cell.setType(Cell.CELL_TYPE_CLICKED)

    const shotEvent: ShotEvent = {
        'col': cell.position.col,
        'row': cell.position.row,
        'playerId': window.playerId,
        'gameId': window.gameId,
    }
    window.socket.emit("shot", shotEvent);
}

window.onload = function() {
    window.mouseMoveEvent = (position: Position) => {
        const cell = window.shotsBoard.grid.getCell(position)
        cell.isHover = true
        cell.setChanged()

        const shotsCanvas = document.getElementById("shots-board") as HTMLCanvasElement
        if (shotsCanvas == null) {
            throw Error("Can't find Shots board")
        }
        window.render.refreshGrid(shotsCanvas, window.shotsBoard)
    }

    window.render = new Render()

    window.socket = window.io()
    window.socket.on("connected", function(event: ConnectedEvent) {
        window.playerId = event.playerId
        const d = new Date()
        d.setTime(d.getTime() + (1*24*60*60*1000))
        let expires = "expires="+ d.toUTCString()
        document.cookie = "playerId=" + window.playerId + ";" + expires + ";path=/"
    })

    window.socket.on("init", function(event: InitEvent) {
        const shotsCanvas = document.getElementById("shots-board") as HTMLCanvasElement
        if (shotsCanvas == null) {
            throw Error("Can't find Shots board")
        }
        const shipsCanvas = document.getElementById("ships-board") as HTMLCanvasElement
        if (shipsCanvas == null) {
            throw Error("Can't find Ships board")
        }

        const shotsGridCols: number = event.shots_grid[0].length
        const shotsGridRows: number = event.shots_grid.length
        window.shotsBoard = Board.getInstance(shotsGridCols, shotsGridRows, true)
        shotsCanvas.width = window.shotsBoard.getTotalWidth()
        shotsCanvas.height = window.shotsBoard.getTotalHeight()
        window.shotsBoard.loadData(event.shots_grid)
        window.shotsBoard.setReady(true)
        window.render.drawEmptyBoard(shotsCanvas, window.shotsBoard)
        window.render.refreshGrid(shotsCanvas, window.shotsBoard)

        const shipsGridCols: number = event.ships_grid[0].length
        const shipsGridRows: number = event.ships_grid.length
        window.shipsBoard = Board.getInstance(shipsGridCols, shipsGridRows, false, 250)
        shipsCanvas.width = window.shipsBoard.getTotalWidth()
        shipsCanvas.height = window.shipsBoard.getTotalHeight()
        window.shipsBoard.loadData(event.ships_grid)
        window.shipsBoard.setReady(true)
        window.render.drawEmptyBoard(shipsCanvas, window.shipsBoard)
        window.render.refreshGrid(shipsCanvas, window.shipsBoard)

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

        const gameDiv = document.getElementById("game-boards")
        if (gameDiv == null) {
            throw Error("Can't find Game Board")
        }
        gameDiv.style.visibility = 'visible';

        const waitingMessageDiv = document.getElementById("waiting-message")
        if (waitingMessageDiv == null) {
            throw Error("Can't find Game Board")
        }
        waitingMessageDiv.style.display = 'none';
    })

    window.socket.on("waiting", function() {
        console.log(`Waiting for the second player`)
    })

    window.socket.on("joined", function(event: JoinedEvent) {
        console.log(`Player ${event.playerId} has joined the game`)
    })

    window.socket.on("left", function(event: LeftEvent) {
        console.log(`Player ${event.playerId} has left the game`)
    })

    window.socket.on("announce", function(event: ShotResultEvent) {
        if (event.result === ShotResult.HIT_RESULT_SUNK) {
            const spanElement = document.getElementById(`remaining-ships-${event.size}`)
            if (spanElement && spanElement.firstElementChild) {
                spanElement.firstElementChild.remove()
            }
        }

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
    })

    window.socket.on("round", function(event: RoundEvent) {
        window.shotsBoard.roundStart(event.number)
    })

    window.socket.on("game_result", function(event: GameResultEvent) {
        switch (event.result) {
            case GameResult.win:
                alert("Congratulations, you won!")
                break
            case GameResult.defeat:
                for (const u in event.opponent_ships) {
                    const upd =  event.opponent_ships[u]
                    window.shotsBoard.grid.getCell(new Position(upd.col, upd.row)).setType(Cell.CELL_TYPE_SHIP)
                }
                window.render.refreshGrid(document.getElementById("shots-board"), window.shotsBoard)
                alert("Defeat")
                break
            case GameResult.draw:
                alert("Draw")
                break
            default:
                throw new Error(`Unknown game result '${event.result}'`)
        }
    })
}