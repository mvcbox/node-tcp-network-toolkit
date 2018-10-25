'use strict';

const {
    hydratorMiddlewareFactory,
    packetRouterFactory,
    writeToSocket
} = require('../../index');

const app = module.exports = packetRouterFactory();

// protocol
const Pong = require('./protocol/Pong');

app.use(hydratorMiddlewareFactory(require('./protocol/index')));

// Ping route
app.use(function (packet, client) {
    console.log('Ping:', packet.packet);

    setTimeout(function () {
        let pong = new Pong({
            serverId: 777,
            timestamp: Math.floor(Date.now() / 1000)
        });

        writeToSocket(client, pong).then(console.log).catch(console.error);
    }, 3000);
}, 1);

app.setErrorHandler(function (err) {
    console.error('ServerError:', err)
});
