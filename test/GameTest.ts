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

    it('rejects and rolls back the player when bot placement fails', async () => {
        // Same ships/grid as RandomizerTest.ts's "impossible combination" case: this combination can
        // never fit a 5x3 grid, so findShipsCombination() reliably resolves to null - regardless of
        // Game's own (much larger) maxIterations budget for this grid - and joinPlayer() falls back to
        // fallbackShipsConfiguration. Passing `null` there stands in for a broken fallback and makes
        // `new Bot(...)` throw (Player's constructor reads `ships.length`), which is the unhandled
        // rejection that could hang the /join request forever.
        const settings = new Settings(
            5,
            3,
            Settings.GAME_TYPE_SINGLE,
            Settings.GAME_MOEDE_CLASSIC,
            [
                ShipTypeFactory.getType(ShipType.Battleship),
                ShipTypeFactory.getType(ShipType.Battleship),
                ShipTypeFactory.getType(ShipType.Destroyer),
            ]
        )
        const game = new Game('test-game-broken-fallback', 1, settings, null)

        const player = new Player('player-1', Grid.initGrid(5, 3), [
            new Ship(new Position(0, 0), true, ShipTypeFactory.getType(ShipType.PatrolBoat)),
        ])

        await assert.rejects(() => game.joinPlayer(player))

        assert.strictEqual(
            game.doesPlayerExist(player.id),
            false,
            'the player should be rolled back when bot placement fails'
        )
    })
})
