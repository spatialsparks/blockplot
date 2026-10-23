// The surfaces: what the house and its furniture are made of, as a part names it - a plain
// colour and how rough it is, and no image (story ST-024, rule 6) - and which of them a block's
// floor is, by the block's name. The colours were set by eye where they are drawn, in the 3D
// view's Materials, on pictures of the made-up house (T-024.12): the owner may want any of them
// otherwise, and no rule here relies on one. It imports its neighbour and names no global.
import { GLASS, OPEN } from './space.js';

/**
 * Every surface a part can have, by its name: `colour`, a plain `#rrggbb`, and `rough`, from 0,
 * a mirror, to 1, chalk. A surface that is see-through has `hides` too: the share it hides of
 * what stands behind it. `plain` is what an object is made of whose kind has no rule yet. And
 * there are two woods: `wood` is a floor's, and `joinery` the wood of what stands on it - wood
 * as a joiner works it - a tone apart: a table of the floor's own wood would show by its shadow
 * alone.
 *
 * A colour is what a floor of that surface shows in the sun, seen straight down: the lights of
 * the view are set so (view3d/lights.js). They are a few quiet ones, and each was set against
 * what it lies beside: plaster, a warm white, against the earth of the ground and the sky; wood,
 * the commonest floor, warmer than the earth and darker than plaster; joinery darker again, so
 * that a table's top is told from the floor under it and a wardrobe from the wall behind it;
 * stone a cool grey, which is how a bath is told; concrete, the roofs, lighter than stone and
 * no colour at all; grass and leaf two greens, both far off the earth; water a blue that hides,
 * and glass a pale one that does not; metal the darkest of the greys, so that a sink shows in a
 * worktop of stone and a wheel on a car; paint a cool pale grey, a kitchen's front and a car at
 * once, where plaster is warm; ceramic the whitest, on a floor of stone; fabric a linen.
 */
export const SURFACES = {
  plaster: { colour: '#f0ebe1', rough: 0.9 },
  wood: { colour: '#cfa775', rough: 0.7 },
  joinery: { colour: '#ad8255', rough: 0.6 },
  stone: { colour: '#aab0b1', rough: 0.75 },
  concrete: { colour: '#d0cfca', rough: 0.9 },
  glass: { colour: '#c2dbe5', rough: 0.15, hides: 0.28 },
  grass: { colour: '#8cab64', rough: 1 },
  water: { colour: '#6aa5c4', rough: 0.3 },
  metal: { colour: '#8e969e', rough: 0.45 },
  fabric: { colour: '#ded7c9', rough: 1 },
  ceramic: { colour: '#f8fafb', rough: 0.3 },
  leaf: { colour: '#6b9a58', rough: 1 },
  paint: { colour: '#d6dade', rough: 0.6 },
  plain: { colour: '#d8d8d4', rough: 0.8 },
};

/** What a roof slab is made of, whatever its block is called. */
export const ROOF = 'concrete';

// The words a floor is read from: one that stands anywhere in a block's name, in capitals or
// not, says what the floor is - `bath` in "Bathroom 2", and in "Sunbath" too. They are common
// names of rooms, in English, as the pad's own words for a block are (blocks.js).
const GRASS_WORDS = ['garden', 'green', 'lawn', 'meadow'];
const WATER_WORDS = ['pool', 'pond', 'water'];
const STONE_WORDS = [
  'bath',
  'shower',
  'toilet',
  'wc',
  'ensuite',
  'kitchen',
  'pantry',
  'laundry',
  'utility',
];
const CONCRETE_WORDS = [
  'garage',
  'cellar',
  'store',
  'storage',
  'workshop',
  'plant',
  'technical',
  'ramp',
  'duct',
];

/**
 * The surface of a block's floor, by the block's name and by what the block counts as (`ROOM`,
 * `OPEN` or `GLASS` of space.js; whatever else is a room). The lists are asked in this order,
 * and the first that has a word in the name says it:
 * - open air: grass, water, and else stone;
 * - a room: stone, concrete, water, and else wood, the commonest - a room without a name too;
 * - glass: as a room, but stone where a room has wood.
 */
export function floorOf(name, as) {
  const words = String(name ?? '').toLowerCase();
  const has = (list) => list.some((word) => words.includes(word));
  if (as === OPEN) return has(GRASS_WORDS) ? 'grass' : has(WATER_WORDS) ? 'water' : 'stone';
  if (has(STONE_WORDS)) return 'stone';
  if (has(CONCRETE_WORDS)) return 'concrete';
  if (has(WATER_WORDS)) return 'water';
  return as === GLASS ? 'stone' : 'wood';
}
