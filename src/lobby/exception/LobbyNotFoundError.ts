export class LobbyNotFoundError extends Error {
    constructor() {
        super('The lobby was not found or full.');
    }
}
