import { describe, it } from 'node:test'
import Game from '../src/server/Game'
import Player from '../src/server/Player'
import Settings from '../src/server/Settings'
import Grid from '../src/server/Grid'
import Ship from '../src/common/Ship'
import Position from '../src/common/Position'
import ShipTypeFactory from '../src/common/ShipTypeFactory'
import { ShipType } from '../src/common/Enums'
const assert = require('node:assert')

describe('Game.joinPlayer() method test', () => {
    it('does not expose the bot as an opponent until its placement promise resolves', async () => {
        const settings = new Settings(
            3,
            3,
            Settings.GAME_TYPE_SINGLE,
            Settings.GAME_MOEDE_CLASSIC,
            [ShipTypeFactory.getType(ShipType.PatrolBoat)]
        )
        const fallbackShip = new Ship(new Position(0, 0), true, ShipTypeFactory.getType(ShipType.PatrolBoat))
        const game = new Game('test-game', 1, settings, [fallbackShip])

        const player = new Player('player-1', Grid.initGrid(3, 3), [
            new Ship(new Position(1, 1), true, ShipTypeFactory.getType(ShipType.PatrolBoat)),
        ])

        const joinCompleted = game.joinPlayer(player)

        // Regression guard for https://github.com/np25071984/battleships/issues/12 :
        // the bot placement is asynchronous, so right after joinPlayer() is called (and before its
        // returned promise resolves) the opponent must not appear to exist yet. If a caller doesn't
        // await the promise before deciding whether to start the game, it would incorrectly tell the
        // human player to wait forever since nothing re-checks opponent status afterwards.
        assert.strictEqual(
            game.doesOpponentExist(player.id),
            false,
            'the bot should not be considered joined before the returned promise resolves'
        )

        await joinCompleted

        assert.strictEqual(
            game.doesOpponentExist(player.id),
            true,
            'the bot should be joined once the returned promise resolves'
        )
        assert.strictEqual(game.getOpponent(player.id).id, 'bot')
    })

    it('resolves immediately for multiplayer games without adding a bot', async () => {
        const settings = new Settings(
            3,
            3,
            Settings.GAME_TYPE_MULTIPLAYER_PUBLIC,
            Settings.GAME_MOEDE_CLASSIC,
            [ShipTypeFactory.getType(ShipType.PatrolBoat)]
        )
        const game = new Game('test-game-multi', 1, settings, [])

        const player = new Player('player-1', Grid.initGrid(3, 3), [
            new Ship(new Position(1, 1), true, ShipTypeFactory.getType(ShipType.PatrolBoat)),
        ])

        await game.joinPlayer(player)

        assert.strictEqual(game.players.length, 1)
        assert.strictEqual(game.doesOpponentExist(player.id), false)
    })
})
