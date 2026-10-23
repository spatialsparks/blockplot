// The surfaces' check: every surface is a plain colour and how rough it is, and a floor has the
// surface its block's name says - for each word a floor is read from, in capitals and inside a
// longer name, as a room, as open air and as glass. No colour is held here: they are set by eye
// where they are drawn. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { GLASS, OPEN, ROOM } from './space.js';
import { ROOF, SURFACES, floorOf } from './surfaces.js';

// The fourteen surfaces the house and its furniture are made of, and no other. Each is a plain
// colour, `#rrggbb`, and how rough it is, from 0 to 1 - and where it is see-through, the share
// it hides of what stands behind it, more than nothing and less than all. Nothing else: no
// image, and no address of one (story ST-024, rule 6). Glass is see-through.
const NAMES =
  'plaster wood joinery stone concrete glass grass water metal fabric ceramic leaf paint plain';
assert.deepEqual(Object.keys(SURFACES).sort(), NAMES.split(' ').sort());
for (const [name, surface] of Object.entries(SURFACES)) {
  const { colour, rough, hides, ...more } = surface;
  assert.match(colour, /^#[0-9a-f]{6}$/, name);
  assert.ok(typeof rough === 'number' && rough >= 0 && rough <= 1, name);
  assert.ok(hides === undefined || (hides > 0 && hides < 1), name);
  assert.deepEqual(more, {}, name);
}
assert.ok(SURFACES.glass.hides > 0);
// A roof is concrete, which is a surface.
assert.equal(ROOF, 'concrete');
assert.ok(Object.hasOwn(SURFACES, ROOF));

// The words a floor is read from, written again from the story's card, with the surface each
// says. A word counts wherever it stands in a name and however it is written: alone, in
// capitals, as the first word of a longer name, and inside a longer word.
const dressed = (word) => [
  word,
  word.toUpperCase(),
  `${word[0].toUpperCase()}${word.slice(1)} 2, upper`,
  `North${word}s`,
];
const each = (words, as, surface) => {
  for (const word of words.split(' ')) {
    for (const name of dressed(word)) assert.equal(floorOf(name, as), surface, `${name}, ${as}`);
  }
};
const GRASS = 'garden green lawn meadow';
const WATER = 'pool pond water';
const STONE = 'bath shower toilet wc ensuite kitchen pantry laundry utility';
const CONCRETE = 'garage cellar store storage workshop plant technical ramp duct';

// A room: stone where it is wet or cooked in, concrete where it is worked or stored in, water
// where it is water - and wood, the commonest, for whatever else: a room with another name, one
// with no name at all, and one whose name has a word that only open air is read by.
each(STONE, ROOM, 'stone');
each(CONCRETE, ROOM, 'concrete');
each(WATER, ROOM, 'water');
each(GRASS, ROOM, 'wood');
for (const name of ['Living room', 'Bedroom 2', 'Study', '', undefined, null]) {
  assert.equal(floorOf(name, ROOM), 'wood', String(name));
}

// Open air: grass where the name says so, water where it says so, and stone for whatever else -
// a terrace, a balcony, open air without a name, and one whose name has a word that only a room
// is read by: the roof of a garage is no concrete floor.
each(GRASS, OPEN, 'grass');
each(WATER, OPEN, 'water');
each(STONE, OPEN, 'stone');
each(CONCRETE, OPEN, 'stone');
for (const name of ['Terrace', 'Balcony 3', 'Roof of the garage', '', undefined]) {
  assert.equal(floorOf(name, OPEN), 'stone', String(name));
}

// Glass: as a room, but stone where a room has wood - a greenhouse, whose name has `green`,
// which a room is not read by.
each(STONE, GLASS, 'stone');
each(CONCRETE, GLASS, 'concrete');
each(WATER, GLASS, 'water');
each(GRASS, GLASS, 'stone');
for (const name of ['Greenhouse', 'Winter room', '', undefined]) {
  assert.equal(floorOf(name, GLASS), 'stone', String(name));
}
assert.equal(floorOf('Greenhouse', ROOM), 'wood');
assert.equal(floorOf('Greenhouse', OPEN), 'grass');

// Where a name has words of two lists, the list that is asked first says it: a room's stone
// before its concrete, and that before water; open air's grass before its water.
assert.equal(floorOf('Bathroom store', ROOM), 'stone');
assert.equal(floorOf('Hot water store', ROOM), 'concrete');
assert.equal(floorOf('Pool shower', GLASS), 'stone');
assert.equal(floorOf('Water garden', OPEN), 'grass');

// A block that says nothing of what it counts as, or a word that is none of the three, is a room.
assert.equal(floorOf('Kitchen'), 'stone');
assert.equal(floorOf('Garden', 'cave'), 'wood');
assert.equal(floorOf(), 'wood');

process.stdout.write(
  'tools/sketch/scene: a surface is a plain colour, and a floor has the one its name says\n',
);
