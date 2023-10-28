import { body, oneOf } from 'express-validator'
import Settings from './Settings'

export const GameCreateValidator = [
    body('cols', 'Grid columns is required parameter').not().isEmpty(),
    body('cols', 'Grid columns value must be between 0 and 20').isInt({ min: 0, max: 20 }),
    body('rows', 'Grid rows is required parameter').not().isEmpty(),
    body('rows', 'Grid rows value must be between 0 and 20').isInt({ min: 0, max: 20 }),
    body('carrier').not().isEmpty(),
    body('carrier').isInt({ min: 0, max: 10 }),
    body('battleship').not().isEmpty(),
    body('battleship').isInt({ min: 0, max: 10 }),
    body('destroyer').not().isEmpty(),
    body('destroyer').isInt({ min: 0, max: 10 }),
    body('patrolboat').not().isEmpty(),
    body('patrolboat').isInt({ min: 0, max: 10 }),
    oneOf([
        body('carrier').isInt({ min: 1}),
        body('battleship').isInt({ min: 1}),
        body('destroyer').isInt({ min: 1}),
        body('patrolboat').isInt({ min: 1}),
    ], {
        message: 'There should be at least one ship',
    }),
    body('mode').isIn([Settings.GAME_MOEDE_CLASSIC, Settings.GAME_MOEDE_CUSTOM]),
    body('type').isIn([
        Settings.GAME_TYPE_SINGLE,
        Settings.GAME_TYPE_MULTIPLAYER_PUBLIC,
        Settings.GAME_TYPE_MULTIPLAYER_PRIVATE
    ]),
]