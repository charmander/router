#!/usr/bin/env node
/* eslint no-console: off */
'use strict';

const lock = require('../package-lock.json');
const deps = lock.dependencies;

for (const [name, {dev}] of Object.entries(deps)) {
	if (dev) {
		delete deps[name];
	}
}

console.log(JSON.stringify(lock, null, '\t'));
