# Battleships

> Battleships (also known as Battleship or Sea Battle) is a strategy type guessing game for two players. It is played on ruled grids (paper or board) on which each player's fleet of warships are marked. The locations of the fleets are concealed from the other player. Players alternate turns calling "shots" at the other player's ships, and the objective of the game is to destroy the opposing player's fleet.
> --  <cite>[Wikipedia](https://en.wikipedia.org/wiki/Battleship_(game))</cite>

It is hosted at http://ec2-18-217-5-14.us-east-2.compute.amazonaws.com:3000

## Rules

* two players
* there should be at least one cell gap between ships
* the ships combination (number and types) is the same for each player
* both players make a shot each round; there isn't the first and the last who shot

## Game navigation

```mermaid
---
title: Game navigation
---
flowchart LR
    menu{Game menu} --> create[Create game page]
    menu{Game menu} --> select[Select game page]
    create -->|gameId| join
    select -->|gameId| join
    join[Join game page]
    join -->|gameId, playerId| game

```

Main menu offers two options:
* Create game - create new game with desirable settings
* Join game - join an existing game which was created by somebody else

## Create game page

### Game types
* single game - game with a AI
* multiplayer - game with another person
    * public - this game will appear on "Join game" page
    * private - this game won't be visible on "Join game" page

### Game settings

You can choose between hardcoded and custom game settings values

* board size
* ships configuration - how many and which ships will be in the game

#### Ship types

| Ship | Size |
| -------- | ------- |
| Carrier | 5 |
| Battleship | 4 |
| Destroyer | 3 |
| Patrol Boat | 2 |

[//]: # (do we need mine? the lucky may unveil 8 cells at once)

## Join game page

Once the game was created it is known information which ships are there and the board size. It is time to put the ships in place. You can move them around the board and rotate. Also `Shuffle` feature is available which lets to get randomly placed ships.

## Gameflow

```mermaid
sequenceDiagram
    actor Client1
    participant Server
    actor Client2
    Client1->>Server: Connect event
    Server-->>Client1: EVENT_TYPE_CONNECTED
    Server-->>Client1: EVENT_TYPE_WAITING
    Client2->>Server: Connect event
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
* Disable Rotate button when it isn't possible to rotate the ship
* Improve AI (make shots into intersections which have most ship probability)
* Implement round timer (?)
* Add Restart Game feature (?)
* Use permanent storage (?)

## Terminology

* ships board - board where player's ships and opponent's shots are shown
* shots board - board where a player makes shots on
* round - game phase when both players make shots
* announce - game phase when both players get their shot result in current round
