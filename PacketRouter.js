'use strict';

const { Writable } = require('stream');
const BaseProtocol = require('./BaseProtocol');
const eachSeries = require('async/eachSeries');

class PacketRouter {
    /**
     *
     */
    constructor() {
        this._handlers = [];
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
                done();
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
        let opcode = packet.constructor._opcode;
        
        eachSeries(this._handlers, function (item, next) {
            if (undefined === item.opcode || item.opcode.includes(opcode)) {
                return item.handler(packet, socket, next);
            }

            next();
        });
    }

    /**
     * @param {Array} args
     * @returns {PacketRouter}
     */
    use(...args) {
        if (args.length) {
            this._handlers.push({
                opcode: 1 === args.length ? undefined : [].concat(args[0]),
                handler: 1 === args.length ? args[0] : args[1]
            });
        }

        return this;
    }
}

module.exports = PacketRouter;
