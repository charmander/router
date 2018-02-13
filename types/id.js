'use strict';

const CaptureRegex = require('./capture-regex');
const type = require('./type');

module.exports = type({
	serialize: String,
	deserialize: Number,
	// All 15-digit integers are safe integers
	regex: new CaptureRegex(/[1-9]\d{0,14}/),
});
