// The parts of the objects: what stands in the sketch, as the simple shape of its kind - and a
// box of its size, where its kind has no rule yet. It imports its neighbours and names no global.
//
// HOW A RULE IS ADDED. A rule is a function in a module of its own beside this one, with a
// check of its own beside it, and one line in `KINDS`, under the kind it is for: the kind as
// the sketch names it (`kind` of a thing). A module that has a rule for each of several kinds
// gives them as one such list, spread into `KINDS` by one line. All it needs is said here.
//
// A rule is `(context, at)`: the parts of the one object at place `at` of `context.things`,
// in metres, in its box - `context.boxOf(context.things[at])`. That is the box the sketch has
// it in, fitted between the walls of its room: moved clear of them, and cut where the room is
// too small for it (clear.js) - and the sketch's own of a door, of a window and of what stands
// in no room. Its `turn` says in quarters how it is turned, the box being turned already.
// `context` is what a rule of blocks gets, and house.js says all of it.
//
// A rule gives a list of parts, each plain data: `of`, which is `piece` or `step`, `shape`,
// `min`, `max` and `surface` (parts.js has the words). It says neither `thing` nor `floor`,
// and it lifts nothing: every part is lifted here, after it, by `context.lift(at)` - what
// stands on a floor stands on the floor's slab. Two things hold of every part (holds.js): it
// lies within the box of its object, moved as the object was; and no two parts of one object
// that are of different surfaces lie in each other, though they may touch - a mattress lies on
// its bed, and not in it. Both are asked of the boxes, `min` and `max`, of what is round too.
//
// The check of a rule makes its own objects up, in cells, against parts worked out by hand -
// `sceneOf(site, things, figures, { kinds: { bed: rule } })` asks a rule alone - and has
// `amiss(scene, liftOf)` of holds.js find nothing in them, told by hand how far each is lifted,
// and how far one was moved that was drawn in a wall.
import { fittings } from './fittings.js';
import { furniture } from './furniture.js';
import { garden } from './garden.js';
import { lamps } from './lamps.js';
import { seats } from './seats.js';
import { steps } from './steps.js';
import { storage } from './storage.js';

// A tree, in the shares the 3D view draws one in (view3d/build.js): the crown is as wide as
// the tree and takes this share of its height, from the top down, and the trunk is this share
// of the tree's width, and of its depth. The trunk ends where the crown's box begins: there the
// two touch. Drawn into the crown, as the view draws it today, wood would lie in leaf.
const CROWN_HIGH = 0.68;
const TRUNK_WIDE = 0.08;

/** The size of a box along x, y and h, in metres. */
const sizeOf = ({ min, max }) => max.map((most, axis) => most - min[axis]);

/** A tree: a round trunk of wood, and on it a ball of leaf for its crown. */
function tree(context, at) {
  const { min, max } = context.boxOf(context.things[at]);
  const [wide, deep, high] = sizeOf({ min, max });
  const middle = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2];
  const half = [(TRUNK_WIDE * wide) / 2, (TRUNK_WIDE * deep) / 2];
  const crownFrom = max[2] - CROWN_HIGH * high;
  const trunk = {
    of: 'piece',
    shape: 'round',
    min: [middle[0] - half[0], middle[1] - half[1], min[2]],
    max: [middle[0] + half[0], middle[1] + half[1], crownFrom],
    surface: 'wood',
  };
  const crown = {
    of: 'piece',
    shape: 'ball',
    min: [min[0], min[1], crownFrom],
    max,
    surface: 'leaf',
  };
  return [trunk, crown];
}

/** A bush: a low round one - a dome of leaf, as wide and as high as its box. */
const bush = (context, at) => [
  { of: 'piece', shape: 'dome', ...context.boxOf(context.things[at]), surface: 'leaf' },
];

/** An object whose kind has no rule: a box of its size, in the surface that says so. */
const plain = (context, at) => [
  { of: 'piece', shape: 'box', ...context.boxOf(context.things[at]), surface: 'plain' },
];

/** The rule of each kind that has one. */
export const KINDS = {
  tree,
  bush,
  ...steps, // a staircase, and a spiral one
  ...furniture, // a room's, a person, a car, a fountain, and a door and a window in no wall
  ...fittings, // a kitchen's and a bathroom's
  ...storage, // a cupboard, a sideboard and a shelf, as long as each is
  ...seats, // an office chair, an armchair and a corner sofa
  ...lamps, // three lamps, a plant and a towel rail
  ...garden, // a bench, a garden table, a sun lounger, a parasol and a grill
};

/**
 * The parts of the object at a place: what its kind's rule gives - of `kinds`, which are the
 * kinds above unless a check tells it others - or one plain box, each lifted by what the
 * object is lifted.
 */
export function ofObject(context, at, kinds = KINDS) {
  const { kind } = context.things[at];
  const rule = Object.hasOwn(kinds, kind) ? kinds[kind] : plain;
  const up = context.lift(at);
  const lifted = ([x, y, h]) => [x, y, h + up];
  return rule(context, at).map((part) => ({
    ...part,
    min: lifted(part.min),
    max: lifted(part.max),
  }));
}
