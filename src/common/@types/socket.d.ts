type ConnectedEvent = {
    playerId: string
}

type GameResultEvent = {
    'result': string
    'playerId': string
    'opponent_ships'?: Object
}

type ShotResultEvent = {
    'playerId': string
    'result': number
    'shots_updates': Object
    'ships_updates': Object
    'size'?: number
}

type InitEvent = {
    'playerId': string
    'round': number
    'ships_grid': number[][]
    'shots_grid': number[][]
}

type RoundEvent = {
    "number": number
}

interface ServerToClientEvents {
    connected: (event: ConnectedEvent) => void
    game_result: () => void
    waiting:  () => void
    init: (event: InitEvent) => void
    round: (event: RoundEvent) => void
}

type ShotEvent = {
    gameId: string
    playerId: string
    col: number
    row: number
}

type JoinedEvent = {
    playerId: string
}

type LeftEvent = {
    playerId: string
}

interface ClientToServerEvents {
    disconnect: () => void
    shot: (event: ShotEvent) => void
    joined: (event: JoinedEvent) => void
    left: (event: LeftEvent) => void
}

export {
    ConnectedEvent,
    ServerToClientEvents,
    ShotEvent,
    JoinedEvent,
    ClientToServerEvents,
    LeftEvent,
    GameResultEvent,
    ShotResultEvent,
    InitEvent,
    RoundEvent
}