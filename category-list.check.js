// The check of the list of categories beside the paper (story ST-028, category-list.js): the
// pad's own scripts and that one on a made-up store, the made-up plot and a made-up page that
// keeps what is made. The list as it is built of the pad's one list; what it shows of nothing,
// of an object and of a block - a category by its name, a name that gives none, no name; a pick
// on every box of a block, against what C had set, against the name, of the very category that
// the name gives, and of the first entry, back to the bytes of before; the key K and Escape, by
// made-up keys; the word that the paper writes on a block without a name (draw.js), on a canvas
// that keeps what is written; and of page.js and index.html, which want a whole page, the text.
// No browser, and no site but the made-up one. Run by tools/sketch/check.js, or alone:
// pnpm exec node tools/sketch/category-list.check.js
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
// what was put after it and the listeners it was told, one of a kind. `did` says, in their
// order, which part took the focus, gave it back or was asked to open.
const did = [];
function part(tagName) {
  const made = { tagName: tagName.toUpperCase(), parts: [], hears: {}, dataset: {} };
  made.append = (...more) => void made.parts.push(...more);
  made.after = (...more) => void (made.followed = more);
  made.addEventListener = (type, hear) => void (made.hears[type] = hear);
  made.setAttribute = () => {};
  for (const act of ['focus', 'blur', 'showPicker'])
    made[act] = () => void did.push(`${made.id} ${act}`);
  return made;
}
// What the scripts ask the page for: the switch of views, the title and the paper (views.js),
// and the pad's words of what is selected, which the list is put after. And the listeners for
// keys that the document was told: the switch's, and the list's.
const page = Object.fromEntries(['views', 'title', 'paper', 'picked'].map((id) => [id, part('p')]));
const listeners = [];
const document = {
  getElementById: (id) => page[id],
  createElement: part,
  addEventListener: (type, hear) => type === 'keydown' && listeners.push(hear),
};
const went = [];
const location = { hash: '#top', assign: (href) => went.push(href), reload() {} };
// Nothing of the site is drawn here (land.js): what the paper writes on a block is draw.js's.
const land = { ground() {}, grid() {}, site() {} };
Object.assign(globalThis, { document, location, land, addEventListener() {} });

// The pad's scripts on the made-up plot, in the order of index.html, as far as the list needs
// them - and draw.js for the word on the paper. The list's script last, as on the page.
const NEEDED =
  'demo-site paper figures shapes categories blocks draw draw-marks legacy sketch labels footer';
for (const one of [...NEEDED.split(' '), 'views', 'category-list']) await import(`./${one}.js`);
const { SITE, paper, sketch, categories, categoryList, structuredClone } = globalThis;
assert.equal(SITE.name, 'Made-up hillside plot');
assert.deepEqual([paper.PLANE, Object.keys(categoryList)], ['top', ['show']]);

// THE PARTS, as the script made them: one row right after the pad's words of what is selected,
// hidden until a block is shown, which holds the list and under it the sentence. The list's
// title says what it is, and its key.
const [row, ...more] = page.picked.followed;
const [list, said] = row.parts;
assert.deepEqual([more.length, row.parts.length, row.hidden], [0, 2, true]);
assert.deepEqual([row.id, list.id, said.id], ['category-row', 'category', 'category-said']);
assert.deepEqual([row.tagName, list.tagName, said.tagName], ['DIV', 'SELECT', 'P']);
assert.match(list.title, /^The category of the selected block, .+ \(K\)$/);

// THE LIST, as it is built: "by its name" first, with no word for a value, and then five groups
// - what a block counts as, in the pad's words - of 22, 5, 1, 1 and 1 entries. Each entry is a
// row of the pad's one list, by its word and its name, in the order of that list; and a group
// holds the rows that count as one thing, and no other.
const [first, ...groups] = list.parts;
assert.deepEqual([first.tagName, first.value], ['OPTION', '']);
const entries = groups.flatMap((group) => group.parts);
const rowOf = ({ tagName, value, textContent }) => `${tagName} ${value}: ${textContent}`;
const ROWS = categories.LIST.map(({ key, name }) => `OPTION ${key}: ${name}`);
assert.deepEqual([entries.map(rowOf), ROWS.length], [ROWS, 30]);
const GROUPS = { room: 'A room', open: 'Open air', glass: 'Glass', ground: 'Ground', cut: 'A cut' };
const counting = (as) => categories.LIST.filter((one) => one.as === as).map((one) => one.key);
const grouped = ({ tagName, label, parts }) => `${tagName} ${label}: ${parts.map((p) => p.value)}`;
const AS_COUNTED = Object.entries(GROUPS).map(
  ([as, label]) => `OPTGROUP ${label}: ${counting(as)}`,
);
assert.deepEqual(groups.map(grouped), AS_COUNTED);
assert.equal(groups.map((group) => group.parts.length).join(), '22,5,1,1,1');

// A SKETCH of its own, on one level, at 815 m: a block without a name, one named "Kitchen /
// Dining", one named "Day rooms" - which holds no word of the list - a block of two boxes, and
// a car. Each box is 4 m by 4 m, in rows 16 to 24 of the top view; a block is told by its column.
const BOX = { x: [20, 28], y: [16, 24], z: [16, 22], colour: 1 };
const box = (column, set) => ({ ...BOX, x: [column, column + 8], ...set });
const TWO = [box(50, { group: 1 }), box(58, { group: 1 })];
const NAMED = [box(30, { name: 'Kitchen / Dining' }), box(40, { name: 'Day rooms' })];
const CAR = { kind: 'car', x: 72, y: 20, floor: 22 };
const [BARE, KITCHEN, DAY, PAIR, OBJECT] = [0, 1, 2, 3, 5];
const begin = (...things) => {
  sketch.doc = sketch.adopt({ ...sketch.blank(), things: structuredClone(things) });
};
const things = () => sketch.doc.things;
const text = () => JSON.stringify(sketch.doc);
// AS THE PAGE DOES (page.js, `refresh`): a thing is selected, and after every change of the
// sketch the list is handed what is selected - nothing, once that is no thing of the sketch.
let selected = null;
sketch.onChange = () => categoryList.show(things().includes(selected) ? selected : null);
const select = (index) => categoryList.show((selected = things()[index] ?? null));
/** What the list shows: `hidden` - or where it stands, what its first entry reads, and the sentence under it. */
const shows = () => (row.hidden ? 'hidden' : [list.value, first.textContent, said.textContent]);
/** The same, as it is to be: of a block by its name, and of one with a picked category - `gives` is what its name gives. */
const byName = (gives, sentence) => ['', `By its name: ${gives}`, sentence];
const picked = (key, name, gives = 'no category') => [
  key,
  ...byName(gives, `Category: ${name}, picked from the list.`).slice(1),
];
begin(box(20), ...NAMED, ...TWO, CAR);

// NOTHING, AND AN OBJECT: the row is hidden, and the list is not to be had.
select(-1);
assert.equal(shows(), 'hidden');
select(OBJECT);
assert.deepEqual([things()[OBJECT].kind, shows()], ['car', 'hidden']);
// A BLOCK BY ITS NAME: the row shows. The list stands at its first entry, which reads what the
// name gives - a Kitchen; no category, where the name holds no word of the list, and where the
// block has no name - over the pad's own sentence.
const KITCHEN_NAMED = byName('Kitchen', 'Category: Kitchen, by its name.');
select(KITCHEN);
assert.deepEqual(shows(), KITCHEN_NAMED);
select(DAY);
assert.deepEqual(
  shows(),
  byName('no category', 'No category: its name holds no word of the list.'),
);
select(BARE);
assert.deepEqual(shows(), byName('no category', 'No category: it has no name.'));

/** A pick, as a browser tells of one: the list stands at an entry, and says `change`. What the page was asked meanwhile. */
function pick(key) {
  list.value = key;
  list.hears.change();
  return did.splice(0);
}
// A PICK of Bathroom on the block of two boxes: both say it, and nothing else of the sketch is
// another. The list stands at Bathroom, the sentence says picked, and the focus was given back.
// It is one step: Undo has the bytes of before, makes the sketch anew - and the list is gone.
select(PAIR);
const [plain, steps] = [text(), sketch.past.length];
const both = (key) => plain.replaceAll('"group":1', `"group":1,"category":"${key}"`);
assert.deepEqual([pick('bathroom'), plain.split('"group":1').length], [['category blur'], 3]);
assert.deepEqual([text(), sketch.past.length], [both('bathroom'), steps + 1]);
assert.deepEqual(shows(), picked('bathroom', 'Bathroom'));
sketch.step(sketch.past, sketch.future);
assert.deepEqual([text(), shows()], [plain, 'hidden']);
// AGAINST WHAT C HAD SET: the block set to a room by hand and then picked a Balcony says the
// category on both boxes, and `is` on none - it counts as its category says.
select(PAIR);
sketch.countNext(selected);
assert.equal(text(), plain.replaceAll('"group":1', '"group":1,"is":"room"'));
pick('balcony');
assert.deepEqual([text(), shows()], [both('balcony'), picked('balcony', 'Balcony')]);
// THE VERY CATEGORY THAT THE NAME GIVES is another entry, and can be picked: the block named
// "Kitchen / Dining" says `kitchen`, and the list stands at Kitchen - picked, where it read "By
// its name: Kitchen". AGAINST THE NAME, Storage: the first entry still says what the name gives.
// THE FIRST ENTRY takes the category away: by its name again, and the bytes of before the picks.
select(KITCHEN);
const named = text();
pick('kitchen');
assert.equal(text(), named.replace('Dining"', 'Dining","category":"kitchen"'));
assert.deepEqual(shows(), picked('kitchen', 'Kitchen', 'Kitchen'));
pick('storage');
assert.deepEqual(shows(), picked('storage', 'Storage', 'Kitchen'));
assert.deepEqual([pick(''), text(), shows()], [['category blur'], named, KITCHEN_NAMED]);
// THE LIST SHOWS THE BLOCK ANEW after a pick, itself: a word that no row has - none that a list
// of the page could say - is no pick, the page is not told, and the list stands where the block
// is. And a `change` with nothing shown changes nothing.
const told = sketch.past.length;
assert.deepEqual(pick('pantry'), ['category blur']);
assert.deepEqual([text(), sketch.past.length, shows()], [named, told, KITCHEN_NAMED]);
select(OBJECT);
assert.deepEqual([pick('kitchen'), text(), shows()], [['category blur'], named, 'hidden']);
// THE LIST FOLLOWS what else changes the block, as the page hands it over: a name given, and C.
select(BARE);
sketch.name(selected, 'Guest Bed');
assert.deepEqual(shows(), byName('Bedroom', 'Category: Bedroom, by its name.'));
pick('garden');
sketch.countNext(selected);
assert.deepEqual([selected.is, shows()], ['room', picked('garden', 'Garden', 'Bedroom')]);

// THE KEY K, by made-up keys, as a browser tells of them: pressed on the page with a block
// shown, the list takes the focus and is asked to open - and the key ends there, or it would be
// typed into the list, which takes a K for a Kitchen. With Shift it is the same key.
const [BODY, FIELD] = [{ tagName: 'BODY' }, { tagName: 'INPUT', type: 'text' }];
/** A key pressed on a thing of the page, with what is held: whether the key ended there, and what the page was asked. */
function press(key, target = BODY, held = {}) {
  const event = { key, target, ctrlKey: false, metaKey: false, altKey: false, ...held };
  let ended = false;
  event.preventDefault = () => (ended = true);
  for (const hear of listeners) hear(event);
  return [ended, ...did.splice(0)];
}
assert.equal(listeners.length, 2, 'the switch of views listens, and the list');
const OPENED = [true, 'category focus', 'category showPicker'];
assert.deepEqual([press('k'), press('K', BODY, { shiftKey: true })], [OPENED, OPENED]);
// TYPED INTO A FIELD it is the field's - into the list itself, too - and with Ctrl, Alt or the
// command key it is the browser's. Another key is not the list's. And with an object selected,
// or nothing, K does nothing.
const IDLE = [false];
for (const field of [FIELD, list, { tagName: 'TEXTAREA' }])
  assert.deepEqual(press('k', field), IDLE);
for (const held of ['ctrlKey', 'metaKey', 'altKey'])
  assert.deepEqual(press('k', BODY, { [held]: true }), IDLE, held);
for (const other of ['j', 'c', 'b', 'Escape', 'Enter']) assert.deepEqual(press(other), IDLE, other);
for (const none of [OBJECT, -1]) {
  select(none);
  assert.deepEqual(press('k'), IDLE);
}
assert.deepEqual(went, [], 'K is no key of a view');
// ESCAPE IN THE LIST gives the focus back, and changes nothing: heard as the key goes down - and
// as it comes up, for an open list may take the key itself. Another key is the list's own.
select(BARE);
const [kept, stood] = [text(), shows()];
for (const heard of ['keydown', 'keyup']) {
  list.hears[heard]({ key: 'Escape', target: list });
  assert.deepEqual(did.splice(0), ['category blur'], heard);
  for (const own of ['b', 'ArrowDown', 'Enter', undefined]) list.hears[heard]({ key: own });
  assert.deepEqual(did.splice(0), [], heard);
}
assert.deepEqual([text(), shows()], [kept, stood]);
// WHERE THE BROWSER LETS NO SCRIPT OPEN A LIST, or knows no way to, K gives it the focus alone.
const refused = () => {
  throw new Error('NotAllowedError: a list is opened by a person');
};
for (const open of [refused, undefined]) {
  list.showPicker = open;
  assert.deepEqual(press('k'), [true, 'category focus']);
}

// THE WORD ON THE PAPER (draw.js, `ink`): a block without a name shows the category that was
// picked for it where its name would stand, in the middle of its boxes; a block with a name
// shows its name, whatever was picked for it; and a block with neither shows nothing. A canvas
// that keeps what is written on it, and where, at 10 pixels a cell: all else that a drawing asks
// of a canvas is done, and not kept.
function written() {
  const texts = [];
  const pen = { fillText: (...told) => texts.push(told.join()) };
  const ctx = new Proxy(pen, { get: (target, key) => target[key] ?? (() => {}) });
  const layer = { ...sketch.layer(paper.PLANE, sketch.on()), faded: false };
  paper.draw({ style: {}, getContext: () => ctx }, { px: 10, layers: [layer], cuts: {} });
  return texts;
}
begin(box(20), ...NAMED, ...TWO);
const NAMES = ['Kitchen / Dining,340,200', 'Day rooms,440,200'];
assert.deepEqual(written(), NAMES);
sketch.categorise(things()[BARE], 'bathroom');
sketch.categorise(things()[KITCHEN], 'storage');
sketch.categorise(things()[PAIR], 'ground-cut');
assert.deepEqual(written(), ['Bathroom,240,200', ...NAMES, 'Ground cut,580,200']);
sketch.categorise(things()[BARE], '');
sketch.categorise(things()[PAIR], '');
assert.deepEqual(written(), NAMES);

// OF page.js, which wants a whole page to load, the text alone. `refresh` hands the list what is
// selected in the line after it writes and shows the pad's words, and nothing else of the page
// does. And the label of what is selected stands a line lower where a word stands on the block:
// its name, or else the category that was picked for it.
const read = (file) => readFileSync(`${import.meta.dirname}/${file}`, 'utf8').split('\n');
const code = read('page.js').map((line) => line.trim());
const from = (opening) => code.slice(code.indexOf(opening));
const refresh = from('function refresh() {');
const at = refresh.indexOf(
  "$('picked').textContent = picked ? footer.picked(picked).words : footer.several(several);",
);
assert.ok(
  at > 0 && at < refresh.indexOf('render();'),
  'refresh writes the words of what is selected',
);
assert.equal(refresh[at + 1], "$('picked').hidden = !picked && several.length === 0;");
assert.match(refresh[at + 2], /^globalThis\.categoryList\.show\(picked\);/);
assert.equal(code.filter((line) => line.includes('categoryList')).length, 1, 'named once');
const chosen = from('function chosen() {');
const word = chosen.findIndex((line) => line.startsWith('const word = '));
assert.ok(word > 0 && word < chosen.indexOf('}'), 'chosen asks which word stands on the block');
assert.match(chosen[word], /^const word = sketch\.named\(picked\) \?\? sketch\.worded\(picked\);/);
const LOWER = 'const said = { label: footer.picked(picked).label, lower: Boolean(word) };';
assert.equal(chosen[word + 1], LOWER);
// OF index.html: the list's script is named once, after all that it asks as it loads - the pad's
// one list, the sketch, its writer, the pad's words, the rule for a key - and before page.js.
const NAMES_A_SCRIPT = /^<script src="([^"]+)"><\/script>$/;
const scripts = read('index.html').flatMap((line) => NAMES_A_SCRIPT.exec(line.trim())?.[1] ?? []);
const place = scripts.indexOf('category-list.js');
assert.equal(scripts.filter((name) => name === 'category-list.js').length, 1);
for (const before of ['categories.js', 'sketch.js', 'labels.js', 'footer.js', 'views.js'])
  assert.ok(scripts.indexOf(before) >= 0 && scripts.indexOf(before) < place, before);
assert.ok(place < scripts.indexOf('page.js'), 'the page hands the list what is selected');

process.stdout.write(
  'tools/sketch: the list beside the paper shows what a block is, a pick is on every box, and K and Escape take and give the focus\n',
);
