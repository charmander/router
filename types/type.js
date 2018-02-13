'use strict';

module.exports = prototype => {
	function Capture(name) {
		if (typeof name !== 'string') {
			throw new TypeError('Capture name must be a string');
		}

		this.name = name;
	}

	Capture.prototype = prototype;

	return name => new Capture(name);
};
