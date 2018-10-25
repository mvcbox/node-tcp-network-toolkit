'use strict';

const net = require('net');
const app = require('./app');
const { packetParserFactory } = require('../../index');

net.createServer(function (client) {
    console.log('New client connection!');
    let packetParser = packetParserFactory();

    client.on('data', function (chunk) {
        app.handlePackets(packetParser(chunk), client);
    });
}).listen(3000);
