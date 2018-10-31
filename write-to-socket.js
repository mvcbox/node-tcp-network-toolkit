'use strict';

const Socket = require('net').Socket;
const ProtocolAbstract = require('./ProtocolAbstract');
const getBufferFromPacket = require('./get-buffer-from-packet');

/**
 * @param {Socket} socket
 * @param {ProtocolAbstract|Object} packet
 */
module.exports = function (socket, packet) {
    if (!socket.writable) {
        return Promise.resolve(false);
    }

    return new Promise(function (resolve, reject) {
        packet = getBufferFromPacket(packet);

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
