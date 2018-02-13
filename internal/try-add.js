'use strict';

module.exports = (set, value) => {
	const present = set.has(value);
	set.add(value);
	return !present;
};
