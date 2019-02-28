'use strict';

const Socket = require('net').Socket;
const ProtocolAbstract = require('./ProtocolAbstract');
const getBufferFromPacket = require('./get-buffer-from-packet');

/**
 * @param {Socket} socket
 * @param {Buffer|NetworkBuffer|ProtocolAbstract|Object} packet
 */
module.exports = function (socket, packet) {
    if (socket.destroyed) {
        return Promise.resolve(false);
    }

    if (socket.write(getBufferFromPacket(packet))) {
        return Promise.resolve(true);
    }

    return new Promise(function (resolve, reject) {
        socket.once('drain', onDrain).once('error', onError).once('close', onClose);

        function onDrain() {
            socket.removeListener('error', onError).removeListener('close', onClose);
            resolve(true);
        }

        function onError(err) {
            socket.removeListener('drain', onDrain).removeListener('close', onClose);
            reject(err);
        }

        function onClose() {
            socket.removeListener('error', onError).removeListener('drain', onDrain);
            reject(new Error('Connection lost'));
        }
    });
};
