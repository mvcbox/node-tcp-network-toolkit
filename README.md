# node-tcp-network-toolkit

#### Client example:
```javascript
'use strict';

const { NetworkBuffer } = require('tcp-network-toolkit');
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
```

#### Server example:
```javascript
'use strict';

const net = require('net');
const {
    BaseProtocol,
    NetworkBuffer,
    hydratorFactory,
    packetRouterFactory,
    packetParserStreamFactory
} = require('tcp-network-toolkit');

/* ------------------------------------------------------------------------------------------------------------------ */
// Some packet

/**
 * @property {number} someProperty
 */
class SomePacket extends BaseProtocol {
    constructor(buffer) {
        super(1, buffer || {
            someProperty: 0 // Default value
        });
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
const hydratorMap = {
    1: SomePacket // opcode: PacketClass
};

const hydrator = hydratorFactory(hydratorMap);

/* ------------------------------------------------------------------------------------------------------------------ */
// TCP Server

net.createServer(function (client) {
    client.pipe(packetParserStreamFactory(hydrator)).pipe(router.stream(client));
}).listen(3000);
```