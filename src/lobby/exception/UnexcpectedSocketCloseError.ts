export class UnexpectedSocketCloseError extends Error {
    constructor() {
        super('The socket has been closed unexpectedly.');
    }
}
