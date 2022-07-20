import { NetworkBuffer } from '../NetworkBuffer';

export interface RawPacket {
  opcode: number;
  length: number;
  payload: NetworkBuffer;
}
