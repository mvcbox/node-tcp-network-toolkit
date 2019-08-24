import { Socket } from 'net';
import { Duplex } from 'stream';
import EventEmitter from 'events';
import { Protocol } from '../Protocol';
import { Hydrator } from '../Hydrator';
import { RawPacket } from '../PacketReader';
import { ProtocolHandler } from './ProtocolHandler';
import { RawPacketHandler } from './RawPacketHandler';
import { ApplicationEvents } from './ApplicationEvents';
import { ApplicationOptions } from './ApplicationOptions';
import { Connection, ConnectionFactory } from '../Connection';
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
        this.connectionFactory = options.connectionFactory;
        this.packetReaderFactory = options.packetReaderFactory;
    }

    public acceptConnection(socket: Socket, input: Duplex, output: Duplex): void {
        let activeFlag = true;
        let packetReader: PacketReader = this.packetReaderFactory();
        let connection: Connection = this.connectionFactory(socket, output);

        const destroyConnection = () => {
            if (activeFlag) {
                activeFlag = false;
                socket.end();
                socket.unref();
                input.end();
                output.end();
                this.emit(ApplicationEvents.CLOSE_CONNECTION, connection);
                socket = input = output = packetReader = connection = undefined as any;
            }
        };

        const onError = (err: any) => {
            this.emit(ApplicationEvents.ERROR_CONNECTION, err, connection);
            destroyConnection();
        };

        socket.once('error', onError).once('end', destroyConnection).once('close', destroyConnection);
        input.once('error', onError).once('end', destroyConnection).once('close', destroyConnection);
        output.once('error', onError).once('end', destroyConnection).once('close', destroyConnection);

        input.on('data', (data: Buffer) => {
            this.handlePackets(packetReader.updateAndRead(data), connection);
        });

        this.emit(ApplicationEvents.ACCEPT_CONNECTION, connection);
    }

    public handlePackets(packets: RawPacket[], connection: Connection): void {
        for (const packet of packets) {
            if (this.protocolHandlers.has(packet.opcode) && this.hydrator.hasProtocolByOpcode(packet.opcode)) {
                for (const handler of <ProtocolHandler<Protocol>[]>this.protocolHandlers.get(packet.opcode) ) {
                    try {
                        const result = handler(this.hydrator.hydrate(packet), connection);

                        if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
                            result.catch((err: any) => {
                                this.emit(ApplicationEvents.ERROR_PACKET_HANDLER, err, connection);
                            });
                        }
                    } catch (err) {
                        this.emit(ApplicationEvents.ERROR_PACKET_HANDLER, err, connection);
                    }
                }
            } else {
                try {
                    const result = this.rawPacketsHandler(packet, connection);

                    if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
                        result.catch((err: any) => {
                            this.emit(ApplicationEvents.ERROR_PACKET_HANDLER, err, connection);
                        });
                    }
                } catch (err) {
                    this.emit(ApplicationEvents.ERROR_PACKET_HANDLER, err, connection);
                }
            }
        }
    }

    public addPacketHandler<T extends Protocol>(handler: ProtocolHandler<T>, protocol: typeof Protocol | number): this {
        if (typeof protocol !== 'number') {
            protocol = protocol._opcode;
        }

        if (this.protocolHandlers.has(protocol)) {
            (<any[]>this.protocolHandlers.get(protocol)).push(handler);
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
