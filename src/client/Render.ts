import Cell from './Cell'
import Position from '../common/Position'
import Ship from './Ship'
import ShipSection from '../common/ShipSection'
import Board from './Board'

class Render {
    public static readonly COLOR_FOG_OF_WAR: string = '#ffffff'
    public static readonly COLOR_HOVER: string = '#90d3de'
    public static readonly COLOR_SHIP: string = '#6ce6b7'
    public static readonly COLOR_SHIP_SELECTED: string = 'orange'
    public static readonly COLOR_WRACKAGE: string = '#fcc786'
    public static readonly COLOR_CLICKED: string = '#7daffa'
    public static readonly COLOR_WATER: string = '#e8faf7'
    public static readonly COLOR_SHADOW: string = 'gray'

    drawEmptyBoard(canvas: HTMLCanvasElement, board: Board) {
        const context = canvas.getContext("2d")
        if (!context) {
            throw Error("Can't get context")
        }
        context.clearRect(board.rect.ltPoint.x, board.rect.ltPoint.y, board.rect.getWidth(), board.rect.getHeight())

        // substrate
        context.beginPath()
        context.rect(board.rect.ltPoint.x, board.rect.ltPoint.y, board.rect.getWidth(), board.rect.getHeight())
        context.fillStyle = '#90d3de'
        context.fill()
        context.closePath()

        if (!board.getIsReady()) {
            context.beginPath()
            const cellWidth = board.rect.getWidth() / board.grid.cols
            const fontWidth = Math.round(cellWidth / 2)
            context.font = `${fontWidth}px serif`
            context.fillStyle = '#000000'
            context.textBaseline = 'middle'
            context.textAlign = "center"
            context.fillText("Loading..." , board.rect.ltPoint.x + (board.rect.getWidth() / 2), board.rect.ltPoint.y + (board.rect.getHeight() / 2))
            context.closePath()
        }

        if (board.showAgenda) {
            this.drawAgenda(canvas, board)
        }
    }

    drawAgenda(canvas: HTMLCanvasElement, board: Board) {
        const context = canvas.getContext("2d")
        if (!context) {
            throw Error("Can't get context")
        }

        const cellWidth = board.rect.getWidth() / board.grid.cols

        context.beginPath()
        context.fillStyle = '#000000'
        context.font = `${board.fontSize}px serif`
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        for (var i = 0; i < board.grid.rows; i++) {
            const label = String.fromCharCode(97 + i).toUpperCase()
            const curShift = board.rect.ltPoint.y + cellWidth*i + cellWidth/2
            context.fillText(label, board.rect.ltPoint.x - board.fontSize/2 - 2, curShift)
        }
        context.closePath()

        context.beginPath()
        context.textBaseline = 'bottom'
        for (var i = 0; i < board.grid.cols; i++) {
            const curShift = board.rect.ltPoint.x + cellWidth*i + cellWidth/2 + board.fontSize/2
            context.fillText((i + 1).toString(), curShift, board.rect.ltPoint.y)
        }
        context.closePath()
    }

    refreshGrid(canvas: HTMLCanvasElement, board: Board) {
        if (!board.getIsReady()) {
            this.drawEmptyBoard(canvas, board)
            return
        }

        if (window.shadeShip) {
            for (var r = 0; r < board.grid.rows; r++) {
                for (var c = 0; c < board.grid.cols; c++) {
                    const pos = new Position(c, r)
                    const cell = board.grid.getCell(pos)
                    cell.setType(Cell.CELL_TYPE_FOG_OF_WAR)
                }
            }
        }

        if (board.grid.ships) {
            board.grid.ships.forEach((ship: Ship) => {
                ship.sections.forEach((section: ShipSection) => {
                    const type = ship.isSelected() ? Cell.CELL_TYPE_SHIP_SELECTED : Cell.CELL_TYPE_SHIP
                    board.grid.getCell(section.position).setType(type)
                })
            })
        }

        if (window.shadeShip) {
            const canPlace: boolean = board.grid.canPlace(window.shadeShip)
            const type: number = canPlace ? Cell.CELL_TYPE_SHADOW : Cell.CELL_TYPE_WRACKAGE
            window.shadeShip.sections.forEach((section: ShipSection) => {
                if (!board.grid.doesCellExist(section.position)) {
                    return
                }

                board.grid.getCell(section.position).setType(type)
            })
        }

        this.render(canvas, board)
    }

    private render(canvas: HTMLCanvasElement, board: Board) {
        const context = canvas.getContext("2d")
        if (!context) {
            throw Error("Can't get context")
        }

        for (var r = 0; r < board.grid.rows; r++) {
            for (var c = 0; c < board.grid.cols; c++) {
                const pos = new Position(c, r)
                const cell: Cell = this.getClientCell(board, pos)
                if (!cell.isChanged()) {
                    continue
                }
                context.beginPath()
                context.rect(cell.rect.ltPoint.x, cell.rect.ltPoint.y, cell.rect.getWidth(), cell.rect.getHeight())
                context.fillStyle = this.getCellColor(cell)
                context.fill()
                context.closePath()
                cell.save()
            }
        }
    }

    private getClientCell(board: Board, pos: Position): Cell {
        const cell = board.grid.getCell(pos)
        if (!(cell instanceof Cell)) {
            throw new Error("Unexpected Cell type")
        }

        return cell
    }

    private getCellColor(cell: Cell) {
        switch (cell.getType()) {
            case Cell.CELL_TYPE_FOG_OF_WAR:
                return cell.isHover ? Render.COLOR_HOVER : Render.COLOR_FOG_OF_WAR;
            case Cell.CELL_TYPE_SHIP:
                return Render.COLOR_SHIP;
            case Cell.CELL_TYPE_SHIP_SELECTED:
                return Render.COLOR_SHIP_SELECTED
            case Cell.CELL_TYPE_WRACKAGE:
                return Render.COLOR_WRACKAGE;
            case Cell.CELL_TYPE_CLICKED:
                return Render.COLOR_CLICKED;
            case Cell.CELL_TYPE_WATER:
                return Render.COLOR_WATER;
            case Cell.CELL_TYPE_SHADOW:
                return Render.COLOR_SHADOW
                default:
                throw new Error('Unknown cell type');
        }
    }
}

export default Render