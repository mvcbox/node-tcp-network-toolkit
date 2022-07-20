import { Protocol } from '../Protocol';
import { Writable, Duplex } from 'stream';

export class Connection {
  public socket: Duplex;
  public output: Writable;
  public session: Map<any, any>;

  public constructor(socket: Duplex, output: Writable) {
    this.socket = socket;
    this.output = output;
    this.session = new Map<any, any>();
  }

  public writePacket(packet: Protocol | Buffer): Promise<void> {
    if (
      (this.socket as any)._writableState.ended ||
      (this.socket as any)._writableState.ending ||
      (this.output as any)._writableState.ended ||
      (this.output as any)._writableState.ending
    ) {
      return Promise.reject(new Error('Writing to a closed connection'));
    }

    if (packet instanceof Protocol) {
      packet = packet._marshalWithHeaders().buffer;
    }

    if (this.output.write(packet)) {
      return Promise.resolve();
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
        resolve();
      }

      function resetListeners() {
        _this.socket.removeListener('error', onError).removeListener('close', onClose);
        _this.output.removeListener('error', onError).removeListener('close', onClose).removeListener('drain', onDrain);
      }
    });
  }
}
