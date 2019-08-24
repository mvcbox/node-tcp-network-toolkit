import { Socket } from 'net';
import { Writable } from 'stream';
import { Protocol } from '../Protocol';

export class Connection {
    public socket: Socket;
    public output: Writable;
    public session: Map<any, any> = new Map<any, any>();

    public constructor(socket: Socket, output: Writable) {
        this.socket = socket;
        this.output = output;
    }

    public writePacket(packet: Protocol | Buffer): Promise<boolean> {
        if (this.socket.destroyed || !this.output.writable) {
            return Promise.resolve(false);
        }

        if (packet instanceof Protocol) {
            packet = packet._marshalWithHeaders().buffer;
        }

        if (this.output.write(packet)) {
            return Promise.resolve(true);
        }

        return new Promise((resolve, reject) => {
            const resetListeners = () => {
                this.socket.removeListener('error', reject).removeListener('close', onClose);
                this.output.removeListener('error', reject).removeListener('close', onClose);
            };

            const onClose = () => {
                resetListeners();
                reject(new Error('Close connection'));
            };

            this.output.once('drain', () => {
                resetListeners();
                resolve(true);
            });
            this.socket.on('error', reject).on('close', onClose);
            this.output.on('error', reject).on('close', onClose);
        });
    }
}
