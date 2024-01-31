import { FixedArray } from './FixedArray';

export const DEFAULT_GAME_SERVER_HOST = 'spelunky-v20.mmo.gratis';
export const DEFAULT_GAME_SERVER_PORT = 11937;
export const DEFAULT_LEADERBOARD_SERVER_HOST = 'cdn.spelunky2.net';
export const DEFAULT_LEADERBOARD_SERVER_PORT = 443;
export const ONLINE_LOBBY_MAX_PLAYER = 4;
export const GAME_SERVER_EDGE_HOSTS = [
    'localhost',
    /*
    'edge-01.spelunky2.net',
    'edge-02.spelunky2.net',
    ...
    'edge-31.spelunky2.net'
    */
    ...Array(31).fill(0).map((_, i) => `edge-${(i+1).toString().padStart(2, '0')}.spelunky2.net`),
] as FixedArray<string, 32>;
export const GAME_SERVER_EDGE_PORTS = Array(32).fill(2816) as FixedArray<number, 32>;
