'use strict';

const net = require('net');
const app = require('./app');
const Ping = require('./protocol/Ping');

const client = net.createConnection(3000, function () {
    console.log('createConnection success!');

    let ping = new Ping({
        clientId: 333,
        timestamp: Math.floor(Date.now() / 1000)
    });

    client.write(ping._toPacketWithHeaders().buffer);
    client.pipe(app.writableStream({ socket: client }));
});
