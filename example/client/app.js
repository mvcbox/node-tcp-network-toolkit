'use strict';

const {
    hydratorMiddlewareFactory,
    packetRouterFactory,
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

        client.write(ping._buildPacket().buffer);
    }, 3000);
}, 2);

app.setErrorHandler(function (err) {
    console.error('ClientError:', err)
});
