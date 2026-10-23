// The check of a selected line recoloured by the swatch beside the paper (ST-039, T-039.4;
// swatch.js): the pad's own scripts and the swatch on a made-up store, the made-up plot and a
// made-up page that keeps what is made, as swatch.check.js has them, with a made-up `views.menu`
// and a made-up Line tool that says which line is selected. A line selected shows the row in its
// colour and beside it its name, the colour marked in the menu; a pick of one of the eleven and
// of a colour of the owner's sets the line's colour, one step each, and nothing else of the
// sketch; Undo has the bytes of before; a block selected is the swatch's as before; and with no
// line and no block the row is hidden. No browser, and no site but the made-up one. Run by
// tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/lines/recolour.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });

// A MADE-UP PAGE that keeps what is made, as swatch.check.js's: a part has what it was given,
// the parts put into it, what was put before it, what it says of itself and its listeners.
function part(tagName) {
  const made = { tagName: tagName.toUpperCase(), parts: [], hears: {}, said: {} };
  Object.assign(made, { dataset: {}, style: {} });
  made.append = (...more) => void made.parts.push(...more);
  made.replaceChildren = (...more) => void (made.parts = more);
  made.before = (...more) => void (made.led = more);
  made.addEventListener = (type, hear) => void (made.hears[type] = hear);
  made.setAttribute = (what, value) => void (made.said[what] = value);
  made.removeAttribute = (what) => void delete made.said[what];
  return made;
}
const page = { 'none-picked': part('p') };
const document = { getElementById: (id) => page[id], createElement: part, addEventListener() {} };
// A made-up `views.menu`: the part hidden, and the way to shut it handed back.
const views = {
  menu: (button, panel) => ((panel.hidden = true), () => void (panel.hidden = true)),
};
Object.assign(globalThis, { document, views, location: { hash: '#top' } });

const SCRIPTS =
  'demo-site paper figures shapes blocks legacy sketch own-colours lines/model strokes';
for (const one of SCRIPTS.split(' ')) await import(`../${one}.js`);
// THE MADE-UP LINE TOOL, which the swatch asks when it shows, not as it loads: the line Select
// took, while it is in the sketch (lines/tool.js).
let chosen = null;
globalThis.lineTool = { picked: () => (sketch.doc.notes.includes(chosen) ? chosen : null) };
await import('../swatch.js');
const { SITE, sketch, swatch } = globalThis;
assert.equal(SITE.name, 'Made-up hillside plot');
const [row] = page['none-picked'].led;
const [button, name, palette] = row.parts;

// A SKETCH of its own, on level 22: a red block of one box; a red line of three points on the
// level, and a line on every level in the owner's "Boundary"; the owner's two colours.
const BOUNDARY = '#c0392b';
sketch.doc = sketch.adopt({
  ...sketch.blank(),
  things: [{ x: [0, 8], y: [16, 24], z: [16, 22], colour: 1 }],
  notes: [
    { view: 'top', at: 22, line: [10, 10, 20, 10, 30, 10, 1] },
    { view: 'top', at: 'every', line: [4, 50, 30, 50, BOUNDARY] },
  ],
  colours: [
    { name: 'Boundary', value: BOUNDARY },
    { name: 'Moss', value: '#4a7c2a' },
  ],
});
const [RED_LINE, EVERY] = sketch.doc.notes;
const text = () => JSON.stringify(sketch.doc);
// AS THE PAGE DOES: no thing is selected while a line is, and after every change the swatch is
// handed what is selected.
let selected = null;
sketch.onChange = () => swatch.show(sketch.doc.things.includes(selected) ? selected : null);
const select = (thing, line) => {
  [selected, chosen] = [thing, line];
  swatch.show(thing);
};
/** What the swatch shows: `hidden`, or its colour, its name, its title's start and what is marked. */
const shows = () => {
  const marked = palette.parts.flatMap((one) => (one.said['aria-current'] ? [one.title] : []));
  const said = [button.style.background, name.textContent, button.title.split(':')[0], marked];
  return row.hidden ? 'hidden' : said;
};
const OF_A_LINE = 'The colour of the selected line';
const OF_A_BLOCK = 'The colour of the selected block';

// NO LINE AND NO BLOCK: the row is hidden.
select(null, null);
assert.equal(shows(), 'hidden');
// A LINE SELECTED: the row in its colour, its name beside it, titled for a line - red, one of
// the eleven; "Boundary", the owner's, marked among the owner's colours after the eleven.
select(null, RED_LINE);
assert.deepEqual(shows(), ['#d9482b', 'red', OF_A_LINE, ['red']]);
select(null, EVERY);
assert.deepEqual(shows(), [BOUNDARY, 'Boundary', OF_A_LINE, ['Boundary']]);
assert.deepEqual(
  palette.parts.slice(11).map((one) => one.dataset.colour),
  [BOUNDARY, '#4a7c2a'],
);

/** A pick, as a browser tells of one: the colour at a place of the menu hears a click. */
const pick = (place) => palette.parts[place].hears.click();
// A PICK OF GREEN, one of the eleven, on the line on every level: its last entry, and nothing
// else of the sketch - one step. Then Moss, the owner's, on the red line: one step more.
const [before, steps] = [text(), sketch.past.length];
pick(4);
assert.deepEqual([EVERY.line, sketch.past.length], [[4, 50, 30, 50, 4], steps + 1]);
assert.equal(text(), before.replace(`50,"${BOUNDARY}"]`, '50,4]'));
assert.deepEqual(shows(), ['#5a9e4b', 'green', OF_A_LINE, ['green']]);
select(null, RED_LINE);
const greened = text();
pick(12);
assert.deepEqual(
  [RED_LINE.line, sketch.past.length],
  [[10, 10, 20, 10, 30, 10, '#4a7c2a'], steps + 2],
);
assert.equal(text(), greened.replace('30,10,1]', '30,10,"#4a7c2a"]'));
assert.deepEqual(shows(), ['#4a7c2a', 'Moss', OF_A_LINE, ['Moss']]);
// The colour it has already: no step.
pick(12);
assert.equal(sketch.past.length, steps + 2);
// UNDO, twice: the bytes of before; the line selected is no note of the sketch made anew.
sketch.step(sketch.past, sketch.future);
sketch.step(sketch.past, sketch.future);
assert.equal(text(), before);
swatch.show(null);
assert.equal(shows(), 'hidden');

// A BLOCK SELECTED is the swatch's as before, whatever line the Line tool holds: its colour, and
// a pick paints the block and no line.
const [block] = sketch.doc.things;
const [line] = sketch.doc.notes;
select(block, line);
assert.deepEqual(shows(), ['#d9482b', 'red', OF_A_BLOCK, ['red']]);
pick(6);
assert.deepEqual([block.colour, line.line.at(-1), sketch.past.length], [6, 1, steps + 1]);
// And none of either: hidden.
select(null, null);
assert.equal(shows(), 'hidden');

process.stdout.write(
  "tools/sketch/lines: a selected line shows in the swatch beside the paper, and a pick recolours it in one step, the eleven or the owner's, nothing else changed; a block is the swatch's as before\n",
);
