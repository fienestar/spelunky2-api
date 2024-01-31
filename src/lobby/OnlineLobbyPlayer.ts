import { Platform } from '../Platform';
import { PlayerCharacter } from '../PlayerCharacter';
import { GameMode } from './GameMode';
import { ReadyState } from './ReadyState';

export interface OnlineLobbyPlayer{
    platform: Platform;
    id: bigint;
    name: string;
    gameMode: GameMode;
    character: PlayerCharacter;
    readyState: ReadyState;
}

export function serializeOnlineLobbyPlayer(player: OnlineLobbyPlayer): Buffer {
    const nameLength = Buffer.byteLength(player.name, 'utf-8');
    const totalBytesLength = 23 + nameLength;
    const buffer = Buffer.alloc(totalBytesLength);
    buffer.writeUInt8(nameLength, 0);
    buffer.writeBigUInt64LE(player.id, 8);
    buffer.writeUInt8(player.gameMode, 16);
    buffer.writeUInt8(player.readyState | (player.platform << 2), 21);
    buffer.writeUInt8(player.character, 22);
    buffer.write(player.name, 23, nameLength, 'utf8');
    return buffer;
}

export function deserializeOnlineLobbyPlayer(player: Buffer): OnlineLobbyPlayer {
    const byte21 = player.readUInt8(21);
    return {
        platform: byte21 >> 2,
        id: player.readBigUInt64LE(8),
        name: player.toString('utf8', 23, 23 + player.readUInt8(0)),
        gameMode: player.readUInt8(16),
        character: player.readUInt8(22),
        readyState: byte21 & 0b11,
    };
}
