// The check of the toolbar's colours (story ST-039, palette.js): the pad's own scripts and that
// one on a made-up store, the made-up plot and a made-up page that keeps what is made, with a
// made-up `views` that keeps what it was handed, and a made-up `prompt` and `confirm` that answer
// as they are told. The colour that the tab kept, read back; the parts and their order; a pick of
// the eleven and of the owner's, and the tool it leaves on - Line where Line is the tool, Block
// with any other - and `#colour`, which is Block; a colour chosen and named, refused, not named;
// a colour taken off the list, in use and not; and the list after an Undo. No browser, and no
// site but the made-up one. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/palette.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });

// A MADE-UP PAGE that keeps what is made: a part has what it was given, its parts, what it was
// told to say of itself (`said`), how it is to look and the listeners it was told, one of a kind.
function part(tagName) {
  const made = { tagName: tagName.toUpperCase(), parts: [], hears: {}, said: {} };
  Object.assign(made, { dataset: {}, style: {} });
  Object.defineProperty(made, 'children', { get: () => made.parts.filter((one) => one.tagName) });
  made.append = (...more) => void made.parts.push(...more);
  made.replaceChildren = (...more) => void (made.parts = more);
  made.addEventListener = (type, hear) => void (made.hears[type] = hear);
  made.setAttribute = (what, value) => void (made.said[what] = value);
  made.removeAttribute = (what) => void delete made.said[what];
  made.click = () => made.hears.click();
  return made;
}
const page = {};
const document = { getElementById: (id) => page[id], createElement: part };
// A MADE-UP `views`: what the tab showed last, `seen`; a menu that keeps what it was handed; and
// what the tab is to keep. And `prompt` and `confirm`, which keep what they were asked.
const views = { seen: {}, handed: [], kept: [] };
views.menu = (button, panel) => void views.handed.push([button, panel]);
views.keep = (showing) => void views.kept.push(showing);
const asked = [];
const answers = [];
const ask = (question) => (asked.push(question), answers.shift());
Object.assign(globalThis, {
  document,
  views,
  prompt: ask,
  confirm: ask,
  location: { hash: '#top' },
});
for (const one of 'demo-site paper figures shapes blocks legacy sketch own-colours'.split(' '))
  await import(`./${one}.js`);
const { SITE, paper, sketch, structuredClone } = globalThis;
assert.equal(SITE.name, 'Made-up hillside plot');

// A SKETCH of its own: two colours of the owner's listed; a block of two boxes, a box and a line
// in the first; and a box in a colour that is listed no more.
const [SKY, MOSS, PLAIN] = ['#3a7bd5', '#4a7c2a', '#c0ffee'];
const LISTED = [
  { name: 'Sky', value: SKY },
  { name: 'Moss', value: MOSS },
];
const BOX = { x: [0, 8], y: [16, 24], z: [16, 22], colour: SKY };
const box = (set) => ({ ...BOX, ...set });
const THINGS = [box({ group: 1 }), box({ x: [8, 16], group: 1 }), box({ x: [20, 28] })];
const NOTES = [{ view: 'top', at: 22, line: [0, 30, 6, 30, SKY] }];
const first = { ...sketch.blank(), things: [...THINGS, box({ x: [40, 48], colour: PLAIN })] };
sketch.doc = sketch.adopt(structuredClone({ ...first, notes: NOTES, colours: LISTED }));
const text = () => JSON.stringify(sketch.doc);

/** palette.js loaded anew, on a page of its own, as a tab that kept `kept` opens it. */
let loads = 0;
async function load(kept) {
  [views.seen, views.handed, views.kept, page.palette] = [kept, [], [], part('span')];
  await import(`./palette.js?${(loads += 1)}`);
  return globalThis.palette;
}
// THE COLOUR THAT THE TAB KEPT, read back: one of the eleven by its number; a value of the
// owner's, listed or not - read out by its name, or by its value; and anything else is red.
const READ = [
  [{ colour: 3 }, 3, 'yellow'],
  [{ colour: SKY }, SKY, 'Sky'],
  [{ colour: PLAIN }, PLAIN, PLAIN],
  [{ colour: 11 }, 1, 'red'],
  [{ colour: 'red' }, 1, 'red'],
  [{}, 1, 'red'],
];
for (const [kept, colour, name] of READ) {
  const palette = await load(kept);
  const button = page.palette.parts[0];
  assert.deepEqual([palette.colour(), button.said['aria-label']], [colour, name], name);
  assert.deepEqual(
    views.kept.map((one) => one()),
    [{ colour }],
    'the tab keeps it',
  );
  assert.equal(button.title, `Draw a block in ${name} (B: in the colour picked last)`);
  assert.equal(button.style.background, paper.hex(colour));
}

// THE PARTS, in their order: in `#palette` the button in the colour to draw with, the arrow
// read out as Colours, and the menu they open - the two handed to `views.menu`, once. In the
// menu the eleven, each read out by its name and in its colour; the owner's list, a row each,
// in the sketch's order, of a button that picks the colour - a swatch and its name - and one
// that takes it off; and a label round the browser's colour chooser.
const palette = await load({ colour: 6 });
const [button, open, menu] = page.palette.parts;
const ids = [button, open, menu].map((one) => [one.tagName, one.id]);
assert.deepEqual(ids, [
  ['BUTTON', 'colour'],
  ['BUTTON', 'colours-open'],
  ['DIV', 'colours'],
]);
assert.deepEqual(
  [open.textContent, open.said, views.handed],
  ['▾', { 'aria-label': 'Colours', 'aria-controls': 'colours' }, [[open, menu]]],
);
const [eleven, own, adds] = menu.parts;
assert.deepEqual(
  [eleven.className, own.tagName, own.id, adds.tagName],
  ['eleven', 'UL', 'own-colours', 'LABEL'],
);
const NAMES = 'ink red orange yellow green teal blue purple pink brown grey'.split(' ');
assert.deepEqual(
  eleven.parts.map((one) => one.said['aria-label']),
  NAMES,
);
assert.deepEqual(
  eleven.parts.map((one) => one.style.background),
  paper.COLOURS.map((one) => one[1]),
);
const [chooser, words] = adds.parts;
assert.deepEqual(
  [chooser.tagName, chooser.type, chooser.id, words],
  ['INPUT', 'color', 'colour-chooser', 'Add a colour'],
);
/** The owner's list as it shows: of each row, the name of its button, its value, and what its other button is read out by. */
const rows = () =>
  own.parts.map(({ parts: [picks, off] }) => [
    picks.parts[1],
    picks.dataset.colour,
    off.said['aria-label'],
  ]);
const ROWS = [
  ['Sky', SKY, 'Take Sky off the list'],
  ['Moss', MOSS, 'Take Moss off the list'],
];
assert.deepEqual(
  [rows(), own.hidden, own.parts[0].parts[0].parts[0].style.background],
  [ROWS, false, SKY],
);

// AS THE PAGE DOES (page.js): it takes the tool a pick names, and hands it to `palette.show`
// again, as at every change of the sketch. `named` are the tools the palette named.
let tool = 'move';
const named = [];
palette.onPick = (next) => {
  named.push((tool = next));
  palette.show(tool);
};
sketch.onChange = () => palette.show(tool);
/** What is marked in the menu, by what each is read out by; and whether `#colour` shows pressed. */
const marked = () => [
  ...eleven.parts.filter((one) => one.said['aria-current']).map((one) => one.said['aria-label']),
  ...own.parts
    .filter((one) => one.parts[0].said['aria-current'])
    .map((one) => one.parts[0].parts[1]),
];
const pressed = () => button.said['aria-pressed'];
palette.show(tool);
assert.deepEqual([marked(), pressed()], [['blue'], 'false']);

// A PICK of the eleven with Select: Block, in that colour, pressed. One of the owner's, with Line:
// Line stays, in that colour - marked, and `#colour` in it. A click on `#colour` with Line: Block.
const before = text();
eleven.parts[4].click();
assert.deepEqual([named, palette.colour(), marked(), pressed()], [['block'], 4, ['green'], 'true']);
palette.show((tool = 'line'));
own.parts[1].parts[0].click();
assert.deepEqual(
  [named.at(-1), palette.colour(), marked(), pressed()],
  ['line', MOSS, ['Moss'], 'false'],
);
assert.deepEqual([button.style.background, button.said['aria-label']], [MOSS, 'Moss']);
eleven.parts[9].click();
assert.deepEqual([named.at(-1), palette.colour(), marked()], ['line', 9, ['brown']]);
button.click();
assert.deepEqual([named.at(-1), palette.colour(), pressed()], ['block', 9, 'true']);
palette.show((tool = 'text'));
own.parts[0].parts[0].click();
assert.deepEqual([named.at(-1), palette.colour()], ['block', SKY]);
// A pick changes nothing drawn, and makes no step.
assert.deepEqual([text(), sketch.past.length], [before, 0]);

// A COLOUR CHOSEN AND NAMED, with Line the tool: the pad asks its name, the list has it at its
// foot - one step - and it is picked, Line left on.
palette.show((tool = 'line'));
const choose = (value, answer) => {
  [chooser.value, asked.length] = [value, 0];
  answers.push(answer);
  chooser.hears.change();
  return asked;
};
assert.deepEqual(choose('#123abc', ' Sea '), ['Name of the new colour: up to 30 characters']);
assert.deepEqual(
  [sketch.past.length, named.at(-1), palette.colour(), marked()],
  [1, 'line', '#123abc', ['Sea']],
);
assert.deepEqual(
  rows().map((one) => one[0]),
  ['Sky', 'Moss', 'Sea'],
);
assert.deepEqual(sketch.doc.colours.at(-1), { name: 'Sea', value: '#123abc' });
// REFUSED - a name there is already - the alarm says it, and nothing is written; NO NAME, nothing.
const added = text();
let told = 0;
sketch.onChange = () => ((told += 1), palette.show(tool));
choose('#654321', 'sea');
assert.deepEqual(
  [sketch.trouble, text(), sketch.past.length, told],
  ['There is a colour "Sea" already.', added, 1, 1],
);
assert.equal(palette.colour(), '#123abc', 'a name refused picks nothing');
choose('#654321', null);
assert.deepEqual([text(), sketch.past.length, told, palette.colour()], [added, 1, 1, '#123abc']);
sketch.trouble = '';

// A COLOUR IN USE TAKEN OFF: the pad asks, with how much is in it - a block of two boxes is one
// block; on no nothing changes; on yes one step, every box and line in it as it was, the list
// without it. The colour to draw with stays, a colour with no name: `#colour` says its value.
const off = (name) => own.parts.find((one) => one.parts[0].parts[1] === name).parts[1];
palette.show((tool = 'block'));
own.parts[0].parts[0].click();
const SAID =
  '2 blocks and 1 line are in "Sky". They keep its colour, with no name. Take "Sky" off the list?';
asked.length = 0;
answers.push(false);
off('Sky').click();
assert.deepEqual([asked, text(), sketch.past.length], [[SAID], added, 1]);
answers.push(true);
off('Sky').click();
assert.equal(sketch.past.length, 2);
const { things, notes } = JSON.parse(added);
assert.deepEqual([sketch.doc.things, sketch.doc.notes], [things, notes]);
assert.deepEqual(
  [rows().map((one) => one[0]), palette.colour(), button.said['aria-label']],
  [['Moss', 'Sea'], SKY, SKY],
);
// The words for one, and none of a part that is nought: one line alone is.
sketch.change((doc) => void (doc.notes[0].line[4] = MOSS));
sketch.change((doc) => void (doc.colours = [...doc.colours, { name: 'Sky', value: SKY }]));
asked.length = 0;
answers.push(false);
off('Moss').click();
assert.deepEqual(asked, [
  '1 line is in "Moss". They keep its colour, with no name. Take "Moss" off the list?',
]);
// ONE NOT IN USE goes with no question, in one step.
const steps = sketch.past.length;
asked.length = 0;
off('Sea').click();
assert.deepEqual(
  [asked, sketch.past.length, rows().map((one) => one[0])],
  [[], steps + 1, ['Moss', 'Sky']],
);

// AFTER AN UNDO the list is as the sketch has it: Sea is back, and Sky is where it was put.
sketch.step(sketch.past, sketch.future);
assert.deepEqual(
  rows().map((one) => one[0]),
  ['Moss', 'Sea', 'Sky'],
);
for (let back = sketch.past.length; back > 0; back -= 1) sketch.step(sketch.past, sketch.future);
assert.deepEqual([text(), rows()], [before, ROWS]);
// A sketch that lists none has no rows, and the list is hidden.
sketch.change((doc) => void delete doc.colours);
assert.deepEqual([own.parts, own.hidden], [[], true]);

process.stdout.write(
  "tools/sketch: the toolbar holds the colour to draw with and its menu - the eleven, the owner's list, a colour to add - a pick leaves Line on where it is the tool, and the list is written in one step each way\n",
);
