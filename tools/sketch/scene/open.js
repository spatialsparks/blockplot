// Railings: a rule of blocks (house.js). A block that counts as open air is a floor with no
// wall and no roof - the floor is slabs.js's - and where one could fall off it, a railing. Each
// box of such a block has its railings along its four edges, cell by cell, by what lies beyond
// the edge at the floor:
// - a block, in the cell beside the edge and just over the floor: none. A room has its wall
//   there, and another open floor goes on - the next box of its own block too;
// - the ground within a step of the floor - at the middle of the cell's edge it lies no more
//   than `STEP_M` under the top of the floor slab, or over it: none. One steps off;
// - else there is a drop, and a railing.
// A railing is a plate of metal, `RAIL_M` thick, on the edge and inward of it: the blocks stay
// the outer size of the house (story ST-024, rule 2). It stands on the floor slab and is as
// high as `railingHighM` says - and never higher than its block: a planted roof that was drawn
// half a metre high gets a low rim, for that is how high it was drawn. A run of cells with a
// drop is one railing, and two that meet in a corner lie in each other there.
//
// Boxes of one block that lie on each other are one open floor, as they are one room: the
// floor is the lowest one's, and a railing that is higher than that box goes on in the box
// over it, each box having the share that lies within it. Rooms and glass get none here. It
// imports its neighbours and names no global.
import { HAIR_M } from './openings.js';
import { floorUnder } from './slabs.js';
import { OPEN, pieces } from './space.js';

/**
 * A step, in metres: how far under a floor the ground may lie beside it, with no railing
 * between them. It is measured down from the top of the floor slab, where one stands, to the
 * hill as it lies at the edge. Half a metre is a row of the pad's grid, and more than a floor
 * is thick as it is first set: a block that was drawn on the ground has no railing.
 */
export const STEP_M = 0.5;
/** How thick a railing is, in metres: a plate, and no wall. */
export const RAIL_M = 0.05;

// The edges of a box, as `pieces` names the faces they are the feet of: which extent each lies
// across - 0, x, or 1, y, as a place has them - and at which of that extent's two figures.
const EDGES = { x0: [0, 0], x1: [0, 1], y0: [1, 0], y1: [1, 1] };
const EXTENTS = ['x', 'y'];

/**
 * The railings of the box at a place: nothing, of a room and of glass. They come edge by edge
 * - up the plot, down the plot, up the top view's paper, down it - and along an edge in the
 * order of its cells, each a box of metal that is a `rail`.
 */
export function railings(context, at) {
  const { things, space, figures, boxOf, hOf, groundAt } = context;
  if (space.asOf(at) !== OPEN) return [];
  const box = things[at];
  const whole = boxOf(box);
  // The lowest row of the box: its cells stand on the floor, or on a box of their own block.
  const foot = { ...box, z: [box.z[1] - 1, box.z[1]] };
  // The floor under a cell of that row: the level of the lowest cell that its block holds
  // straight under it, and the top of the slab that cell lies on, in metres above sea level.
  const floorOf = ([column, row, level]) => {
    let lowest = level;
    while (space.same(at, space.who(column, row, lowest + 1))) lowest += 1;
    return { level: lowest, topM: hOf(lowest + 1) + floorUnder(context, [column, row, lowest]) };
  };
  return Object.entries(EDGES).flatMap(([edge, [axis, side]]) => {
    const line = box[EXTENTS[axis]][side];
    // What a cell of the edge says: where the top of its floor lies, in metres, if the floor
    // has a drop beside it there - and nothing if it has none. Of two blocks drawn into each
    // other the later holds the cell: a box has a railing only on the cells it holds.
    const drop = (within, beyond) => {
      if (space.who(...within) !== at) return null;
      const floor = floorOf(within);
      if (space.who(beyond[0], beyond[1], floor.level) >= 0) return null;
      const middle = [within[0] + 0.5, within[1] + 0.5];
      middle[axis] = line;
      return floor.topM - groundAt(...middle) > STEP_M + HAIR_M ? floor.topM : null;
    };
    // Metres count up with the columns and down with the rows: inward is up them, or down.
    const up = (axis === 0) === (side === 0);
    return pieces(foot, edge, drop).flatMap(({ word: topM, ...cells }) => {
      const { min, max } = boxOf(cells);
      if (up) max[axis] += RAIL_M;
      else min[axis] -= RAIL_M;
      // The share of the railing that lies within this box: all of it, as a rule.
      min[2] = Math.max(topM, whole.min[2]);
      max[2] = Math.min(topM + figures.railingHighM, whole.max[2]);
      if (max[2] - min[2] <= HAIR_M) return [];
      return [{ of: 'rail', shape: 'box', min, max, surface: 'metal' }];
    });
  });
}
