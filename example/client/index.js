'use strict';

const net = require('net');
const app = require('./app');
const Ping = require('./protocol/Ping');
const packetParserFactory = require('../../index').packetParserFactory;

const client = net.createConnection(3000, function () {
    console.log('createConnection success!');
    let packetParser = packetParserFactory();

    let ping = new Ping({
        clientId: 333,
        timestamp: Math.floor(Date.now() / 1000)
    });

    client.write(ping._toPacketWithHeaders().buffer);

    client.on('data', function (chunk) {
        app.handlePackets(packetParser(chunk), client);
    });
});
