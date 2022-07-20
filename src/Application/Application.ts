import { EventEmitter } from 'events';
import { Protocol } from '../Protocol';
import { Hydrator } from '../Hydrator';
import { emptyFunction } from '../utils';
import { RawPacket } from '../PacketReader';
import { Duplex, Readable, Writable } from 'stream';
import { ProtocolHandler } from './ProtocolHandler';
import { RawPacketHandler } from './RawPacketHandler';
import { ApplicationOptions } from './ApplicationOptions';
import { Connection, ConnectionFactory } from '../Connection';
import { ApplicationEventsEnum } from './ApplicationEventsEnum';
import { PacketReader, PacketReaderFactory } from '../PacketReader';

export class Application extends EventEmitter {
  public hydrator: Hydrator;
  public connectionFactory: ConnectionFactory;
  public packetReaderFactory: PacketReaderFactory;
  public rawPacketsHandler: RawPacketHandler = function() {};
  public protocolHandlers: Map<number, any[]> = new Map<number, any[]>();

  public constructor(options: ApplicationOptions) {
    super();
    this.hydrator = options.hydrator;

    if (options.connectionFactory) {
      this.connectionFactory = options.connectionFactory;
    } else {
      this.connectionFactory = function (socket, output) { return new Connection(socket, output); };
    }

    if (options.packetReaderFactory) {
      this.packetReaderFactory = options.packetReaderFactory;
    } else {
      this.packetReaderFactory = function () { return new PacketReader; };
    }
  }

  public acceptConnection(socket: Duplex, input: Readable, output: Writable): void {
    const _this = this;
    let activeFlag = true;
    const packetReader: PacketReader = this.packetReaderFactory();
    const connection: Connection = this.connectionFactory(socket, output);
    socket.on('error', onError).on('error', emptyFunction).on('end', onEnd).on('close', onClose);
    output.on('error', onError).on('error', emptyFunction).on('end', onEnd).on('close', onClose);
    input.on('error', onError).on('error', emptyFunction).on('end', onEnd).on('close', onClose).on('data', onData);

    function onData(data: Buffer) {
      try {
        _this.handlePackets(packetReader.updateAndRead(data), connection);
      } catch (err) {
        removeListeners();
        _this.emit(ApplicationEventsEnum.ERROR_PACKET_READER, err, connection);
        destroyConnection();
      }
    }

    function onError(err: any) {
      removeListeners();
      _this.emit(ApplicationEventsEnum.ERROR_CONNECTION, err, connection);
      destroyConnection();
    }

    function onEnd() {
      removeListeners();
      destroyConnection();
    }

    function onClose() {
      removeListeners();
      destroyConnection();
    }

    function destroyConnection() {
      if (activeFlag) {
        activeFlag = false;
        socket.end();
        output.end();
        input.destroy && input.destroy();
        _this.emit(ApplicationEventsEnum.CLOSE_CONNECTION, connection);
        socket.removeListener('error', emptyFunction);
        output.removeListener('error', emptyFunction);
        input.removeListener('error', emptyFunction);
      }
    }

    function removeListeners() {
      socket.removeListener('error', onError).removeListener('end', onEnd).removeListener('close', onClose);
      output.removeListener('error', onError).removeListener('end', onEnd).removeListener('close', onClose);
      input.removeListener('error', onError).removeListener('end', onEnd).removeListener('close', onClose).removeListener('data', onData);
    }

    this.emit(ApplicationEventsEnum.ACCEPT_CONNECTION, connection);
  }

  public handlePackets(packets: RawPacket[], connection: Connection): void {
    for (const packet of packets) {
      if (this.protocolHandlers.has(packet.opcode) && this.hydrator.hasProtocolByOpcode(packet.opcode)) {
        for (const handler of (this.protocolHandlers.get(packet.opcode) as ProtocolHandler<Protocol>[])) {
          try {
            const result = handler(this.hydrator.hydrate(packet), connection);

            if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
              result.catch((err: any) => {
                this.emit(ApplicationEventsEnum.ERROR_PACKET_HANDLER, err, connection);
              });
            }
          } catch (err) {
            this.emit(ApplicationEventsEnum.ERROR_PACKET_HANDLER, err, connection);
          }
        }
      } else {
        try {
          const result = this.rawPacketsHandler(packet, connection);

          if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
            result.catch((err: any) => {
              this.emit(ApplicationEventsEnum.ERROR_PACKET_HANDLER, err, connection);
            });
          }
        } catch (err) {
          this.emit(ApplicationEventsEnum.ERROR_PACKET_HANDLER, err, connection);
        }
      }
    }
  }

  public addPacketHandler<T extends Protocol>(handler: ProtocolHandler<T>, protocol: typeof Protocol | number): this {
    if (typeof protocol !== 'number') {
      protocol = protocol._opcode;
    }

    if (this.protocolHandlers.has(protocol)) {
      (this.protocolHandlers.get(protocol) as any[]).push(handler);
    } else {
      this.protocolHandlers.set(protocol, [handler])
    }

    return this;
  }

  public setRawPacketshandler(handler: RawPacketHandler): this {
    this.rawPacketsHandler = handler;
    return this;
  }
}
