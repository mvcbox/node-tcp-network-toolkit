'use strict';

const Socket = require('net').Socket;
const NetworkBuffer = require('./NetworkBuffer');
const ProtocolAbstract = require('./ProtocolAbstract');

/**
 * @param {Socket} socket
 * @param {ProtocolAbstract|Object} packet
 */
module.exports = function (socket, packet) {
    if (!socket.writable) {
        return Promise.resolve(false);
    }

    return new Promise(function (resolve, reject) {
        if (packet instanceof ProtocolAbstract) {
            packet = packet._buildPacket().buffer;
        } else if (packet && packet.opcode && packet.payload instanceof NetworkBuffer) {
            packet = packet.payload.writeCUInt(packet.payload.length, true).writeCUInt(packet.opcode, true).buffer;
        } else if (!(packet instanceof Buffer)) {
            return reject(new TypeError('"packet" has incorrect type'));
        }

        function errorCallback(err) {
            socket.removeListener('error', errorCallback).removeListener('close', closeCallback);
            reject(err);
        }

        function closeCallback() {
            socket.removeListener('error', errorCallback).removeListener('close', closeCallback);
            reject(new Error('Connection lost'));
        }

        socket.on('error', errorCallback).on('close', closeCallback);

        socket.write(packet, function () {
            socket.removeListener('error', errorCallback).removeListener('close', closeCallback);
            resolve(true);
        });
    });
};
