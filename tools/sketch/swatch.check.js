// The check of the colour of the selected block beside the paper (story ST-029, swatch.js): the
// pad's own scripts and that one on a made-up store, the made-up plot and a made-up page that
// keeps what is made, with a made-up `views.menu` that keeps what it was handed. The parts, and
// where they were put; the eleven colours of the pad's one list, each by its place and its name;
// what the swatch shows of nothing, of an object and of a block - the colour of the box that is
// selected, as the paper draws it, and ink for a colour the pad has not; a pick on every box of
// a block, one step, with Undo to the byte, and none where the block has the colour; a menu that
// is shut, by the way `views.menu` hands back, once nothing is shown; the owner's colours after
// the eleven (ST-039); and of page.js, palette.js and index.html, which want a whole page, the
// text: a colour of the toolbar paints nothing. No browser, and no site but the made-up one. Run
// by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/swatch.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });

// A MADE-UP PAGE that keeps what is made. A part has what it was given, the parts put into it,
// what was put before it, what it was told to say of itself (`said`), how it is to look and the
// listeners it was told, one of a kind. A click on it is heard by its own listener, as a
// script's click is.
function part(tagName) {
  const made = { tagName: tagName.toUpperCase(), parts: [], hears: {}, said: {} };
  Object.assign(made, { dataset: {}, style: {} });
  made.append = (...more) => void made.parts.push(...more);
  made.replaceChildren = (...more) => void (made.parts = more);
  made.before = (...more) => void (made.led = more);
  made.addEventListener = (type, hear) => void (made.hears[type] = hear);
  made.setAttribute = (what, value) => void (made.said[what] = value);
  made.removeAttribute = (what) => void delete made.said[what];
  made.click = () => made.hears.click();
  return made;
}
// What the script asks the page for: the line that says that nothing is selected, which the row
// is put before. And the listeners that the document was told: none is the script's.
const page = { 'none-picked': part('p') };
const listeners = [];
const document = {
  getElementById: (id) => page[id],
  createElement: part,
  addEventListener: (type) => listeners.push(type),
};
// A MADE-UP `views.menu`, which keeps what it was handed and does of a menu what the script
// counts on - views.check.js and views-menu.check.js hold the real one: made, the part is
// hidden; a click on the button shows it, and a second click hides it; and it hands back the way
// to shut it, which hides the part, shown or not. `clicks` counts the clicks its button heard.
const handed = [];
let clicks = 0;
const views = {
  menu(button, panel) {
    handed.push([button, panel]);
    panel.hidden = true;
    button.addEventListener('click', () => ((clicks += 1), (panel.hidden = !panel.hidden)));
    return () => void (panel.hidden = true);
  },
};
Object.assign(globalThis, { document, views, location: { hash: '#top' } });

// The pad's scripts on the made-up plot, in the order of index.html, as far as the swatch needs
// them - strokes.js for the one writer of a colour - and the swatch's script last.
for (const one of 'demo-site paper figures shapes blocks legacy sketch own-colours strokes swatch'.split(
  ' ',
))
  await import(`./${one}.js`);
const { SITE, paper, sketch, swatch, structuredClone } = globalThis;
assert.equal(SITE.name, 'Made-up hillside plot');
assert.deepEqual([paper.PLANE, Object.keys(swatch)], ['top', ['show']]);

// THE PARTS, as the script made them: one row before the line that says that nothing is
// selected - so after the list of categories, which stands right after the pad's words - hidden
// until a block is shown. It holds the swatch, a button; the name of its colour; and the
// colours, which are the swatch's menu: the two were handed to `views.menu`, once. The swatch
// says what a click does and what it opens, and the document was told of no listener: while the
// menu is open the keys are its own by the one rule (views.js).
const [row, ...more] = page['none-picked'].led;
const [button, name, palette] = row.parts;
assert.deepEqual([more.length, row.parts.length, row.hidden], [0, 3, true]);
const made = (what) => [row, button, name, palette].map((one) => one[what]);
assert.deepEqual(made('id'), ['swatch-row', 'swatch', 'swatch-name', 'swatch-palette']);
assert.deepEqual([made('tagName'), button.type], [['DIV', 'BUTTON', 'SPAN', 'SPAN'], 'button']);
assert.deepEqual([row.className, palette.className], ['group', 'menu']);
assert.match(button.title, /^The colour of the selected block: a click opens the colours, .+$/);
assert.equal(button.said['aria-controls'], palette.id);
assert.deepEqual([handed, palette.hidden, listeners], [[[button, palette]], true, []]);

// THE COLOURS: eleven buttons in the order of the pad's one list, typed in here - each says its
// place in that list, is named by its colour's name, to a pointer and read out, and is in that
// colour. None is marked before a block is shown, and none says that it is pressed: pressed is
// said of a tool.
const colours = palette.parts;
const NAMES = 'ink red orange yellow green teal blue purple pink brown grey'.split(' ');
const told = (one) =>
  [one.tagName, one.type, one.dataset.colour, one.title, one.style.background].join(' ');
const LISTED = paper.COLOURS.map(
  ([named, value], place) => `BUTTON button ${place} ${named} ${value}`,
);
assert.deepEqual([colours.map(told), colours.map((one) => one.title)], [LISTED, NAMES]);
assert.deepEqual([colours.length, told(colours[6])], [11, 'BUTTON button 6 blue #2f7ed8']);
assert.deepEqual(
  colours.map((one) => one.said),
  NAMES.map((named) => ({ 'aria-label': named })),
);

// A SKETCH of its own, on one level: a red block of two boxes; a block of a red box and a blue
// one, as only a sketch written by hand holds one - Merge gives a block the colour of its first;
// four boxes whose colour the pad has not - a place that the list does not have, none at all, a
// word, and a place between two; and a car. Each box is 4 m by 4 m; a thing is told by its
// place among the things.
const BOX = { x: [0, 8], y: [16, 24], z: [16, 22], colour: 1 };
const box = (set) => ({ ...BOX, ...set });
const [RED, BLUE, GREEN, INK] = [1, 6, 4, 0];
const PAIR = [box({ group: 1 }), box({ x: [8, 16], group: 1 })];
const MIXED = [box({ x: [20, 28], group: 2 }), box({ x: [28, 36], colour: BLUE, group: 2 })];
const ODD = [99, undefined, 'red', 1.5].map((colour, at) =>
  box({ x: [40 + 8 * at, 48 + 8 * at], colour }),
);
const CAR = { kind: 'car', x: 80, y: 20, floor: 22 };
const [FIRST, SECOND, OF_RED, OF_BLUE, UNKNOWN, OBJECT] = [0, 1, 2, 3, 4, 8];
const things = () => sketch.doc.things;
const text = () => JSON.stringify(sketch.doc);
sketch.doc = sketch.adopt({
  ...sketch.blank(),
  things: structuredClone([...PAIR, ...MIXED, ...ODD, CAR]),
});
assert.deepEqual([things().length, things()[OBJECT].kind], [9, 'car']);
// AS THE PAGE DOES (page.js, `refresh`): a thing is selected, and after every change of the
// sketch the swatch is handed what is selected - nothing, once that is no thing of the sketch.
// `heard` counts the times the page was told of a change.
let selected = null;
let heard = 0;
sketch.onChange = () => {
  heard += 1;
  swatch.show(things().includes(selected) ? selected : null);
};
const select = (index) => swatch.show((selected = things()[index] ?? null));
/** What the swatch shows: `hidden` - or its colour, the name beside it, what it is read out by, and which colours of the menu are marked. */
const shows = () => {
  const marked = colours.flatMap((one) => (one.said['aria-current'] ? [one.title] : []));
  const read = [button.style.background, name.textContent, button.said['aria-label'], marked];
  return row.hidden ? 'hidden' : read;
};
/** The same, as it is to be, of a colour of the list: the one colour marked is that one. */
const inColour = (place) => {
  const [named, value] = paper.COLOURS[place];
  return [value, named, `Colour: ${named}`, [named]];
};

// NOTHING, AND AN OBJECT: the row is hidden, and there is no swatch.
select(-1);
assert.equal(shows(), 'hidden');
select(OBJECT);
assert.equal(shows(), 'hidden');
// A RED BLOCK: the swatch in red, #d9482b, beside "red", and red marked in the menu - by
// whichever box the block is selected. THE BOX THAT IS SELECTED says the colour: of a block
// whose boxes differ, the swatch is red by the red box and blue by the blue one.
for (const index of [FIRST, SECOND]) {
  select(index);
  assert.deepEqual(shows(), ['#d9482b', 'red', 'Colour: red', ['red']]);
}
select(OF_RED);
assert.deepEqual(shows(), inColour(RED));
select(OF_BLUE);
assert.deepEqual(shows(), inColour(BLUE));
// A COLOUR THE PAD HAS NOT is its first, ink, as the paper draws it: the swatch in #1f2933,
// beside "ink". The sketch says what it said: showing writes nothing.
const plain = text();
for (const index of [0, 1, 2, 3].map((at) => UNKNOWN + at)) {
  select(index);
  assert.equal(paper.hex(things()[index].colour), '#1f2933');
  assert.deepEqual(shows(), ['#1f2933', 'ink', 'Colour: ink', ['ink']]);
}
assert.deepEqual([text(), sketch.past.length, heard], [plain, 0, 0]);

/** A pick, as a browser tells of one: the colour at a place of the menu hears a click. How many steps there are to undo, and how often the page was told. */
function pick(place) {
  colours[place].hears.click();
  return [sketch.past.length, heard];
}
// A PICK of green on the red block of two boxes: both say the place of green, and nothing else
// of the sketch is another. The swatch is green. It is one step, and the page was told once:
// Undo has the bytes of before, makes the sketch anew - and the swatch is gone.
select(SECOND);
const both = (place) => plain.replaceAll('"colour":1,"group":1', `"colour":${place},"group":1`);
assert.deepEqual([pick(GREEN), plain.split('"colour":1,"group":1').length], [[1, 1], 3]);
assert.deepEqual([text(), shows()], [both(GREEN), inColour(GREEN)]);
sketch.step(sketch.past, sketch.future);
assert.deepEqual([text(), shows(), sketch.past.length], [plain, 'hidden', 0]);
// A PICK OF THE COLOUR IT HAS changes nothing: no step, the page is not told, and the swatch
// is as it was. And with nothing shown a pick is none.
select(FIRST);
heard = 0;
assert.deepEqual([pick(RED), text(), shows()], [[0, 0], plain, inColour(RED)]);
select(OBJECT);
assert.deepEqual([pick(GREEN), text(), shows()], [[0, 0], plain, 'hidden']);
// THE WHOLE BLOCK IS PAINTED, whichever box says the colour that is picked: blue, picked by the
// blue box of the block whose other box is red, is on both - one step, and the red box alone
// is another in the text.
select(OF_BLUE);
assert.deepEqual([pick(BLUE), shows()], [[1, 1], inColour(BLUE)]);
assert.equal(text(), plain.replace('"colour":1,"group":2', '"colour":6,"group":2'));
// THE SWATCH SHOWS THE BLOCK ANEW ITSELF after a pick, and waits for nobody: on a page that is
// told of the change and hands nothing back, it is in the colour that was picked.
const handsOver = sketch.onChange;
sketch.onChange = () => (heard += 1);
assert.deepEqual([pick(GREEN), shows()], [[2, 2], inColour(GREEN)]);
sketch.onChange = handsOver;
// And ink, picked for a box whose colour the pad has not, is in the sketch: the place of ink.
select(UNKNOWN);
assert.deepEqual([pick(INK), things()[UNKNOWN].colour, shows()], [[3, 3], 0, inColour(INK)]);

// THE MENU IS SHUT once nothing is shown, or an object: open, it would keep the keys of a page
// that shows none. It is shut by the way `views.menu` handed back, and by no click on its
// button: the button hears the one click that opened it. Told the same again, it stays shut.
// Shown a block, an open menu stays open.
for (const none of [-1, OBJECT]) {
  select(FIRST);
  button.click();
  clicks = 0;
  select(SECOND);
  assert.deepEqual([palette.hidden, shows()], [false, inColour(RED)]);
  for (const time of ['once', 'again']) {
    select(none);
    assert.deepEqual([palette.hidden, shows(), clicks], [true, 'hidden', 0], time);
  }
}

// THE OWNER'S COLOURS (ST-039), after the eleven in the list's order, each read out by its name:
// a pick paints every box of the block in its value, one step, and marks it. Beside the swatch
// the name of a listed value - and of a plain one, taken off the list, the value, marked nowhere.
const OWN = Object.entries({ Sky: '#3a7bd5', Moss: '#4a7c2a' });
const MOSS = OWN[1][1];
sketch.change((doc) => void (doc.colours = OWN.map(([named, value]) => ({ name: named, value }))));
select(FIRST);
const mark = ({ said }) => said['aria-label'] + (said['aria-current'] ? ' marked' : '');
const own = () => palette.parts.slice(11).map(mark);
const ownAs = OWN.map(([named, value]) => `BUTTON button ${value} ${named} ${value}`);
assert.deepEqual([palette.parts.slice(0, 11), palette.parts.slice(11).map(told)], [colours, ownAs]);
assert.deepEqual(own(), ['Sky', 'Moss']);
const steps = sketch.past.length;
palette.parts[12].hears.click();
const [first, second] = things();
assert.deepEqual([first.colour, second.colour, sketch.past.length], [MOSS, MOSS, steps + 1]);
assert.deepEqual(shows(), [MOSS, 'Moss', 'Colour: Moss', []]);
assert.deepEqual(own(), ['Sky', 'Moss marked']);
sketch.change((doc) => void doc.colours.pop());
select(FIRST);
assert.deepEqual([shows(), own()], [[MOSS, MOSS, `Colour: ${MOSS}`, []], ['Sky']]);

// OF page.js, which wants a whole page to load, the text alone. `refresh` hands the swatch what
// is selected in the line after it hands the list of categories the same, and nothing else of
// the page names the swatch. The page takes the tool a pick of the palette names; a height that
// is one takes Block too; and `paint` is named nowhere in it. OF palette.js no more than that
// `paint` is named nowhere: what a pick leaves on is palette.check.js's to hold.
const read = (file) => readFileSync(`${import.meta.dirname}/${file}`, 'utf8');
const lines = (file) =>
  read(file)
    .split('\n')
    .map((line) => line.trim());
const code = lines('page.js');
const refresh = code.slice(code.indexOf('function refresh() {'));
const at = refresh.findIndex((line) => line.startsWith('globalThis.categoryList.show(picked);'));
assert.ok(at > 0 && at < refresh.indexOf('render();'), 'refresh hands the list what is selected');
assert.match(refresh[at + 1], /^globalThis\.swatch\.show\(picked\);/);
assert.equal(code.filter((line) => line.includes('globalThis.swatch')).length, 1, 'named once');
const TAKEN = ['palette.onPick = (next) => {', 'tool = next;', 'refresh();', '};'];
const takes = code.indexOf(TAKEN[0]);
assert.deepEqual(code.slice(takes, takes + 4), TAKEN, 'the page takes the tool a colour names');
assert.ok(
  refresh.some((line) => line.startsWith('palette.show(tool);')),
  'the page asks it to',
);
const SET = "if (Number($('high').value) > 0) [high, tool] = [Number($('high').value), 'block'];";
const typed = code.indexOf("$('high').addEventListener('input', () => {");
assert.deepEqual([typed > 0, code[typed + 1]], [true, SET], 'a height takes Block');
assert.match(code[typed + 2], /^refresh\(\);/, 'the page shows the tool that a height took');
assert.ok(!/paint/i.test(read('page.js')), 'page.js names paint');
assert.ok(!/paint/i.test(read('palette.js')), 'palette.js names paint');
// OF index.html: the Block tool has no button, and the swatch's script is named once, in a line
// after the list's - and after all that it asks as it loads: the colours, the sketch, the writer
// of a colour, the menu - and before page.js, whose `refresh` hands it what is selected.
const html = read('index.html');
assert.ok(!html.includes('data-tool="block"'), 'the Block tool has a button');
const NAMES_A_SCRIPT = /^<script src="([^"]+)"><\/script>$/;
const scripts = html.split('\n').flatMap((line) => NAMES_A_SCRIPT.exec(line.trim())?.[1] ?? []);
const place = scripts.indexOf('swatch.js');
assert.equal(scripts.filter((one) => one === 'swatch.js').length, 1);
for (const before of ['paper.js', 'sketch.js', 'strokes.js', 'views.js', 'category-list.js'])
  assert.ok(scripts.indexOf(before) >= 0 && scripts.indexOf(before) < place, before);
assert.ok(place < scripts.indexOf('page.js'), 'the page hands the swatch what is selected');

process.stdout.write(
  "tools/sketch: the swatch beside the paper shows the colour of the selected block, the eleven and the owner's, a pick paints every box of it in one step, and a colour of the toolbar paints nothing\n",
);
