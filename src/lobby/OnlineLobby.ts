import {OnlineLobbyPlayer, deserializeOnlineLobbyPlayer, serializeOnlineLobbyPlayer} from './OnlineLobbyPlayer';
import {FixedArray, ONLINE_LOBBY_MAX_PLAYER} from '../constants';
import {GameMode} from './GameMode';
import {Socket, createSocket} from 'dgram';
import {Spelunky2Client} from '../Spelunky2Client';
import {LobbyNotFoundError, UnexpectedSocketCloseError, TimeoutError} from './exception';
import {send} from './utils';

type OnlineLobbyPlayerList = FixedArray<OnlineLobbyPlayer | null, typeof ONLINE_LOBBY_MAX_PLAYER>;
type OnlineLobbyPlayerSlot = 0 | 1 | 2 | 3;

type SocketData = {
    socket: Socket,
    is_closed: boolean
} | {
    socket: null,
    is_closed: true
}

export class OnlineLobby {
    #client: Spelunky2Client;
    #socketData: SocketData;
    #code: string;
    #localPlayerSlot: OnlineLobbyPlayerSlot;
    #players: OnlineLobbyPlayerList;
    #gameMode: GameMode;
    #updateListeners: (() => void)[] = [];

    private constructor(
        client: Spelunky2Client,
        socketData: SocketData,
        code: string,
        localPlayerSlot: OnlineLobbyPlayerSlot,
        players: OnlineLobbyPlayerList,
        gameMode: GameMode,
    ) {
        this.#client = client;
        this.#socketData = socketData;
        this.#code = code;
        this.#localPlayerSlot = localPlayerSlot;
        this.#players = players;
        this.#gameMode = gameMode;
    }

    detach() {
        if (!this.#socketData.is_closed) {
            this.#socketData.socket.close();
        }
    }

    is_detached() {
        return this.#socketData.is_closed;
    }

    on(event: 'update' | 'detach', callback: () => void) {
        if (event === 'update') {
            this.#updateListeners.push(callback);
        } else if (event === 'detach') {
            if (this.#socketData.is_closed) {
                callback();
            } else {
                this.#socketData.socket.on('close', callback);
            }
        }
    }

    off(event: 'update' | 'detach', callback: () => void) {
        if (event === 'update') {
            const index = this.#updateListeners.indexOf(callback);
            if (index !== -1) {
                this.#updateListeners.splice(index, 1);
            }
        } else if (event === 'detach') {
            if (this.#socketData.is_closed) {
                return;
            } else {
                this.#socketData.socket.off('close', callback);
            }
        }
    }

    get gameMode() {
        return this.#gameMode;
    }

    get code() {
        return this.#code;
    }

    get players(): Readonly<OnlineLobbyPlayerList> {
        return [...this.#players];
    }

    get localPlayerSlot() {
        return this.#localPlayerSlot;
    }

    private serializeSlot() {
        const buffer = Buffer.alloc(12);
        buffer.writeUInt8(1, 3);
        buffer.writeUInt8(1, 7);
        buffer.writeUInt8(this.#localPlayerSlot, 11);
        return buffer;
    }

    private serialize(pingBytes: Buffer) {
        const codeBytes = Buffer.alloc(4);
        codeBytes.writeUInt32LE(parseInt(this.#code, 16));

        const playerBytes = Buffer.concat(
            this.players.map(
                (player) => {
                    if (player === null) {
                        return Buffer.alloc(1);
                    } else {
                        return serializeOnlineLobbyPlayer(player);
                    }
                },
            ),
        );

        return Buffer.concat([
            codeBytes,
            Buffer.alloc(1),
            this.serializeSlot(),
            pingBytes,
            Buffer.alloc(7),
            playerBytes,
        ]);
    }

    private updateFrom(buffer: Buffer): boolean {
        const code = buffer.readUInt32LE(0).toString(16).padStart(8, '0').toUpperCase();
        if (code === '00000000') {
            return false;
        }

        this.#code = code;

        {
            const localPlayerSlot = buffer.readUInt8(16) as OnlineLobbyPlayerSlot;
            this.#players[localPlayerSlot] = this.#players[this.#localPlayerSlot];
            this.#localPlayerSlot = localPlayerSlot;
        }

        let playersIndex = 0;
        for (let i=56; i!==buffer.byteLength;) {
            if (buffer[i] === 0) {
                this.#players[playersIndex++] = null;
                ++i;
            } else {
                const length = 23 + buffer[i];
                const player = deserializeOnlineLobbyPlayer(buffer.subarray(i, i + length));
                if (playersIndex !== this.#localPlayerSlot) {
                    Object.freeze(player);
                    this.#players[playersIndex] = player;
                }
                ++playersIndex;
                if (player.gameMode !== GameMode.UNKNOWN) {
                    this.#gameMode = player.gameMode;
                }
                i += length;
            }
        }

        const localPlayer = this.#players[this.#localPlayerSlot];
        if (localPlayer !== null) {
            localPlayer.gameMode = this.#gameMode;
        }

        for (const listener of this.#updateListeners) {
            listener();
        }

        return true;
    }

    private async attach(client: Spelunky2Client, socket: Socket) {
        return new Promise<void>((resolve, reject) => {
            let before = Buffer.alloc(0);
            let resolved = false;
            socket.on('message', (buffer) => {
                if (buffer.equals(before)) {
                    return;
                }
                before = buffer;

                if (this.updateFrom(buffer.subarray(16))) {
                    resolved = true;
                    resolve();
                    return;
                } else {
                    reject(new LobbyNotFoundError);
                    socket.close();
                    return;
                }
            });

            socket.on('close', () => {
                reject(new UnexpectedSocketCloseError);
            });

            socket.on('error', (err) => {
                reject(err);
            });

            if (client.timeout !== -1) {
                setTimeout(() => {
                    if (!resolved) {
                        reject(new TimeoutError);
                        socket.close();
                    }
                }, client.timeout);
            }
        });
    }

    async pushChanges() {
        if (this.#socketData.is_closed) return;
        const request = this.serialize(await this.#client.getPingBytes());
        await send(this.#socketData.socket, this.#client.game_server_host, this.#client.game_server_port, request);
    }

    static async join(client: Spelunky2Client, code: string, player: OnlineLobbyPlayer | null) {
        const socketData: SocketData = {
            socket: createSocket('udp4'),
            is_closed: false,
        };
        socketData.socket.on('close', () => {
            socketData.is_closed = true;
        });

        let intervalHandle: NodeJS.Timeout | null = null;
        socketData.socket.on('close', () => {
            if (intervalHandle !== null) {
                clearInterval(intervalHandle);
            }
        });

        const lobby = new OnlineLobby(
            client,
            socketData,
            code,
            0,
            [player, null, null, null],
            GameMode.UNKNOWN,
        );

        const waitAttached = lobby.attach(client, socketData.socket);

        const request = lobby.serialize(await client.getPingBytes());
        await send(socketData.socket, client.game_server_host, client.game_server_port, request);

        intervalHandle = setInterval(() => {
            void lobby.pushChanges();
        }, 1000);

        await waitAttached;
        return lobby;
    }

    static async create(client: Spelunky2Client, player: OnlineLobbyPlayer) {
        const socketData: SocketData = {
            socket: createSocket('udp4'),
            is_closed: false,
        };

        socketData.socket.on('close', () => {
            socketData.is_closed = true;
        });

        let intervalHandle: NodeJS.Timeout | null = null;
        socketData.socket.on('close', () => {
            if (intervalHandle !== null) {
                clearInterval(intervalHandle);
            }
        });

        const lobby = new OnlineLobby(
            client,
            socketData,
            'FFFFFFFF',
            0,
            [player, null, null, null],
            GameMode.UNKNOWN,
        );

        const waitAttached = lobby.attach(client, socketData.socket);

        const request = lobby.serialize(await client.getPingBytes());
        request.writeBigUInt64BE(0xFFFFFFFF01000000n, 4);
        request.writeUint8(0, 12);
        await send(socketData.socket, client.game_server_host, client.game_server_port, request);
        await send(socketData.socket, client.game_server_host, client.game_server_port, request);
        intervalHandle = setInterval(() => {
            void lobby.pushChanges();
        }, 1000);

        await waitAttached;
        return lobby;
    }
}
