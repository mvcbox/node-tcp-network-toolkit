'use strict';

const PacketRouter = require('./PacketRouter');

module.exports = function () {
    return new PacketRouter;
};
