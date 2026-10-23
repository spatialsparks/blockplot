// The check of the naming and the making (ST-031; in the page since ST-041, T-041.3): the first
// half of make.js - what it decides and says, with nothing of the page in it. The folder that a
// name will get, with no list of the plots asked (T-040.3); the id that a plot made gets, free of
// the plots this browser holds and of the names in the folder picked; the sentences, typed in -
// a plot not made, cut to 400 characters, a folder that could not be written, a folder not
// picked, a plot made and not held. And of the script, the text: it asks nobody itself - no
// `fetch(`, no order to the pad's server - picks the folder before the ground is asked, writes the
// two notes, and goes to the pad's own page, `../`. What is made, and what is refused of an
// order, are new-plot/making.check.js's and making-refused.check.js's; the name's field, the
// button and the page in a browser tests/e2e/sketch-new-plot-made.spec.ts's. Nothing is asked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { SAID, idOf, lying, notMade, unwritten } from './make.js';

const PAD = path.join(import.meta.dirname, '..');
// What the page says, typed in, to the letter.
const NOT_MADE = 'The plot was not made: ';
const lies = (folder) => `It will lie in the folder "${folder}".`;

// The folder that a name will get, by the making's own rule and with no folder known to be
// taken - the page asks no list of the plots (T-040.3): the folder of the name; the pad's own two
// get a figure; what the rule does not take is left out or written plain; and a name that Windows
// keeps for a device gets `plot-` before it. Of no name, nothing.
const FOLDERS = {
  Terrace: 'Terrace',
  home: 'home-2',
  Example: 'Example-2',
  '***': 'plot',
  'Bärenhöhe, Parzelle 12': 'Barenhohe Parzelle 12',
  '  Trial slope ': 'Trial slope',
  con: 'plot-con',
};
for (const [name, folder] of Object.entries(FOLDERS)) assert.equal(lying(name), lies(folder), name);
for (const none of ['', ' ', '\t \n']) assert.equal(lying(none), '', JSON.stringify(none));

// The id of a plot made: its folder, where neither a held plot nor a name of the folder picked
// has it, in whatever letters - else the next figure, free of both; never `home` or `example`.
assert.equal(idOf('Trial slope', []), 'Trial slope');
assert.equal(idOf('Trial slope', ['Trial slope']), 'Trial slope-2');
assert.equal(idOf('Trial slope', [], ['trial slope']), 'Trial slope-2');
assert.equal(
  idOf('Trial slope', ['Trial slope'], ['Trial slope-2', 'TRIAL SLOPE-3']),
  'Trial slope-4',
);
assert.equal(idOf('Trial slope', ['terrace'], ['Trial slope-2']), 'Trial slope');
assert.equal(idOf('home', []), 'home-2');
assert.equal(idOf('Example', ['example-2']), 'Example-3');
// A file of that name in the folder picked takes it as a folder would: anything of that name.
assert.equal(idOf('Terrace', ['home'], ['Terrace', 'plot.json']), 'Terrace-2');

// A plot not made: the sentence, as text whatever it holds, cut to 400 characters - whole ones,
// a character of two halves among them - with the sign after it; blanks at its ends go.
assert.equal(notMade('Its outline crosses itself.'), `${NOT_MADE}Its outline crosses itself.`);
assert.equal(notMade(' <b>words</b>\n'), `${NOT_MADE}<b>words</b>`);
const face = String.fromCodePoint(0x1f600);
assert.equal(notMade(`${'a'.repeat(399)}${face}b`), `${NOT_MADE}${'a'.repeat(399)}${face}…`);
assert.equal(notMade(`${'a'.repeat(399)}${face}`), `${NOT_MADE}${'a'.repeat(399)}${face}`);
assert.equal(notMade(` ${'a'.repeat(401)} \n`), `${NOT_MADE}${'a'.repeat(400)}…`);

// A plot's folder that could not be written: what the browser said, with a full stop, and that
// nothing of it was left - in the server's words - or, where what was begun could not be taken
// away again, that something of it may be left, and where.
const full = Object.assign(new Error('The disk is full'), { name: 'QuotaExceededError' });
assert.equal(
  unwritten(full, 'Trial slope'),
  `${NOT_MADE}The plot could not be written: The disk is full. Nothing of it was left.`,
);
assert.equal(
  unwritten(new Error('Refused.'), 'a'),
  `${NOT_MADE}The plot could not be written: Refused. Nothing of it was left.`,
);
const left = Object.assign(new Error('Not empty'), { left: true });
assert.equal(
  unwritten(left, 'Trial slope'),
  `${NOT_MADE}The plot could not be written: Not empty. Something of it may be left in the folder "Trial slope".`,
);

// The other sentences, to the letter.
assert.deepEqual(Object.keys(SAID), [
  'folder',
  'fetching',
  'unpicked',
  'unheldIn',
  'unheldFile',
  'left',
]);
assert.equal(
  SAID.fetching,
  'The ground is being fetched from swisstopo, and the plot is made of it: this takes a few seconds.',
);
assert.equal(SAID.unpicked, 'No folder was picked: nothing was asked, and nothing made.');
assert.equal(
  SAID.unheldIn('Trial slope'),
  'The plot was made, in the folder "Trial slope" of the folder that was picked, and this browser did not keep it: back in the pad, File, "Open plot", "A plot\'s folder" opens it.',
);
assert.equal(
  SAID.unheldFile,
  'The plot was made, and this browser did not keep it: its file is offered to save, as plot.json, which File, "Open plot" opens back in the pad.',
);

// Of the script, the text: it asks nobody itself - the door asks, through the making - and
// sends the pad's server no order; it picks the folder before the plot is made, and makes the
// plot's folder or offers its file after; it goes to one address, the pad's own page, from where
// the map's page is, in its page's place; and it writes the two notes, once each.
const code = fs.readFileSync(path.join(PAD, 'map', 'make.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
// (The four other words of a request no file of the pad says: ../swisstopo/named.check.js.)
const ASKS = /\bfetch\b|\bNEW\b|\/new-plot\//;
assert.ok(ASKS.test('await fetch(NEW, how);') && ASKS.test("'/new-plot/'"));
assert.equal(ASKS.test(code.replace(/ from '[^']+';$/gm, ';')), false);
assert.deepEqual(code.match(/\blocation\.\w+\([^)]*\)+/g), ['location.replace(PAD)']);
assert.match(code, /^const PAD = '\.\.\/';$/m);
const at = (word) => code.indexOf(word);
assert.ok(at('await pickFolder()') > 0 && at('await pickFolder()') < at('await plotMadeOf('));
assert.ok(
  at('await plotMadeOf(') < at('await madeIn(') && at('await plotMadeOf(') < at('offer(made'),
);
const notes = code.match(/\w+\.\w+\([^)]*\)/g).filter((call) => /Storage|Item/.test(call));
assert.deepEqual(notes, ['sessionStorage.setItem(TAB, id)', 'localStorage.setItem(LAST, id)']);
assert.equal(/removeItem|removeEntry/.test(code), false);

process.stdout.write(
  'tools/sketch/map: the folder that a name will get with no list of the plots asked, the id of a plot made free of the held plots and the folder picked, each sentence of the making, and a script that asks nobody itself, picks the folder first and goes to ../\n',
);
