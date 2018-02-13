'use strict';

const tap = require('tap');

const CaptureRegex = require('../types/capture-regex');

tap.test('new types', t => {
	t.test('can’t capture slashes', t => {
		const attempt = regex => () => {
			void new CaptureRegex(regex);
		};

		const error = {
			constructor: Error,
			message: 'Capture’s pattern cannot match any strings containing slashes',
		};

		t.throws(attempt(/\//), error);
		t.throws(attempt(/[/]/), error);
		t.throws(attempt(/\x2f/), error);
		t.throws(attempt(/[\x2f]/), error);
		t.throws(attempt(/\x2F/), error);
		t.throws(attempt(/[\x2F]/), error);
		t.throws(attempt(/\u002f/), error);
		t.throws(attempt(/[\u002f]/), error);
		t.throws(attempt(/[\x00-/]/), error);
		t.throws(attempt(/[/-~]/), error);
		t.throws(attempt(/./), error);
		t.throws(attempt(/[^]/), error);
		t.throws(attempt(/a(?:\/)/), error);
		t.throws(attempt(/abc\/d/), error);
		t.throws(attempt(/[\^/]/), error);

		t.end();
	});

	t.test('can’t specify regex flags', t => {
		t.throws(() => {
			void new CaptureRegex(/[a-z]+/i);
		}, {constructor: Error, message: 'Capture’s pattern cannot specify flags'});

		t.end();
	});

	t.test('can’t be constructed from non-RegExp values', t => {
		t.throws(() => {
			void new CaptureRegex('[a-z]+');
		}, {constructor: TypeError, message: 'CaptureRegex must be constructed from RegExp object'});

		t.end();
	});

	t.end();
});
