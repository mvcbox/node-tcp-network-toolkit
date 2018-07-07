'use strict';

const { Writable } = require('stream');
const BaseProtocol = require('./BaseProtocol');

class PacketRouter {
    /**
     *
     */
    constructor() {
        this._routes = {};
    }

    /**
     * @param {Socket} socket
     * @returns {Writable}
     */
    stream(socket) {
        let _this = this;

        return new (class extends Writable {
            /**
             * @param {Buffer} chunk
             * @param {string} encoding
             * @param {Function} done
             * @private
             */
            _write(chunk, encoding, done) {
                _this._handlePacket(chunk, socket);
            }
        })({
            objectMode: true
        });
    }

    /**
     * @param {BaseProtocol} packet
     * @param {Socket} socket
     * @private
     */
    _handlePacket(packet, socket) {
        if (this._routes[packet._opcode]) {
            this._routes[packet._opcode].forEach(function (handler) {
                handler(packet, socket);
            });
        }

        if (this._routes['*']) {
            this._routes['*'].forEach(function (handler) {
                handler(packet, socket);
            });
        }
    }

    /**
     * @param {Array|number|string} opcodes
     * @param {Function} handler
     * @returns {PacketRouter}
     */
    addRoute(opcodes, handler) {
        if (!Array.isArray(opcodes)) {
            opcodes = [opcodes];
        }

        opcodes.forEach(opcode => {
            this._routes[opcode] ? this._routes[opcode].push(handler) : this._routes[opcode] = [handler];
        });

        return this;
    }
}

module.exports = PacketRouter;
