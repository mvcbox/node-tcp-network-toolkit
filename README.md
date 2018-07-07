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
    /**
     * @param {NetworkBuffer|Buffer|Object} buffer
     */
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

// Add middleware
router.use(function (packet, client, next) {
    console.log('Middleware 1:', packet);
    next();
});

// Add route
router.use(1, function (packet, client, next) {
    console.log('SomePacket route 1:', packet);
    packet.someProperty = 123;
    client.write(packet._buildPacket().buffer);
    next();
});

// Add route
router.use(5, function (packet, client, next) {
    console.log('SomePacket route 5:', packet);
    next();
});

// Add route
router.use([1, 2, 3], function (packet, client, next) {
    console.log('SomePacket route [1, 2, 3]:', packet);
    packet.someProperty = 456;
    client.write(packet._buildPacket().buffer);
    next();
});

// Add middleware
router.use(function (packet, client, next) {
    console.log('Middleware 2:', packet);
    next();
});

/* ------------------------------------------------------------------------------------------------------------------ */
// Create hydrator

const hydrator = hydratorFactory([
    SomePacket
]);

/* ------------------------------------------------------------------------------------------------------------------ */
// TCP Server

net.createServer(function (client) {
    client.pipe(packetParserStreamFactory(hydrator)).pipe(router.stream(client));
}).listen(3000);

```