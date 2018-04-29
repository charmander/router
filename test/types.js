'use strict';

const assert = require('assert');
const test = require('@charmander/test')(module);

const CaptureRegex = require('../types/capture-regex');

test.group('new types', test => {
	test('can’t capture slashes', () => {
		const attempt = regex => () => {
			void new CaptureRegex(regex);
		};

		const error =
			/^Error: Capture’s pattern cannot match any strings containing slashes$/;

		assert.throws(attempt(/\//), error);
		assert.throws(attempt(/[/]/), error);
		assert.throws(attempt(/\x2f/), error);
		assert.throws(attempt(/[\x2f]/), error);
		assert.throws(attempt(/\x2F/), error);
		assert.throws(attempt(/[\x2F]/), error);
		assert.throws(attempt(/\u002f/), error);
		assert.throws(attempt(/[\u002f]/), error);
		assert.throws(attempt(/[\x00-/]/), error);
		assert.throws(attempt(/[/-~]/), error);
		assert.throws(attempt(/./), error);
		assert.throws(attempt(/[^]/), error);
		assert.throws(attempt(/a(?:\/)/), error);
		assert.throws(attempt(/abc\/d/), error);
		assert.throws(attempt(/[\^/]/), error);
	});

	test('can’t specify regex flags', () => {
		assert.throws(() => {
			void new CaptureRegex(/[a-z]+/i);
		}, /^Error: Capture’s pattern cannot specify flags$/);
	});

	test('can’t be constructed from non-RegExp values', () => {
		assert.throws(() => {
			void new CaptureRegex('[a-z]+');
		}, /^TypeError: CaptureRegex must be constructed from RegExp object$/);
	});
});
