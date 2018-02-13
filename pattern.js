'use strict';

const extend = require('./internal/extend');
const Pattern = require('./internal/pattern');

module.exports = (parts, ...captures) => {
	if (!parts[0].startsWith('/')) {
		throw new SyntaxError('Pattern must begin with a slash');
	}

	if (parts.length === 1 && parts[0] === '/') {
		return new Pattern([], false);
	}

	const result = [];

	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];

		if (!part.startsWith('/') || !part.endsWith('/')) {
			throw new SyntaxError('${…} must be a complete path segment');
		}

		if (part !== '/') {
			extend(result, part.slice(1, -1).split('/'));
		}

		result.push(captures[i]);
	}

	last: {
		const last = parts[parts.length - 1];

		if (last === '') {
			break last;
		}

		if (!last.startsWith('/')) {
			throw new SyntaxError('${…} must be a complete path segment');
		}

		extend(result, last.slice(1).split('/'));
	}

	const preferTrailingSlash = result[result.length - 1] === '';

	if (preferTrailingSlash) {
		result.pop();
	}

	return new Pattern(result, preferTrailingSlash);
};
