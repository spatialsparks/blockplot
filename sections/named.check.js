// The check of the name of a section (story ST-032): `sections.named`, which `sections.make`
// and `sections.rename` ask. A name is the text without the blanks at its two ends; and it is
// refused in one of three sentences, each to the letter: where it is nothing, where it has more
// than sixty characters - sixty are taken, and a character is counted as the language counts it
// - and where the list has it already, in whatever capitals, but for the section that is being
// renamed. The limit is named once, `sections.NAME_MOST`. The pad's own scripts on a made-up
// store and the made-up plot: no browser, nothing of the real site. Run by tools/sketch/check.js,
// or alone: pnpm exec node tools/sketch/sections/named.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

// A browser's two stores, with a made-up sketch where the pad keeps it: two sections, the second
// under a name that was written by hand with a blank at its end, and nothing drawn.
const HELD = [
  { id: 1, name: 'Home 1' },
  { id: 2, name: 'Garage and cellar ' },
];
const SKETCH = { space: 7, things: [], floors: [], notes: [], on: {}, show: { top: {} } };
const kept = new Map([
  ['blockplot/sketch/space', JSON.stringify({ ...SKETCH, sections: HELD })],
]);
const store = {
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
};
Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: store, configurable: true });
globalThis.location = { hash: '#top' };
const SCRIPTS = ['sections/model', 'demo-site', 'paper', 'figures', 'shapes', 'categories'];
for (const file of [...SCRIPTS, 'blocks', 'legacy', 'sketch']) await import(`../${file}.js`);
const { sections, sketch } = globalThis;
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
assert.deepEqual(
  sections.list().map(({ id, name }) => `${id}: ${name}`),
  ['1: Home 1', '2: Garage and cellar '],
);

// A NAME is the text without the blanks at its two ends, whatever it holds between them.
assert.equal(sections.NAME_MOST, 60);
assert.deepEqual(sections.named('  Yard \t'), { name: 'Yard' });
assert.deepEqual(sections.named('Süd / "2"'), { name: 'Süd / "2"' });
assert.deepEqual(sections.named('Home  1'), { name: 'Home  1' });

// NOTHING, and blanks alone - and what is no text.
const NEEDED = 'A section needs a name.';
for (const none of ['', ' ', ' \t\n ', undefined, null, 7, true, ['Home'], { name: 'Home' }]) {
  assert.deepEqual(sections.named(none), { refused: NEEDED }, JSON.stringify(none));
}

// SIXTY CHARACTERS AT THE MOST, counted without the blanks at the ends: sixty are taken, and
// sixty-one refused, with their count. A character is counted as the language counts it: a clef
// is two units of a text and one character, so sixty of them are a name.
const sixty = 'n'.repeat(60);
const TOO_LONG = "A section's name has 60 characters at the most: this one has 61.";
assert.deepEqual(sections.named(sixty), { name: sixty });
assert.deepEqual(sections.named(`  ${sixty}  `), { name: sixty });
assert.deepEqual(sections.named(`${sixty}n`), { refused: TOO_LONG });
const CLEF = '\u{1D11E}';
const clefs = CLEF.repeat(60);
assert.deepEqual([clefs.length, sections.named(clefs)], [120, { name: clefs }]);
assert.deepEqual(sections.named(`${clefs}${CLEF}`), { refused: TOO_LONG });
const LONGER = "A section's name has 60 characters at the most: this one has 75.";
assert.deepEqual(sections.named('n'.repeat(75)), { refused: LONGER });

// A NAME THAT THE LIST HAS, as the list has it: two names are one where they differ in capitals
// alone - and in the blanks at their ends, which a name that was written by hand may have.
const TAKEN = 'There is a section "Home 1" already.';
for (const taken of ['Home 1', 'home 1', 'HOME 1', '  hoMe 1 ']) {
  assert.deepEqual(sections.named(taken), { refused: TAKEN }, taken);
}
const CELLAR = 'There is a section "Garage and cellar " already.';
assert.deepEqual(sections.named('garage and cellar'), { refused: CELLAR });
for (const free of ['Home 11', 'Home', 'Home  1', 'Home-1', 'Garage']) {
  assert.deepEqual(sections.named(free), { name: free }, free);
}
// `but` is the section that is being renamed: its own name is not taken, and another's is.
assert.deepEqual(sections.named('HOME 1', 1), { name: 'HOME 1' });
assert.deepEqual(sections.named('Garage and cellar', 2), { name: 'Garage and cellar' });
assert.deepEqual(sections.named('home 1', 2), { refused: TAKEN });
assert.deepEqual(sections.named('GARAGE AND CELLAR', 1), { refused: CELLAR });
assert.deepEqual(sections.named('home 1', 9), { refused: TAKEN });
// Too long a name is refused for its length, whoever has it.
assert.deepEqual(sections.named(`${sixty}n`, 1), { refused: TOO_LONG });

// Asking changes nothing: the sketch is as it was, and nothing is there to undo.
assert.deepEqual([sketch.doc.sections, sketch.past.length], [HELD, 0]);

process.stdout.write(
  'tools/sketch/sections: a name is taken without the blanks at its ends, and refused in a sentence where it is nothing, longer than sixty characters, or another section has it\n',
);
