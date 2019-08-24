import { RawPacket } from '../PacketReader';
import { Connection } from '../Connection';

export interface RawPacketHandler {
    (rawPacket: RawPacket, connection: Connection): any;
}

