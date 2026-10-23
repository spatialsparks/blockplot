// The check of what the sketch adds up to (info/sums.js; story ST-032), against figures worked
// out by hand (T-032.2), on the made-up house and on what the card adds to it and takes away: in
// each case every total is the sum of its rows, and the three totals and the whole house are the
// same figures, with no tolerance - every figure here is a whole number of eighths. And one
// computation: a block's row says the floor and the volume of `sketch.stats` and of the pad's
// sentence, and sums.js works out neither. The pad's own scripts on a made-up store and the
// made-up plot: no browser, nothing of the real site. Run by tools/sketch/check.js, or alone.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { golden, VERSION } from '../check-golden.js';

// A browser's two stores. The scripts of the sums, the sections and the rates are loaded first
// and once, before there is a paper or a sketch: they read nothing as they load.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
for (const file of ['info/sums', 'sections/model', 'info/rates', 'demo-site', 'categories']) {
  await import(`../${file}.js`);
}
const { sums, sections, rates } = globalThis;
assert.deepEqual([globalThis.SITE.name, Object.keys(sums)], ['Made-up hillside plot', ['of']]);
const KEY = 'blockplot/sketch/space';
const SCRIPTS = ['paper', 'figures', 'shapes', 'blocks', 'legacy', 'sketch', 'strokes', 'labels'];
let [loads, sketch, said] = [0, null, null];
/** The pad's sketch, loaded anew from above on the made-up plot, on a store that holds this text. */
async function pad(text) {
  for (const one of [local, session]) one.held.clear();
  local.held.set(KEY, text);
  globalThis.location = { hash: '#top' };
  loads += 1;
  for (const file of [...SCRIPTS, 'footer']) await import(`../${file}.js?${loads}`);
  sketch = globalThis.sketch;
  assert.equal(JSON.stringify(sketch.doc), text, 'the sketch is not read as it was written');
}
const HOUSE = golden('made-up');
const EMPTY = { floors: [], notes: [], on: {}, show: { top: {} } };
const drawn = (things, more) => JSON.stringify({ space: VERSION, things, ...EMPTY, ...more });
const things = () => sketch.doc.things;
const named = (name) => things().find((thing) => thing.name === name);
/** Sets the rates of a room, of glass, of open air and of the category `bathroom`, in one step through the pad's own `change` and `rates.set` - null takes one away - and gives what the sketch adds up to then. */
function rated(room, glass, open, bathroom) {
  sketch.change((doc) => {
    for (const [as, value] of Object.entries({ room, glass, open })) rates.set(doc, { as }, value);
    rates.set(doc, { category: 'bathroom' }, bathroom);
  });
  return sums.of();
}
/** The made-up house, loaded anew: its two sections made by the model's steps, and its four rates. */
async function house() {
  await pad(HOUSE);
  const homes = ['Upper home', 'Lower home'].map((name) => sections.make(name).id);
  sections.put(['Night rooms', 'Bath', 'Roof terrace'].map(named), homes[0]);
  sections.put(['Day rooms', 'Glass porch', 'Garden', 'Lawn'].map(named), homes[1]);
  rated(900, 600, 350, 1200);
  return homes;
}
/** A row as the card's tables write it: its name, how many blocks, floor, open air, volume, cost. */
const figures = (row) => [row.name, row.blocks, row.floor, row.open, row.volume, row.cost];
const table = ({ rows, total }) => [...rows, total].map(figures);
/** A row of the categories at its place: its figures, its key, what it counts as, its own rate. */
const marks = (row) => [...figures(row), row.key, row.as, row.rate];
const category = (at) => marks(said.categories.rows.at(at));
const PARTS = ['sections', 'levels', 'categories'];
const everyRow = () => [said.house, ...PARTS.flatMap((p) => [...said[p].rows, said[p].total])];
/** Of each row of a table, and then of the whole house: its cost, and what that leaves out. */
const costs = (part) => [...said[part].rows, said.house].flatMap((row) => [row.cost, row.without]);
/**
 * Each total is the sum of its rows, added up in their order - its cost that of the rows that
 * have one, none where none has - and leaves out what they leave out; and the three totals and
 * the whole house are the same figures, to the last digit.
 */
function addsUp() {
  const five = (row) => [row.blocks, row.floor, row.open, row.volume, row.cost, row.without];
  for (const { rows, total } of PARTS.map((part) => said[part])) {
    const sum = (figure) => rows.reduce((all, row) => all + row[figure], 0);
    const had = rows.map((row) => row.cost).filter((cost) => cost !== null);
    const cost = had.length > 0 ? had.reduce((all, one) => all + one) : null;
    const left = ['room', 'glass', 'open'].filter((as) => rows.some((r) => r.without.includes(as)));
    const added = [sum('blocks'), sum('floor'), sum('open'), sum('volume'), cost, left];
    assert.deepEqual([total.name, five(total)], ['Total', added]);
    assert.deepEqual(five(total), five(said.house));
  }
}

// --- the made-up house: two sections, four rates -----------------------------------------------------
// "Upper home": the night rooms, the bath, the roof terrace. "Lower home": the day rooms, the
// porch, the garden and the lawn. The store and the cut in none. 900 francs a cubic metre of
// rooms, 600 of glass, 350 a square metre of open air, and 1200 a cubic metre of a Bathroom.
await house();
said = sums.of();
const ALL = ['Total', 7, 188, 28, 520, 469400];
assert.deepEqual(table(said.sections), [
  ['Upper home', 3, 68, 12, 200, 190200],
  ['Lower home', 3, 104, 16, 288, 250400],
  ['No section', 1, 16, 0, 32, 28800],
  ALL,
]);
assert.deepEqual(table(said.levels), [
  ['Level 817 m', 3, 68, 12, 200, 190200],
  ['Level 814 m', 4, 120, 16, 320, 279200],
  ALL,
]);
assert.deepEqual(table(said.categories), [
  ['Bathroom', 1, 8, 0, 20, 24000],
  ['Garden', 1, 0, 16, 0, 5600],
  ['Roof', 1, 0, 12, 0, 4200],
  ['No category', 4, 180, 0, 500, 435600],
  ALL,
]);
assert.deepEqual(figures(said.house), ALL);
// What else names a row: a section's `id`, a level's row, a category's key, what that counts as
// and its own rate. Every row of a kind says those, then its six figures, and nothing more - the
// totals and the whole house their name alone; every row has a rate for all it holds.
const of = (part, mark) => said[part].rows.map((row) => row[mark]);
assert.deepEqual([...of('sections', 'id'), ...of('levels', 'level')], [1, 2, null, 18, 24]);
assert.deepEqual(category(0), ['Bathroom', 1, 8, 0, 20, 24000, 'bathroom', 'room', 1200]);
assert.deepEqual(category(-1), ['No category', 4, 180, 0, 500, 435600, null, null, null]);
const SIX = ' blocks floor open volume cost without';
const shapes = (rows) => [...new Set(rows.map((row) => Object.keys(row).join(' ')))].join(' | ');
const totals = [said.house, ...PARTS.map((part) => said[part].total)];
const kinds = [...PARTS.map((part) => shapes(said[part].rows)), shapes(totals)];
const KINDS = ['name id', 'name level', 'name key as rate', 'name'].map((kind) => kind + SIX);
assert.deepEqual(kinds, KINDS);
assert.ok(everyRow().every((row) => row.without.length === 0));
// The lawn, ground, in "Lower home", and the cut, in no section, are in no row: they are counted
// apart, and the level at 812 m, where the lawn alone has its floor, has no row. Nothing is
// counted twice, and no block has boxes on two floors: the night rooms' two stand on one.
const apart = [said.blocks, said.apart, said.twice, said.through];
assert.deepEqual(apart, [9, { ground: 1, cut: 1 }, [], 0]);
addsUp();

// --- the rates taken away, but one --------------------------------------------------------------------
// Of each row, by section and then of the whole house: its cost - null is no cost - and what it
// leaves out, of `room`, `glass` and `open`, in that order: what it holds that has no rate.
const [ROOM, GLASS, OPEN, ROOM_OPEN] = [['room'], ['glass'], ['open'], ['room', 'open']];
const [GLASS_OPEN, THREE] = [GLASS.concat(OPEN), ['room', 'glass', 'open']];
// NO RATE: no cost anywhere.
said = rated(null, null, null, null);
assert.ok(everyRow().every((row) => row.cost === null));
assert.deepEqual(costs('sections'), [null, ROOM_OPEN, null, THREE, null, ROOM, null, THREE]);
addsUp();
// 900 FOR A ROOM, ALONE: the bath is costed as a room, 20 × 900 = 18 000; the porch and the two
// terraces have no cost, and "No category" is 406 800 without glass.
said = rated(900, null, null, null);
const roomAlone = [180000, OPEN, 216000, GLASS_OPEN, 28800, [], 424800, GLASS_OPEN];
assert.deepEqual(costs('sections'), roomAlone);
const byCategory = [18000, [], null, OPEN, null, OPEN, 406800, GLASS, 424800, GLASS_OPEN];
assert.deepEqual(costs('categories'), byCategory);
addsUp();
// 1200 FOR A BATHROOM, ALONE: the bath alone has a cost, by its category's own rate.
said = rated(null, null, null, 1200);
assert.deepEqual(costs('sections'), [24000, ROOM_OPEN, null, THREE, null, ROOM, 24000, THREE]);
addsUp();

// --- an overlap: a kitchen drawn over two blocks ------------------------------------------------------
// With the pad's own Block tool from above, on the level at 814 m, drawn on first: from the cell
// at column 46 and row 18 to the one at column 53 and row 25, 3 m high - columns 46 to 54, rows
// 18 to 26. Named "Kitchen", a Kitchen by its name, in "Lower home": 16 m², 48 m³, 43 200 francs,
// the first category. It lies over 4 m² of the day rooms and 2 m² of the porch - and 4 m² of the
// cut, no floor: 6 m² counted twice on the level at 814 m, and nothing on the level above.
const homes = await house();
sketch.doc.on.top = 24;
sketch.apply({ tool: 'block', from: [46.5, 18.5], to: [53.5, 25.5], colour: 2 });
assert.equal(JSON.stringify(things().at(-1)), '{"x":[46,54],"y":[18,26],"z":[18,24],"colour":2}');
sketch.name(things().at(-1), 'Kitchen');
sections.put([things().at(-1)], homes[1]);
said = sums.of();
assert.deepEqual(figures(said.sections.rows[1]), ['Lower home', 4, 120, 16, 336, 293600]);
assert.deepEqual(figures(said.levels.rows[1]), ['Level 814 m', 5, 136, 16, 368, 322400]);
assert.deepEqual(figures(said.categories.rows[0]), ['Kitchen', 1, 16, 0, 48, 43200]);
assert.equal(said.categories.rows[1].name, 'Bathroom');
assert.deepEqual(figures(said.house), ['Total', 8, 204, 28, 568, 512600]);
assert.deepEqual(said.twice, [{ level: 24, name: 'Level 814 m', m2: 6 }]);
addsUp();

// --- C against the category ---------------------------------------------------------------------------
// The garden set to a room with C's own writer, and 350 francs for the category `garden` beside
// the four rates: it counts 16 m² of floor and 16 m³, and costs 16 × 900, as a room - its
// category counts as open air, and a rate of a square metre is never multiplied by a volume.
await house();
sketch.count(named('Garden'), 'room');
sketch.change((doc) => rates.set(doc, { category: 'garden' }, 350));
said = sums.of();
assert.deepEqual(figures(said.house), ['Total', 7, 204, 12, 536, 478200]);
assert.deepEqual(category(1), ['Garden', 1, 16, 0, 16, 14400, 'garden', 'open', 350]);
addsUp();

// --- a rate of 0, a section hidden, a section and a category that hold no block -----------------------
// A RATE OF 0 is a rate, for open air and for a Bathroom alike: the two terraces and the bath -
// the first three categories - cost 0, the bath at its category's own, and no row is without
// `open`: the house is the day rooms, the porch, the store and the night rooms, 435 600 francs.
await house();
said = rated(900, 600, 0, 0);
const costed = said.categories.rows.slice(0, 3).map((row) => row.cost);
const free = everyRow().every((row) => row.without.length === 0);
assert.deepEqual([...costed, said.house.cost, free], [0, 0, 0, 435600, true]);
addsUp();
// "UPPER HOME" HIDDEN: every figure as it was, to the last digit.
sections.hide(1, true);
assert.deepEqual([sections.list()[0].hidden, sums.of()], [true, said]);
// "GARAGE", MADE LAST, AND THE CUT IN IT: a row of 0 blocks and no cost, after "Lower home" in
// the list's order. The cut is counted apart still, and the store alone is in no section. And
// 500 francs for the category `garage`, which no block has: a row of its own, between the
// Bathroom and the Garden, in the order of the pad's list - of 0 blocks, and no cost.
sections.put([things().at(-1)], sections.make('Garage').id);
sketch.change((doc) => rates.set(doc, { category: 'garage' }, 500));
said = sums.of();
assert.deepEqual(table(said.sections).slice(2), [
  ['Garage', 0, 0, 0, 0, null],
  ['No section', 1, 16, 0, 32, 28800],
  ['Total', 7, 188, 28, 520, 435600],
]);
assert.deepEqual(category(1), ['Garage', 0, 0, 0, 0, null, 'garage', 'room', 500]);
const nothing = [said.sections.rows[2].without, said.categories.rows[1].without];
assert.deepEqual([...nothing, said.apart], [[], [], { ground: 1, cut: 1 }]);
addsUp();

// --- no section; an empty sketch ----------------------------------------------------------------------
// The made-up house as it is, with no section and no rate: one row, "No section", which is the
// total. And a sketch with nothing drawn: no block and no row, nothing apart and nothing twice.
await pad(HOUSE);
said = sums.of();
assert.deepEqual(table(said.sections), [
  ['No section', 7, 188, 28, 520, null],
  ['Total', 7, 188, 28, 520, null],
]);
addsUp();
await pad(drawn([]));
said = sums.of();
const NONE = ['Total', 0, 0, 0, 0, null];
const tables = PARTS.map((part) => table(said[part]));
assert.deepEqual(tables, [[NONE], [NONE], [NONE]]);
const told = [said.blocks, said.apart, figures(said.house), said.twice, said.through];
assert.deepEqual(told, [0, { ground: 0, cut: 0 }, NONE, [], 0]);
addsUp();

// --- a block through two levels, and a piece of a ramp ------------------------------------------------
// TWO BOXES ONE OVER THE OTHER, one group, 2 m by 2 m and 3 m high each, the lower on 814 m: 4 m²
// of floor and 24 m³ on the level at 814 m, one block through two levels. A PIECE OF A RAMP, from
// column 33 to 37, 2 m by 2 m, from row 10 to row 24, of a slope said at columns 30 and 40: its
// top in rows 13.8 and 16.2, 4.5 m high in the mean - 4 m², 18 m³. A section each, by hand.
const tower = (z) => ({ x: [60, 64], y: [12, 16], z, colour: 3, group: 1, section: 1 });
const slope = { x: [30, 40], z: [12, 18] };
const RAMP = { x: [33, 37], y: [12, 16], z: [10, 24], colour: 3, section: 2, slope };
const LISTED = ['Tower', 'Ramp'].map((name, at) => ({ id: at + 1, name }));
await pad(drawn([tower([18, 24]), tower([12, 18]), RAMP], { sections: LISTED }));
assert.deepEqual(globalThis.blocks.topOf(things()[2]).rows, [13.8, 16.2]);
said = sums.of();
assert.deepEqual(table(said.sections), [
  ['Tower', 1, 4, 0, 24, null],
  ['Ramp', 1, 4, 0, 18, null],
  ['Total', 2, 8, 0, 42, null],
]);
assert.deepEqual(table(said.levels)[0], ['Level 814 m', 2, 8, 0, 42, null]);
assert.deepEqual([said.levels.rows.length, said.through, said.twice], [1, 1, []]);
addsUp();

// --- one computation ----------------------------------------------------------------------------------
// Each counted block of the house in a section of its own: its row says the floor and volume of
// `sketch.stats`, which the pad's sentence says from above, typed in - of the five that count as
// a room or as glass. Of the two of open air the row's open air is the area that the sentence
// calls floor, and it counts no volume, where the sentence says the box's, as it said before.
await pad(HOUSE);
const SAID = {
  'Day rooms': [80, 240, '80 m² of floor, 10 m by 8 m, 3 m high, 240 m³.'],
  'Glass porch': [24, 48, '24 m² of floor, 4 m by 6 m, 3 m high, 48 m³.'],
  Store: [16, 32, '16 m² of floor, 4 m by 4 m, 2 m high, 32 m³.'],
  'Night rooms': [60, 180, '60 m² of floor, 10 m by 8 m, 3 m high, 180 m³.'],
  Bath: [8, 20, '8 m² of floor, 2 m by 4 m, 3 m high, 20 m³.'],
  'Roof terrace': [12, 36, '12 m² of floor, 3 m by 4 m, 3 m high, 36 m³.', 'open air'],
  Garden: [16, 16, '16 m² of floor, 4 m by 4 m, 1 m high, 16 m³.', 'open air'],
};
for (const name of Object.keys(SAID)) sections.put([named(name)], sections.make(name).id);
said = sums.of();
assert.deepEqual(of('sections', 'name'), Object.keys(SAID));
for (const [name, [m2, m3, sentence, outside]] of Object.entries(SAID)) {
  const block = named(name);
  const { area, volume } = sketch.stats(block);
  const { floor, open, volume: counts } = said.sections.rows.find((row) => row.name === name);
  assert.ok(globalThis.footer.picked(block).words.includes(sentence), name);
  assert.deepEqual([area, volume], [m2, m3], name);
  assert.deepEqual([floor, open, counts], outside ? [0, m2, 0] : [m2, 0, m3], name);
}
addsUp();
// And of sums.js the text: it asks `sketch.stats`, in one place, names no `highOf`, and names
// `blocks.area` in one place - what the boxes of a level cover together, by their rects.
const TEXT = readFileSync(`${import.meta.dirname}/sums.js`, 'utf8');
const count = (word) => TEXT.split(word).length - 1;
assert.deepEqual([count('sketch.stats('), count('highOf'), count('blocks.area')], [1, 0, 1]);
const covered = TEXT.split('\n').find((line) => line.includes('blocks.area'));
assert.ok(covered.includes("blocks.area(boxes.map((box) => sketch.rect(box, 'top')))"), covered);

process.stdout.write(
  'tools/sketch/info: the made-up house adds up by section, by level and by category to the figures worked out by hand, each total the sum of its rows\n',
);
