import Cell from './Cell'

class Render {
    public static readonly COLOR_FOG_OF_WAR: string = '#ffffff';
    public static readonly COLOR_HOVER: string = '#90d3de';
    public static readonly COLOR_SHIP: string = 'green';
    public static readonly COLOR_WRACKAGE: string = 'red';
    public static readonly COLOR_CLICKED: string = 'blue';
    public static readonly COLOR_WATER: string = 'yellow';

    drawBoard(canvas, board) {
        const context = canvas.getContext("2d");
        context.clearRect(board.rect.ltPoint.x, board.rect.ltPoint.y, board.rect.getWidth(), board.rect.getHeight());
        
        // substrate
        context.beginPath();
        context.rect(board.rect.ltPoint.x, board.rect.ltPoint.y, board.rect.getWidth(), board.rect.getHeight());
        context.fillStyle = '#90d3de';
        context.fill();
        context.closePath();
    
        // grid
        for (const key in board.grid.cells) {
            const cell = board.grid.cells[key];
            context.beginPath();
            context.rect(cell.rect.ltPoint.x, cell.rect.ltPoint.y, cell.rect.getWidth(), cell.rect.getHeight());
            switch (cell.type) {
                case Cell.CELL_TYPE_FOG_OF_WAR:
                    context.fillStyle = cell.isHover ? '#90d3de' : '#ffffff';
                    break;
                case Cell.CELL_TYPE_SHIP:
                    context.fillStyle = '#7b99d1';
                    break;
                case Cell.CELL_TYPE_WRACKAGE:
                    context.fillStyle = 'red';
                    break;
                case Cell.CELL_TYPE_CLICKED:
                    context.fillStyle = 'blue';
                    break;
                case Cell.CELL_TYPE_WATER:
                    context.fillStyle = 'yellow';
                    break;
                }
            context.fill();
            context.closePath();
        };
    
        // agenda
        if (board.showAgenda) {
            const cellWidth = board.rect.getWidth() / board.grid.cols;
            const fontWidth = Math.round(cellWidth / 3);
    
            context.beginPath();
            context.fillStyle = '#000000';
            context.font = `${fontWidth}px serif`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            for (var i = 0; i < board.grid.rows; i++) {
                const label = String.fromCharCode(97 + i).toUpperCase();
                const curShift = board.rect.ltPoint.y + cellWidth*i + cellWidth/2;
                context.fillText(label, board.rect.ltPoint.x - fontWidth/2 - 2, curShift);
            }
            context.closePath();
    
            context.beginPath();
            context.textAlign = 'middle';
            context.textBaseline = 'bottom';
            for (var i = 0; i < board.grid.cols; i++) {
                const curShift = board.rect.ltPoint.x + cellWidth*i + cellWidth/2 + fontWidth/2;
                context.fillText(i + 1, curShift, board.rect.ltPoint.y);
            }
            context.closePath();
        }
    }

    refreshGrid(canvas, board) {
        const context = canvas.getContext("2d");
        for (const key in board.grid.cells) {
            const cell = board.grid.cells[key];
            if (!cell.changed) {
                continue;
            }
            context.beginPath();
            context.rect(cell.rect.ltPoint.x, cell.rect.ltPoint.y, cell.rect.getWidth(), cell.rect.getHeight());
            context.fillStyle = this.getCellColor(cell);
            context.fill();
            context.closePath();
            cell.changed = false;
            board.grid.cells[key] = cell;
        };
    }

    getCellColor(cell) {
        switch (cell.type) {
            case Cell.CELL_TYPE_FOG_OF_WAR:
                return cell.isHover ? Render.COLOR_HOVER : Render.COLOR_FOG_OF_WAR;
            case Cell.CELL_TYPE_SHIP:
                return Render.COLOR_SHIP;
            case Cell.CELL_TYPE_WRACKAGE:
                return Render.COLOR_WRACKAGE;
            case Cell.CELL_TYPE_CLICKED:
                return Render.COLOR_CLICKED;
            case Cell.CELL_TYPE_WATER:
                return Render.COLOR_WATER;
            default:
                throw new Error('Unknown cell type');
        }
    }
}

export default Render