'use strict';

const ExtendedBuffer = require('extended-buffer');

class NetworkBuffer extends ExtendedBuffer {
    /**
     * @param {NetworkBuffer} buffer
     * @param {number} value
     * @param {boolean} noAssert
     * @returns {NetworkBuffer}
     * @private
     */
    _writeCUIntToBuffer(buffer, value, noAssert) {
        let tmp;

        if (value < 0x80) {
            buffer.writeUInt8(value, false, noAssert);
        } else if (value < 0x4000) {
            tmp = value | 0x8000;

            if (tmp < 0) {
                buffer.writeInt16BE(tmp, false, noAssert);
            } else {
                buffer.writeUInt16BE(tmp, false, noAssert);
            }
        } else if (value < 0x20000000) {
            tmp = value | 0xC0000000;

            if (tmp < 0) {
                buffer.writeInt32BE(tmp, false, noAssert);
            } else {
                buffer.writeUInt32BE(tmp, false, noAssert);
            }
        } else {
            buffer.writeUInt8(0xE0, false, noAssert).writeUInt32BE(value, false, noAssert);
        }

        return this;
    }

    /**
     * @param {boolean} noAssert
     * @returns {boolean}
     */
    isReadableCUInt(noAssert) {
        if (!this.isReadable(1)) {
            return false;
        }

        let value = this.readUInt8(noAssert);
        this.offset(-1);

        switch (value & 0xE0) {
            case 0xE0:
                return this.isReadable(5);
            case 0xC0:
                return this.isReadable(4);
            case 0x80:
            case 0xA0:
                return this.isReadable(2);
        }

        return true;
    }

    /**
     * @param {boolean} noAssert
     * @returns {number}
     */
    readCUInt(noAssert) {
        let value = this.readUInt8(noAssert);

        switch (value & 0xE0) {
            case 0xE0:
                return this.readUInt32BE(noAssert);
            case 0xC0:
                return this.offset(-1).readUInt32BE(noAssert) & 0x1FFFFFFF;
            case 0x80:
            case 0xA0:
                return this.offset(-1).readUInt16BE(noAssert) & 0x3FFF;
        }

        return value;
    }

    /**
     * @param {number} value
     * @param {boolean} unshift
     * @param {boolean} noAssert
     * @returns {NetworkBuffer}
     */
    writeCUInt(value, unshift, noAssert) {
        if (unshift) {
            let buffer = new this.constructor({
                maxBufferLength: 10
            });

            return this._writeCUIntToBuffer(buffer, value, noAssert)._writeNativeBuffer(buffer.buffer, true);
        }

        return this._writeCUIntToBuffer(this, value, noAssert);
    }

    /**
     * @param {string} encoding
     * @param {boolean} noAssert
     * @returns {string}
     */
    readNetworkString(encoding, noAssert) {
        return this.readString(this.readCUInt(noAssert), encoding);
    }

    /**
     * @param {string} value
     * @param {string} encoding
     * @param {boolean} unshift
     * @param {boolean} noAssert
     * @returns {NetworkBuffer}
     */
    writeNetworkString(value, encoding, unshift, noAssert) {
        if (unshift) {
            return this.writeString(value, encoding, true).writeCUInt(Buffer.byteLength(value, encoding), true, noAssert);
        }

        return this.writeCUInt(Buffer.byteLength(value, encoding), false, noAssert).writeString(value, encoding, false);
    }

    /**
     * @param {boolean} noAssert
     * @param {number} maxBufferLength
     * @returns {NetworkBuffer}
     */
    readNetworkBuffer(noAssert, maxBufferLength) {
        let length = this.readCUInt(noAssert);
        maxBufferLength = maxBufferLength || length + 10;

        return this.readBuffer(length, false, {
            maxBufferLength: maxBufferLength
        });
    }

    /**
     * @param {NetworkBuffer|Buffer} value
     * @param {boolean} unshift
     * @param {boolean} noAssert
     * @returns {NetworkBuffer}
     */
    writeNetworkBuffer(value, unshift, noAssert) {
        if (unshift) {
            return this.writeBuffer(value, true).writeCUInt(value.length, true, noAssert);
        }

        return this.writeCUInt(value.length, false, noAssert).writeBuffer(value, false);
    }
}

module.exports = NetworkBuffer;
