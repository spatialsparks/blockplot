// What holds of every part of a scene, tried: for the check of a rule, on the house that check
// makes up. `amiss` says in words what does not hold, and nothing where all does. It imports
// its neighbours and names no global.
//
// A part is what parts.js says a part is. And three things hold of every part:
// 1. a part of a block lies within the box of its block - the box of the thing it is made of.
//    So the blocks stay the outer size of the house: thickness is taken from inside. And
//    under its top, where that slopes (story ST-026): a roof, a wall, a pane and a frame rise
//    nowhere over the top that the block's solid says. A floor and a railing are not asked
//    that: under a slope each is as it was, level and as high as its figure;
// 2. a part of an object lies within the box of its object, lifted as the object is - and moved
//    as it is, where it was moved clear of the walls of its room (clear.js);
// 3. no two parts of different surfaces lie in each other - they may touch - among the parts
//    of the blocks, and among the parts of one object. So no two surfaces flicker in one plane.
//    An object and a block are not asked of each other: where an object still stands in a wall
//    - drawn across it, or in a room too small to hold it - the two do lie in each other.
// All three are asked of the boxes, `min` and `max`: of the box around what is round, too. That
// asks a little more of a round part than that it keeps clear itself - the trunk of a tree ends
// where the box of its crown begins - and it is the same question for every shape.
//
// But a slant is asked by what it fills, wherever that can be said as lines along one extent
// (`filled`, tops.js): whether it rises over the top of its block, and whether it lies in
// another part - a box, or a slant that slopes along the same extent. So a pane may end under
// a sloping bar whose box lies in its own. A slant under a top that slopes along the other
// extent, and two slants that slope along different extents, are asked by their boxes, as
// what is round is: no rule makes either.
import { OF, SHAPES } from './parts.js';
import { SURFACES } from './surfaces.js';
import { HAIR_M, filled, lineAt } from './tops.js';

// What a wedge says of itself, and no other shape says: a place, and four figures.
const OF_A_WEDGE = 'about from to inner outer'.split(' ');
// What a slant says of itself, and no other shape says: an extent, and two lines.
const OF_A_SLANT = 'along low high'.split(' ');
// What ends under the top of its block, where that slopes: all of a block but its floor and
// its railing.
const UNDER_A_TOP = ['roof', 'wall', 'pane', 'frame'];
const AXES = [0, 1, 2];

const isPlace = (place, count) =>
  Array.isArray(place) && place.length === count && place.every(Number.isFinite);
const isSlant = (part) => part.shape === 'slant';

/**
 * What a slant is not, of what parts.js says a slant is, once it says an extent, two lines and
 * a box: in words, one for each lack.
 */
function askew({ min, max, low, high }) {
  const said = [];
  const thick = [0, 1].map((end) => high[end] - low[end]);
  const level = [low, high].every((line) => Math.abs(line[1] - line[0]) <= HAIR_M);
  const around = [min[2] - Math.min(...low), max[2] - Math.max(...high)];
  if (thick.some((far) => far < -HAIR_M)) said.push('has its bottom over its top');
  else if (thick.every((far) => far <= HAIR_M)) said.push('is nowhere higher than a hair');
  if (level) said.push('is level above and below, and says no box');
  if (around.some((far) => Math.abs(far) > HAIR_M)) said.push('has not the box around it');
  return said;
}

/** What a part is not, of what the contract says a part is: in words, one for each lack. */
function lacks(part, solids) {
  const said = [];
  if (!OF.includes(part.of)) said.push(`is of nothing the scene knows: ${part.of}`);
  if (!SHAPES.includes(part.shape)) said.push(`has a shape the scene does not know: ${part.shape}`);
  if (!Object.hasOwn(SURFACES, part.surface)) said.push(`is of no surface: ${part.surface}`);
  if (solids[part.thing] === undefined) said.push(`is made of no thing: ${part.thing}`);
  else if (part.floor !== solids[part.thing].floor)
    said.push('does not stand on the floor of its thing');
  const boxed = isPlace(part.min, 3) && isPlace(part.max, 3);
  if (!boxed) said.push('has no box');
  else if (AXES.some((axis) => part.max[axis] - part.min[axis] <= HAIR_M)) said.push('has no size');
  if ('over' in part && part.over !== true) said.push('says over, and not true');
  const winds = OF_A_WEDGE.filter((key) => key in part);
  const figures = OF_A_WEDGE.slice(1).every((key) => Number.isFinite(part[key]));
  if (part.shape === 'wedge' ? !(isPlace(part.about, 2) && figures) : winds.length > 0) {
    said.push(`says of a wedge what it should not, or not what it should: ${winds.join(', ')}`);
  }
  const slopes = OF_A_SLANT.filter((key) => key in part);
  const lines = [0, 1].includes(part.along) && isPlace(part.low, 2) && isPlace(part.high, 2);
  if (isSlant(part) ? !lines : slopes.length > 0) {
    said.push(`says of a slant what it should not, or not what it should: ${slopes.join(', ')}`);
  } else if (isSlant(part) && boxed) said.push(...askew(part));
  return said;
}

/**
 * The bottom and the top of a part over a rectangle within it, as lines along an extent
 * (tops.js): its own two, where it is a slant that slopes along that extent - and else those
 * of its box, as of what is round.
 */
const linesOf = (part, along, rectangle) =>
  isSlant(part) && part.along === along
    ? [part.low, part.high].map((line) => lineAt(line, part, along, rectangle))
    : [part.min[2], part.max[2]].map((level) => [level, level]);

/**
 * Whether a part of a block rises over the top of its block, where that slopes: whether
 * anything lies over that top and under the part's own.
 */
function overTop(part, solid) {
  if (solid.top === undefined || !UNDER_A_TOP.includes(part.of)) return false;
  const { along, high } = solid.top;
  const [, own] = linesOf(part, along, part);
  return filled(part, along, [lineAt(high, solid, along, part)], [own]).length > 0;
}

/**
 * Whether two parts lie in each other, whose boxes do: whether what both fill is something,
 * over the rectangle both cover. Two boxes do; and so do two slants that slope along
 * different extents, which are asked by their boxes.
 */
function inEachOther(a, b) {
  const slants = [a, b].filter(isSlant);
  if (slants.length === 0 || (slants.length === 2 && a.along !== b.along)) return true;
  const [{ along }] = slants;
  const both = {
    min: [0, 1].map((axis) => Math.max(a.min[axis], b.min[axis])),
    max: [0, 1].map((axis) => Math.min(a.max[axis], b.max[axis])),
  };
  const [[lowA, highA], [lowB, highB]] = [a, b].map((part) => linesOf(part, along, both));
  return filled(both, along, [lowA, lowB], [highA, highB]).length > 0;
}

/**
 * What is amiss of a scene's parts, in words - and nothing, where every part is a part and the
 * three things hold. `scene` is what `sceneOf` gives, with its `solids` and its `parts`.
 * `liftOf(at)` says how far the object at a place of `things` stands from where the sketch has
 * it, in metres, worked out by hand in the check that asks - in one of two writings:
 * - a number: how far it is lifted, for an object that stands where it was drawn;
 * - `[dx, dy, dh]`: how far its middle was moved along the plot and across it, and how far it
 *   is lifted, for an object that was moved clear of a wall. One that was cut lies within its
 *   moved box as it is: it is shorter, about the middle it was moved to.
 * Nothing, where it is not told. Told by a check that gives neither for an object that has
 * parts, the question says so, once for the object, and does not ask where its parts lie:
 * without a lift, one that lies outside its object would pass. Every pair of parts is tried.
 */
export function amiss(scene, liftOf = () => 0) {
  const { parts, solids } = scene;
  const said = [];
  const named = (at) => `part ${at}, a ${parts[at].of} of thing ${parts[at].thing},`;
  const ofAnObject = (part) => solids[part.thing].kind !== undefined;
  // A part that is no part is said, and asked nothing more.
  const sound = parts.map((part, at) => {
    const lacking = lacks(part, solids);
    said.push(...lacking.map((words) => `${named(at)} ${words}`));
    return lacking.length === 0;
  });
  const unlifted = new Set();
  parts.forEach((part, at) => {
    if (!sound[at]) return;
    const solid = solids[part.thing];
    const told = ofAnObject(part) ? liftOf(part.thing) : 0;
    const by = typeof told === 'number' ? [0, 0, told] : told;
    if (!isPlace(by, 3)) {
      if (!unlifted.has(part.thing)) {
        said.push(`thing ${part.thing}, a ${solid.kind} that has parts, was given no lift`);
      }
      unlifted.add(part.thing);
      return;
    }
    const outside = AXES.some(
      (axis) =>
        part.min[axis] < solid.min[axis] + by[axis] - HAIR_M ||
        part.max[axis] > solid.max[axis] + by[axis] + HAIR_M,
    );
    const as = told === by ? 'moved and lifted as it is' : 'lifted as it is';
    const box = ofAnObject(part) ? `its object, ${as}` : 'its block';
    if (outside) said.push(`${named(at)} does not lie within the box of ${box}`);
    else if (overTop(part, solid)) said.push(`${named(at)} rises over the top of its block`);
  });
  const apart = (a, b) =>
    AXES.some((axis) => a.max[axis] - b.min[axis] <= HAIR_M || b.max[axis] - a.min[axis] <= HAIR_M);
  const asked = (a, b) => a.thing === b.thing || (!ofAnObject(a) && !ofAnObject(b));
  parts.forEach((a, first) => {
    parts.forEach((b, second) => {
      if (second <= first || !sound[first] || !sound[second]) return;
      if (a.surface !== b.surface && asked(a, b) && !apart(a, b) && inEachOther(a, b)) {
        said.push(
          `${named(first)} of ${a.surface}, and ${named(second)} of ${b.surface}, lie in each other`,
        );
      }
    });
  });
  return said;
}
