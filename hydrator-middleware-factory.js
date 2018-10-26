'use strict';

/**
 * @param {Array} protocols
 * @param {string} fieldname
 * @returns {Function}
 */
module.exports = function (protocols, fieldname) {
    let PacketClass;
    protocols = protocols.reduce(function (accum, item) {
        accum[item._opcode] = item;
        return accum;
    }, {});

    return function (packet, socket, next) {
        if (packet.opcode in protocols) {
            PacketClass = protocols[packet.opcode];
            packet[fieldname || 'packet'] = (new PacketClass)._fromPacket(packet.payload);
        }

        next();
    };
};
