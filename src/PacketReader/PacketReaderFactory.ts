import { PacketReader } from './PacketReader';

export interface PacketReaderFactory {
    (...args: any[]): PacketReader;
}
