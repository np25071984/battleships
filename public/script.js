window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('playerId');

    const d = new Date();
    d.setTime(d.getTime() + (1*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = "playerId=" + playerId + ";" + expires + ";path=/";

    window.socket = io();
    window.socketId = undefined;
    window.socket.on(Event.EVENT_CHANNEL_NAME_SYSTEM, function(event) {
        switch (event.type) {
            case Event.EVENT_TYPE_CONNECTED:
                console.log(`We are connected to the server (socketId: ${event.socketId})`);
                window.socketId = event.socketId;
                break;
            default:
                throw new Error(`Unknown system event type(${event.type})`);
        }
    });

    window.render = new Render();
    const actionCanvas = document.getElementById("action-board");
    const sheepsCanvas = document.getElementById("my-ships");

    const startPoint = new Point(40, 40);
    const actionBoard = Board.initBoard(startPoint, 40, 1, 10, 10, [], true);
    window.render.drawBoard(actionCanvas, actionBoard);

    const shipsBoard = Board.initBoard(startPoint, 40, 1, 10, 10, true);
    const ships = shuffleShips();
    shipsBoard.placeShips(ships);
    window.render.drawBoard(sheepsCanvas, shipsBoard);

    window.socket.on(Event.EVENT_CHANNEL_NAME_GAME, function(event) {
        switch (event.type) {
            case Event.EVENT_TYPE_WAITING:
                console.log(`Waiting for the second player`);
                break;
            case Event.EVENT_TYPE_JOINED:
                console.log(`Player ${event.socketId} has joined the game`);
                break;
            case Event.EVENT_TYPE_LEFT:
                console.log(`Player ${event.socketId} has left the game`);
                break;
            case Event.EVENT_TYPE_HIT:
                console.log(`Hit at ${event.col} x ${event.row}`);
                var pos = new Position(event.col, event.row);
                shipsBoard.hit(pos);
                window.render.refreshGrid(sheepsCanvas, shipsBoard);
                break;
            case Event.EVENT_TYPE_ANNOUNCE:
                console.log(`Announce about ${event.col} x ${event.row}; there is ${event.result}`);
                var pos = new Position(event.col, event.row);
                switch (event.result) {
                    case HitResult.HIT_RESULT_MISS:
                        actionBoard.setCellType(pos, Cell.CELL_TYPE_WATER);
                        break;
                    case HitResult.HIT_RESULT_DAMAGE:
                        actionBoard.setCellType(pos, Cell.CELL_TYPE_WRACKAGE);
                        break;
                    case HitResult.HIT_RESULT_SUNK:
                        actionBoard.setCellType(pos, Cell.CELL_TYPE_WRACKAGE);
                        event.surround.forEach((pos) => {
                            actionBoard.setCellType(new Position(pos.col, pos.row), Cell.CELL_TYPE_WATER);
                        });
                        break;
                    default:
                        throw new Error(`Unknown hit result(${event.result})`);
                }
                window.render.refreshGrid(actionCanvas, actionBoard);
                break;
            case Event.EVENT_TYPE_ROUND:
                console.log("Round");
                actionBoard.roundStart(event.number);
                break;
            case Event.EVENT_TYPE_WIN:
                console.log("Win");
                actionBoard.setActive(false);
                break;
            case Event.EVENT_TYPE_LOST:
                console.log("Lost");
                actionBoard.setActive(false);
                break;
            default:
                console.dir(event);
                throw new Error(`Unknown game event type(${event.type})`);
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
    // var c = new Position(2, 0);
    // var s = new Ship(c, Ship.SHIP_ORIENTATION_VERTICAL, battleShipType);
    // ships.push(s);
    var c = new Position(4, 0);
    var s = new Ship(c, Ship.SHIP_ORIENTATION_VERTICAL, destroyerShipType);
    ships.push(s);
    // var c = new Position(6, 0);
    // var s = new Ship(c, Ship.SHIP_ORIENTATION_VERTICAL, submarineShipType);
    // ships.push(s);
    var c = new Position(8, 0);
    var s = new Ship(c, Ship.SHIP_ORIENTATION_VERTICAL, patrolBoatShipType);
    ships.push(s);
    // var c = new Position(0, 6);
    // var s = new Ship(c, Ship.SHIP_ORIENTATION_HORIZONTAL, patrolBoatShipType);
    // ships.push(s);
    // var c = new Position(3, 6);
    // var s = new Ship(c, Ship.SHIP_ORIENTATION_HORIZONTAL, battleShipType);
    // ships.push(s);

    return ships;
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Rect {
    constructor(ltPoint, rbPoint) {
        this.ltPoint = ltPoint;
        this.rbPoint = rbPoint;
    }

    getWidth() {
        return this.rbPoint.x - this.ltPoint.x;
    }

    getHeight() {
        return this.rbPoint.y - this.ltPoint.y;
    }
}

class Position
{
    constructor(col, row) {
        this.col = col;
        this.row = row;
    }

    isEqual(position) {
        if (position.col !== this.col) {
            return false;
        }

        if (position.row !== this.row) {
            return false;
        }

        return true;
    }

    generateKey() {
        return `${this.col}_${this.row}`;
    }

    getSurraund() {
        const res = {};
        var p = new Position(this.col, this.row - 1);
        res[p.generateKey()] = p;
        var p = new Position(this.col + 1, this.row - 1);
        res[p.generateKey()] = p;
        var p = new Position(this.col + 1, this.row);
        res[p.generateKey()] = p;
        var p = new Position(this.col + 1, this.row + 1);
        res[p.generateKey()] = p;
        var p = new Position(this.col, this.row + 1);
        res[p.generateKey()] = p;
        var p = new Position(this.col - 1, this.row + 1);
        res[p.generateKey()] = p;
        var p = new Position(this.col - 1, this.row);
        res[p.generateKey()] = p;
        var p = new Position(this.col - 1, this.row - 1);
        res[p.generateKey()] = p;

        return res;
    }
}

class Board
{
    constructor(outerRect, grid, showAgenda) {
        this.round = undefined;
        this.active = false;
        this.rect = outerRect;
        this.grid = grid;
        this.ships = [];
        this.showAgenda = showAgenda;
    }

    hit(position) {
        var moreShips = true;
        var ship = undefined;
        for (var i = 0; i < this.ships.length; i++) {
            const s = this.ships[i];
            if (s.isLocatedAt(position)) {
                ship = s
                break;
            }
        }

        var hitResult = undefined;
        var sunkShipSurround = [];
        if (ship === undefined) {
            hitResult = HitResult.HIT_RESULT_MISS;
            this.setCellType(position, Cell.CELL_TYPE_WATER);    
        } else {
            hitResult = ship.hit(position);
            this.setCellType(position, Cell.CELL_TYPE_WRACKAGE);
            if (hitResult === HitResult.HIT_RESULT_SUNK) {
                const surround = ship.getSurraund();
                for (const key in surround) {
                    const position = surround[key];
                    if (this.grid.cellExists(position)) {
                        sunkShipSurround.push(position);
                        this.setCellType(position, Cell.CELL_TYPE_WATER);
                    }
                };

                var isAlive = false;
                for (var i = 0; i < this.ships.length; i++) {
                    const s = this.ships[i];
                    if (s.alive) {
                        isAlive = true;
                        break;
                    }
                }
                moreShips = isAlive;        
            }
        }

        window.socket.emit('game', {
            'type': 'announce',
            'col': position.col,
            'row': position.row,
            'result': hitResult,
            'surround': sunkShipSurround,
            'moreShips': moreShips
        });
    }

    placeShips(ships) {
        this.ships = ships;
        this.ships.forEach(function(ship) {
            ship.sections.forEach(function(section) {
                const key = `${section.position.col}_${section.position.row}`;
                if (!(key in this.grid.cells)) {
                    return;
                }
                const cell = this.grid.cells[key];
                cell.type = section.isAlive ? Cell.CELL_TYPE_SHIP : Cell.CELL_TYPE_WRACKAGE;
                this.grid.cells[key] = cell;
            }, this);
        }, this);
    }

    mouseMove(point) {
        if (this.active) {
            this.grid.mouseMove(point);
        }
    }

    mouseClick(point) {
        if (this.active) {
            this.grid.mouseClick(point);
            this.active = false;
        }
    }

    roundStart(number) {
        this.active = true;
        this.round = number;
    }

    setCellType(position, cellType) {
        this.grid.setCellType(position, cellType)
    }

    setActive(isActive) {
        this.active = isActive;
    }

    static initBoard(ltPoint, width, gap, col, row, showAgenda) {
        // TODO: col,row max value
        const xSt = ltPoint.x + gap;
        const ySt = ltPoint.y + gap;
        const step = width + gap;
        const totalWidth = gap + (step * col);
        const totalHeight = gap + (step * row);
    
        const cells = {};
        var positionY = 0;
        for (var y = ySt; y < ltPoint.y + totalHeight; y += step) {
            var positionX = 0;
            for (var x = xSt; x < ltPoint.x + totalWidth; x += step) {
                const ltP = new Point(x, y);
                const pos = new Position(positionX, positionY);
                const key = `${positionX}_${positionY}`;
                const rbP = new Point(x + width, y + width);
                const outerRect = new Rect(ltP, rbP);
                cells[key] = new Cell(outerRect, pos, false, Cell.CELL_TYPE_FOG_OF_WAR, false);
                positionX++;
            }
            positionY++;
        }
    
        const grid = new Grid(cells, col, row);
        const rbPoint = new Point(ltPoint.x + totalWidth, ltPoint.y + totalHeight);
        const boardOuterRect = new Rect(ltPoint, rbPoint);
        const board = new Board(boardOuterRect, grid, showAgenda);
    
        return board;
    }
}

class Grid
{
    constructor(cells, cols, rows) {
        this.cells = cells;
        this.rows = rows;
        this.cols = cols;
    }

    mouseMove(point) {
        for (const key in this.cells) {
            const cell = this.cells[key];
            cell.mouseMove(point);
        }
    }

    mouseClick(point) {
        for (const key in this.cells) {
            const cell = this.cells[key];
            cell.mouseClick(point);
        }
    }

    getCell(position) {
        const key = position.generateKey();
        return this.cells[key];
    }

    setCellType(position, cellType) {
        const key = position.generateKey();
        if (this.cells[key].type !== cellType) {
            this.cells[key].type = cellType;
            this.cells[key].changed = true;
        }
    }

    cellExists(position) {
        const key = position.generateKey();
        return key in this.cells;
    }
}

class Cell
{
    constructor(outerRect, position, isHover, type, changed) {
        this.rect = outerRect;
        this.position = position;
        this.isHover = isHover;
        this.type = type;
        this.changed = changed;
    }

    isInside(point) {
        if (point.x < this.rect.ltPoint.x) {
            return false;
        }
    
        if (point.x > this.rect.rbPoint.x) {
            return false;
        }
    
        if (point.y < this.rect.ltPoint.y) {
            return false;
        }
    
        if (point.y > this.rect.rbPoint.y) {
            return false;
        }
    
        return true;
    }

    mouseMove(point) {
        if (this.isInside(point)) {
            if (!this.isHover) {
                this.isHover = true;
                this.changed = true;
            }
        } else {
            if (this.isHover) {
                this.isHover = false;
                this.changed = true;
            }
        }
    }

    mouseClick(point) {
        if (!this.isInside(point)) {
            return;
        }

        if (this.type === Cell.CELL_TYPE_CLICKED) {
            return;
        }

        this.type = Cell.CELL_TYPE_CLICKED;
        this.changed = true;

        window.socket.emit('game', {
            'type': 'shot',
            'col': this.position.col,
            'row': this.position.row,
            'socketId': window.socketId
        });
    }

    hit(position) {
        const key = position.generateKey();
        const cell = this.cells[key];
        switch (cell.type) {
            case Cell.CELL_TYPE_SHIP:
                cell.type = Cell.CELL_TYPE_WRACKAGE;
                break;
            case Cell.CELL_TYPE_FOG_OF_WAR:
                cell.type = Cell.CELL_TYPE_WATER;
        }
        cell.changed = true;
        this.cells[key] = cell;
    }
}

Object.defineProperty(Cell, "CELL_TYPE_FOG_OF_WAR", {
    value: 1,
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Cell, "CELL_TYPE_WATER", {
    value: 2,
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Cell, "CELL_TYPE_SHIP", {
    value: 3,
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Cell, "CELL_TYPE_WRACKAGE", {
    value: 4,
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Cell, "CELL_TYPE_CLICKED", {
    value: 5,
    writable: false,
    enumerable: true,
    configurable: true
});

class ShipTypeCarrier {
    getSize() {
        return 5;
    }
}

class ShipTypeBattleShip {
    getSize() {
        return 4;
    }
}

class ShipTypeDestroyer {
    getSize() {
        return 3;
    }
}

class ShipTypeSubmarine {
    getSize() {
        return 3;
    }
}

class ShipTypePatrolBoat {
    getSize() {
        return 2;
    }
}

class Ship 
{
    constructor(position, orientation, type) {
        this.liveSectionCount = type.getSize();
        this.position = position;
        this.orientation = orientation;
        this.alive = true;
        this.sections = []; // TODO: hashed array
        for (var i = 0; i < type.getSize(); i++) {
            switch (orientation) {
                case Ship.SHIP_ORIENTATION_VERTICAL:
                    var c = new Position(position.col, position.row + i);
                    break;
                case Ship.SHIP_ORIENTATION_HORIZONTAL:
                    var c = new Position(position.col + i, position.row);
                    break;
                default:
                    throw new Error(`Unknown ship orientation(${orientation})`);
            }
            const s = new ShipSection(c, true);
            this.sections.push(s);
        }
    }

    isLocatedAt(position) {
        for (var i = 0; i < this.sections.length; i++) {
            const section = this.sections[i];
            if (section.isLocatedAt(position)) {
                return true;
            };
        }

        return false;
    }

    hit(position) {
        for (var i = 0; i < this.sections.length; i++) {
            const section = this.sections[i];
            if (section.isLocatedAt(position)) {
                this.sections[i].isAlive = false;
                this.liveSectionCount--;
                if (this.liveSectionCount === 0) {
                    this.alive = false;
                    return HitResult.HIT_RESULT_SUNK;
                } else {
                    return HitResult.HIT_RESULT_DAMAGE;
                }
            };
        }
    }

    getSurraund() {
        const res = {};
        for (var i = 0; i < this.sections.length; i++) {
            const section = this.sections[i];
            const surround = section.position.getSurraund();
            for (const key in surround) {
                const s = surround[key];
                if(!(key in res) && !this.isLocatedAt(s)) {
                    res[key] = s;
                }
            }
        }
        return res;
    }
}

Object.defineProperty(Ship, "SHIP_ORIENTATION_VERTICAL", {
    value: 1,
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Ship, "SHIP_ORIENTATION_HORIZONTAL", {
    value: 2,
    writable: false,
    enumerable: true,
    configurable: true
});

class ShipSection
{
    constructor(position, isAlive) {
        this.position = position;
        this.isAlive = isAlive;
    }

    isLocatedAt(position) {
        if (this.position.isEqual(position)) {
            return true;
        }

        return false;
    }
}

class Render {
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
            cell.change = false;
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

Object.defineProperty(Render, "COLOR_FOG_OF_WAR", {
    value: '#ffffff',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Render, "COLOR_HOVER", {
    value: '#90d3de',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Render, "COLOR_SHIP", {
    value: '#7b99d1',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Render, "COLOR_WRACKAGE", {
    value: 'red',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Render, "COLOR_CLICKED", {
    value: 'blue',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Render, "COLOR_WATER", {
    value: 'yellow',
    writable: false,
    enumerable: true,
    configurable: true
});

class HitResult {}

Object.defineProperty(HitResult, "HIT_RESULT_MISS", {
    value: 1,
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(HitResult, "HIT_RESULT_DAMAGE", {
    value: 2,
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(HitResult, "HIT_RESULT_SUNK", {
    value: 3,
    writable: false,
    enumerable: true,
    configurable: true
});

class Event {}

Object.defineProperty(Event, "EVENT_CHANNEL_NAME_SYSTEM", {
    value: 'system',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Event, "EVENT_CHANNEL_NAME_GAME", {
    value: 'game',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Event, "EVENT_TYPE_CONNECTED", {
    value: 'connected',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Event, "EVENT_TYPE_WAITING", {
    value: 'waiting',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Event, "EVENT_TYPE_JOINED", {
    value: 'joined',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Event, "EVENT_TYPE_LEFT", {
    value: 'left',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Event, "EVENT_TYPE_HIT", {
    value: 'hit',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Event, "EVENT_TYPE_ANNOUNCE", {
    value: 'announce',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Event, "EVENT_TYPE_ROUND", {
    value: 'round',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Event, "EVENT_TYPE_WIN", {
    value: 'win',
    writable: false,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Event, "EVENT_TYPE_LOST", {
    value: 'lost',
    writable: false,
    enumerable: true,
    configurable: true
});