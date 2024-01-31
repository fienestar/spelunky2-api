import { writeFileSync } from 'fs';
import { GameEnding, LeaderboardEntry, Platform, PlayerCharacter, Spelunky2Client } from '../src';

const client = new Spelunky2Client;

function frame2time(frames: number) {
    const totalSeconds = frames / 60;
    const hours = (totalSeconds / 3600) | 0;
    const minutes = ((totalSeconds / 60) | 0) % 60;
    const seconds = (totalSeconds | 0) % 60;
    const milliseconds = ((totalSeconds - (totalSeconds | 0)) * 10000) | 0;
    const pad = (value: number, length: number) => value.toString().padStart(length, '0');
    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(milliseconds, 4)}`;
}

async function main() {
    const DAY = 24 * 60 * 60 * 1000;
    const date = new Date(Date.now() - 3*DAY);
    const leaderboard: Array<LeaderboardEntry & { time?: string }> =
        await client.getLeaderboard(date.getFullYear(), date.getMonth() + 1, date.getDate());

    for (const entry of leaderboard) {
        entry.time = frame2time(entry.frames);
    }

    writeFileSync('leaderboard.json', JSON.stringify(leaderboard, (key: string, value: string | bigint) => {
        if (key === 'platform') {
            return Platform[value as unknown as number];
        }
        if (key === 'character') {
            return PlayerCharacter[value as unknown as number];
        }
        if (key === 'level') {
            return (value as unknown as Array<number>).join('-');
        }
        if (key === 'ending') {
            return GameEnding[value as unknown as number];
        }
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    }, 4));
}

main()
    .catch((err) => {
        console.error(err);
    });
