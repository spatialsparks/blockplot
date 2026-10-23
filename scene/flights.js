// Flights: what a straight flight of stairs runs over, said once for the rules that ask - the box
// it is fitted into (clear.js), its steps (steps.js), a wall that stands across it (walls.js) and
// the roof of a room under it (slabs.js). A rule imports this module, and this module no rule:
// what four of them share can be none's. It imports its neighbour and names no global.
//
// A flight is one thing (story ST-026, rule 5): what it runs over does not cut it. It is an object
// of a kind of `FLIGHTS`, and climbs along its length, away from its foot - the end where the
// pad's arrow begins, its lowest step (`climbOf`).
//
// WHAT IT RUNS OVER is read off the cells of its footprint as the sketch has it, and not as
// clear.js fits it, on the storey it stands on: the cells over its floor. Place by place along
// its length, from its foot on, the block that holds them:
// - its OWN room is the room under its foot, and with it every room it runs over whose name
//   begins with the word for a staircase (`STAIR`). There the flight stands as it always did:
//   solid to its foot;
// - a room UNDER it is every other room it runs over, named or not. There it is open underneath,
//   and the room's space is what is under the steps;
// - open air and glass are neither: a flight stands in them as it did.
// Only a flight that runs over more than one block has a run. One that stands on one block alone
// has that block for its room, whatever it is called, and nothing lies under it: it stands as it
// stood. So does a flight on no level - on the ground, as a rule - one with a cell of its
// footprint that no block holds, and one that two blocks hold side by side across its width:
// such a flight runs along a wall and not over one, and the rule has nothing to say of it.
import { ROOM } from './space.js';

/**
 * The kinds that are a straight flight: the staircase, a metre wide, and the wide one, a metre
 * and a half. A kind of another width is one word more here: it gets the steps of a flight
 * (steps.js), the opening in the floor above (slabs.js) and all that is said here.
 */
export const FLIGHTS = ['stairs', 'widestairs'];
/**
 * The word that the name of a staircase begins with. A block is a staircase where its name
 * begins with it, without regard to capitals and to blank space before it: "Staircase", "Stair
 * room", "stairs to the cellar". A name that holds the word further on is a room's: "Storage
 * under the stairs", "Understairs" and "Upstairs hall" lie under a flight that runs over them.
 */
export const STAIR = 'stair';
/** What a room is to a flight that runs over it: its own, or a room under it. */
export const OWN = 'own';
export const UNDER = 'under';

// How near a line of the grid a place lies that lies on it, in cells: a place that was worked
// out is off by its last figure, and is on the line all the same.
const HAIR_CELLS = 1e-9;
// And in metres: two figures that are worked out in two ways differ by less than this.
const HAIR_M = 1e-9;
// The way a flight climbs at each quarter it is turned by: along which extent of its box - 0 is
// x, down the plot, and 1 is y, across it - and whether towards the larger. Not turned, it climbs
// down the plot; then, a quarter on with each, clockwise seen from above: towards the smaller y,
// up the plot, towards the larger y. The pad says it first, where it draws the arrow
// (`TOP.stairs` and `TURNS` of shapes.js): steps.check.js fails where the two differ.
const CLIMBS = [
  [0, true],
  [1, false],
  [0, false],
  [1, true],
];
// What the rule works out of a scene, once: every flight that has a run, and the cells that have
// a flight for their ceiling. It is kept for as long as the scene's context is, and not on it.
const worked = new WeakMap();

/** How many quarters an object is turned by, none to three: four of them are none. */
export const quartersOf = ({ turn }) => ((turn % 4) + 4) % 4;

/**
 * The way a flight climbs: `[run, larger]` - the extent of its box that it climbs along, 0 or 1,
 * and whether towards the larger figure, in metres. Its foot is at the other end.
 */
export const climbOf = (thing) => CLIMBS[quartersOf(thing)];

/** The columns, or the rows, that an extent of a thing stands in, wholly or in part. */
function countsOf([first, last]) {
  const counts = [];
  for (let count = Math.floor(first + HAIR_CELLS); count < last - HAIR_CELLS; count += 1) {
    counts.push(count);
  }
  return counts;
}

/**
 * The run of a flight: what it runs over - or null, where it has none (the head says when).
 * `thing` is an object as the scene gets it, and `context` what a rule gets (house.js). A run is
 * - `axis`: the extent the flight climbs along, 0 or 1;
 * - `lines`: the cells under it, a line of them along its length for each cell of its width,
 *   each line in the order of the cells and each cell `[column, row, level]`;
 * - `over`: the blocks it runs over, from its foot on, one for each stretch of its length that
 *   one block holds - a block that it meets twice is there twice. Each is `{ at, is, from, to,
 *   cells }`: the place of a box of that block; `OWN`, `UNDER` or null, for what is no room;
 *   where the stretch begins and ends along the flight, in metres, on lines of the grid; and
 *   the cells of the stretch. The first begins nowhere and the last ends nowhere, as far as the
 *   figures go - `Infinity`, one of them under nought: a flight that was moved a little off its
 *   cells (clear.js) still stands over the first block at its foot, and over the last at its top.
 */
export function runOf(context, thing) {
  const floor = Math.round(thing.floor);
  if (!FLIGHTS.includes(thing.kind) || !(Math.abs(thing.floor - floor) < HAIR_CELLS)) return null;
  const { space } = context;
  const [axis, larger] = climbOf(thing);
  const [columns, rows] = [countsOf(thing.x), countsOf(thing.y)];
  const [far, wide] = axis === 0 ? [columns, rows] : [rows, columns];
  const cell = (along, across) => (axis === 0 ? [along, across] : [across, along]);
  const lines = wide.map((across) => far.map((along) => [...cell(along, across), floor - 1]));
  // The block under each place along it: one for all of its width, or none.
  const held = far.map((along, nth) => {
    const at = space.who(...lines[0][nth]);
    return lines.every((line) => space.same(at, space.who(...line[nth]))) ? at : -1;
  });
  if (held.includes(-1)) return null;
  // Metres count up with the columns and down with the rows: it climbs as its cells count, or
  // against them.
  const up = (axis === 0) === larger;
  const lineOf = axis === 0 ? context.xOf : context.yOf;
  const named = (at) => space.nameOf(at).trimStart().toLowerCase().startsWith(STAIR);
  const over = [];
  for (const nth of up ? far.keys() : [...far.keys()].reverse()) {
    const [at, last] = [held[nth], over.at(-1)];
    const [begins, ends] = up ? [far[nth], far[nth] + 1] : [far[nth] + 1, far[nth]];
    const cells = lines.map((line) => line[nth]);
    if (last !== undefined && space.same(last.at, at)) {
      last.to = lineOf(ends);
      last.cells.push(...cells);
      continue;
    }
    const own = over.length === 0 || space.same(over[0].at, at) || named(at);
    const is = space.asOf(at) !== ROOM ? null : own ? OWN : UNDER;
    over.push({ at, is, from: lineOf(begins), to: lineOf(ends), cells });
  }
  if (over.length < 2) return null;
  const beyond = larger ? Infinity : -Infinity;
  over[0].from = -beyond;
  over.at(-1).to = beyond;
  return { axis, lines, over };
}

/**
 * The flights of a scene that have a run, each its run with `at`, the place of the flight in
 * `things` - and the cells that have a flight for their ceiling (`flightOver`).
 */
function flightsOf(context) {
  if (!worked.has(context)) {
    const { things, space } = context;
    const runs = [];
    const ceilings = new Set();
    things.forEach((thing, at) => {
      const run = runOf(context, thing);
      if (run === null) return;
      runs.push({ ...run, at });
      const top = Math.ceil(thing.z[0] - HAIR_CELLS);
      for (const block of run.over.filter(({ is }) => is === UNDER)) {
        for (const [column, row, lowest] of block.cells) {
          for (let level = top; level <= lowest; level += 1) {
            if (space.same(block.at, space.who(column, row, level))) {
              ceilings.add(`${column} ${row} ${level}`);
            }
          }
        }
      }
    });
    worked.set(context, { runs, ceilings });
  }
  return worked.get(context);
}

/**
 * The flights that cross a face of the box at a place: each as its run, with `at`, the place of
 * the flight. `axis` is the extent the face lies across, 0 or 1, and `plane` where it lies, in
 * metres. A flight crosses it where it climbs along that extent and two blocks that it runs
 * over, one after the other, meet in that plane - one of them the block of the box. Where along
 * the face the flight is, and how high, the caller asks of its box.
 */
export function crossing(context, at, axis, plane) {
  const { space } = context;
  const meets = ({ over }) =>
    over.some(
      (block, nth) =>
        nth > 0 &&
        Math.abs(block.from - plane) < HAIR_M &&
        (space.same(at, block.at) || space.same(at, over[nth - 1].at)),
    );
  return flightsOf(context).runs.filter((run) => run.axis === axis && meets(run));
}

/**
 * Whether a cell has a flight for its ceiling: a room under a flight holds it, it lies in a
 * column of cells that the flight runs over, and on a level of the flight's own box - from the
 * flight's floor up to where its box ends. Over such a cell a room has no roof (slabs.js). A
 * room that is higher than the flight has its roof over the flight all the same: nothing comes
 * up to it. `cell` is `[column, row, level]`.
 */
export const flightOver = (context, [column, row, level]) =>
  flightsOf(context).ceilings.has(`${column} ${row} ${level}`);
