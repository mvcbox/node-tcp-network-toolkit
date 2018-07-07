'use strict';

const { Transform } = require('stream');
const NetworkBuffer = require('./NetworkBuffer');
const cloneDeep = require('clone-deep');

/**
 * @param {Function} hydrator
 * @param {Object} [options]
 * @param {number} [options.gcThreshold]
 * @param {Object} [options.buffer]
 * @param {number} [options.buffer.maxBufferLength]
 * @param {Object} [options.stream]
 * @returns {*}
 */
module.exports = function (hydrator, options) {
    options = cloneDeep(options || {});
    let buffer = new NetworkBuffer(options.buffer || {});
    let gcThreshold = options.gcThreshold || 104857600;
    let oldPointer;
    let packet;
    let length;
    let opcode;

    return new Transform(Object.assign({
        /**
         *
         */
        readableObjectMode: true,

        /**
         * @param {Buffer} chunk
         * @param {string} encoding
         * @param {Function} done
         */
        transform(chunk, encoding, done) {
            if (buffer.getFreeSpace() < gcThreshold) {
                buffer.gc();
            }

            buffer._writeNativeBuffer(chunk);

            while (true) {
                oldPointer = buffer.pointer;

                if (!buffer.isReadableCUInt()) {
                    break;
                }

                opcode = buffer.readCUInt();

                if (!buffer.isReadableCUInt()) {
                    buffer.pointer = oldPointer;
                    break;
                }

                length = buffer.readCUInt();

                if (!buffer.isReadable(length)) {
                    buffer.pointer = oldPointer;
                    break;
                }

                if (packet = hydrator(opcode, buffer.readBuffer(length, false, {maxBufferLength: length}))) {
                    this.push(packet);
                }
            }

            done();
        }
    }, options.stream || {}));
};
