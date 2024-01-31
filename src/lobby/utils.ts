import {Socket} from 'dgram';

export async function send(socket: Socket, host: string, port: number, buffer: Buffer) {
    return new Promise<number>((resolve, reject) => {
        socket.send(buffer, 0, buffer.length, port, host, (err, bytes) => {
            if (err) reject(err);
            else resolve(bytes);
        });
    });
}
