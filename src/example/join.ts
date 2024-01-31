import {Platform, OnlineLobbyPlayer, Spelunky2Client, GameMode, ReadyState, OnlineLobby} from '..';
import {PlayerCharacter} from '../constants';

const client = new Spelunky2Client;
const p1: OnlineLobbyPlayer = {
    platform: Platform.NONE,
    id: 0x7777777777777777n,
    name: '플레이어 1(Player 1)',
    gameMode: GameMode.CO_OP,
    character: PlayerCharacter.YELLOW,
    readyState: ReadyState.NOT_READY,
};

const p2: OnlineLobbyPlayer = {
    platform: Platform.STEAM,
    id: 0x7777777777777722n,
    name: 'Player 2',
    gameMode: GameMode.CO_OP,
    character: 255 as PlayerCharacter,
    readyState: ReadyState.NOT_READY,
};

function printLobby(lobby: OnlineLobby) {
    console.log(`${GameMode[lobby.gameMode]} ${lobby.code}`);
    for (const player of lobby.players) {
        if (player !== null) {
            console.log(`${player.name} ${ReadyState[player.readyState]} ${PlayerCharacter[player.character]}`);
        } else {
            console.log('');
        }
    }
}

async function main() {
    const lobbyP1 = await client.createOnlineLobby(p1);
    const printP1 = () => {
        console.log('======= p1 =======');
        printLobby(lobbyP1);
        console.log('==================');
    };
    lobbyP1.on('update', printP1);
    lobbyP1.on('detach', () => {
        console.log('p1 disconnected');
    });
    printP1();
    const lobbyP2 = await client.joinOnlineLobby(lobbyP1.code, p2);
    const printP2 = () => {
        console.log('======= p2 =======');
        printLobby(lobbyP2);
        console.log('==================');
    };
    lobbyP2.on('update', printP2);
    lobbyP2.on('detach', () => {
        console.log('p2 disconnected');
    });
    printP2();
    lobbyP1.detach();
    // spelunky2 server will remove player after 10 seconds
    // does not support immediate detach(same as vanilla)
    setTimeout(() => {
        lobbyP2.detach();
    }, 14000);
}

main()
    .catch((err) => {
        console.error(err);
    });
