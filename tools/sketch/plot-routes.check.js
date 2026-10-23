// The check of the rules of a plot (ST-030, ST-040), routes.js and store/rules.js, with nothing
// running: the names in a plot's folder, and what a plot's folder can be called. No path names a
// plot: the server gives none, makes none and keeps no sketch (T-040.5, T-041.4) -
// plots-served.check.js asks it. And of routes.js the map's page, on both kinds of pad: on the
// made-up pad its page alone, answered with nothing (204), and nothing else of its folder. It
// reads made-up plots alone - the example, and the names of the folders of
// tests/__fixtures__/plots - and of design/ nothing. Run by check.js, as every check is.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { read } from './plot-file.js';
import { EXAMPLE_FILE, MAP, MAP_PAGE, NO_PAGE, PLOT_FILE, PLOT_KEEPS, route } from './routes.js';
import { EXAMPLE, KEPT_NAME_MAX, OWN, SPACE, keptName, plotName } from './store/rules.js';

// The constants, typed in. The example lies in the pad's own folder: its file is there, and it
// is the made-up plot.
const CONSTANTS = [PLOT_FILE, PLOT_KEEPS, EXAMPLE, EXAMPLE_FILE, OWN, SPACE];
const TYPED = ['plot.json', 'sketches', 'example', 'example/plot.json', 'home'];
TYPED.push('blockplot/sketch/space');
assert.deepEqual(CONSTANTS, TYPED);
const example = read(readFileSync(path.join(import.meta.dirname, EXAMPLE_FILE), 'utf8')).site;
assert.equal(example.name, 'Made-up hillside plot');

// What a plot's folder can be called: the rule of a kept sketch's name, the very one - on every
// kind of name that kept.check.js tries, typed in again, and on the pad's own two.
const LONGEST = 'n'.repeat(KEPT_NAME_MAX);
const NAMES = ['plan', 'Plan B', '2026-10-10 14.30.05', 'a', '7', '_', '-x', 'a_b-c', 'a.b.c'];
NAMES.push('ends.', 'two  blanks', 'plan.json', 'CON', LONGEST, 'second', 'My plot', OWN, EXAMPLE);
const NO_NAMES = {
  'a slash': ['a/b', '/a', 'a/', '/'],
  'a backslash': ['a\\b', '\\a', '..\\a'],
  'two dots, or a dot at its start': ['..', '.', '...', '.hidden', '../a'],
  'an encoded one': ['%2e%2e', 'a%2fb', 'a%5cb', '%2Fa', 'a%20b', 'a%00', 'a%2eb', 'pl%61n'],
  'nothing in it, or a blank at an end': ['', ' ', '   ', ' a', 'a ', ' a '],
  'one of 81': [`${LONGEST}n`],
  'another letter': ['Küche', 'ſ', 'ı', 'é'],
  'another sign': ['a:b', 'a*b', 'a?b', 'a"b', 'a<b', 'a|b', 'a,b', 'a (1)', 'a\nb', 'a\tb'],
  'what is no text': [undefined, null, 7, ['plan']],
};
const REFUSED = Object.values(NO_NAMES).flat();
for (const name of NAMES) assert.deepEqual([plotName(name), keptName(name)], [true, true], name);
for (const name of REFUSED) assert.deepEqual([plotName(name), keptName(name)], [false, false]);
// The made-up plots of the tests are a folder of plots: each under a name that a plot can have,
// the pad's own among them, with its file in it and no sketch kept.
const FIXTURES = path.join(import.meta.dirname, '..', '..', 'tests', '__fixtures__', 'plots');
const made = readdirSync(FIXTURES);
assert.ok(made.includes(OWN) && made.every(plotName), made.join());
const holds = (id, name) => existsSync(path.join(FIXTURES, id, name));
for (const id of made) assert.ok(holds(id, PLOT_FILE) && !holds(id, PLOT_KEEPS), id);

// The map's page, by the rule of routes.js: on a pad that is not the made-up one, the page, with
// what lies beside it in its folder; on the made-up pad the page alone, as nothing - a 204, so
// that File, which asks for it, has no New plot and no error on its console - and nothing else of
// that folder, under whatever letters; and under other letters than its own no pad gives it - a
// disk may take `Map` for `map`. What is not that folder is as it was. New plot's old address is
// a path as any other, of no file: nothing.
const [HTML, JS] = ['text/html; charset=utf-8', 'text/javascript; charset=utf-8'];
assert.deepEqual([MAP, MAP_PAGE, NO_PAGE], ['map', 'map/index.html', { status: 204 }]);
assert.ok(Object.isFrozen(NO_PAGE));
for (const asked of ['/map/index.html', '/map/index.html?as=asked', '/map/index.html?asks=5123']) {
  assert.deepEqual(route(asked, false), { file: MAP_PAGE, type: HTML }, asked);
  assert.equal(route(asked, true), NO_PAGE, asked);
}
assert.deepEqual(route('/map/map.js', false), { file: 'map/map.js', type: JS });
const IN_MAP = ['/map/map.js', '/map/map.css', '/map/page.js', '/map/make.js', '/map/map.html'];
const OTHER_LETTERS = ['/Map/index.html', '/MAP/index.html', '/map/INDEX.html', '/map/Index.html'];
OTHER_LETTERS.push('/mAp/map.js', '/map/Map.js', '/MAP/MAP.css');
for (const asked of [...IN_MAP, ...OTHER_LETTERS]) assert.equal(route(asked, true), null, asked);
for (const asked of OTHER_LETTERS) assert.equal(route(asked, false), null, asked);
const NO_MAP = ['/map/', '/map', '/map/index.htm', '/map/map/index.html', '/index.html/map'];
NO_MAP.push('/plots/terrace/map/index.html', '/new-plot/', '/new-plot', '/new-plot/?as=asked');
for (const asked of NO_MAP) {
  assert.deepEqual([route(asked, false), route(asked, true)], [null, null], asked);
}
for (const demo of [false, true]) {
  assert.deepEqual(route('/map.js', demo), { file: 'map.js', type: JS });
  assert.deepEqual(route('/mapped/Map.js', demo), { file: 'mapped/Map.js', type: JS });
  assert.deepEqual(route('/scene/Map.js', demo), { file: 'scene/Map.js', type: JS });
}

process.stdout.write(
  "tools/sketch: a plot's folder is called by the rule of a kept sketch's name, and the made-up pad answers the map's page with nothing and has nothing else of its folder\n",
);
