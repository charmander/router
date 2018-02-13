'use strict';

module.exports = (destination, source) => {
	// allow for destination === source
	const l = source.length;

	for (let i = 0; i < l; i++) {
		destination.push(source[i]);
	}
};
