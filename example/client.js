'use strict';

const { NetworkBuffer } = require('../index');
const net = require('net');

let client = net.createConnection(3000, function () {
    let buffer = new NetworkBuffer;
    buffer.writeCUInt(1); // Opcode
    buffer.writeCUInt(4); // Data length
    buffer.writeInt32BE(357); // Data
    client.write(buffer.buffer);

    client.on('data', function (chunk, encoding, done) {
        console.log('Response:', chunk);
        let buffer = (new NetworkBuffer).writeBuffer(chunk);
        console.log('Opcode:', buffer.readCUInt());
        console.log('Length:', buffer.readCUInt());
        console.log('someProperty value:', buffer.readInt32BE());
        client.end().unref();
    });
});
