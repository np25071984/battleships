import { describe, it } from 'node:test'
import ShipTypeAbstract from './../src/common/ShipTypeAbstract'
import ShipTypeFactory from './../src/common/ShipTypeFactory'
import { ShipType } from '../src/common/Enums'

const assert = require('node:assert')

describe('ShipTypeFactory test', () => {
    it('Carrier type', async () => {
        const carrierType: ShipTypeAbstract = ShipTypeFactory.getType(ShipType.Carrier)
        assert.strictEqual(carrierType.isCarrier(), true, "the type isn't a Carrier")
    })

    it('Battleship type', async () => {
        const battleshipType: ShipTypeAbstract = ShipTypeFactory.getType(ShipType.Battleship)
        assert.strictEqual(battleshipType.isBattleship(), true, "the type isn't a Battleship")
    })

    it('Destroyer type', async () => {
        const destroyerType: ShipTypeAbstract = ShipTypeFactory.getType(ShipType.Destroyer)
        assert.strictEqual(destroyerType.isDestroyer(), true, "the type isn't a Destroyer")
    })

    it('PatrolBoard type', async () => {
        const patrolBoardType: ShipTypeAbstract = ShipTypeFactory.getType(ShipType.PatrolBoat)
        assert.strictEqual(patrolBoardType.isPatrolBoat(), true, "the type isn't a PatrolBoard")
    })

    it('Invalid type', async () => {
        assert.throws(() => {
            const shipType: ShipTypeAbstract = ShipTypeFactory.getType(9999 as ShipType)
        }, "Somehow we were able to create unexisting ShipType 9999")
    })
})