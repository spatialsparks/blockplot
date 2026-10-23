// An object clear of the walls of its room: the box that the rule of a kind gets for its object
// (objects.js). Thickness is taken from inside (story ST-024, rule 2), so what the sketch puts
// against the edge of its block - a toilet, a bed, a flight of stairs - would stand in the wall
// by the wall's thickness. Here it gives way: its box is its own, fitted into the clear space
// of its room.
// - The room is the block that holds the cell over the object's floor, under its middle, and
//   counts as a room. An object that stands in none keeps its box: on the ground, on a roof, in
//   open air, in glass, and with its middle on the edge between two blocks. So do a door and a
//   window, which stand in their wall to open it (openings.js), and every block.
// - Along the plot and across it alike, the clear space runs between the faces of two walls, on
//   the line through the object's middle: the room's own faces there - beyond every box of its
//   block that the line runs through - each moved in by as much as a wall stands on it (`wallOn`
//   of walls.js), and by nothing where none does.
// - An object that is no longer than the clear space is moved the least that brings it into it,
//   and keeps its size: one that stands clear is not moved at all.
// - One that is longer is cut to the clear space - and keeps at least `LEAST` of its own
//   length, about the middle of the clear space: a flight in a room as wide as itself stays a
//   flight, though it then stands in both walls.
// - Up and down nothing changes, and neither does how far it is lifted (parts.js).
// - A flight that runs over more than one block (flights.js) is fitted as one thing, and has no
//   one room (story ST-026, rule 5). Along its length its clear space runs from the wall behind
//   its foot to the wall beyond its last step, through every block it runs over: no wall
//   between two of them ends it. Across, it is the narrowest clear space of those blocks. Then
//   it is moved before it is cut and keeps `LEAST`, as every object.
// Only the box that a rule builds in gives way. Where an object lies is the pad's to say: its
// solid, its `floor` and the cells it is read by stay as the sketch has them. It imports its
// neighbours and names no global.
import { runOf } from './flights.js';
import { HAIR_M } from './openings.js';
import { ROOM, metres } from './space.js';
import { wallOn } from './walls.js';

/**
 * The least that an object keeps of its own length where the clear space of its room is
 * shorter still, as a share: half. A flight of 1 m between two outer walls of 0.4 m has 0.2 m
 * clear, and stays 0.5 m wide. Half is the most that never reaches through a wall in a room at
 * least as wide as the object: a wall is no thicker than half its box (walls.js), so what is
 * kept about the middle of the clear space ends inside the thinner of the two walls, or at
 * its face.
 */
export const LEAST = 0.5;

// The kinds that stand in a wall because they open it: they keep the box the sketch gives them.
const IN_A_WALL = ['door', 'window'];
// How near a line of the grid a place lies that lies on it, in cells: a place that was worked
// out is off by its last figure, and is on the line all the same.
const HAIR_CELLS = 1e-9;
// The two level extents of a box, each with the faces of a cell that lie across it, as `pieces`
// names them: the face at the smaller count first.
const ACROSS = [
  ['x', 'x0', 'x1'],
  ['y', 'y0', 'y1'],
];

/** The line of the grid that a place lies on - a column, a row or a level - or null. */
const lineAt = (place) =>
  Math.abs(place - Math.round(place)) < HAIR_CELLS ? Math.round(place) : null;

/** The cells beside a middle: the one it lies in, or the two on either side of its line. */
function beside(middle) {
  const line = lineAt(middle);
  return line === null ? [Math.floor(middle)] : [line - 1, line];
}

/**
 * Where an object stands: `level`, the row of the standing papers that its floor lies on, and
 * the `columns` and the `rows` of the cells under its middle - one of each, and two where the
 * middle lies on a line of the grid, to a hair: the cells on both sides of that line. The cells
 * over its floor are those of `level - 1`. Null, where its floor lies on no line of the grid:
 * it stands on no level then - on the ground, as a rule.
 */
export function standing({ x, y, floor }) {
  const level = lineAt(floor);
  if (level === null) return null;
  return { level, columns: beside((x[0] + x[1]) / 2), rows: beside((y[0] + y[1]) / 2) };
}

/**
 * Where the clear space of a block ends on one side of a cell that the block holds, along one
 * extent - 0 is x, 1 is y - in metres: the block's own face on that side - 0 is the side of the
 * smaller count, 1 of the larger - moved in by the wall that stands on it, and by nothing where
 * none does. The line is followed box by box, for as long as a box of the same block goes on
 * beyond the last.
 */
function endOf(context, axis, cell, side) {
  const { things, space } = context;
  const [extent, ...faces] = ACROSS[axis];
  const lineOf = axis === 0 ? context.xOf : context.yOf;
  const beyond = [...cell];
  let own = space.who(...cell);
  let next = own;
  do {
    own = next;
    beyond[axis] = side === 0 ? things[own][extent][0] - 1 : things[own][extent][1];
    next = space.who(...beyond);
  } while (space.same(own, next));
  const within = [...beyond];
  within[axis] += side === 0 ? 1 : -1;
  // Metres count up with the columns and down with the rows: inward is up them, or down.
  const inward = (axis === 0) === (side === 0) ? 1 : -1;
  const line = side === 0 ? within[axis] : beyond[axis];
  return lineOf(line) + inward * wallOn(context, within, faces[side]);
}

/** Two ends along an extent, the side of the smaller count first, as `[from, to]` in metres. */
const reach = (axis, ends) => (axis === 0 ? ends : [ends[1], ends[0]]);

/**
 * The clear space of a room along one extent - 0 is x, 1 is y - on the line through a cell that
 * the room holds: `[from, to]` in metres, the faces of the two walls it lies between (`endOf`).
 */
const between = (context, axis, cell) =>
  reach(axis, [endOf(context, axis, cell, 0), endOf(context, axis, cell, 1)]);

/**
 * An object's reach along one extent, `[low, high]`, fitted into a clear space, `[from, to]`,
 * all in metres: as it is, where it stands clear; moved to the nearer face, where it is no
 * longer than the clear space; and where it is longer, the clear space itself - or `LEAST` of
 * its own length about the middle of the clear space, where that is more.
 */
function fit([low, high], [from, to]) {
  const long = high - low;
  const room = to - from;
  if (long > room + HAIR_M) {
    if (room >= LEAST * long) return [from, to];
    const [middle, half] = [(from + to) / 2, (LEAST * long) / 2];
    return [middle - half, middle + half];
  }
  if (low < from - HAIR_M) return [from, from + long];
  if (high > to + HAIR_M) return [to - long, to];
  return [low, high];
}

/**
 * The clear spaces of the room that an object stands in, along x and along y: for each of the
 * two a list of `[from, to]`, one for every line of cells that is asked - or null, where the
 * object stands in no room.
 *
 * Where the object's middle lies on a line of the grid, the cells on both sides of the line
 * are asked. All of them have to be one room's, or the object stands in none. And of the two
 * lines of cells that then run along its middle, each has a clear space of its own.
 */
function inRoom(context, thing) {
  const stands = IN_A_WALL.includes(thing.kind) ? null : standing(thing);
  if (stands === null) return null;
  const { space } = context;
  const { columns, rows } = stands;
  const over = stands.level - 1;
  const room = space.who(columns[0], rows[0], over);
  const held = (column, row) => space.same(room, space.who(column, row, over));
  if (space.asOf(room) !== ROOM) return null;
  if (!columns.every((column) => rows.every((row) => held(column, row)))) return null;
  const lines = [
    rows.map((row) => [columns[0], row, over]),
    columns.map((column) => [column, rows[0], over]),
  ];
  return lines.map((cells, axis) => cells.map((cell) => between(context, axis, cell)));
}

/**
 * The clear spaces of a flight that runs over more than one block, as `inRoom` gives those of
 * a room. `axis` and `lines` are its run's (flights.js). Along its length each line of cells
 * under it has one: from the wall behind its foot to the wall beyond its last step - the ends
 * of the blocks that hold the line's first cell and its last, on the sides away from the
 * flight. What stands between those two is not asked. Across, each place along it has one, the
 * block's that holds it there. Open air and glass have no wall, and end at their own faces.
 */
function alongRun(context, { axis, lines }) {
  const along = lines.map((line) =>
    reach(axis, [endOf(context, axis, line[0], 0), endOf(context, axis, line.at(-1), 1)]),
  );
  const across = lines[0].map((cell) => between(context, 1 - axis, cell));
  return axis === 0 ? [along, across] : [across, along];
}

/**
 * The box of an object, in metres, fitted into the clear space of its room: `{ min, max }`,
 * each `[x, y, h]`. `thing` is an object as the scene gets it, with its `kind` and its `floor`
 * (scene.js); `context` is what a rule gets (house.js).
 *
 * Along the plot and across it alike, several clear spaces may be asked - on the two lines of
 * cells beside a middle that lies on a line of the grid (`inRoom`), of the blocks that a flight
 * runs over (`alongRun`). The nearer wall holds on either side: the clear space is what they
 * all have in common.
 */
export function fitted(context, thing) {
  const whole = metres(context, thing);
  const run = runOf(context, thing);
  const clear = run === null ? inRoom(context, thing) : alongRun(context, run);
  if (clear === null) return whole;
  const [alongX, alongY] = clear.map((spaces, axis) => {
    const from = Math.max(...spaces.map((one) => one[0]));
    const to = Math.min(...spaces.map((one) => one[1]));
    return fit([whole.min[axis], whole.max[axis]], [from, to]);
  });
  return {
    min: [alongX[0], alongY[0], whole.min[2]],
    max: [alongX[1], alongY[1], whole.max[2]],
  };
}
