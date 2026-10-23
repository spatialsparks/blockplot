// The check of what the 3D view reads off a picked category (story ST-028, T-028.6): the pad's
// own scripts - the ones 3d.html names, in its order - on the made-up plot, with sketches of
// this check's own in a made-up store, against what a person worked out by hand. The scene reads
// two things off a block's name: what its floor is made of (scene/surfaces.js), and whether it
// is a flight's own room (scene/flights.js). So `read` hands every box of a block for which a
// category was picked on under the name of that category, as the list shows it, and every other
// box as it was: under its own name, or under none. Held here: what is handed on, box by box,
// with picks and with none; the floors that the scene makes of it, in its parts; what the floor
// of every row of the list is, typed in; a flight in a block that was picked a staircase, its
// own room as in a block named so; the boxes of the made-up house, for which nothing is picked,
// under the names of its file; and that read.js asks the list when a thing is read, not as it
// loads. No module of the scene knows of a category. No browser, and nothing of the real site:
// site.js is never read. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { amiss } from '../scene/holds.js';
import { sceneOf } from '../scene/scene.js';
import { GLASS, OPEN, ROOM } from '../scene/space.js';
import { floorOf } from '../scene/surfaces.js';

// The made-up plot (docs/sketch/pad-gotchas.md): a column is x = c / 2 - 4 m, a row of the top view
// y = 28 - r / 2 m, and a row of a standing view lies at 826 - row / 2 m. Every floor here lies
// in row 24, at 814 m: a room is 3 m high, and a floor of open air is drawn a metre high.
//
// THE SKETCH, as the pad keeps one: eight boxes of seven blocks, of which none touches another,
// each written here as it is with nothing picked, and in `PICKS` what is picked for its block.
// - a block with no name: `garden`;
// - a block of two boxes, a `group`: the first says a name of its own, "Den", and the second
//   alone says the category, `bathroom` - as a sketch may, though the pad's own writer puts a
//   category on every box of a block;
// - a block named "Balcony": `storage`, a room against its name;
// - a block named "Green roof": `roof`;
// - a block named "Garden", and one that says nothing at all: nothing is picked for either;
// - and a block with no name that says `is: 'room'`, as the key C sets it: `garden`.
const GARDEN = { x: [30, 38], y: [14, 20], z: [22, 24], colour: 4 };
const DEN = { x: [30, 36], y: [22, 28], z: [18, 24], colour: 5, group: 1, name: 'Den' };
const BATH = { x: [36, 40], y: [22, 26], z: [18, 24], colour: 5, group: 1 };
const STORE = { x: [42, 50], y: [14, 20], z: [18, 24], colour: 2, name: 'Balcony' };
const ROOF = { x: [42, 50], y: [22, 28], z: [22, 24], colour: 4, name: 'Green roof' };
const NAMED = { x: [52, 60], y: [14, 20], z: [22, 24], colour: 4, name: 'Garden' };
const BARE = { x: [52, 60], y: [22, 28], z: [18, 24], colour: 2 };
const SET = { x: [62, 70], y: [14, 20], z: [18, 24], colour: 2, is: 'room' };
const BOXES = [GARDEN, DEN, BATH, STORE, ROOF, NAMED, BARE, SET];
const PICKS = ['garden', '', 'bathroom', 'storage', 'roof', '', '', 'garden'];
const PICKED = BOXES.map((box, nth) => (PICKS[nth] ? { ...box, category: PICKS[nth] } : box));
// The same eight with nothing picked - and the first set to open air by hand, as C sets it:
// with nothing said of it at all it is a room, as the seventh is.
const PLAIN = [{ ...GARDEN, is: 'open' }, ...BOXES.slice(1)];
const KEY = 'blockplot/sketch/space';
const asKept = (things) => JSON.stringify({ space: 6, things, floors: [], notes: [], on: {} });

// A browser's two stores, with the sketch where the pad keeps it, and what the pad's scripts
// ask of the page beside them. Whatever is written into a store is noted: reading writes none.
const kept = new Map([[KEY, asKept(PICKED)]]);
const written = [];
const store = { getItem: (key) => kept.get(key) ?? null, setItem: (key) => written.push(key) };
Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: store, configurable: true });
globalThis.location = { hash: '' };
globalThis.views = { seen: {}, keep() {} };

// The scripts the page loads before its module, read off the page, as earth-cut.check.js loads
// them: the site first, which is the made-up plot's here, and the switch of views last, which
// wants a page and is made up above. The list of the categories is among them.
const pad = path.join(import.meta.dirname, '..');
const page = readFileSync(path.join(pad, '3d.html'), 'utf8');
const scripts = [...page.matchAll(/<script src="([\w-]+\.js)"><\/script>/g)].map(([, src]) => src);
assert.deepEqual([scripts[0], scripts.at(-1)], ['site.js', 'views.js']);
assert.ok(scripts.includes('categories.js'));
for (const script of scripts.slice(0, -1)) {
  await import(`../${script === 'site.js' ? 'demo-site.js' : script}`);
}
// READ.JS ASKS THE LIST WHEN A THING IS READ, and not as it loads: it is loaded here while the
// page has no list - taken off the page for that moment, and put back - and reads by the list
// all the same. A module that took the list as it loaded would hold none, and read nothing.
const { categories } = globalThis;
delete globalThis.categories;
const { read, site } = await import('./read.js');
globalThis.categories = categories;
assert.equal(site.name, 'Made-up hillside plot');
let withPicks;
const LOADED = 'read.js took the list of the categories as it loaded, when the page had none';
assert.doesNotThrow(() => (withPicks = read()), LOADED);

/** A sketch kept anew, as another window keeps it, and read again. */
const readAgain = (text) => {
  kept.set(KEY, text);
  return read(true);
};
/** A box as it is handed on: its box, its colour by name and by hex, and what is said of it. */
const on = ({ x, y, z }, colour, said) => ({ x, y, z, colour, ...said });
const GREEN = { name: 'green', hex: '#5a9e4b' };
const TEAL = { name: 'teal', hex: '#1f9e8f' };
const ORANGE = { name: 'orange', hex: '#f08c00' };

// --- what is handed on ---------------------------------------------------------------------------
// What the pad reads of the eight, of all the boxes of each one's block: its category and by
// what (`categories.of`), and what it counts as (`blocks.countsAs`). The box that says "Den"
// and no category is of a block that was picked a Bathroom; "Garden" has its category by its
// name; and the last was picked a Garden, and counts as a room.
const { blocks, sketch } = globalThis;
const readAs = (thing) => {
  const { category, by } = categories.of(sketch.blockOf(thing));
  return `${category?.name ?? 'none'} ${by}, ${blocks.countsAs(sketch.blockOf(thing)).as}`;
};
assert.deepEqual(sketch.doc.things.map(readAs), [
  'Garden picked, open',
  'Bathroom picked, room',
  'Bathroom picked, room',
  'Storage picked, room',
  'Roof picked, open',
  'Garden name, open',
  'none name, room',
  'Garden picked, room',
]);
// WITH THE PICKS, every thing by hand - and nothing else of it: no `category`, and no `is`. A
// block with a picked category has that category's name, as the list shows it, on every box:
// the block with no name is "Garden", and open air; the box that says "Den" and the box of its
// block that says nothing are both "Bathroom"; "Balcony" is "Storage", and a room; "Green roof"
// is "Roof". The block named "Garden" for which nothing was picked has its own name, and the
// block that says nothing has no `name` at all. And the one that C set to a room against its
// pick has the name of its category, and counts as what C says. The sketch that the pad holds
// is as it was kept: "Den", "Balcony" and "Green roof" are the owner's still.
assert.deepEqual([withPicks.trouble, withPicks.locked], ['', '']);
assert.deepEqual(sketch.doc.things, PICKED);
assert.deepEqual(withPicks.things, [
  on(GARDEN, GREEN, { name: 'Garden', as: 'open' }),
  on(DEN, TEAL, { name: 'Bathroom', group: 1, as: 'room' }),
  on(BATH, TEAL, { name: 'Bathroom', group: 1, as: 'room' }),
  on(STORE, ORANGE, { name: 'Storage', as: 'room' }),
  on(ROOF, GREEN, { name: 'Roof', as: 'open' }),
  on(NAMED, GREEN, { name: 'Garden', as: 'open' }),
  on(BARE, ORANGE, { as: 'room' }),
  on(SET, ORANGE, { name: 'Garden', as: 'room' }),
]);
// WITH NOTHING PICKED, every box as ever: under its own name where it says one, and under none
// where it says none - the second box of the den too, whose block the scene calls by its first.
// A category that a name gives is no name: "Green roof" is a Roof by its name, and is handed
// on as "Green roof"; "Balcony" is open air again.
const plain = readAgain(asKept(PLAIN));
assert.deepEqual(plain.things, [
  on(GARDEN, GREEN, { as: 'open' }),
  on(DEN, TEAL, { name: 'Den', group: 1, as: 'room' }),
  on(BATH, TEAL, { group: 1, as: 'room' }),
  on(STORE, ORANGE, { name: 'Balcony', as: 'open' }),
  on(ROOF, GREEN, { name: 'Green roof', as: 'open' }),
  on(NAMED, GREEN, { name: 'Garden', as: 'open' }),
  on(BARE, ORANGE, { as: 'room' }),
  on(SET, ORANGE, { as: 'room' }),
]);

// --- the floors ----------------------------------------------------------------------------------
// The scene of each, as the page builds it, and in its parts the floor of every box: of a room
// the field of its slab, which comes first - the strips under its outer walls are plaster - and
// of open air the one slab. By the scene's lists (scene/surfaces.js), which no pick changed:
// - with the picks: grass under the picked Garden; stone in both boxes of the picked Bathroom;
//   concrete in the "Balcony" that was picked Storage; stone on the "Green roof" that was picked
//   Roof - the pick is read, and "green" no more; grass in the block named "Garden"; wood in the
//   block that says nothing; and wood in the Garden that C set to a room - grass is open air's;
// - with nothing picked: stone where the Garden was, set to open air - paved, as a picked Garden
//   was before its name was handed on; wood in the den; stone on the "Balcony", open air again;
//   grass on the "Green roof", by "green"; and the last three as they were.
const sceneIn = ({ land, things, figures }) => sceneOf(land, things, figures);
const laid = (scene, at) => scene.parts.filter((part) => part.thing === at && part.of === 'floor');
const fields = (scene) => BOXES.map((_, at) => laid(scene, at)[0].surface);
const [picked, unpicked] = [sceneIn(withPicks), sceneIn(plain)];
const FIELDS = {
  picked: ['grass', 'stone', 'stone', 'concrete', 'stone', 'grass', 'wood', 'wood'],
  plain: ['stone', 'wood', 'wood', 'stone', 'grass', 'grass', 'wood', 'wood'],
};
assert.deepEqual({ picked: fields(picked), plain: fields(unpicked) }, FIELDS);
// Two of them whole. The garden's floor is one part: all of its box from above, columns 30 to 38
// and rows 14 to 20 - x from 11 m to 15 m, y from 18 m to 21 m - a slab of 0.3 m on 814 m. The
// storage, columns 42 to 50 and those rows, has an outer wall of 0.4 m all round: its field
// lies from x = 17.4 m to 20.6 m and from y = 18.4 m to 20.6 m, and four strips of plaster
// round it.
const FLOOR = { of: 'floor', shape: 'box', floor: 814 };
const slab = (min, max, surface, thing) => ({ ...FLOOR, min, max, surface, thing });
const [field, ...strips] = laid(picked, 3);
assert.deepEqual(laid(picked, 0), [slab([11, 18, 814], [15, 21, 814.3], 'grass', 0)]);
assert.deepEqual(field, slab([17.4, 18.4, 814], [20.6, 20.6, 814.3], 'concrete', 3));
assert.deepEqual(
  strips.map((part) => part.surface),
  Array(4).fill('plaster'),
);
assert.deepEqual([amiss(picked), amiss(unpicked)], [[], []]);

// EVERY ROW OF THE LIST, typed in under what its floor is made of, in the list's order: the
// floor of a block for which that row was picked, and which counts as the row says - what the
// scene's `floorOf` makes of the row's name and of what the row counts as. Whoever adds a row
// says here what its floor is: until then this fails. A Shaft has a floor of wood - "duct" is
// a word of the scene's for concrete, and "Shaft" is none. And the last two rows are the
// ground's, none of the scene's three: no box of such a block is handed on, and no floor made.
const FLOORS = {
  grass: 'Garden',
  stone: 'Kitchen, Bathroom, Toilet, Laundry, Balcony, Terrace, Courtyard, Roof, Greenhouse',
  concrete: 'Storage, Cellar, Technical room, Garage, Ramp, Workshop',
  wood:
    'Living room, Dining room, Bedroom, Office, Corridor, Entrance, Staircase, Lift, Shaft, ' +
    'Gym, Sauna, Leisure room',
  none: 'Ground fill, Ground cut',
};
const floorBy = ({ name, as }) => ([ROOM, OPEN, GLASS].includes(as) ? floorOf(name, as) : 'none');
for (const [floor, names] of Object.entries(FLOORS)) {
  const rows = categories.LIST.filter((row) => floorBy(row) === floor);
  assert.equal(rows.map((row) => row.name).join(', '), names, `a floor of ${floor}`);
}
assert.equal(Object.values(FLOORS).join(', ').split(', ').length, categories.LIST.length);
const ofTheGround = [
  { ...GARDEN, category: 'ground-fill' },
  { ...BARE, category: 'ground-cut' },
];
assert.deepEqual(readAgain(asKept(ofTheGround)).things, []);

// --- a flight's own room -------------------------------------------------------------------------
// A hall of 2 m by 2 m, columns 30 to 34, and after it down the plot a second room of 4 m, to
// column 42, both a storey high. A flight of 4.5 m by 1 m climbs down the plot from column 32,
// x = 12 m: its foot stands a metre inside the hall, which is its own room, and from x = 13 m on
// it runs over the second room. Sixteen steps, each 4.5 / 16 = 0.28125 m deep and 3 / 16 =
// 0.1875 m higher, on the floor's slab at 814.3 m.
// - Where the second room has no name and was picked `staircase`, it is the flight's own too:
//   every step stands on the slab. Those are, part for part, the parts of the same house with
//   that room named "Staircase" and nothing picked.
// - Where it says neither, it lies under the flight. The fourth step, from x = 12.84375 m to
//   13.125 m and up to 815.05 m, is parted at the line between the rooms: seventeen parts, of
//   which the first four stand on the slab, and the fifth and every part after it hangs, its
//   rise and 0.125 m thick - the fifth from 815.05 - 0.3125 = 814.7375 m.
const HALL = { x: [30, 34], y: [20, 24], z: [18, 24], colour: 2, name: 'Hall' };
const WELL = { x: [34, 42], y: [20, 24], z: [18, 24], colour: 3 };
const FLIGHT = { kind: 'stairs', x: 36.5, y: 22, floor: 24 };
const houseWith = (well) => sceneIn(readAgain(asKept([HALL, well, FLIGHT]))).parts;
const feet = (parts) => parts.filter((part) => part.of === 'step').map((part) => part.min[2]);
const byPick = houseWith({ ...WELL, category: 'staircase' });
const byName = houseWith({ ...WELL, name: 'Staircase' });
const byNeither = houseWith(WELL);
assert.deepEqual(feet(byPick), Array(16).fill(814.3));
assert.deepEqual(byPick, byName);
assert.deepEqual(feet(byNeither).slice(0, 5), [814.3, 814.3, 814.3, 814.3, 814.7375]);
assert.deepEqual(
  [feet(byNeither).length, feet(byNeither).filter((foot) => foot > 814.3).length],
  [17, 13],
);
assert.notDeepEqual(byNeither, byPick);

// --- with one pick, the cut's --------------------------------------------------------------------
// The made-up house of the browser tests: every box of it that is handed on has the name that
// its file says, typed in - its lawn, a block of ground, is none of them, nor is its cut, the one
// block with a category picked. For none handed on was one picked, and three of their names give
// a category: "Bath" a Bathroom, "Roof terrace" a Roof, "Garden" a Garden - none is handed on so.
const fixture = path.join(pad, '../../tests/__fixtures__/sketch/made-up.json');
const house = readAgain(readFileSync(fixture, 'utf8'));
const NAMES = ['Day rooms', 'Glass porch', 'Store', 'Night rooms', 'Night rooms'];
assert.deepEqual(
  house.things.flatMap(({ kind, name }) => (kind === undefined ? [name] : [])),
  [...NAMES, 'Bath', 'Roof terrace', 'Garden'],
);

// Reading wrote nothing, into neither store.
assert.deepEqual(written, []);

process.stdout.write(
  'tools/sketch/view3d: a block with a picked category is handed on under the name of that category, on every box, so its floor and a flight in it are what a block of that name has - and with nothing picked every box is handed on under its own name\n',
);
