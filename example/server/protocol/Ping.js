'use strict';

const { ProtocolAbstract } = require('../../../index');

/**
 * @property {number} clientId
 * @property {number} timestamp
 */
module.exports = class Ping extends ProtocolAbstract {
    /**
     * @param {NetworkBuffer|Buffer|Object} buffer
     */
    constructor(buffer) {
        super(buffer || {
            // Default values
            clientId: 0,
            timestamp: 0
        });
    }

    /**
     * @returns {number}
     * @private
     */
    static get _opcode() {
        return 1;
    }

    /**
     * @returns {NetworkBuffer}
     * @private
     */
    _marshal() {
        let buffer = this._makeBuffer(8); // Max buffer size
        buffer.writeInt32BE(this.clientId);
        buffer.writeInt32BE(this.timestamp);
        return buffer;
    }

    /**
     * @param {NetworkBuffer} buffer
     * @private
     */
    _unmarshal(buffer) {
        this.clientId = buffer.readInt32BE();
        this.timestamp = buffer.readInt32BE();
    }
};
