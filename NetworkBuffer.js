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
            buffer.writeUIntBE(value, 1, false, noAssert);
        } else if (value < 0x4000) {
            tmp = value | 0x8000;

            if (tmp < 0) {
                buffer.writeIntBE(tmp, 2, false, noAssert);
            } else {
                buffer.writeUIntBE(tmp, 2, false, noAssert);
            }
        } else if (value < 0x20000000) {
            tmp = value | 0xC0000000;

            if (tmp < 0) {
                buffer.writeIntBE(tmp, 4, false, noAssert);
            } else {
                buffer.writeUIntBE(tmp, 4, false, noAssert);
            }
        } else {
            buffer.writeUIntBE(0xE0, 1, false, noAssert).writeUIntBE(value, 4, false, noAssert);
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

        let value = this.readUIntBE(1);
        --this._pointer;

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
        let value = this.readUIntBE(1, noAssert);

        switch (value & 0xE0) {
            case 0xE0:
                return this.readUIntBE(4, noAssert);
            case 0xC0:
                --this._pointer;
                return this.readUIntBE(4, noAssert) & 0x1FFFFFFF;
            case 0x80:
            case 0xA0:
                --this._pointer;
                return this.readUIntBE(2, noAssert) & 0x3FFF;
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
                maxBufferLength: 5
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
     * @param {boolean} asNative
     * @param {number} reservedSize
     * @returns {NetworkBuffer}
     */
    readNetworkBuffer(noAssert, asNative, reservedSize) {
        let length = this.readCUInt(noAssert);

        return this.readBuffer(length, asNative, {
            maxBufferLength: length + (reservedSize || 10)
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
