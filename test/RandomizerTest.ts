import { describe, it } from 'node:test'
import Randomizer from '../src/server/Randomizer'
import ShipTypeFactory from '../src/common/ShipTypeFactory'
import Position from '../src/common/Position'
import Ship from '../src/common/Ship'
import ShipTypeAbstract from '../src/common/ShipTypeAbstract'
const assert = require('node:assert')
import { ShipType } from './../src/common/Enums'

describe('Randomizer class test', () => {
    it('the only possible combination', async () => {
        const shipTypes: Array<ShipTypeAbstract> = [
            ShipTypeFactory.getType(ShipType.Battleship),
            ShipTypeFactory.getType(ShipType.Battleship),
            ShipTypeFactory.getType(ShipType.Destroyer),
        ]

        const randomizer: Randomizer = new Randomizer(1000)
        await randomizer.findShipsCombination(6, 3, shipTypes).then((ships) => {
            if (ships === null) {
                throw new Error("findShipsCombination returned null")
            }
            assert.strictEqual(ships.length, shipTypes.length, `Unexpected ships amount: ${ships.length}`)

            ships.forEach((ship: Ship) => {
                if (ship.type.isDestroyer()) {
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
            ShipTypeFactory.getType(ShipType.PatrolBoat),
            ShipTypeFactory.getType(ShipType.PatrolBoat),
            ShipTypeFactory.getType(ShipType.PatrolBoat),
            ShipTypeFactory.getType(ShipType.PatrolBoat),
            ShipTypeFactory.getType(ShipType.Destroyer),
            ShipTypeFactory.getType(ShipType.Destroyer),
            ShipTypeFactory.getType(ShipType.Destroyer),
            ShipTypeFactory.getType(ShipType.Battleship),
            ShipTypeFactory.getType(ShipType.Battleship),
            ShipTypeFactory.getType(ShipType.Carrier),
        ]

        const randomizer: Randomizer = new Randomizer(1000)
        await randomizer.findShipsCombination(20, 20, shipTypes).then((ships) => {
            if (ships === null) {
                throw new Error("findShipsCombination returned null")
            }
            assert.strictEqual(ships.length, shipTypes.length, `Unexpected ships amount: ${ships.length}`)
        })
    })

    it('impossible combination', async () => {
        const shipTypes: Array<ShipTypeAbstract> = [
            ShipTypeFactory.getType(ShipType.Battleship),
            ShipTypeFactory.getType(ShipType.Battleship),
            ShipTypeFactory.getType(ShipType.Destroyer),
        ]

        const randomizer: Randomizer = new Randomizer(10)
        await randomizer.findShipsCombination(5, 3, shipTypes).then((ships) => {
            assert.strictEqual(ships, null, "findShipsCombination method returned not null")
        })
    })
})