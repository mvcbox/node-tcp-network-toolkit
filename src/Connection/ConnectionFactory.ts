import { Duplex, Writable } from 'stream';
import { Connection } from './Connection';

export interface ConnectionFactory {
    (socket: Duplex, output: Writable): Connection;
}
