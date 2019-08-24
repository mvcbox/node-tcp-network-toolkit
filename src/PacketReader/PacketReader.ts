import { RawPacket } from './RawPacket';
import { NetworkBuffer } from '../NetworkBuffer';
import { PacketReaderOptions } from './PacketReaderOptions';
import { PacketSizeLimitError } from './PacketSizeLimitError';

export class PacketReader {
    public gcThreshold: number;
    public buffer: NetworkBuffer;
    public packetSizeLimit: number;

    constructor(options?: PacketReaderOptions) {
        options = options || {};
        this.gcThreshold = options.gcThreshold || 1048576;
        this.packetSizeLimit = options.packetSizeLimit || 1048576;
        this.buffer = new NetworkBuffer({
            maxBufferLength: options.maxBufferLength || 5242880
        });
        this.buffer.allocEnd(this.buffer.getFreeSpace());
    }

    public updateAndRead(chunk: Buffer): RawPacket[] {
        if (this.buffer.getFreeSpace() < this.gcThreshold) {
            this.buffer.gc().allocEnd(this.buffer.getFreeSpace());
        }

        this.buffer._writeNativeBuffer(chunk);
        const result: RawPacket[] = [];

        while (true) {
            const oldPointer = this.buffer._pointer;

            if (!this.buffer.isReadableCUInt()) {
                break;
            }

            const opcode = this.buffer.readCUInt();

            if (!this.buffer.isReadableCUInt()) {
                this.buffer._pointer = oldPointer;
                break;
            }

            const length = this.buffer.readCUInt();

            if (length > this.packetSizeLimit) {
                throw new PacketSizeLimitError(`Maximum packet size [${length} > ${this.packetSizeLimit}] for "opcode" ${opcode} exceeded`);
            }

            if (!this.buffer.isReadable(length)) {
                this.buffer._pointer = oldPointer;
                break;
            }

            result.push({
                opcode,
                length,
                payload: <NetworkBuffer>this.buffer.readBuffer(length, false, { maxBufferLength: length })
            });
        }

        return result;
    }
}
