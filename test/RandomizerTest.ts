import { describe, it } from 'node:test'
import Randomizer from '../src/Server/Randomizer'
import ShipTypeFactory from '../src/common/ShipTypeFactory'
import Position from '../src/common/Position'
import Ship from '../src/common/Ship'
import ShipTypeAbstract from '../src/common/ShipTypeAbstract'
const assert = require('node:assert')

describe('Randomizer class test', () => {
    it('the only possible combination', async () => {
        const shipTypes: Array<ShipTypeAbstract> = [
            ShipTypeFactory.getType(4),
            ShipTypeFactory.getType(4),
            ShipTypeFactory.getType(3),
        ]

        const randomizer: Randomizer = new Randomizer(1000)
        await randomizer.findShipsCombination(6, 3, shipTypes).then((ships) => {
            if (ships === null) {
                throw new Error("findShipsCombination returned null")
            }
            assert.strictEqual(shipTypes.length, ships.length, `Unexpected ships amount: ${ships.length}`)

            ships.forEach((ship: Ship) => {
                if (ship.type.getSize() === 3) {
                    const expectedPositin = new Position(5, 0)
                    assert.strictEqual(expectedPositin.isEqual(ship.position), true)
                } else {
                    const expectedTopPositin = new Position(0, 0)
                    const expectedBottomPositin = new Position(0, 2)
                    assert.strictEqual(
                        expectedTopPositin.isEqual(ship.position) || expectedBottomPositin.isEqual(ship.position),
                        true,
                        `A ship is located into impossible position ${ship.position.col}x${ship.position.row}`
                    )
                }
            })
        })
    })

    it('one in a million combination', async () => {
        const shipTypes: Array<ShipTypeAbstract> = [
            ShipTypeFactory.getType(2),
            ShipTypeFactory.getType(2),
            ShipTypeFactory.getType(2),
            ShipTypeFactory.getType(2),
            ShipTypeFactory.getType(3),
            ShipTypeFactory.getType(3),
            ShipTypeFactory.getType(3),
            ShipTypeFactory.getType(4),
            ShipTypeFactory.getType(4),
            ShipTypeFactory.getType(5),
        ]

        const randomizer: Randomizer = new Randomizer(1000)
        await randomizer.findShipsCombination(20, 20, shipTypes).then((ships) => {
            if (ships === null) {
                throw new Error("findShipsCombination returned null")
            }
            assert.strictEqual(shipTypes.length, ships.length, `Unexpected ships amount: ${ships.length}`)
        })
    })

    it('impossible combination', async () => {
        const shipTypes: Array<ShipTypeAbstract> = [
            ShipTypeFactory.getType(4),
            ShipTypeFactory.getType(4),
            ShipTypeFactory.getType(3),
        ]

        const randomizer: Randomizer = new Randomizer(10)
        await randomizer.findShipsCombination(5, 3, shipTypes).then((ships) => {
            assert.strictEqual(ships, null, "findShipsCombination method returned not null")
        })
    })
})