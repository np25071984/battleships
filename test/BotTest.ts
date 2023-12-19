import { describe, it } from 'node:test'
import Bot from './../src/server/Bot'
import Grid from './../src/server/Grid'
import Position from '../src/common/Position'
import Ship from './../src/common/Ship'
import ShipTypeAbstract from './../src/common/ShipTypeAbstract'
import ShipTypeFactory from './../src/common/ShipTypeFactory'
import { ShipType } from '../src/common/Enums'
import ShotResult from './../src/common/ShotResult'
import Cell from './../src/common/Cell'

const assert = require('node:assert')

describe('Bot.makeShot() method test', () => {
    it('random cell was shot', async () => {
        const pos: Position = new Position(0, 0)
        const type: ShipTypeAbstract = ShipTypeFactory.getType(ShipType.PatrolBoat)
        const ship = new Ship(pos, true, type)

        const grid: Grid = Grid.initGrid(4, 4)
        const bot: Bot = new Bot('bot', grid, [ship])
        assert.strictEqual(
            false,
            1 in bot.shots,
            "The shots collection isn't empty after the bot has been created"
        )
        bot.makeShot(1)
        assert.strictEqual(true, 1 in bot.shots, "Unable to find shot position after shot has been made")

        const position: Position = bot.shots[1]
        assert.strictEqual(true, position.col < 4, `shot is outside the grid (column: ${position.col})`)
        assert.strictEqual(true, position.row < 4, `shot is outside the grid (row: ${position.row}`)
    })

    it('run out of cells', async () => {
        const pos: Position = new Position(0, 0)
        const type: ShipTypeAbstract = ShipTypeFactory.getType(ShipType.PatrolBoat)
        const ship = new Ship(pos, true, type)

        const grid: Grid = Grid.initGrid(4, 4)
        const bot: Bot = new Bot('bot', grid, [ship])

        var shotResult: ShotResult = new ShotResult(ShotResult.HIT_RESULT_MISS)
        const updates: any[] = []
        for (var c = 0; c < grid.cols; c++) {
            for (var r = 0; r < grid.rows; r++) {
                const u = {
                    'col': c,
                    'row': r,
                    'type': Cell.CELL_TYPE_WATER
                }
                updates.push(u)
            }
        }
        bot.syncDecisionBoard(shotResult, updates)

        assert.throws(() => {
            bot.makeShot(17)
        }, "Was able find an available option to make a shot on fully discovered board")
    })

    it('the only place to shot at', async () => {
        const pos: Position = new Position(2, 2)
        const type: ShipTypeAbstract = ShipTypeFactory.getType(ShipType.PatrolBoat)
        const ship = new Ship(pos, false, type)

        const grid: Grid = Grid.initGrid(4, 4)
        const bot: Bot = new Bot('bot', grid, [ship])

        var shotResult: ShotResult = new ShotResult(ShotResult.HIT_RESULT_DAMAGE)
        const updates: any[] = []
        for (var c = 0; c < grid.cols; c++) {
            for (var r = 0; r < grid.rows; r++) {
                if (c === 2 && r === 3) {
                    continue
                }
                const u = {
                    'col': c,
                    'row': r,
                    'type': (c === 2 && r === 2) ? Cell.CELL_TYPE_WRACKAGE : Cell.CELL_TYPE_WATER
                }
                updates.push(u)
            }
        }
        bot.syncDecisionBoard(shotResult, updates)

        bot.makeShot(16)
        const position: Position = bot.shots[16]
        assert.strictEqual(true, position.col === 2, `shot isn't in the only available column (actual: ${position.col})`)
        assert.strictEqual(true, position.row === 3, `shot isn't in the only available row (actual: ${position.row})`)
    })

    it('no place to shot at', async () => {
        const pos: Position = new Position(1, 0)
        const type: ShipTypeAbstract = ShipTypeFactory.getType(ShipType.PatrolBoat)
        const ship = new Ship(pos, false, type)

        const grid: Grid = Grid.initGrid(4, 4)
        const bot: Bot = new Bot('bot', grid, [ship])

        var shotResult: ShotResult = new ShotResult(ShotResult.HIT_RESULT_MISS)
        const updates: any[] = []
        for (var c = 0; c < grid.cols; c++) {
            // grid with odd end even discovered cells so that no way to fit 2x1 ship
            for (var r = (c % 2) === 0 ? 0 : 1; r < grid.rows; r += 2) {
                const u = {
                    'col': c,
                    'row': r,
                    'type': Cell.CELL_TYPE_WATER
                }
                updates.push(u)
            }
        }
        bot.syncDecisionBoard(shotResult, updates)

        assert.throws(() => {
            bot.makeShot(9)
        }, "Was able find an available option to make a shot when there are only 1x1 unexplored cells")

    })
})