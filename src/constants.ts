export type FixedArray<T, N extends number, R extends T[] = []>
    = R['length'] extends N ? R : FixedArray<T, N, [...R, T]>;
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
export enum PlayerCharacter{
    YELLOW = 0,
    MAGENTA = 1,
    CYAN = 2,
    BLACK = 3,
    CINNABAR = 4,
    GREEN = 5,
    OLIVE = 6,
    WHITE = 7,
    CERULEAN = 8,
    BLUE = 9,
    LIME = 10,
    LEMON = 11,
    IRIS = 12,
    GOLD = 13,
    RED = 14,
    PINK = 15,
    VIOLET = 16,
    GRAY = 17,
    KHAKI = 18,
    ORANGE = 19,
    SIZE = 20
}

