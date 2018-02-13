'use strict';

const ret3 = require('reflect-type-3');

const matches = code => {
	const atomMatches = atom => {
		switch (atom.type) {
		case 'Character':
			return atom.value === code;

		case 'CharacterClass':
			return atom.ranges.some(range => range.start <= code && code <= range.end) !== atom.negated;

		case 'Disjunction':
			return disjunctionMatches(atom);
		}

		/* istanbul ignore next: unreachable */
		throw new Error('Unexpected');
	};

	const termMatches = term =>
		atomMatches(term.atom);

	const alternativeMatches = alternative =>
		alternative.terms.some(termMatches);

	const disjunctionMatches = disjunction =>
		disjunction.alternatives.some(alternativeMatches);

	return disjunctionMatches;
};

// URL normalizes backslashes
const matchesSlash = matches('/'.charCodeAt(0));

class CaptureRegex {
	constructor(regex) {
		if (!(regex instanceof RegExp)) {
			throw new TypeError('CaptureRegex must be constructed from RegExp object');
		}

		if (regex.flags !== '') {
			throw new Error('Capture’s pattern cannot specify flags');
		}

		const source = regex.source;
		const root = ret3.parse(source);

		if (matchesSlash(root)) {
			throw new Error('Capture’s pattern cannot match any strings containing slashes');
		}

		this.source = source;
	}
}

module.exports = CaptureRegex;
