import { ExtendedBuffer } from 'extended-buffer';
import { NetworkBufferOptions } from './NetworkBufferOptions';

export class NetworkBuffer extends ExtendedBuffer {
    public _writeCUIntToBuffer(buffer: this, value: number, noAssert?: boolean): this {
        let tmp;

        if (value < 0x80) {
            buffer.writeUIntBE(value, 1, false, noAssert);
        } else if (value < 0x4000) {
            if ((tmp = value | 0x8000) < 0) {
                buffer.writeIntBE(tmp, 2, false, noAssert);
            } else {
                buffer.writeUIntBE(tmp, 2, false, noAssert);
            }
        } else if (value < 0x20000000) {
            if ((tmp = value | 0xC0000000) < 0) {
                buffer.writeIntBE(tmp, 4, false, noAssert);
            } else {
                buffer.writeUIntBE(tmp, 4, false, noAssert);
            }
        } else {
            buffer.writeUIntBE(0xE0, 1, false, noAssert).writeUIntBE(value, 4, false, noAssert);
        }

        return this;
    }

    public isReadableCUInt(): boolean {
        if (!this.isReadable(1)) {
            return false;
        }

        let value = this.readUIntBE(1);
        --this._pointer;

        switch (value & 0xE0) {
            case 0xE0:
                return this.isReadable(5);
            case 0xC0:
                return this.isReadable(4);
            case 0x80:
            case 0xA0:
                return this.isReadable(2);
        }

        return true;
    }

    public readCUInt(noAssert?: boolean): number {
        let value = this.readUIntBE(1, noAssert);

        switch (value & 0xE0) {
            case 0xE0:
                return this.readUIntBE(4, noAssert);
            case 0xC0:
                --this._pointer;
                return this.readUIntBE(4, noAssert) & 0x1FFFFFFF;
            case 0x80:
            case 0xA0:
                --this._pointer;
                return this.readUIntBE(2, noAssert) & 0x3FFF;
        }

        return value;
    }

    public writeCUInt(value: number, unshift?: boolean, noAssert?: boolean): this {
        if (unshift) {
            const ThisClass = <new(options?: NetworkBufferOptions) => this>this.constructor;
            let buffer = new ThisClass({
                maxBufferLength: 5
            });

            return this._writeCUIntToBuffer(buffer, value, noAssert)._writeNativeBuffer(buffer.buffer, true);
        }

        return this._writeCUIntToBuffer(this, value, noAssert);
    }

    public readNetworkString(encoding?: BufferEncoding, noAssert?: boolean): string {
        return this.readString(this.readCUInt(noAssert), encoding);
    }

    public writeNetworkString(value: string, encoding?: BufferEncoding, unshift?: boolean, noAssert?: boolean): this {
        if (unshift) {
            return this.writeString(value, encoding, true).writeCUInt(Buffer.byteLength(value, encoding), true, noAssert);
        }

        return this.writeCUInt(Buffer.byteLength(value, encoding), false, noAssert).writeString(value, encoding, false);
    }

    public readNetworkBuffer(asNative?: boolean, reservedSize?: number, noAssert?: boolean): this {
        let length = this.readCUInt(noAssert);

        return <this>this.readBuffer(length, asNative, {
            maxBufferLength: length + (reservedSize || 10)
        });
    }

    public writeNetworkBuffer(value: Buffer | NetworkBuffer, unshift?: boolean, noAssert?: boolean): this {
        if (unshift) {
            return this.writeBuffer(value, true).writeCUInt(value.length, true, noAssert);
        }

        return this.writeCUInt(value.length, false, noAssert).writeBuffer(value, false);
    }
}
