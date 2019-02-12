'use strict';

/**
 * @param {Array} array
 * @returns {Object}
 */
exports.makeBoolObjectFromArray = function (array) {
    let result = {};

    for (let value of array) {
        result[value] = true;
    }

    return result;
};
