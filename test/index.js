'use strict';

const tap = require('tap');

const pattern = require('../pattern');
const Pattern = require('../internal/pattern');
const Route = require('../route');
const Router = require('../');
const CaptureRegex = require('../types/capture-regex');

const id = require('../types/id');
const text = require('../types/text');

tap.test('pattern`` template string tag', t => {
	t.test('produces patterns equivalent to the Pattern constructor', t => {
		t.strictSame(
			pattern`/`,
			new Pattern([], false),
		);

		t.strictSame(
			pattern`/about`,
			new Pattern(['about'], false),
		);

		t.strictSame(
			pattern`/posts/`,
			new Pattern(['posts'], true),
		);

		t.strictSame(
			pattern`/posts/${id('id')}`,
			new Pattern(['posts', id('id')], false),
		);

		t.strictSame(
			pattern`/posts/${id('id')}/${text('slug')}`,
			new Pattern(['posts', id('id'), text('slug')], false),
		);

		t.strictSame(
			pattern`/users/${text('username')}`,
			new Pattern(['users', text('username')], false),
		);

		t.strictSame(
			pattern`/priority/static`,
			new Pattern(['priority', 'static'], false),
		);

		t.end();
	});

	t.test('checks syntax', t => {
		t.throws(() => {
			void pattern`posts/${id('id')}`;
		}, {constructor: SyntaxError, message: 'Pattern must begin with a slash'});

		t.throws(() => {
			void pattern`${id('id')}`;
		}, {constructor: SyntaxError, message: 'Pattern must begin with a slash'});

		t.throws(() => {
			void pattern`/posts/post-${id('id')}`;
		}, {constructor: SyntaxError, message: '${…} must be a complete path segment'});

		t.throws(() => {
			void pattern`/posts/${id('id')}?`;
		}, {constructor: SyntaxError, message: '${…} must be a complete path segment'});

		t.throws(() => {
			void pattern`/posts/${id('id')}${text('text')}`;
		}, {constructor: SyntaxError, message: '${…} must be a complete path segment'});

		t.end();
	});

	t.end();
});

tap.test('pattern constructor', t => {
	t.throws(() => {
		void new Pattern(['posts', id]);
	}, TypeError);

	t.throws(() => {
		void new Pattern(['posts', {name: 1, regex: new CaptureRegex(/a/)}]);
	}, {constructor: TypeError, message: 'Capture name must be a string'});

	t.throws(() => {
		void new Pattern(['posts', {name: 'a', regex: /a/}]);
	}, {constructor: TypeError, message: 'Capture regex must be a CaptureRegex instance'});

	t.throws(() => {
		void new Pattern(['posts', id('id'), id('id')]);
	}, {constructor: Error, message: "Duplicate capture name: 'id'"});

	t.end();
});

tap.test('route constructor', t => {
	t.throws(() => {
		void new Route(null, pattern`/`);
	}, {constructor: TypeError, message: 'Route name must be a string'});

	t.throws(() => {
		void new Route('home', '/');
	}, {constructor: TypeError, message: 'Route pattern must be created with pattern`…`'});

	t.end();
});

tap.test('type constructors', t => {
	t.is(id.prototype, undefined, 'are not exposed directly');

	t.throws(() => {
		id(1);
	}, {constructor: TypeError, message: 'Capture name must be a string'});

	t.throws(() => {
		id(Object('id'));
	}, {constructor: TypeError, message: 'Capture name must be a string'});

	t.end();
});

tap.test('duplicate route names throw', t => {
	t.throws(() => {
		void new Router([
			new Route('home', pattern`/`),
			new Route('home', pattern`/`),
		]);
	}, {constructor: Error, message: "Duplicate route name: 'home'"});

	t.end();
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

tap.test('static routes', t => {
	['/', '/?a=b', '/?a=b/', '/??'].forEach(path => {
		const match = router.match(path);
		t.strictSame(match.captures, {});
		t.is(match.route.name, 'home');
	});

	t.is(router.match('//'), null);

	SUFFIXES.forEach(suffix => {
		{
			const match = router.match('/about' + suffix);
			t.strictSame(match.captures, {});
			t.is(match.route.name, 'about');
		}

		{
			const match = router.match('/posts' + suffix);
			t.strictSame(match.captures, {});
			t.is(match.route.name, 'post-list');
		}
	});

	t.end();
});

tap.test('id captures', t => {
	SUFFIXES.forEach(suffix => {
		IDS.forEach(idTest => {
			const match = router.match('/posts/' + idTest.text + suffix);
			t.strictSame(match.captures, {id: idTest.value});
			t.is(match.route.name, 'post');
		});

		NON_IDS.forEach(text => {
			t.is(router.match('/posts/' + text + suffix), null);
		});
	});

	t.is(router.match('/posts//'), null);
	t.end();
});

tap.test('text captures', t => {
	SUFFIXES.forEach(suffix => {
		TEXT.forEach(text => {
			{
				const match = router.match('/users/' + text + suffix);
				t.strictSame(match.captures, {username: text});
				t.is(match.route.name, 'user');
			}

			{
				const match = router.match('/items/' + text + suffix);
				t.strictSame(match.captures, {username: text});
				t.is(match.route.name, 'items');
			}
		});
	});

	t.is(router.match('/users'), null);
	t.is(router.match('/users/'), null);
	t.is(router.match('/users//'), null);

	t.is(router.match('/items'), null);
	t.is(router.match('/items/'), null);
	t.is(router.match('/items//'), null);

	t.end();
});

tap.test('combined captures', t => {
	SUFFIXES.forEach(suffix => {
		IDS.forEach(idTest => {
			TEXT.forEach(text => {
				const match = router.match('/posts/' + idTest.text + '/' + text + suffix);
				t.strictSame(match.captures, {id: idTest.value, slug: text});
				t.is(match.route.name, 'post-slug');
			});
		});

		NON_IDS.forEach(nonId => {
			TEXT.forEach(text => {
				t.is(router.match('/posts/' + nonId + '/' + text + suffix), null);
			});
		});

		TEXT.forEach(text => {
			t.is(router.match('/posts//' + text + suffix), null);
		});
	});

	IDS.forEach(idTest => {
		t.is(router.match('/posts/' + idTest.text + '//'), null);
	});

	t.is(router.match('/posts///'), null);
	t.end();
});

tap.test('priority', t => {
	t.test('is in route order for captures', t => {
		{
			const match = router.match('/priority/1');
			t.strictSame(match.captures, {id: 1});
			t.is(match.route.name, 'priority-id');
		}

		{
			const match = router.match('/priority/-');
			t.strictSame(match.captures, {text: '-'});
			t.is(match.route.name, 'priority-text');
		}

		{
			const match = router.match('/priority2/1');
			t.strictSame(match.captures, {text: '1'});
			t.is(match.route.name, 'priority2-text');
		}

		{
			const match = router.match('/priority2/-');
			t.strictSame(match.captures, {text: '-'});
			t.is(match.route.name, 'priority2-text');
		}

		t.end();
	});

	t.test('prefers entirely static matches', t => {
		const match = router.match('/priority/static');
		t.strictSame(match.captures, {});
		t.is(match.route.name, 'priority-static');
		t.end();
	});

	t.end();
});

tap.test('reverse', t => {
	t.is(router.reverse('home'), '/');
	t.is(router.reverse('about'), '/about');
	t.is(router.reverse('post-list'), '/posts/');
	t.is(router.reverse('post', [1]), '/posts/1');
	t.is(router.reverse('post-slug', [1, 'title']), '/posts/1/title');
	t.is(router.reverse('user', ['username']), '/users/username');
	t.is(router.reverse('items', ['username']), '/items/username/');

	t.throws(() => {
		router.reverse('unknown');
	}, {constructor: Error, message: "Unknown route 'unknown'"});

	t.end();
});
