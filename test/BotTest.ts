import { describe, it } from 'node:test'
import Bot from './../src/server/Bot'
import Grid from './../src/server/Grid'
import Position from '../src/common/Position'
import Ship from './../src/common/Ship'
import ShipTypeAbstract from './../src/common/ShipTypeAbstract'
import ShipTypeFactory from './../src/common/ShipTypeFactory'

const assert = require('node:assert')

describe('Bot.makeShot() method test', () => {
    it('random cell was shot', async () => {
        const pos: Position = new Position(0, 0)
        const type: ShipTypeAbstract = ShipTypeFactory.getType(2)
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
})