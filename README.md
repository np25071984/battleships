# Battleships

> Battleships (also known as Battleship or Sea Battle) is a strategy type guessing game for two players. It is played on ruled grids (paper or board) on which each player's fleet of warships are marked. The locations of the fleets are concealed from the other player. Players alternate turns calling "shots" at the other player's ships, and the objective of the game is to destroy the opposing player's fleet.
> --  <cite>[Wikipedia](https://en.wikipedia.org/wiki/Battleship_(game))</cite>

## Rules

* two players
* there should be at least one cell gap between ships
* the ships combination is the same for each player
* each round lasts a given amount of time
* both players make a shot each round; there isn't first or last shot; there is only round shot
* if a player run out of time they skip the round

## Game navigation

```mermaid
---
title: Game navigation
---
flowchart LR
    menu{Game menu} -->|Create game| create[Create page]
    menu{Game menu} -->|Join game| select[Select page]
    create -->|gameId| join
    select -->|gameId| join
    join[Join page]
    join -->|gameId, playerId| game

```

Main menu offers two options:
* Create game - create new game with desirable settings
* Join game - join an existing game

## Game setting

* visibility (public/private)
* board size
* ships configuration
* round timeout

## Ship types

| Ship | Size |
| -------- | ------- |
| Carrier | 5 |
| Battleship | 4 |
| Destroyer | 3 |
| Submarine | 3 |
| Patrol Boat | 2 |

[//]: # (do we need mine? the lucky may unveil 8 cells at once)
[//]: # (why Destroyer and Submarine simultaneously?)

## Gameflow


```mermaid
sequenceDiagram
    actor Client1
    participant Server
    actor Client2
    Client1->>Server: Open up the game page (gameId, playerId)
    Server-->>Client1: EVENT_TYPE_CONNECTED
    Server-->>Client1: EVENT_TYPE_WAITING
    Client2->>Server: Open up the game page (gameId, playerId)
    Server-->>Client2: EVENT_TYPE_CONNECTED
    Server->>Client1: EVENT_TYPE_JOINED (playerId)
    par
        Server->>Client1: EVENT_TYPE_INIT (game data)
        Server->>Client2: EVENT_TYPE_INIT (game data)
    end
    Note over Client1, Client2: both players are connected and set up
    par
        Server->>Client1: EVENT_TYPE_ROUND (number)
        Server->>Client2: EVENT_TYPE_ROUND (number)
    end
    opt Lost connection (any player)
        Server->>Client2: ping
        Client2-->>Server: no response
        Server->>Client1: EVENT_TYPE_LEFT
        Client2->>Server: Open up the game page (gameId, playerId)
        Server-->>Client2: EVENT_TYPE_CONNECTED
        Server->>Client1: EVENT_TYPE_JOINED (playerId)
        Server-->Client2: EVENT_TYPE_INIT (game data)
    end
    par Client shots
        Client1->>Server: EVENT_TYPE_SHOT
    and
        Client2->>Server: EVENT_TYPE_SHOT
    end
    par
        Server-->>Client1: EVENT_TYPE_ANNOUNCE
        Server-->>Client2: EVENT_TYPE_ANNOUNCE
    end
    Note over Client1, Client2: repeate shots until one of the users has at least one alive ship
    alt No more ships for Client1
        Server->>Client1: GAME_RESULT_DEFEAT
        Server->>Client2: GAME_RESULT_WIN
    else No more ships for Client2
        Server->>Client1: GAME_RESULT_WIN
        Server->>Client2: GAME_RESULT_DEFEAT
    else No more ships for both players
        Server->>Client1: GAME_RESULT_DRAW
        Server->>Client2: GAME_RESULT_DRAW
    end
```

## TODO
* Improve AI
* Implement round timer (?)
* Add Restart Game feature (?)
* Use permanent storage (?)

## Terminology

* ships board - board where player's ships and opponent's shots are shown
* shots board - board where a player makes shots on
* round - game phase when both players make shots
* announce - game phase when both players get their shot result in current round