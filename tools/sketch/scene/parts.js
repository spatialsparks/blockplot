// The parts of the scene: what the house is built of and what stands in it, each a shape of a
// surface, worked out by rules from the blocks, the objects and the figures of the house (story
// ST-024). Plain data in metres of the plot's frame, for a view to draw and for a file to hold.
// The rules of blocks are house.js's, the rules of objects objects.js's; here they are run, and
// their parts handed over. It imports its neighbours and names no global.
//
// A PART is
// - `of`: what it is, in a word of `OF`
// - `shape`: a word of `SHAPES`. `box`; or, for what is round and for a tread of a spiral
//   staircase alone (story ST-024, rule 4): `round`, an upright cylinder; `ball`; `dome`, the
//   upper half of a ball, standing on the bottom of its box; `wedge`; or, for what slopes
//   (story ST-026, rule 4): `slant`
// - `min`, `max`: `[x, y, h]` in metres, as a solid has them - the box, or the box around what
//   is round, which fills it from side to side, or around what slopes
// - `surface`: a name of `SURFACES` (surfaces.js)
// - `thing`: the place of the thing it is made of, in `things` and so in the scene's `solids`
// - `floor`: the floor that thing stands on, `solids[thing].floor`, in metres: what a cut asks
// - `over`: true on what closes its block from above - a roof, of whatever it is made. No
//   other part has it: none says false
// - of a `wedge` alone - a slice of a ring, as high as its box: `about`, the `[x, y]` it winds
//   round; `from` and `to`, in degrees counted from the plot's x towards its y; `inner` and
//   `outer`, in metres from `about`
// - of a `slant` alone - all that lies, over the rectangle of its `min` and its `max` seen from
//   above, between two planes that each rise or fall along one extent of the plot and run
//   level across the other: `along`, the extent they slope along, 0 for x or 1 for y, as a
//   place has them; `low`, `[h, h]`, its bottom at `min[along]` and at `max[along]`, in
//   metres; `high`, its top at the two. `min[2]` is the lower of `low` and `max[2]` the higher
//   of `high`: the box around it. Its bottom lies nowhere over its top, and under it at one end
//   at the least: it may come down to an edge. One shape serves a roof - both planes slope - a
//   wall, a pane and a post under a sloping head - the bottom level - and a member that
//   follows a slope. What is level above and below is a `box`, and says so. A rule makes one
//   with `filled` (tops.js), and says in its own head what it builds under a top that slopes
// It is plain data, and says only what it has: written down and read again, it is the same.
// Parts come in the order of their things, and of one thing as its rules give them. Three
// things hold of every one of them: holds.js says which, and tries them.
import { fitted, standing } from './clear.js';
import { RULES } from './house.js';
import { KINDS, ofObject } from './objects.js';
import { floorWhole } from './slabs.js';
import { isBlock, metres, spaceOf } from './space.js';

/** What a part can be: a part of an object is a `piece`, or a `step` of its staircase. */
export const OF = ['floor', 'roof', 'wall', 'pane', 'frame', 'rail', 'step', 'piece'];
/** The shapes a part can have. */
export const SHAPES = ['box', 'round', 'ball', 'dome', 'wedge', 'slant'];

/**
 * How far the object at a place is lifted, in metres: what stands on a floor stands on the
 * floor's slab. It is as thick as the floor of the block the object stands in - the block that
 * holds the cell over its `floor`, under its middle (`standing`, clear.js) - under the lowest
 * cell that this block holds straight under it:
 * - on the block's own floor, that is the slab it stands on;
 * - on a level inside the block, where it has no floor of its own - halfway up a shaft of two
 *   storeys, or on the upper of two boxes of one block - it is the slab at the block's foot.
 *   So a second flight begins where the first ends;
 * - and over a staircase that comes up through the floor it is that floor taken whole, as
 *   thick as it lies beside the opening (`floorWhole`, slabs.js): a flight over a flight
 *   begins where the lower one ends in a shaft of two blocks too, and what is drawn over a
 *   stairwell hangs at the height of its floor.
 * It is nothing where no block holds the cell over its floor - on the ground, on a roof - where
 * its floor lies on no line of the grid, and of a block, which is no object.
 *
 * Where the middle lies on a line of the grid, the cells on both sides of the line are asked,
 * and the thicker slab lifts: a window lies in a face of its room and a door may stand across
 * one, the middle on the line between the room and what lies beyond it, and each is lifted in
 * whichever of the room's faces it stands.
 */
function liftOf(context, at) {
  const stands = standing(context.things[at]);
  if (stands === null) return 0;
  const { space } = context;
  const floorOf = (column, row) => {
    let lowest = stands.level - 1;
    const own = space.who(column, row, lowest);
    while (space.same(own, space.who(column, row, lowest + 1))) lowest += 1;
    return floorWhole(context, [column, row, lowest]);
  };
  return Math.max(
    ...stands.columns.flatMap((column) => stands.rows.map((row) => floorOf(column, row))),
  );
}

/**
 * What a rule gets: the head of house.js says each of them. Of `boxOf` it has yet to say that
 * an object's box is fitted into the clear space of its room (`fitted`, clear.js): a block and
 * a piece of a face, which have no kind, are the cells they are.
 */
function contextOf({ xOf, yOf, hOf, groundAt, things, figures }) {
  const taken = new Set();
  const context = {
    things,
    figures,
    space: spaceOf(things),
    xOf,
    yOf,
    hOf,
    boxOf: (cells) => (isBlock(cells) ? metres({ xOf, yOf, hOf }, cells) : fitted(context, cells)),
    groundAt,
    lift: (at) => liftOf(context, at),
    take(at) {
      taken.add(at);
    },
    taken: (at) => taken.has(at),
  };
  return context;
}

/**
 * The parts of a sketch's things. `given` is what the scene knows by then (scene.js): the
 * frame - `xOf`, `yOf`, `hOf` - `groundAt`, `things`, `figures`, and `solids`, a solid for
 * each thing. `rules` are the house's own and the objects' own unless it is told others, a
 * check's: `blocks`, the rules of blocks in their order, and `kinds`, the rule of each kind.
 *
 * The rules of blocks run first, for every box of every block: one of them may take an object,
 * which then gives no part of its own, wherever in `things` it stands. Then each object that
 * is left gives its parts. Every part is given its `thing` and its `floor`.
 */
export function partsOf(given, { blocks = RULES, kinds = KINDS } = {}) {
  const { things, solids } = given;
  const context = contextOf(given);
  const ofBlocks = things.map((thing, at) =>
    isBlock(thing) ? blocks.flatMap((rule) => rule(context, at)) : null,
  );
  return things.flatMap((thing, at) => {
    const made = ofBlocks[at] ?? (context.taken(at) ? [] : ofObject(context, at, kinds));
    return made.map((part) => ({ ...part, thing: at, floor: solids[at].floor }));
  });
}
