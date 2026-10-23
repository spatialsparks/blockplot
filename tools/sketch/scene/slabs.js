// Floors and roofs: the first rule of blocks (house.js). A slab lies inside the box it belongs
// to - the floor in its lowest part, the roof in its highest - so that the blocks stay the outer
// size of the house (story ST-024, rule 2). A floor is open over a staircase that comes up to
// it. A roof is opened by no staircase that stands in its own room - and a room that a flight
// runs over, and that lies under its steps, has no roof there: the flight is its ceiling
// (story ST-026; flights.js).
//
// The facade is the wall's. A slab of a room is a field and a rim: along each edge where an
// outer wall of its box stands (faces.js) - a wall toward nothing, the ground, open air or
// glass - it is a strip as wide as that wall is thick, of the wall's surface; the rest is its
// field, in the surface the slab had. So a house is plaster from its foot to its top, and no
// floor shows across its facade. Toward another room and toward a box of its own block a slab
// is its own surface to its edge, and so is all of a slab of open air and of glass, which have
// no wall.
//
// UNDER A TOP THAT SLOPES (story ST-026; tops.js) the roof of a room follows the top: over the
// rectangles it lay over - its field and its strips, each asked for at the top of the box - and
// as thick as it was, measured upright: between the top less that thickness and the top. And
// nowhere lower than the floor under it: where the top comes down to the floor's slab the roof
// thins out on it, and ends where the two meet. A floor is level and whole, as it was, and
// where a top falls lower than the floor is thick its edge shows beyond the roof.
//
// And the questions the rule asks of a cell, for whoever builds on a slab or up to one: a wall,
// a railing, and the lift of what stands on a floor (parts.js). They know of no rim: a strip is
// a part of its slab, and as thick. And of no slope: each answers by the box. It imports its
// neighbours and names no global.
import { EXTENTS, FACES, OUTER, WALL, thickOf, toward } from './faces.js';
import { FLIGHTS, flightOver } from './flights.js';
import { ROOM, pieces } from './space.js';
import { ROOF, floorOf } from './surfaces.js';
import { filled, lineOver, topOf } from './tops.js';

// The kinds that are a staircase - a flight of any kind, and a spiral one: a floor is open
// where one comes up to it.
const STAIRCASES = [...FLIGHTS, 'spiral'];
// How near a line of the grid a place lies that lies on it, in cells: a place that was worked
// out is off by its last figure, and is on the line all the same.
const HAIR_CELLS = 1e-9;
// And in metres: a wall that ends nearer than this to a line of the grid ends on it.
const HAIR_M = 1e-9;
// What a square of a slab is: a strip's, under the name of the face its wall stands on - in a
// corner the first of them has it - or the field's, where no outer wall stands on it. And the
// order a slab's parts come in: its field, and then its strips face by face, as walls come.
const WORDS = Object.keys(FACES);
const FIELD = 'field';
const ORDER = [FIELD, ...WORDS];
// What the rule works out of a scene, once: the cells over every staircase. It is kept for as
// long as the scene's context is, and not on it: the context is another module's (parts.js).
const worked = new WeakMap();

/**
 * The cells that a staircase comes up to, level by level: under each of them a floor is open.
 * They are the cells over its footprint - every cell that it stands in, wholly or in part, as
 * the sketch has it and not as clear.js fits it - at the level where its own box ends. One
 * that ends on no line of the grid comes up to no level, and opens nothing.
 */
function openOf(context) {
  if (!worked.has(context)) {
    const open = new Map();
    for (const { kind, x, y, z } of context.things) {
      const top = Math.round(z[0]);
      if (!STAIRCASES.includes(kind) || Math.abs(z[0] - top) >= HAIR_CELLS) continue;
      // The cells over a line of the grid are those of the level before it.
      const cells = open.get(top - 1) ?? new Set();
      open.set(top - 1, cells);
      for (let column = Math.floor(x[0] + HAIR_CELLS); column < x[1] - HAIR_CELLS; column += 1) {
        for (let row = Math.floor(y[0] + HAIR_CELLS); row < y[1] - HAIR_CELLS; row += 1) {
          cells.add(`${column} ${row}`);
        }
      }
    }
    worked.set(context, open);
  }
  return worked.get(context);
}

/**
 * How thick a slab is in the box at a place, in metres: as its figure says, and never more
 * than half of what the box is high - a block lower than its two slabs is two slabs that meet
 * in its middle, and neither lies in the other.
 */
function thick({ things, hOf }, at, figureM) {
  const [top, bottom] = things[at].z;
  return Math.min(figureM, (hOf(top) - hOf(bottom)) / 2);
}

/**
 * How thick the floor of a block is under a cell, in metres, taken whole: with no opening - and
 * nothing, 0, where the block has no floor. It has one where a block holds the cell and no box
 * of the same block holds the cell under it: at the bottom of a block, also where another
 * block lies below. `cell` is `[column, row, level]`.
 *
 * It is the height of that floor, for what stands on its level: over a staircase too, where no
 * slab lies, an object is lifted as high as the floor is beside it (parts.js), and a door or a
 * window in a wall beside the opening is raised as high (walls.js).
 */
export function floorWhole(context, [column, row, level]) {
  const { space, figures } = context;
  const at = space.who(column, row, level);
  if (at < 0 || space.same(at, space.who(column, row, level + 1))) return 0;
  return thick(context, at, figures.floorSlabM);
}

/**
 * How thick a floor slab lies under a cell, in metres - and nothing, 0, where none does: where
 * the block has no floor (`floorWhole`), and where a staircase comes up to the cell - a
 * kind of `STAIRCASES` whose box ends under it. There the floor is open: no slab is made, and
 * a wall beside the opening runs down to the bottom of its box.
 */
export function floorUnder(context, cell) {
  const [column, row, level] = cell;
  return openOf(context).get(level)?.has(`${column} ${row}`) ? 0 : floorWhole(context, cell);
}

/**
 * How thick a roof slab lies over a cell, in metres - and nothing, 0, where none does. One does
 * where a block that counts as a room holds the cell and no block at all holds the cell over
 * it. Under another block a room has that block's floor for its ceiling; open air has no roof,
 * and the roof of glass is no slab. No staircase opens the roof of the room it stands in. But a
 * room that lies under a flight has the flight for its ceiling, over the cells that the flight
 * runs over (`flightOver`, flights.js): there it has no roof, and beside them it has its own.
 * Under a top that slopes the answer is the box's: the cell at its top has the roof over it,
 * as thick as it is upright, however far under that cell the roof lies.
 */
export function roofOver(context, cell) {
  const [column, row, level] = cell;
  const { space, figures } = context;
  const at = space.who(column, row, level);
  if (space.asOf(at) !== ROOM || space.who(column, row, level - 1) >= 0) return 0;
  return flightOver(context, cell) ? 0 : thick(context, at, figures.roofSlabM);
}

/**
 * An extent of the box at a place - 0, along the plot, or 1, across it - cut into spans, in the
 * order of its cells: a cell is one span, or two or three where an outer wall of the box ends
 * in it, `reachM` in from the face at either end of the extent. A wall that ends on a line of
 * the grid, to a hair, cuts no cell: no strip is a hair wide.
 *
 * A span is `{ cell, ends, within }`: its column or its row; from where to where it lies, in
 * metres, in the order of the cells - across the plot the larger figure first, as the rows
 * count; and for the face at either end of the extent, whether a wall on that face reaches it.
 */
function spansOf({ things, xOf, yOf }, at, axis, reachM) {
  const lineOf = axis === 0 ? xOf : yOf;
  const [first, last] = things[at][EXTENTS[axis]];
  // Metres count up with the columns and down with the rows.
  const way = axis === 0 ? 1 : -1;
  const before = (place, other) => way * (other - place) > HAIR_M;
  // Where the two walls end, worked out as walls.js works out where its own parts end.
  const reach = [lineOf(first) + way * reachM, lineOf(last) - way * reachM];
  const spans = [];
  for (let cell = first; cell < last; cell += 1) {
    const [from, to] = [lineOf(cell), lineOf(cell + 1)];
    const cuts = reach.filter((place) => before(from, place) && before(place, to));
    [...cuts, to].forEach((end, nth) => {
      const begun = nth === 0 ? from : cuts[nth - 1];
      // The two walls of a box that is all wall end in one place, its middle, or a hair apart:
      // what lies between them is reached by both, and is the strip's of whichever stands.
      const within = [!before(reach[0], end), !before(begun, reach[1])];
      spans.push({ cell, ends: [begun, end], within });
    });
  }
  return spans;
}

/**
 * One slab of the box at a place, as flat rectangles in metres at the height `plane`, each
 * `{ min, max, rim, on }`: the field first, and then the strips of its rim, face by face.
 *
 * The slab lies where the box holds its own cell on `level` - of two blocks drawn into each
 * other the later holds it - and `asked`, `floorUnder` or `roofOver`, says so. Of that, a square
 * is a strip's where an outer wall of the box reaches it: a wall on the face of the cell at the
 * edge of the box, on the same level - the foot of the box for its floor, its top for its roof -
 * as far in as that wall is thick (faces.js). Where the slab lies under a part of a wall alone,
 * that part is the strip. A wall is asked for where it stands, and not where a door or a window
 * opens it or its slabs leave it no height. Where two walls reach one square, in a corner, it
 * is the strip's of the face that comes first.
 *
 * The spans of the two extents are a grid, as the cells are one, and `pieces` cuts it as it
 * cuts a face: a strip is one rectangle for as long as its wall goes on and the slab under it,
 * and the field one wherever it can be. A box that is no room has no wall, and so no rim: its
 * slab is the rectangles that `pieces` makes of its cells.
 *
 * `on(column, row)` is a figure of a square that parts the slab too, where it is given: no
 * rectangle lies over two of them, and each says its own as `on` - what a roof under a slope
 * may come down onto. Where none is given, it is 0 for every square, and parts nothing.
 */
function laid(context, at, { level, plane, asked, on = () => 0 }) {
  const { things, space } = context;
  const room = space.asOf(at) === ROOM;
  const [columns, rows] = [0, 1].map((axis) =>
    spansOf(context, at, axis, room ? thickOf(context, at, axis)[OUTER] : 0),
  );
  // Whether an outer wall of the box stands on one of its faces, at a column or a row along it.
  const walled = (axis, side, along) => {
    const cell = [along, along, level];
    cell[axis] = things[at][EXTENTS[axis]][side] - side;
    const beyond = [...cell];
    beyond[axis] += side === 0 ? -1 : 1;
    return space.who(...cell) === at && toward(context, at, beyond) === OUTER;
  };
  const wordOf = ([nth, down]) => {
    const [column, row] = [columns[nth], rows[down]];
    const cell = [column.cell, row.cell, level];
    if (space.who(...cell) !== at || !(asked(context, cell) > 0)) return null;
    const face = WORDS.find((word) => {
      const [axis, side] = FACES[word];
      const [across, along] = axis === 0 ? [column, row] : [row, column];
      return across.within[side] && walled(axis, side, along.cell);
    });
    return `${face ?? FIELD} ${on(column.cell, row.cell)}`;
  };
  const grid = { x: [0, columns.length], y: [0, rows.length], z: [0, 0] };
  return pieces(grid, 'z0', wordOf)
    .map(({ word, x, y }) => ({ said: word.split(' '), x, y }))
    .sort((one, other) => ORDER.indexOf(one.said[0]) - ORDER.indexOf(other.said[0]))
    .map(({ said, x, y }) => ({
      min: [columns[x[0]].ends[0], rows[y[1] - 1].ends[1], plane],
      max: [columns[x[1] - 1].ends[1], rows[y[0]].ends[0], plane],
      rim: said[0] !== FIELD,
      on: Number(said[1]),
    }));
}

/**
 * The floors and the roofs of the box at a place, floors first:
 * - a floor under the box, wherever no box of the same block lies under it and no staircase
 *   comes up to it: `floorSlabM` thick, from the bottom of the box up, in the surface the
 *   block's name says (`floorOf`). A block of two storeys has none halfway up, and of two boxes
 *   one over the other the upper has none where it lies on the lower. Over a staircase the
 *   floor is open by the cells of the staircase's footprint, and whole beside them;
 * - a roof on the box of a room, wherever no block at all lies over it and no flight is its
 *   ceiling: `roofSlabM` thick, down from the top of the box, of the roofs' one surface, and
 *   `over`. Under a flight it is open by the cells of the flight's footprint, as a floor is.
 * Of a room, each is its field and the strips of its rim, which are of the wall's surface, as
 * thick as the slab and `of` what it is (`laid`): four strips at the most to a room alone.
 *
 * Under a top that slopes a rectangle of the roof is what `filled` gives of it (tops.js): all
 * between the top less the roof's thickness and the top - a slant - and over the floor that
 * lies under that rectangle at the foot of the box (`floorUnder`), or over the foot itself
 * where none does: on a lower box of its block, over a staircase. The roof is parted where
 * that differs. So a roof that comes down to its floor is two slants, the second thinning out
 * on the floor's slab. Under a level top a roof lies nowhere near the foot of its box, and
 * `filled` gives the one box that the roof was, to the last figure.
 */
export function slabs(context, at) {
  const { things, space, figures, hOf } = context;
  const [top, bottom] = things[at].z;
  const [floorM, roofM] = [figures.floorSlabM, figures.roofSlabM].map((figureM) =>
    thick(context, at, figureM),
  );
  const surface = floorOf(space.nameOf(at), space.asOf(at));
  const slope = topOf(context, things[at]);
  // The floor under a square, at the foot of the box: what a roof that slopes may come down onto.
  const under = (column, row) => floorUnder(context, [column, row, bottom - 1]);
  const floor = { level: bottom - 1, plane: hOf(bottom), asked: floorUnder };
  const roof = { level: top, plane: hOf(top), asked: roofOver, on: slope ? under : undefined };
  const floors = laid(context, at, floor).map(({ min, max, rim }) => ({
    of: 'floor',
    shape: 'box',
    min,
    max: [max[0], max[1], min[2] + floorM],
    surface: rim ? WALL : surface,
  }));
  const roofs = laid(context, at, roof).flatMap(({ min, max, rim, on }) => {
    const head = lineOver(context, things[at], { min, max });
    const soffit = head.map((h) => h - roofM);
    const lowest = [hOf(bottom) + on, hOf(bottom) + on];
    return filled({ min, max }, slope?.along ?? 0, [soffit, lowest], [head]).map((shape) => ({
      of: 'roof',
      ...shape,
      surface: rim ? WALL : ROOF,
      over: true,
    }));
  });
  return [...floors, ...roofs];
}
