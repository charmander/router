'use strict';

const {inspect} = require('util');

const removeQueryString = path => {
	const i = path.indexOf('?');

	return i === -1 ?
		path :
		path.substring(0, i);
};

const findStart = match => {
	for (let i = 1; i < match.length; i++) {
		if (match[i] !== undefined) {
			return i;
		}
	}

	/* istanbul ignore next: unreachable */
	return -1;
};

const EMPTY_CAPTURES = Object.freeze({});

class Router {
	constructor(routes) {
		const reverse = new Map();

		routes.forEach(route => {
			if (reverse.has(route.name)) {
				throw new Error(`Duplicate route name: ${inspect(route.name)}`);
			}

			reverse.set(route.name, route);
		});

		const staticMap = new Map();
		const routeRegexes = [];
		const captureRoutes = [null];
		let currentBase = 1;

		routes.forEach(route => {
			const pattern = route.pattern;
			const static_ = pattern.static;

			if (static_ !== null) {
				staticMap.set(static_, route);

				if (static_ !== '/') {
					staticMap.set(static_ + '/', route);
				}
			} else {
				const groupBase = currentBase;
				currentBase += pattern.captures.length;

				routeRegexes.push(pattern.regex);

				for (let i = groupBase; i < currentBase; i++) {
					captureRoutes.push(route);
				}
			}
		});

		this._reverse = reverse;
		this._static = staticMap;
		this._regex = new RegExp('^/(?:' + routeRegexes.join('|') + ')/?$');
		this._captureRoutes = captureRoutes;
	}

	reverse(routeName, captures) {
		const route = this._reverse.get(routeName);

		if (route === undefined) {
			throw new Error(`Unknown route ${inspect(routeName)}`);
		}

		return route.pattern.reverse(captures);
	}

	_staticMatch(pathname) {
		const route = this._static.get(pathname);

		return route === undefined ?
			null :
			{route, captures: EMPTY_CAPTURES};
	}

	_regexMatch(pathname) {
		const match = this._regex.exec(pathname);

		if (match === null) {
			return null;
		}

		const start = findStart(match);
		const route = this._captureRoutes[start];
		const captures = route.pattern.captures;
		const captureValues = {};

		for (let i = 0; i < captures.length; i++) {
			const capture = captures[i];
			captureValues[capture.name] = capture.deserialize(match[start + i]);
		}

		return {
			route,
			captures: captureValues,
		};
	}

	match(path) {
		const pathname = removeQueryString(path);
		return this._staticMatch(pathname) || this._regexMatch(pathname);
	}
}

module.exports = Router;
