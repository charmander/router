'use strict';

const assert = require('assert');
const test = require('@charmander/test')(module);

const pattern = require('../pattern');
const Pattern = require('../internal/pattern');
const Route = require('../route');
const Router = require('../');
const CaptureRegex = require('../types/capture-regex');

const id = require('../types/id');
const text = require('../types/text');

test.group('pattern`` template string tag', test => {
	test('produces patterns equivalent to the Pattern constructor', () => {
		assert.deepStrictEqual(
			pattern`/`,
			new Pattern([], false),
		);

		assert.deepStrictEqual(
			pattern`/about`,
			new Pattern(['about'], false),
		);

		assert.deepStrictEqual(
			pattern`/posts/`,
			new Pattern(['posts'], true),
		);

		assert.deepStrictEqual(
			pattern`/posts/${id('id')}`,
			new Pattern(['posts', id('id')], false),
		);

		assert.deepStrictEqual(
			pattern`/posts/${id('id')}/${text('slug')}`,
			new Pattern(['posts', id('id'), text('slug')], false),
		);

		assert.deepStrictEqual(
			pattern`/users/${text('username')}`,
			new Pattern(['users', text('username')], false),
		);

		assert.deepStrictEqual(
			pattern`/priority/static`,
			new Pattern(['priority', 'static'], false),
		);

	});

	test('checks syntax', () => {
		assert.throws(() => {
			void pattern`posts/${id('id')}`;
		}, /^SyntaxError: Pattern must begin with a slash$/);

		assert.throws(() => {
			void pattern`${id('id')}`;
		}, /^SyntaxError: Pattern must begin with a slash$/);

		assert.throws(() => {
			void pattern`/posts/post-${id('id')}`;
		}, /^SyntaxError: \${…} must be a complete path segment$/);

		assert.throws(() => {
			void pattern`/posts/${id('id')}?`;
		}, /^SyntaxError: \${…} must be a complete path segment$/);

		assert.throws(() => {
			void pattern`/posts/${id('id')}${text('text')}`;
		}, /^SyntaxError: \${…} must be a complete path segment$/);
	});
});

test.group('pattern constructor', test => {
	test('checks capture name types', () => {
		assert.throws(() => {
			void new Pattern(['posts', {name: 1, regex: new CaptureRegex(/a/)}]);
		}, /^TypeError: Capture name must be a string$/);
	});

	test('checks capture regex types', () => {
		assert.throws(() => {
			void new Pattern(['posts', id]);
		}, /^TypeError: Capture regex must be a CaptureRegex instance$/);

		assert.throws(() => {
			void new Pattern(['posts', {name: 'a', regex: /a/}]);
		}, /^TypeError: Capture regex must be a CaptureRegex instance$/);
	});

	test('disallows duplicate capture names', () => {
		assert.throws(() => {
			void new Pattern(['posts', id('id'), id('id')]);
		}, /^Error: Duplicate capture name: 'id'$/);
	});
});

test.group('route constructor', test => {
	test('checks route name type', () => {
		assert.throws(() => {
			void new Route(null, pattern`/`);
		}, /^TypeError: Route name must be a string$/);
	});

	test('checks route pattern type', () => {
		assert.throws(() => {
			void new Route('home', '/');
		}, /^TypeError: Route pattern must be created with pattern`…`$/);
	});
});

test.group('type constructors', test => {
	test('are not exposed directly', () => {
		assert.strictEqual(id.prototype, undefined);
	});

	test('check argument types', () => {
		assert.throws(() => {
			id(1);
		}, /^TypeError: Capture name must be a string$/);

		assert.throws(() => {
			id(Object('id'));
		}, /^TypeError: Capture name must be a string$/);
	});
});

test('duplicate route names throw', () => {
	assert.throws(() => {
		void new Router([
			new Route('home', pattern`/`),
			new Route('home', pattern`/`),
		]);
	}, /^Error: Duplicate route name: 'home'$/);
});

const router = new Router([
	new Route('home', pattern`/`),
	new Route('about', pattern`/about`),
	new Route('post-list', pattern`/posts/`),
	new Route('post', pattern`/posts/${id('id')}`),
	new Route('post-slug', pattern`/posts/${id('id')}/${text('slug')}`),
	new Route('user', pattern`/users/${text('username')}`),
	new Route('items', pattern`/items/${text('username')}/`),
	new Route('priority-id', pattern`/priority/${id('id')}`),
	new Route('priority-text', pattern`/priority/${text('text')}`),
	new Route('priority2-text', pattern`/priority2/${text('text')}`),
	new Route('priority2-id', pattern`/priority2/${id('id')}`),
	new Route('priority-static', pattern`/priority/static`),
]);

const SUFFIXES = [
	'',
	'/',
	'?a=b',
	'/?a=b',
	'?a=b/',
	'/?a=b/',
	'??',
];

const IDS = [
	{text: '1', value: 1},
	{text: '20', value: 20},
	{text: '822709461058169', value: 822709461058169},
];

const NON_IDS = [
	'0',
	'-1',
	'١',
	'01',
	'1.',
	'1e1',
	'0x1',
	String(Number.MAX_SAFE_INTEGER + 1),
	'Infinity',
	'-Infinity',
	'NaN',
];

const TEXT = [
	'a',
	' ',
	'\n',
	'\0',
	'string',
	'posts',
];

test('static routes', () => {
	['/', '/?a=b', '/?a=b/', '/??'].forEach(path => {
		const match = router.match(path);
		assert.deepStrictEqual(match.captures, {});
		assert.strictEqual(match.route.name, 'home');
	});

	assert.strictEqual(router.match('//'), null);

	SUFFIXES.forEach(suffix => {
		{
			const match = router.match('/about' + suffix);
			assert.deepStrictEqual(match.captures, {});
			assert.strictEqual(match.route.name, 'about');
		}

		{
			const match = router.match('/posts' + suffix);
			assert.deepStrictEqual(match.captures, {});
			assert.strictEqual(match.route.name, 'post-list');
		}
	});

});

test('id captures', () => {
	SUFFIXES.forEach(suffix => {
		IDS.forEach(idTest => {
			const match = router.match('/posts/' + idTest.text + suffix);
			assert.deepStrictEqual(match.captures, {id: idTest.value});
			assert.strictEqual(match.route.name, 'post');
		});

		NON_IDS.forEach(text => {
			assert.strictEqual(router.match('/posts/' + text + suffix), null);
		});
	});

	assert.strictEqual(router.match('/posts//'), null);
});

test('text captures', () => {
	SUFFIXES.forEach(suffix => {
		TEXT.forEach(text => {
			{
				const match = router.match('/users/' + text + suffix);
				assert.deepStrictEqual(match.captures, {username: text});
				assert.strictEqual(match.route.name, 'user');
			}

			{
				const match = router.match('/items/' + text + suffix);
				assert.deepStrictEqual(match.captures, {username: text});
				assert.strictEqual(match.route.name, 'items');
			}
		});
	});

	assert.strictEqual(router.match('/users'), null);
	assert.strictEqual(router.match('/users/'), null);
	assert.strictEqual(router.match('/users//'), null);

	assert.strictEqual(router.match('/items'), null);
	assert.strictEqual(router.match('/items/'), null);
	assert.strictEqual(router.match('/items//'), null);

});

test('combined captures', () => {
	SUFFIXES.forEach(suffix => {
		IDS.forEach(idTest => {
			TEXT.forEach(text => {
				const match = router.match('/posts/' + idTest.text + '/' + text + suffix);
				assert.deepStrictEqual(match.captures, {id: idTest.value, slug: text});
				assert.strictEqual(match.route.name, 'post-slug');
			});
		});

		NON_IDS.forEach(nonId => {
			TEXT.forEach(text => {
				assert.strictEqual(router.match('/posts/' + nonId + '/' + text + suffix), null);
			});
		});

		TEXT.forEach(text => {
			assert.strictEqual(router.match('/posts//' + text + suffix), null);
		});
	});

	IDS.forEach(idTest => {
		assert.strictEqual(router.match('/posts/' + idTest.text + '//'), null);
	});

	assert.strictEqual(router.match('/posts///'), null);
});

test.group('priority', test => {
	test('is in route order for captures', () => {
		{
			const match = router.match('/priority/1');
			assert.deepStrictEqual(match.captures, {id: 1});
			assert.strictEqual(match.route.name, 'priority-id');
		}

		{
			const match = router.match('/priority/-');
			assert.deepStrictEqual(match.captures, {text: '-'});
			assert.strictEqual(match.route.name, 'priority-text');
		}

		{
			const match = router.match('/priority2/1');
			assert.deepStrictEqual(match.captures, {text: '1'});
			assert.strictEqual(match.route.name, 'priority2-text');
		}

		{
			const match = router.match('/priority2/-');
			assert.deepStrictEqual(match.captures, {text: '-'});
			assert.strictEqual(match.route.name, 'priority2-text');
		}
	});

	test('prefers entirely static matches', () => {
		const match = router.match('/priority/static');
		assert.deepStrictEqual(match.captures, {});
		assert.strictEqual(match.route.name, 'priority-static');
	});
});

test('reverse', () => {
	assert.strictEqual(router.reverse('home'), '/');
	assert.strictEqual(router.reverse('about'), '/about');
	assert.strictEqual(router.reverse('post-list'), '/posts/');
	assert.strictEqual(router.reverse('post', [1]), '/posts/1');
	assert.strictEqual(router.reverse('post-slug', [1, 'title']), '/posts/1/title');
	assert.strictEqual(router.reverse('user', ['username']), '/users/username');
	assert.strictEqual(router.reverse('items', ['username']), '/items/username/');

	assert.throws(() => {
		router.reverse('unknown');
	}, /^Error: Unknown route 'unknown'$/);
});
