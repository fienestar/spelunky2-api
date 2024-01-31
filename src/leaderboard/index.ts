import { ZSTDDecoder } from 'zstddec';
import { GameEnding } from '../GameEnding';
import { Platform } from '../Platform';
import { PlayerCharacter } from '../PlayerCharacter';
import { Spelunky2Client } from '../Spelunky2Client';

export async function downloadLeaderboard(client: Spelunky2Client, year: number, month: number, day: number) {
    const host = client.leaderboard_server_host;
    const port = client.leaderboard_server_port;
    const datestring = year.toString().padStart(4, '0') +
        month.toString().padStart(2, '0') +
        day.toString().padStart(2, '0');
    const response = await fetch(`https://${host}:${port}/static/${datestring}`);
    const decoder = new ZSTDDecoder();
    await decoder.init();
    const leaderboardRaw = decoder.decode(new Uint8Array(await response.arrayBuffer()));
    const leaderboard = parseLeaderboardFrom(Buffer.from(leaderboardRaw));

    return leaderboard;
}

export interface LeaderboardEntry {
    id: bigint;
    name: string;
    platform: Platform;
    character: PlayerCharacter;
    frames: number;
    ending: GameEnding;
    score: number;
    /** world, level */
    level: [number, number];
}

const levelsCount = [4, 4, 1, 4, 1, 4, 4];
function parseLevel(levelCount: number): [number, number] {
    let world = 1;

    while (world !== levelsCount.length) {
        if (levelCount <= levelsCount[world - 1]) {
            return [world, levelCount];
        }
        levelCount -= levelsCount[world - 1];
        ++world;
    }
    return [world, levelCount];
}

export function parseLeaderboardFrom(buffer: Buffer) {
    const length = Number(buffer.readBigUInt64LE(0)) - 2;
    const leaderboard = Array<LeaderboardEntry>(length);
    for (let i=0; i!==length; ++i) {
        const levelCount = buffer.readUInt32LE(0x30A32DC + i * 8);
        leaderboard[i] = {
            id: buffer.readBigUInt64LE(0x0000018 + i * 8),
            name: buffer.toString('utf8', 0x07A124A + i * 33, 0x07A126B + i * 33).replace(/\0.*$/, ''),
            platform: buffer.readUInt8(0x2719C4C + i * 2),
            character: buffer.readUInt8(0x2719C4D + i * 2),
            frames: buffer.readUInt32LE(0x29020D8 + i * 8),
            ending: (1023 - levelCount - buffer.readUInt32LE(0x29020DC + i * 8)) >> 8,
            score: buffer.readUInt32LE(0x30A32D8 + i * 8),
            level: parseLevel(levelCount),
        };
    }

    return leaderboard;
}
