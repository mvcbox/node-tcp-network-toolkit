import { Socket } from 'net';
import { Writable } from 'stream';
import { Protocol } from '../Protocol';

export class Connection {
    public socket: Socket;
    public output: Writable;
    public session: Map<any, any>;

    public constructor(socket: Socket, output: Writable) {
        this.socket = socket;
        this.output = output;
        this.session = new Map<any, any>();
    }

    public writePacket(packet: Protocol | Buffer): Promise<boolean> {
        if (
            (<any>this.socket)._writableState.ended ||
            (<any>this.socket)._writableState.ending ||
            (<any>this.output)._writableState.ended ||
            (<any>this.output)._writableState.ending
        ) {
            return Promise.resolve(false);
        }

        if (packet instanceof Protocol) {
            packet = packet._marshalWithHeaders().buffer;
        }

        if (this.output.write(packet)) {
            return Promise.resolve(true);
        }

        const _this = this;

        return new Promise(function(resolve, reject) {
            _this.socket.on('error', onError).on('close', onClose);
            _this.output.on('error', onError).on('close', onClose).on('drain', onDrain);

            function onClose() {
                resetListeners();
                reject(new Error('Close connection'));
            }

            function onError(err: any) {
                resetListeners();
                reject(err);
            }

            function onDrain() {
                resetListeners();
                resolve(true);
            }

            function resetListeners() {
                _this.socket.removeListener('error', onError).removeListener('close', onClose);
                _this.output.removeListener('error', onError).removeListener('close', onClose).removeListener('drain', onDrain);
            }
        });
    }
}
