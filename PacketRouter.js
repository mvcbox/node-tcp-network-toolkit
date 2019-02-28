'use strict';

const Socket = require('net').Socket;
const Writable = require('stream').Writable;
const eachSeries = require('async/eachSeries');
const ProtocolAbstract = require('./ProtocolAbstract');
const packetParserFactory = require('./packet-parser-factory');
const makeBoolObjectFromArray = require('./utils').makeBoolObjectFromArray;

module.exports = class PacketRouter {
    /**
     *
     */
    constructor() {
        this._handlers = [];
    }

    /**
     * @param {Object} options
     * @param {Socket} options.socket
     * @param {Function} options.packetParser
     * @param {number} options.highWaterMark
     * @param {boolean} options.decodeStrings
     * @param {boolean} options.objectMode
     * @returns {module:stream.internal.Writable}
     */
    writableStream(options) {
        options = options || {};
        const _this = this;
        const packetParser = options.packetParser || packetParserFactory();

        return new Writable({
            objectMode: options.objectMode,
            highWaterMark: options.highWaterMark,
            decodeStrings: options.decodeStrings,

            /**
             * @param {Buffer} chunk
             * @param {string} encoding
             * @param {Function} callback
             */
            write(chunk, encoding, callback) {
                _this.handlePackets(packetParser(chunk), options.socket);
                callback();
            }
        });
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
     * @param {Function} callback
     */
    handlePacket(packet, socket, callback) {
        eachSeries(
            this._handlers,

            /**
             * @param {Object} item
             * @param {Function} next
             */
            function(item, next) {
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

                    if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
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
                    callback(err);
                } else if (err && this._errorHandler) {
                    this._errorHandler(err);
                }
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
            for (let item of handler) {
                this.use(item.handler, item.opcode);
            }

            return this;
        }

        if (opcode) {
            opcode = Array.isArray(opcode) ? opcode : [opcode];
            opcode = opcode.map(function (item) {
                return item && item.prototype instanceof ProtocolAbstract ? item._opcode : item;
            });
        }

        if (handler instanceof PacketRouter) {
            opcode = opcode || handler._handlers.reduce(function (accum, item) {
                if (item.opcode) {
                    accum = accum.concat(Object.keys(item.opcode));
                }

                return accum;
            }, []);
            opcode = opcode.length ? makeBoolObjectFromArray(opcode) : undefined;
        } else {
            handler = handler.bind(this);
            opcode = opcode && makeBoolObjectFromArray(opcode);
        }

        this._handlers.push({
            handler: handler,
            opcode: opcode
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
