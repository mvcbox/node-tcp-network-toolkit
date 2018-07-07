'use strict';

const NetworkBuffer = require('./NetworkBuffer');
const BaseProtocol = require('./BaseProtocol');

/**
 * @param {Array} protocols
 * @returns {Function}
 */
module.exports = function (protocols) {
    let PacketClass;
    protocols = protocols.reduce(function (accum, item) {
        accum[item._opcode] = item;
        return accum;
    }, {});

    /**
     * @param {number} opcode
     * @param {NetworkBuffer} buffer
     * @returns {BaseProtocol}
     */
    return function (opcode, buffer) {
        if (opcode in protocols) {
            PacketClass = protocols[opcode];
            return new PacketClass(buffer);
        }
    };
};
