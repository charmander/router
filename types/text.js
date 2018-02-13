'use strict';

const identity = x => x;
const CaptureRegex = require('./capture-regex');
const type = require('./type');

module.exports = type({
	serialize: identity,
	deserialize: identity,
	regex: new CaptureRegex(/[^/]+/),
});
