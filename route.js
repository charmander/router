'use strict';

const Pattern = require('./internal/pattern');

class Route {
	constructor(name, pattern, target) {
		if (typeof name !== 'string') {
			throw new TypeError('Route name must be a string');
		}

		if (!(pattern instanceof Pattern)) {
			throw new TypeError('Route pattern must be created with pattern`…`');
		}

		this.name = name;
		this.pattern = pattern;
		this.target = target;
	}
}

module.exports = Route;
