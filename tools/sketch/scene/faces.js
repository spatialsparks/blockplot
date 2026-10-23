// Faces: which wall the box of a room has on an upright face, and how thick it is - what the
// two rules ask that build there, said once for both. The walls stand on the faces (walls.js);
// and a slab that an outer wall stands on, or under, is the wall's along that edge (slabs.js).
// A rule imports this module, and this module no rule: walls.js builds on slabs.js, so what the
// two share can be neither's. It imports its neighbour and names no global.
//
// Which wall a room has on a face is said by what lies beyond the face:
// - a box of its own block: none - a room is a block, and has no wall inside it;
// - another room: half of an inner wall, `innerWallM / 2` thick. The room beyond makes the
//   other half, so a wall of two rooms is two parts that meet in the face;
// - all else - nothing, the ground, open air, glass: an outer wall, `outerWallM` thick.
// A wall lies inside its box, on the face and inward of it, and is never thicker than half of
// what its box is wide there. Open air and glass have no wall: only a room is asked.
//
// The question of a cell that the two answer together - how thick a wall stands on a face of
// it - is walls.js's, `wallOn`: who builds up to a wall asks there.
import { ROOM } from './space.js';

/**
 * The upright faces of a box or of a cell, as `pieces` names them (space.js): which extent each
 * lies across - 0, x, or 1, y, as a place has them - and at which of that extent's two figures.
 * They come as the walls of a box do: up the plot, down the plot, up the paper, down the paper.
 */
export const FACES = { x0: [0, 0], x1: [0, 1], y0: [1, 0], y1: [1, 1] };
/** The two extents an upright face can lie across, as a box of cells names them. */
export const EXTENTS = ['x', 'y'];
/** The two walls a room can have on a face. */
export const INNER = 'inner';
export const OUTER = 'outer';
/** What a wall is made of - and with it the edge of a slab that an outer wall stands on. */
export const WALL = 'plaster';

/**
 * The wall that the box of a room, at place `at`, has toward a cell beyond one of its faces:
 * none, null, where its own block holds that cell; an inner one where another room does; and an
 * outer one toward all else.
 */
export function toward({ space }, at, beyond) {
  const other = space.who(...beyond);
  if (space.same(at, other)) return null;
  return space.asOf(other) === ROOM ? INNER : OUTER;
}

/**
 * How thick the walls of the box at a place are across an extent, by their kind, in metres: an
 * outer wall as its figure says, an inner one half of its figure, and neither more than half
 * of what the box is wide across that extent - the two walls of a narrow box meet in its
 * middle, and neither lies in the other.
 */
export function thickOf({ things, figures, boxOf }, at, axis) {
  const { min, max } = boxOf(things[at]);
  const half = (max[axis] - min[axis]) / 2;
  return {
    [INNER]: Math.min(figures.innerWallM / 2, half),
    [OUTER]: Math.min(figures.outerWallM, half),
  };
}
