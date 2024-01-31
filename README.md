# Spelunky 2 API

Unofficial Spelunky 2 API

## Installation

```bash
npm i spelunky2
```

## Features

- create online lobby
- join online lobby
- fetch leaderboard

## Usage

```ts
import { GameMode, Platform, PlayerCharacter, ReadyState, Spelunky2Client } from 'spelunky2';

const client = new Spelunky2Client;

async function main() {
    const player = {
        platform: Platform.NONE,
        id: 0x7777777777777777n,
        name: 'Player 1',
        gameMode: GameMode.CO_OP,
        character: PlayerCharacter.YELLOW,
        readyState: ReadyState.NOT_READY,
    };
    const lobby1 = await client.createOnlineLobby(player);
    console.log('created lobby code: ' + lobby1.code);

    player.name = 'Player 2';
    
    const lobby2 = await client.joinOnlineLobby(lobby1.code, player);
    console.log('joined lobby code: ' + lobby2.code)
    console.log('players');
    for(const player of lobby2.players) {
        if(player === null) console.log('  ㄴ(empty slot)')
        else console.log('  ㄴ' + player.name);
    }

    lobby1.detach();
    lobby2.detach();

    const leaderboard = await client.getLeaderboard(2024, 1, 31);
    let max_score = leaderboard[0].score;
    for(const entry of leaderboard) {
        if(entry.score > max_score) max_score = entry.score;
    }
    console.log('max score at 2024/01/31 is : ' + max_score);
}

main()
    .catch((err) => {
        console.error(err);
    });

/*
output:
created lobby code: A70C1F7F(example)
joined lobby code: A70C1F7F
players
  ㄴPlayer 1
  ㄴPlayer 2
  ㄴ(empty slot)
  ㄴ(empty slot)
max score at 2024/01/31 is : 1412945
*/
```