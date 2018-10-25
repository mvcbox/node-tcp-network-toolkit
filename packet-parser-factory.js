'use strict';

const NetworkBuffer = require('./NetworkBuffer');

/**
 * @param {Object} [options]
 * @param {number} [options.gcThreshold]
 * @param {Object} [options.buffer]
 * @param {number} [options.buffer.maxBufferLength]
 * @returns {*}
 */
module.exports = function (options) {
    options |= {};
    let buffer = new NetworkBuffer(options.buffer || {});
    buffer.allocEnd(buffer.getFreeSpace());
    let gcThreshold = options.gcThreshold || 104857600;
    let oldPointer;
    let length;
    let opcode;
    let result;

    return function (chunk) {
        if (buffer.getFreeSpace() < gcThreshold) {
            buffer.gc();
            buffer.allocEnd(buffer.getFreeSpace());
        }

        buffer._writeNativeBuffer(chunk);
        result = [];

        while (true) {
            oldPointer = buffer._pointer;

            if (!buffer.isReadableCUInt()) {
                break;
            }

            opcode = buffer.readCUInt();

            if (!buffer.isReadableCUInt()) {
                buffer._pointer = oldPointer;
                break;
            }

            length = buffer.readCUInt();

            if (!buffer.isReadable(length)) {
                buffer._pointer = oldPointer;
                break;
            }

            result.push({
                opcode,
                length,
                payload: buffer.readBuffer(length, false, {maxBufferLength: length})
            });
        }

        return result;
    };
};
