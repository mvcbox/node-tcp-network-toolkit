'use strict';

const net = require('net');
const app = require('./app');

net.createServer(function (client) {
    console.log('New client connection!');
    client.pipe(app.writableStream({ socket: client }));
}).listen(3000);
