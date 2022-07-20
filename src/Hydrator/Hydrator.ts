import { Protocol } from '../Protocol';
import { RawPacket } from '../PacketReader';

export class Hydrator {
  public protocols: Map<number, typeof Protocol>;

  public constructor(protocols: (typeof Protocol)[] | {[key: string]: typeof Protocol}) {
    this.protocols = new Map<number, typeof Protocol>();

    if (Array.isArray(protocols)) {
      protocols.forEach(item => this._handleProtocolItem(item));
    } else {
      for (const key in protocols) {
        this._handleProtocolItem(protocols[key]);
      }
    }
  }

  protected _handleProtocolItem(protocol: typeof Protocol): void {
    if (protocol?.prototype instanceof Protocol) {
      if (this.protocols.has(protocol._opcode)) {
        throw new Error('Duplicate for "_opcode": ' + protocol._opcode);
      }

      this.protocols.set(protocol._opcode, protocol);
    }
  }

  public hasProtocolByOpcode(opcode: number): boolean {
    return this.protocols.has(opcode);
  }

  public hydrate(rawPacket: RawPacket): Protocol {
    const protocol = this.protocols.get(rawPacket.opcode);

    if (!protocol) {
      throw new Error('Missing protocol for "opcode": ' + rawPacket.opcode);
    }

    return new protocol(rawPacket.payload);
  }
}
