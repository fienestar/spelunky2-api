import { createSocket } from 'dgram';
import {
    DEFAULT_LEADERBOARD_SERVER_HOST,
    DEFAULT_LEADERBOARD_SERVER_PORT,
    DEFAULT_GAME_SERVER_HOST,
    DEFAULT_GAME_SERVER_PORT,
    FixedArray,
    GAME_SERVER_EDGE_HOSTS,
    GAME_SERVER_EDGE_PORTS,
} from './constants';
import { OnlineLobbyPlayer } from './lobby/OnlineLobbyPlayer';
import { send } from './lobby/utils';
import { OnlineLobby } from './lobby/OnlineLobby';

export interface Spelunky2ClientOptions
{
    game_server_host: string;
    game_server_port: number;
    leaderboard_server_host: string;
    leaderboard_server_port: number;
    /** set -1 to disable */
    timeout: number;
}

async function pingGameServerEdges() {
    const socket = createSocket('udp4');

    const start = Date.now();
    const result = Array<number>(32) as FixedArray<number, 32>;
    socket.on('message', (buffer) => {
        result[buffer[0]] = Math.floor((Date.now() - start) * 60 / 1000);
    });

    while (Date.now() - start < 4266) {
        for (let i=0; i!=32; ++i) {
            if (result[i] === undefined) {
                await send(socket, GAME_SERVER_EDGE_HOSTS[i], GAME_SERVER_EDGE_PORTS[i], Buffer.from([i, 0x14]));
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    socket.close();

    for (let i=0; i!=32; ++i) {
        if (!result[i]) {
            result[i] = 0xFF;
        }
    }

    return result;
}

export class Spelunky2Client {
    game_server_host: string;
    game_server_port: number;
    leaderboard_server_host: string;
    leaderboard_server_port: number;
    timeout: number;
    #ping_bytes?: Buffer;

    constructor(options?: Partial<Spelunky2ClientOptions>) {
        this.game_server_host = options?.game_server_host ?? DEFAULT_GAME_SERVER_HOST;
        this.game_server_port = options?.game_server_port ?? DEFAULT_GAME_SERVER_PORT;
        this.leaderboard_server_host = options?.leaderboard_server_host ?? DEFAULT_LEADERBOARD_SERVER_HOST;
        this.leaderboard_server_port = options?.leaderboard_server_port ?? DEFAULT_LEADERBOARD_SERVER_PORT;
        this.timeout = options?.timeout ?? 5000;
    }

    async getPingBytes() {
        if (this.#ping_bytes === undefined) {
            this.#ping_bytes = Buffer.from(await pingGameServerEdges());
        }
        return this.#ping_bytes;
    }

    async createOnlineLobby(player: OnlineLobbyPlayer) {
        return await OnlineLobby.create(this, player);
    }

    async joinOnlineLobby(code: string, player: OnlineLobbyPlayer) {
        return await OnlineLobby.join(this, code, player);
    }

    getLeaderboard() {
    }
}
