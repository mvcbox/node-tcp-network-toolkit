'use strict';

const NetworkBuffer = require('./NetworkBuffer');

class BaseProtocol {
    /**
     * @param {NetworkBuffer|Buffer|Object} buffer
     */
    constructor(buffer) {
        if (buffer instanceof NetworkBuffer) {
            this._unmarshal(buffer);
        } else if (buffer instanceof Object) {
            Object.assign(this, buffer);
        } else if (buffer instanceof Buffer) {
            this._unmarshal((new NetworkBuffer({
                maxBufferLength: buffer.length
            }))._writeNativeBuffer(buffer));
        }
    }

    /**
     * @returns {NetworkBuffer}
     * @private
     */
    _buildPacket() {
        let buffer = this._marshal();
        return buffer.writeCUInt(buffer.length, true).writeCUInt(this.constructor._opcode, true);
    }

    /**
     * @param {number} maxBufferLength
     * @returns {NetworkBuffer}
     * @private
     */
    _makeBuffer(maxBufferLength) {
        return new NetworkBuffer({
            maxBufferLength: maxBufferLength && maxBufferLength + 10 || 1048576
        });
    }

    /**
     * @returns {number}
     * @private
     */
    static get _opcode() {
        /**
         * Example:
         *
         * return 1;
         */
        throw new Error('You must implement the _opcode() method');
    }

    /**
     * @returns {NetworkBuffer}
     * @private
     */
    _marshal() {
        /**
         * Example:
         *
         * let buffer = this._makeBuffer(12); // 12 - max buffer size
         * buffer.writeInt32BE(this.field1);
         * buffer.writeInt32BE(this.field2);
         * buffer.writeInt32BE(this.field3);
         * return buffer;
         */
        throw new Error('You must implement the _marshal() method');
    }

    /**
     * @param {NetworkBuffer} buffer
     * @private
     */
    _unmarshal(buffer) {
        /**
         * Example:
         *
         * this.field1 = buffer.readInt32BE();
         * this.field2 = buffer.readInt32BE();
         * this.field3 = buffer.readInt32BE();
         */
        throw new Error('You must implement the _unmarshal() method');
    }
}

module.exports = BaseProtocol;
