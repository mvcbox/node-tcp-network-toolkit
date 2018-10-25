'use strict';

const Socket = require('net').Socket;
const eachSeries = require('async/eachSeries');
const { makeBoolObjectFromArray, arrayUnique } = require('./utils');

class PacketRouter {
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
     * @returns {PacketRouter}
     */
    handlePackets(packets, socket) {
        for (let packet of packets) {
            this.handlePacket(packet, socket);
        }

        return this;
    }

    /**
     * @param {Object} packet
     * @param {Socket} socket
     * @param {Function|undefined} callback
     * @returns {PacketRouter}
     */
    handlePacket(packet, socket, callback) {
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

                if (item.handler instanceof PacketRouter) {
                    return item.handler.handlePacket(packet, socket, next);
                }

                try {
                    let result = item.handler(packet, socket, function (err) {
                        err ? next({ err, packet, socket }) : next();
                    });

                    if (result && typeof result.catch === 'function') {
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
                if (callback) {
                    return callback(err);
                }

                err && this._errorHandler(err);
            }
        );

        return this;
    }

    /**
     * @param {Function|PacketRouter} handler
     * @param {Array|undefined} opcode
     * @returns {PacketRouter}
     */
    use(handler, opcode) {
        if (opcode) {
            opcode = makeBoolObjectFromArray(Array.isArray(opcode) ? opcode : [opcode]);
        } else if (handler instanceof PacketRouter) {
            opcode = makeBoolObjectFromArray(handler.getDefinedDpcodes());
        }

        this._handlers.push({
            handler,
            opcode
        });

        return this;
    }

    /**
     * @returns {Array}
     */
    getDefinedDpcodes() {
        let result = [];

        for (let item of this._handlers) {
            if (item.handler instanceof PacketRouter) {
                result.push(...item.handler.getDefinedDpcodes());
            } else if (item.opcode) {
                result.push(...Object.keys(item.opcode).map(Number));
            }
        }

        return arrayUnique(result);
    }

    /**
     * @param {Function} errorHandler
     * @returns {PacketRouter}
     */
    setErrorHandler(errorHandler) {
        this._errorHandler = errorHandler;
        return this;
    }
}

module.exports = PacketRouter;
