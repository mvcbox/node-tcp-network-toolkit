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

/**
 * @param {Array} array
 * @returns {Array}
 */
exports.arrayUnique = function (array) {
    return array.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });
};
