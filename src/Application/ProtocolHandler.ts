import { Protocol } from '../Protocol';
import { Connection } from '../Connection';

export interface ProtocolHandler<T extends Protocol> {
    (packet: T, connection: Connection): any;
}
