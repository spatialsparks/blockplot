// The check of the order for a new plot (ST-031): request.js by hand, with nothing running. An
// order that is one; every sentence of the list, the first that holds, on an order that
// is also wrong in every way the list names after it; and each sentence alone, at the edge of
// what an order may say. The folder of a name, every row of the card's table, each an id that
// the rule of a plot's id takes; the id that a new plot gets where a name is taken; and the
// sentences and the limits, typed in. Run by check.js, as every check is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { EXAMPLE, OWN, plotName } from '../store/rules.js';
import { LAYERS, SHEET, layersOf } from '../swisstopo/hosts.js';
import { AROUND_MAX_M, AROUND_M, CORNERS_MAX, FOLDER_MAX, NAME_MAX } from './request.js';
import { PAPER_MAX_M, SAID, folderOf, freeOf, orderOf } from './request.js';

// The limits, typed in.
const LIMITS = [NAME_MAX, CORNERS_MAX, AROUND_MAX_M, AROUND_M, PAPER_MAX_M];
assert.deepEqual([...LIMITS, FOLDER_MAX], [80, 1000, 20, 5, 1000, 60]);

// An order that is one: a name, three corners in LV95 - each an easting and a northing - the
// side that the paper lies along, the ground around the plot, and what the corners were marked on.
const paired = (flat) => flat.flatMap((figure, at) => (at % 2 ? [[flat[at - 1], figure]] : []));
const CORNERS = paired([2_600_010.5, 1_200_020.25, 2_600_040, 1_200_020, 2_600_040, 1_200_050]);
const NAME = 'Made-up terrace, by the lake / north';
const ORDER = { name: NAME, corners: CORNERS, side: 1, aroundM: 5, on: ['cadastral'] };
const of = (order) => orderOf(JSON.stringify(order));
const refused = (status, sentence) => ({ status, refused: sentence });
assert.deepEqual(of(ORDER), ORDER);
assert.deepEqual(orderOf(JSON.stringify(ORDER, null, 2)), ORDER);
assert.deepEqual(of({ on: ['photo'], aroundM: 0, side: 0, corners: CORNERS, name: NAME }), {
  ...ORDER,
  ...{ side: 0, aroundM: 0, on: ['photo'] },
});

// The list, to the letter. What is no JSON, or no object, is refused before anything else.
const SENTENCES = [
  'It is no order for a plot: one object, as JSON.',
  'It holds "paper", which no order for a plot has.',
  'It has no name, or one of more than 80 characters.',
  'It has no outline: three corners to 1000, each an easting and a northing in metres.',
  'A corner lies off the map of Switzerland: E 2420000 to 2900000, N 1030000 to 1350000.',
  "Its side is none of its outline's.",
  'The ground around the plot is none: 0 to 20 m, in steps of half a metre.',
  'It does not say what the corners were marked on: a map, the aerial photo, or a map and the photo.',
].map((sentence) => refused(400, sentence));
const NO_ORDER = ['', 'no order', '{"name":', '[]', `[${JSON.stringify(ORDER)}]`, '"text"', 'null'];
NO_ORDER.push('5', 'true', `${JSON.stringify(ORDER)},`, undefined, null, ORDER);
NO_ORDER.push([JSON.stringify(ORDER)]);
for (const text of NO_ORDER) assert.deepEqual(orderOf(text), SENTENCES[0], String(text));
// Then the first that holds, on an order that is also wrong in every way the list names after
// it: an order that is wrong in all seven, put right one thing at a time, in the list's order.
const OFF = [...CORNERS.slice(0, 2), [2_419_999.99, 1_200_000]];
const PUT_RIGHT = [{ paper: undefined }, { name: NAME }, { corners: OFF }, { corners: CORNERS }];
PUT_RIGHT.push({ side: 1 }, { aroundM: 5 }, { on: ['cadastral'] });
let order = { paper: [], name: ' ', corners: [[0, 0]], side: -1, aroundM: 21, on: ['map'] };
PUT_RIGHT.forEach((put, at) => {
  assert.deepEqual(of(order), SENTENCES[at + 1], `sentence ${at + 1}`);
  order = { ...order, ...put };
});
assert.deepEqual([of(order), SENTENCES.length], [ORDER, PUT_RIGHT.length + 1]);

// Each sentence alone, on an order that is one but for that. `wrong` is its number in the list.
const but = (put) => of({ ...ORDER, ...put });
const none = (wrong, puts) => {
  for (const put of puts) assert.deepEqual(but(put), SENTENCES[wrong], JSON.stringify(put));
};
const taken = (puts) => {
  for (const put of puts) assert.deepEqual(but(put), { ...ORDER, ...put }, JSON.stringify(put));
};
// A field that no order has: the first such, as JSON writes its name. And a field that is not
// there is refused in the sentence of that field.
none(1, [{ paper: 1 }, { paper: null, plot: 1 }, { paper: { name: NAME } }]);
const held = (text) => orderOf(text).refused?.replace(/, which no order for a plot has\.$/, '');
assert.equal(held(JSON.stringify({ ...ORDER, 'a "b"': 1, paper: 2 })), 'It holds "a \\"b\\""');
assert.equal(held(JSON.stringify({ ...ORDER, Name: NAME })), 'It holds "Name"');
assert.equal(held(`{"__proto__":1,${JSON.stringify(ORDER).slice(1)}`), 'It holds "__proto__"');
// The first, as the order's own object lists its fields: a whole number before every word.
assert.equal(held(`${JSON.stringify(ORDER).slice(0, -1)},"paper":1,"7":2}`), 'It holds "7"');
const WITHOUT = { name: 2, corners: 3, side: 5, aroundM: 6, on: 7 };
for (const [field, wrong] of Object.entries(WITHOUT)) none(wrong, [{ [field]: undefined }]);
assert.deepEqual(orderOf('{}'), SENTENCES[2]);
// A name: a text that is not blank, of 80 characters at the most - given with no blank at either end.
none(2, [{ name: '' }, { name: '   ' }, { name: '\t\n' }, { name: 'n'.repeat(81) }, { name: 5 }]);
none(2, [{ name: null }, { name: [NAME] }, { name: { name: NAME } }, { name: true }]);
taken([{ name: 'n' }, { name: 'n'.repeat(80) }, { name: 'Bärenhöhe, Parzelle 12' }]);
assert.equal(but({ name: `  ${'n'.repeat(80)}\n` }).name, 'n'.repeat(80));
assert.equal(but({ name: ' a  b ' }).name, 'a  b');
// An outline: a list of three corners to 1000, each two numbers - and no more than two.
const many = (count) => Array.from({ length: count }, (_, at) => [2_600_000 + at, 1_200_000]);
none(3, [{ corners: many(2) }, { corners: many(1001) }, { corners: [] }, { corners: 'outline' }]);
none(3, [{ corners: null }, { corners: { 0: CORNERS[0], length: 3 } }, { corners: [1, 2, 3] }]);
const NO_CORNER = [[2_600_000], [2_600_000, 1_200_000, 550], ['2600000', 1_200_000], [null, 1]];
for (const corner of [...NO_CORNER, 'EN', 26, null]) none(3, [{ corners: [...many(3), corner] }]);
none(3, [{ corners: [...many(3), { east: 2_600_000, north: 1_200_000 }] }, { corners: [many(3)] }]);
const huge = JSON.stringify(ORDER).replace('2600040', '1e999');
assert.deepEqual([huge.includes('1e999'), orderOf(huge)], [true, SENTENCES[3]]);
taken([{ corners: many(3) }, { corners: many(1000) }]);
// The sheet of the map, as hosts.js has it: a corner on its edge is on it, and a centimetre
// beyond is off - on each of its four sides.
const { west, east, south, north } = SHEET;
const edges = paired([west, south, east, south, east, north, west, north]);
taken([{ corners: edges, side: 3 }]);
for (const [at, [moveE, moveN]] of paired([-0.01, 0, 0, -0.01, 0.01, 0, 0, 0.01]).entries()) {
  const [cornerE, cornerN] = edges[at];
  none(4, [{ corners: edges.with(at, [cornerE + moveE, cornerN + moveN]) }]);
}
none(4, [
  { corners: [...many(3), [7.44, 46.95]] },
  { corners: [...many(3), [1_200_000, 2_600_000]] },
]);
// A side: a whole number from 0 to one less than the corners. The ground around: 0 to 20 m, in
// halves. A zero with a minus before it is a zero.
none(5, [{ side: -1 }, { side: 3 }, { side: 1.5 }, { side: '1' }, { side: null }, { side: [1] }]);
taken([{ side: 0 }, { side: 2 }, { corners: many(50), side: 49 }]);
none(5, [{ corners: many(50), side: 50 }]);
none(6, [{ aroundM: -0.5 }, { aroundM: 20.5 }, { aroundM: 0.25 }, { aroundM: 5.1 }]);
none(6, [{ aroundM: '5' }, { aroundM: null }, { aroundM: true }, { aroundM: [5] }]);
taken([{ aroundM: 0 }, { aroundM: 0.5 }, { aroundM: 19.5 }, { aroundM: 20 }]);
const minus = orderOf(
  JSON.stringify(ORDER).replace('"side":1', '"side":-0').replace(':5,', ':-0,'),
);
assert.deepEqual([Object.is(minus.side, 0), Object.is(minus.aroundM, 0)], [true, true]);
// What the corners were marked on: one of five lists, and no other - a map, the photo, or a map
// and the photo, of three layers of the map; never the two maps (T-044.10: the national map is
// one, where the pad offers no cadastre - before, `["national"]` was refused).
taken([{ on: ['national'] }, { on: ['cadastral'] }, { on: ['photo'] }]);
taken([{ on: ['national', 'photo'] }, { on: ['cadastral', 'photo'] }]);
none(7, [{ on: ['photo', 'cadastral'] }, { on: [] }, { on: ['cadastral', 'cadastral'] }]);
none(7, [{ on: ['national', 'cadastral'] }, { on: ['photo', 'national'] }]);
none(7, [{ on: ['national', 'cadastral', 'photo'] }, { on: ['map'] }]);
none(7, [{ on: 'cadastral' }, { on: ['cadastral,photo'] }, { on: null }]);
none(7, [{ on: [['cadastral']] }, { on: ['cadastral', 'photo', 'photo'] }, { on: { 0: 'photo' } }]);
// Each a layer of the map: the national map and the photo of every pad, the cadastral map of one
// that offers a cadastre - here a made-up one.
assert.ok(['national', 'photo'].every((name) => Object.hasOwn(LAYERS, name)));
const OFFERED = layersOf({ layer: 'made-up', ending: 'png', to: 28, credit: '© Made-up' });
assert.ok(Object.hasOwn(OFFERED, 'cadastral'));

// The sentences that the making of a plot says, typed in.
assert.deepEqual(Object.keys(SAID), 'same flat crosses large steep ground disk'.split(' '));
assert.ok(Object.isFrozen(SAID));
assert.equal(SAID.same, 'Two corners that follow each other lie at one place.');
assert.equal(SAID.flat, 'Its outline encloses no area.');
assert.equal(SAID.crosses, 'Its outline crosses itself.');
assert.equal(
  SAID.large(1001, 30),
  'Its paper would be 1001 m by 30 m, and the pad takes 1000 m each way: mark a smaller plot, or less ground around it.',
);
assert.equal(
  SAID.steep(603, 1614),
  'Its standing paper would be 1011 m high, from 603 m to 1614 m above sea level, and the pad takes 1000 m: the ground is too steep for it.',
);
assert.ok(
  SAID.steep(602.5, 733).startsWith('Its standing paper would be 130.5 m high, from 602.5 m'),
);
assert.equal(SAID.ground('It said 503.'), 'The ground did not come: It said 503.');
assert.equal(
  SAID.disk('The disk is full.'),
  'The plot could not be written: The disk is full. Nothing of it was left.',
);

// The folder of a name, every row of the card's table. The names are typed as they are seen: a
// letter with its sign is one sign here, and the three dots that are one sign are by its number.
const N = (count) => 'n'.repeat(count);
const FOLDERS = {
  'Bärenhöhe, Parzelle 12': 'Barenhohe Parzelle 12',
  [NAME]: 'Made-up terrace by the lake north',
  Genève: 'Geneve',
  Zürich: 'Zurich',
  Straße: 'Strae',
  '***': 'plot',
  '. .': 'plot',
  [String.fromCodePoint(0x2026)]: 'plot',
  '...hidden.': 'hidden',
  'a  b': 'a b',
  home: 'home',
  Home: 'Home',
  EXAMPLE: 'EXAMPLE',
  [N(200)]: N(60),
  [`${N(59)} more`]: N(59),
  [`${N(59)}.more`]: N(59),
  'Æsir Øl': 'sir l',
  日本: 'plot',
  CON: 'plot-CON',
};
assert.deepEqual(
  ['Bärenhöhe'.length, 'Genève'.length, 'Zürich'.length, Object.keys(FOLDERS).length],
  [9, 6, 6, 19],
);
for (const [name, folder] of Object.entries(FOLDERS)) {
  assert.equal(folderOf(name), folder, name);
  // A letter taken apart, into the letter and its sign, gives the same folder; and every folder
  // is an id that the server's rule takes, and the folder of itself.
  assert.deepEqual([folderOf(name.normalize('NFD')), folderOf(folder)], [folder, folder], name);
  assert.ok(plotName(folder) && folder.length <= 60, name);
}
assert.equal('Bärenhöhe'.normalize('NFD').length, 11);
// What the rule leaves: every sign that an id takes; of blanks and dots none at either end, and
// of blanks no two together; and the cut once more, after the sixtieth sign.
assert.equal(folderOf('Plot_7-b.2 (north)'), 'Plot_7-b.2 north');
assert.equal(folderOf(' .. a .b. ..  c.  . '), 'a .b. .. c');
assert.equal(folderOf('a   b     c, / , d'), 'a b c d');
assert.deepEqual([folderOf(`${N(58)} . more`), folderOf(`.. ${N(60)}.`)], [N(58), N(60)]);
assert.equal(folderOf(`a\tb${String.fromCodePoint(0xa0)}c\nd`), 'abcd');
assert.deepEqual([folderOf('-'), folderOf('_'), folderOf('- -')], ['-', '_', '- -']);
for (const no of ['', ' ', '.', undefined, null, 5, ['Plot']]) assert.equal(folderOf(no), 'plot');
// And every name of signs up to the last of the letters with a sign, alone and between letters:
// its folder is an id.
for (let point = 0; point < 0x250; point += 1) {
  const sign = String.fromCodePoint(point);
  for (const name of [sign, `a${sign}b`, `${sign}${sign} a`, `${N(59)}${sign}${sign}`]) {
    const folder = folderOf(name);
    assert.ok(plotName(folder) && folderOf(folder) === folder, `sign ${point}: ${folder}`);
  }
}
// A name that Windows keeps for a device, in whatever letters, as a folder's first part - what
// stands before its first dot, less the blanks at its end - gets `plot-` before it, and the cut
// once more. What only begins or ends with such a name is as it is.
const DEVICES = ['con', 'PRN', 'aux', 'Nul', 'NUL.1', 'Com7.north plan', 'aux .x', 'prn.a.b'];
for (let figure = 0; figure <= 9; figure += 1) DEVICES.push(`com${figure}`, `LPT${figure}`);
for (const device of DEVICES) {
  assert.deepEqual([folderOf(device), plotName(`plot-${device}`)], [`plot-${device}`, true]);
  assert.equal(folderOf(`plot-${device}`), `plot-${device}`, device);
}
const NO_DEVICE = ['console', 'con-2', 'my.con', 'com', 'com10', 'lpt', 'nul_', 'a con', 'con a'];
for (const none of [...NO_DEVICE, 'x.nul.y', 'conin', 'c0n']) assert.equal(folderOf(none), none);
assert.deepEqual([folderOf('aux.'), folderOf(' . Nul ..')], ['plot-aux', 'plot-Nul']);
assert.equal(folderOf(`con.${N(70)}`), `plot-con.${N(51)}`, 'cut to sixty once more');
assert.equal(folderOf(`con.${N(50)} .m`), `plot-con.${N(50)}`, 'and its end cut again');
// In `folderOf`, and not after a figure: a figure leaves the first part what it was made.
assert.equal(freeOf(folderOf('con'), ['plot-con', 'PLOT-CON-2']), 'plot-con-3');

// The id that a new plot gets: its folder where that is free, and else with a figure after it,
// the first that is free. A name is taken in whatever letters, and the pad's own two are never
// free: no new plot gets `home` or `example`.
assert.deepEqual([OWN, EXAMPLE], ['home', 'example']);
const FREE = [
  ['Terrace', [], 'Terrace'],
  ['home', [], 'home-2'],
  ['Home', [], 'Home-2'],
  ['EXAMPLE', [], 'EXAMPLE-2'],
  ['example', ['Example-2', 'example-3'], 'example-4'],
  ['Terrace', ['terrace'], 'Terrace-2'],
  ['Terrace', ['terrace', 'terrace-2'], 'Terrace-3'],
  ['terrace', ['TERRACE', 'Terrace-2', 'terrace-3', 'terrace-5'], 'terrace-4'],
  ['Terrace', ['orchard', 'home', 'terrace.old', 'terrace-2', 'CLAUDE.md'], 'Terrace'],
  ['plot', ['plot', 'plot-2', 'plot-3'], 'plot-4'],
  [N(60), [N(60).toUpperCase()], `${N(60)}-2`],
];
for (const [folder, lying, id] of FREE) {
  assert.equal(freeOf(folder, lying), id, `${folder} beside ${lying.join()}`);
  assert.ok(
    plotName(id) &&
      ![...lying, OWN, EXAMPLE].some((name) => name.toLowerCase() === id.toLowerCase()),
  );
}

process.stdout.write(
  'tools/sketch/new-plot: an order is read or refused in the first sentence that holds, and a name gives a folder that is an id and free\n',
);
