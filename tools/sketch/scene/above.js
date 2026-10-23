// What stands above the ground (story ST-016): of the solids of a scene, the boxes of the house
// that go to Google Earth - and how many were left out, under the ground. It works out no
// ground: it reads `scene.ground` as the scene gives it, the grid that the 3D page hands it
// shaped by the sketch's blocks of ground and cuts, which are no solid of it. It imports its
// neighbour space.js alone, and names no global.
//
// The rule, in its words. A solid of an OBJECT - one with a `kind`: furniture, fittings, stairs,
// a tree, a car - is in neither list: the house is its blocks. A solid of a BLOCK - a room, open
// air, glass - is LEFT OUT where its HIGHEST POINT lies AT OR UNDER the LOWEST height of the
// ground's grid points ON ITS FOOTPRINT, its edges included: every `heights[row][column]` whose
// `xs[column]` lies from `min[0]` to `max[0]` and whose `ys[row]` lies from `min[1]` to `max[1]`.
// Its highest point is `max[2]`, or, where its top slopes, the higher of `top.high`. Every other
// block is KEPT, whole: one that stands partly out of the ground - downhill, beside a cut - for
// Google Earth's own ground hides its foot; and one with no grid point on its footprint, off the
// paper, for nothing says it is under the ground. A block's box is whole cells, so its corners
// are grid points of the ground, worked out alike: no figure is compared within a hair.
import { isBlock } from './space.js';

/** The lowest height of the ground's grid points on a solid's footprint - of every near grid, where it has them (ST-042) - or null where none lies on it. */
function lowestUnder(ground, { min, max }) {
  const within = (figure, axis) => min[axis] <= figure && figure <= max[axis];
  const found = (ground.near ?? [ground]).flatMap(({ xs, ys, heights }) => {
    const columns = xs.flatMap((x, column) => (within(x, 0) ? [column] : []));
    return ys.flatMap((y, row) =>
      within(y, 1) ? columns.map((column) => heights[row][column]) : [],
    );
  });
  return found.length === 0 ? null : Math.min(...found);
}

/** The highest point of a solid: the top of its box, or, where its top slopes, its higher end. */
const highestOf = ({ max, top }) => (top === undefined ? max[2] : Math.max(...top.high));

/**
 * Of a scene (scene.js) - its `solids` and its `ground` - `{ boxes, under }`: `boxes`, the solids
 * of blocks that are kept, the very objects, in the scene's order; `under`, how many solids of
 * blocks were left out, under the ground. No object is in either.
 */
export function aboveGround({ solids, ground }) {
  const boxes = [];
  let under = 0;
  for (const solid of solids.filter(isBlock)) {
    const lowest = lowestUnder(ground, solid);
    if (lowest !== null && highestOf(solid) <= lowest) under += 1;
    else boxes.push(solid);
  }
  return { boxes, under };
}
