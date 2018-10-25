'use strict';

const {
    hydratorMiddlewareFactory,
    packetRouterFactory,
    writeToSocket
} = require('../../index');

const app = module.exports = packetRouterFactory();

// protocol
const Ping = require('./protocol/Ping');

app.use(hydratorMiddlewareFactory(require('./protocol/index')));

// Pong route
app.use(function (packet, client) {
    console.log('Pong:', packet.packet);

    setTimeout(function () {
        let ping = new Ping({
            clientId: 333,
            timestamp: Math.floor(Date.now() / 1000)
        });

        writeToSocket(client, ping).then(console.log).catch(console.error);
    }, 3000);
}, 2);

app.setErrorHandler(function (err) {
    console.error('ClientError:', err)
});
