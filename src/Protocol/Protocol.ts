import { NetworkBuffer } from '../NetworkBuffer';
import { ProtocolOptions } from './ProtocolOptions';

export class Protocol {
    public constructor(initValue?: ProtocolOptions) {
        if (initValue instanceof NetworkBuffer) {
            this._unmarshal(initValue);
        } else if (initValue instanceof Buffer) {
            this._unmarshal((new NetworkBuffer({
                maxBufferLength: initValue.length
            }))._writeNativeBuffer(initValue));
        } else if (initValue instanceof Object) {
            Object.assign(this, initValue);
        }
    }

    public _marshal(): NetworkBuffer {
        /**
         * Example:
         *
         * const buffer = this._makeBuffer(12); // 12 - max buffer size
         * buffer.writeInt32BE(this.field1);
         * buffer.writeInt32BE(this.field2);
         * buffer.writeInt32BE(this.field3);
         * return buffer;
         */
        throw new Error('You must implement the _marshal() method');
    }

    public _unmarshal(buffer: NetworkBuffer): void {
        /**
         * Example:
         *
         * this.field1 = buffer.readInt32BE();
         * this.field2 = buffer.readInt32BE();
         * this.field3 = buffer.readInt32BE();
         */
        throw new Error('You must implement the _unmarshal() method');
    }

    public static get _opcode(): number {
        /**
         * Example:
         *
         * return 1;
         */
        throw new Error('You must implement the _opcode() method');
    }

    public get _opcode(): number {
        return (<typeof Protocol>this.constructor)._opcode;
    }

    public _makeBuffer(maxBufferLength?: number): NetworkBuffer {
        const buffer = new NetworkBuffer({
            maxBufferLength: maxBufferLength && maxBufferLength + 10 || 1048576
        });

        return buffer.allocEnd(buffer.getFreeSpace() - 10);
    }

    public _marshalWithHeaders(): NetworkBuffer {
        const buffer = this._marshal();
        return buffer.writeCUInt(buffer.length, true).writeCUInt(this._opcode, true);
    }
}
