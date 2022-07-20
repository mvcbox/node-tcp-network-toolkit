import { NetworkBuffer } from '../NetworkBuffer';
import { ProtocolOptions } from './ProtocolOptions';

export class Protocol {
  public _unmarshalled: boolean;

  public constructor(initValue?: ProtocolOptions) {
    this._unmarshalled = false;

    if (initValue instanceof NetworkBuffer) {
      const pointer = initValue.getPointer();
      this._unmarshalled = this._unmarshal(initValue);
      initValue.setPointer(pointer);
    } else if (initValue instanceof Buffer) {
      this._unmarshalled = this._unmarshal(this._makeBuffer(initValue.length)._writeNativeBuffer(initValue));
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

  public _unmarshal(buffer: NetworkBuffer): boolean {
    /**
     * Example:
     *
     * this.field1 = buffer.readInt32BE();
     * this.field2 = buffer.readInt32BE();
     * this.field3 = buffer.readInt32BE();
     * return true;
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
    return (this.constructor as typeof Protocol)._opcode;
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
