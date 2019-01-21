'use strict';

const Socket = require('net').Socket;
const eachSeries = require('async/eachSeries');
const ProtocolAbstract = require('./ProtocolAbstract');
const { makeBoolObjectFromArray, arrayUnique } = require('./utils');

module.exports = class PacketRouter {
    /**
     *
     */
    constructor() {
        this._handlers = [];
        this._errorHandler = function () {}
    }

    /**
     * @param {Array} packets
     * @param {Socket} socket
     */
    handlePackets(packets, socket) {
        for (let packet of packets) {
            this.handlePacket(packet, socket);
        }
    }

    /**
     * @param {Object} packet
     * @param {Socket} socket
     */
    handlePacket(packet, socket) {
        eachSeries(
            this._handlers,

            /**
             * @param {Object} item
             * @param {Function} next
             */
            (item, next) => {
                if (item.opcode && !(packet.opcode in item.opcode)) {
                    return next();
                }

                try {
                    let result = item.handler(packet, socket, function (err) {
                        err ? next({ err, packet, socket }) : next();
                    });

                    if (result && typeof result.then === 'function') {
                        result.catch(function (err) {
                            next({ err, packet, socket });
                        });
                    }
                } catch (err) {
                    next({ err, packet, socket });
                }
            },

            /**
             * @param {*} err
             */
            err => {
                err && this._errorHandler(err);
            }
        );
    }

    /**
     * @param {Function|Array} handler
     * @param {Array|ProtocolAbstract|number|undefined} opcode
     * @returns {PacketRouter}
     */
    use(handler, opcode) {
        if (Array.isArray(handler)) {
            for (let { handler: _handler, opcode: _opcode } of handler) {
                this.use(_handler, _opcode);
            }

            return this;
        }

        if (opcode) {
            opcode = Array.isArray(opcode) ? opcode : [opcode];
            opcode = opcode.map(function (item) {
                return item && item.prototype instanceof ProtocolAbstract ? item._opcode : item;
            });
        }

        this._handlers.push({
            handler: handler.bind(this),
            opcode: opcode && makeBoolObjectFromArray(opcode)
        });

        return this;
    }

    /**
     * @param {Function} errorHandler
     * @returns {PacketRouter}
     */
    setErrorHandler(errorHandler) {
        this._errorHandler = errorHandler.bind(this);
        return this;
    }
};
