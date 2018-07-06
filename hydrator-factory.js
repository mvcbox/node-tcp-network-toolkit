'use strict';

const NetworkBuffer = require('./NetworkBuffer');
const BaseProtocol = require('./BaseProtocol');

/**
 * @param {Object} protocols
 * @returns {Function}
 */
module.exports = function (protocols) {
    let PacketClass;

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
