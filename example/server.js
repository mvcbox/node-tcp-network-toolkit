'use strict';

const net = require('net');
const {
    BaseProtocol,
    NetworkBuffer,
    hydratorFactory,
    packetRouterFactory,
    packetParserStreamFactory
} = require('../index');

/* ------------------------------------------------------------------------------------------------------------------ */
// Some packet

/**
 * @property {number} someProperty
 */
class SomePacket extends BaseProtocol {
    constructor(buffer) {
        super(buffer || {
            someProperty: 0 // Default value
        });
    }

    /**
     * @returns {number}
     * @private
     */
    static get _opcode() {
        return 1;
    }

    /**
     * @returns {NetworkBuffer}
     * @private
     */
    _marshal() {
        let buffer = this._makeBuffer(4);
        buffer.writeInt32BE(this.someProperty);
        return buffer;
    }

    /**
     * @param {NetworkBuffer} buffer
     * @private
     */
    _unmarshal(buffer) {
        this.someProperty = buffer.readInt32BE();
    }
}

/* ------------------------------------------------------------------------------------------------------------------ */
// Packet routes

const router = packetRouterFactory();

router.addRoute(1, function (packet, client) {
    console.log('SomePacket route:', packet);
    console.log('SomePacket route:', packet.someProperty);

    packet.someProperty = 123;

    client.write(packet._buildPacket().buffer);
});

router.addRoute('*', function (packet, client) {
    console.log('Any packet route:', packet);
});

/* ------------------------------------------------------------------------------------------------------------------ */
// Create hydrator

/**
 * Packet map for hydrator
 */
const hydratorMap = [
    SomePacket
];

const hydrator = hydratorFactory(hydratorMap);

/* ------------------------------------------------------------------------------------------------------------------ */
// TCP Server

net.createServer(function (client) {
    client.pipe(packetParserStreamFactory(hydrator)).pipe(router.stream(client));
}).listen(3000);
