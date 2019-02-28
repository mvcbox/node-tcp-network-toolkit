'use strict';

/**
 * @param {Object|Array} protocols
 * @param {string} fieldname
 * @returns {Function}
 */
module.exports = function (protocols, fieldname) {
    let PacketClass;
    const _protocols = {};

    for (let protocol in protocols) {
        _protocols[protocols[protocol]._opcode] = protocols[protocol];
    }

    return function (packet, socket, next) {
        if (packet.opcode in _protocols) {
            PacketClass = _protocols[packet.opcode];
            packet[fieldname || 'packet'] = (new PacketClass)._fromPacket(packet.payload);

            if ('payload' !== fieldname) {
                packet.payload._pointer = 0;
            }
        }

        next();
    };
};
