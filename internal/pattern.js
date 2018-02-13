'use strict';

const escapeStringRegexp = require('escape-string-regexp');
const {inspect} = require('util');

const tryAdd = require('./try-add');
const CaptureRegex = require('../types/capture-regex');

class Pattern {
	constructor(segments, preferTrailingSlash) {
		const captureNames = new Set();
		const captures = [];
		const regexParts = [];

		segments.forEach(segment => {
			if (typeof segment === 'string') {
				regexParts.push(escapeStringRegexp(segment));
				return;
			}

			if (typeof segment.name !== 'string') {
				throw new TypeError('Capture name must be a string');
			}

			if (!tryAdd(captureNames, segment.name)) {
				throw new Error(`Duplicate capture name: ${inspect(segment.name)}`);
			}

			if (!(segment.regex instanceof CaptureRegex)) {
				throw new TypeError('Capture regex must be a CaptureRegex instance');
			}

			regexParts.push('(' + segment.regex.source + ')');
			captures.push(segment);
		});

		this.segments = segments;
		this.captures = captures;
		this.static =
			captures.length === 0 ?
				'/' + segments.join('/') :
				null;
		this.preferTrailingSlash = Boolean(preferTrailingSlash);
		this.regex = regexParts.join('/');

		this._staticReverse = this.static && (
			this.preferTrailingSlash ?
				this.static + '/' :
				this.static
		);
	}

	reverse(captures) {
		if (this._staticReverse !== null) {
			return this._staticReverse;
		}

		let result = '';
		let captureIndex = 0;

		this.segments.forEach(segment => {
			result += '/' + (
				typeof segment === 'string' ?
					segment :
					segment.serialize(captures[captureIndex++])
			);
		});

		if (this.preferTrailingSlash) {
			result += '/';
		}

		return result;
	}
}

module.exports = Pattern;
