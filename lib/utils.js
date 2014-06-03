// Load modules

var Querystring = require('querystring');


// Declare internals

var internals = {};


exports.parse = function (payload) {

    if (payload[0] === '{') {
        try {
            return JSON.parse(payload);
        }
        catch (err) {
            return err;
        }
    }

    return Querystring.parse(payload);
};