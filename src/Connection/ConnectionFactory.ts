import { Socket } from 'net';
import { Duplex } from 'stream';
import { Connection } from './Connection';

export interface ConnectionFactory {
    (socket: Socket, output: Duplex): Connection;
}
