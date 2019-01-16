'use strict';

const NetworkBuffer = require('./NetworkBuffer');
const ProtocolAbstract = require('./ProtocolAbstract');

/**
 * @param {Buffer|NetworkBuffer|ProtocolAbstract|Object} packet
 * @returns {Buffer}
 */
module.exports = function (packet) {
    if (packet instanceof Buffer) {
        return packet;
    } else if (packet instanceof NetworkBuffer) {
        return packet.buffer;
    } else if (packet instanceof ProtocolAbstract) {
        return packet._toPacketWithHeaders().buffer;
    } else if (packet && packet.opcode && packet.payload instanceof NetworkBuffer) {
        return packet.payload.writeCUInt(packet.payload.length, true).writeCUInt(packet.opcode, true).buffer;
    }

    throw new TypeError('"packet" has incorrect type');
};
