import { Hydrator } from '../Hydrator';
import { ConnectionFactory } from '../Connection';
import { PacketReaderFactory } from '../PacketReader';

export interface ApplicationOptions {
    hydrator: Hydrator;
    connectionFactory?: ConnectionFactory;
    packetReaderFactory?: PacketReaderFactory;
}
