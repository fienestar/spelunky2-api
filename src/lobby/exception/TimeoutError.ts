export class TimeoutError extends Error {
    constructor() {
        super('Timeout. see Spelunky2ClientOptions#timeout');
    }
}
