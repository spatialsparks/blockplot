// Walls: a rule of blocks (house.js). The box of a room has a wall on each of its four upright
// faces, by what lies beyond the face - faces.js says which, and how thick, for the slabs too:
// - a box of its own block: none - a room is a block, and has no wall inside it;
// - another room: half of an inner wall, `innerWallM / 2` thick. The room beyond makes the
//   other half, so a wall of two rooms is two parts that meet in the face;
// - all else - nothing, the ground, open air, glass: an outer wall, `outerWallM` thick. So a
//   wall between a room and open air is the room's, and a room that is dug into the hill has
//   its outer walls against the earth.
// A wall lies inside its box, on the face and inward of it: the blocks stay the outer size of
// the house (story ST-024, rule 2). It is never thicker than half of what its box is wide
// there. It stands on the floor slab where its box has one under it, and ends under the roof
// slab where it has one over it; else it runs to the bottom and to the top of its box - so the
// walls of a block two storeys high run through, and a wall under another block meets that
// block's floor. Open air and glass get no wall here. A wall is plaster.
//
// Where a door or a window opens a wall, the wall is what is left around the opening, and a
// window's opening holds a pane of glass: openings.js says which object opens what.
//
// A wall across a flight ends under the steps (story ST-026). Where a flight runs over two
// blocks, one after the other (flights.js), a wall that stands in the face between them stands
// under the flight alone, over the width of the flight as it is fitted: up to the underside of
// the step over it, and no higher. So the wall of a room under the flight closes that room
// under the steps; the wall of the flight's own room, where a step reaches down to the foot, is
// not there at all - between two stair rooms no wall crosses the flight; and beside the flight
// a wall is whole. It is so before anything opens it: a door drawn into the wall under a flight
// opens it as far as the wall reaches.
//
// UNDER A TOP THAT SLOPES (story ST-026; tops.js) a wall stands on its floor as it did, and ends
// under the roof: at the top less the roof's thickness where its box has a roof over it, and at
// the top itself where it has none - under another block, under a flight. Every stretch is what
// `filled` gives of it: a wall along the slope has a head that slopes, a wall across it - at
// the high end, at the low end - one that slopes across its own thickness, and where the top
// leaves a wall no height there is none. Where a flight and a slope both end a wall, the lower
// ends it. A level block has the walls it had, to the last figure.
//
// And the question the rule asks of a cell, for whoever builds up to a wall - what stands in a
// room ends at the faces of its walls: `wallOn(context, cell, face)`. It knows of no flight, as
// it knows of no opening and of no slope. It imports its neighbours and names no global.
import { EXTENTS, FACES, INNER, OUTER, WALL, thickOf, toward } from './faces.js';
import { crossing } from './flights.js';
import { HAIR_M, around, opened, panes } from './openings.js';
import { floorUnder, floorWhole, roofOver } from './slabs.js';
import { ROOM, pieces } from './space.js';
import { soffit } from './steps.js';
import { filled, lineAt, lineOver, topOf } from './tops.js';

/**
 * How thick a wall stands on an upright face of a cell, in metres - and nothing, 0, where none
 * does. `cell` is `[column, row, level]`, and `face` is `x0`, `x1`, `y0` or `y1`: the face of
 * the cell up the plot, down the plot, up the top view's paper or down it, as `pieces` names
 * the faces of a box. A wall stands there where a room holds the cell and no box of the same
 * block holds the cell beyond the face; it lies in the cell and inward of the face, as thick
 * as the rule makes it: an outer wall, half an inner one, never more than half the box.
 *
 * It says how thick, and not how high: on its face a wall stands between the slabs of its box,
 * which `floorUnder` and `roofOver` tell of, and a door or a window may open it.
 */
export function wallOn(context, cell, face) {
  const { space } = context;
  const at = space.who(...cell);
  if (space.asOf(at) !== ROOM) return 0;
  const [axis, side] = FACES[face];
  const beyond = [...cell];
  beyond[axis] += side === 0 ? -1 : 1;
  const kind = toward(context, at, beyond);
  return kind === null ? 0 : thickOf(context, at, axis)[kind];
}

/**
 * One face of the box at a place, as the rule reads it: its `word`; the extent it lies across,
 * `axis`, and at which end, `side`; the line of the grid it lies on, `line`, and where that is
 * in metres, `plane`; the box in metres, `whole`, and the row it stands on, `level`; how thick
 * each kind of wall is there, `thick`; `depth(cells)`, how far inside the face the line of the
 * grid lies that is so many cells in, in metres; `span(near, far)`, from where to where
 * across the box a wall lies that begins so far inside the face and ends so far; and the top
 * of the box (tops.js) - `along`, the extent it slopes along, or where it is level the one the
 * face runs along, and `top(rectangle)`, where it lies over a part of the box, a line along that.
 */
function faceOf(context, at, word) {
  const { things, boxOf, xOf, yOf } = context;
  const [axis, side] = FACES[word];
  const line = things[at][EXTENTS[axis]][side];
  const lineOf = axis === 0 ? xOf : yOf;
  const plane = lineOf(line);
  // Metres count up with the columns and down with the rows: inward is up them, or down.
  const up = (axis === 0) === (side === 0);
  return {
    at,
    word,
    axis,
    side,
    line,
    plane,
    whole: boxOf(things[at]),
    level: things[at].z[1],
    thick: thickOf(context, at, axis),
    depth: (cells) => Math.abs(lineOf(side === 0 ? line + cells : line - cells) - plane),
    span: (near, far) => (up ? [plane + near, plane + far] : [plane - far, plane - near]),
    along: topOf(context, things[at])?.along ?? 1 - axis,
    top: (rectangle) => lineOver(context, things[at], rectangle),
  };
}

/**
 * A face cut into pieces by the wall that each of its squares has, and by the slabs that wall
 * stands on and under, in the order `pieces` gives them: each `{ flat, kind, slabs, floorM }` -
 * the piece in metres, INNER or OUTER, and lane by lane how thick a floor lies under the wall
 * there and how thick a roof over it. A lane is a cell's width of the wall, counted inward: a
 * wall that is thicker than a cell stands over two, and may have a floor under one alone.
 * `floorM` is how thick the box's floor is at the wall, taken whole (`floorWhole`): beside a
 * staircase's opening the wall runs down, and a door in it is still raised to the floor.
 */
function cut(context, face) {
  const { things, space, boxOf } = context;
  const { at, axis, side, line, thick, depth } = face;
  const box = things[at];
  const cellIn = (run, lane, level) => {
    const deep = side === 0 ? line + lane : line - 1 - lane;
    return axis === 0 ? [deep, run, level] : [run, deep, level];
  };
  const own = (asked, cell) => (space.who(...cell) === at ? asked(context, cell) : 0);
  // A square's word says all of that. It is the same up a run of the face, and worked out once.
  const words = { [INNER]: new Map(), [OUTER]: new Map() };
  const told = new Map();
  const wordOf = (kind, run) => {
    const known = words[kind].get(run);
    if (known !== undefined) return known;
    // A wall as thick as a cell, to a hair, stands in one lane: a cell is its width to a hair.
    const lanes = Math.ceil(thick[kind] / depth(1) - HAIR_M);
    const slabs = Array.from({ length: lanes }, (none, lane) => [
      own(floorUnder, cellIn(run, lane, box.z[1] - 1)),
      own(roofOver, cellIn(run, lane, box.z[0])),
    ]);
    // Where a slab lies it is the whole floor: only where none does is the whole one asked for.
    const floorM = slabs[0][0] || own(floorWhole, cellIn(run, 0, box.z[1] - 1));
    const word = `${kind} ${floorM} ${slabs.join(' ')}`;
    told.set(word, { kind, slabs, floorM });
    words[kind].set(run, word);
    return word;
  };
  // Of two blocks drawn into each other the later holds the cell: a box has a wall only on the
  // cells it holds.
  return pieces(box, face.word, (within, beyond) => {
    const kind = space.who(...within) === at ? toward(context, at, beyond) : null;
    return kind === null ? null : wordOf(kind, within[1 - axis]);
  }).map((piece) => ({ flat: boxOf(piece), ...told.get(piece.word) }));
}

/**
 * A rectangle of a stretch as `filled` makes it (tops.js): all that lies over it, over the
 * level `low` and under every line of `tops` - a stretch for each piece, with the box around
 * the piece and its `head`. None, where the lines leave it no height.
 */
const headed = (stretch, { min, max }, low, tops) =>
  filled({ min, max }, stretch.along, [[low, low]], tops).map((shape) => ({
    ...stretch,
    min: shape.min,
    max: shape.max,
    head: shape.high ?? [shape.max[2], shape.max[2]],
  }));

/**
 * The stretches of one piece of a face, from the face inward: each a shape of wall before
 * anything opens it (openings.js says what a stretch has). A piece is one stretch - or, where
 * its slabs differ from lane to lane, one for each run of lanes that are alike, so that no
 * wall stands in a slab and none hangs over one. It stands between the slabs - under a top
 * that slopes, under the top less the roof that its box has over it there - and is none where
 * they leave it no height. Where the top passes under the piece's own, it is two: a box and a
 * slant along the slope, or side by side across the wall's thickness.
 */
function stretches(face, { flat, kind, slabs, floorM }) {
  const { at, axis, side, plane, whole, level, thick, depth, span, along, top } = face;
  const runs = [];
  slabs.forEach((slab, lane) => {
    if (lane > 0 && String(slab) === String(slabs[lane - 1])) runs.at(-1)[1] = lane + 1;
    else runs.push([lane, lane + 1]);
  });
  return runs.flatMap(([begun, ended]) => {
    const low = Math.max(flat.min[2], whole.min[2] + slabs[begun][0]);
    const [min, max] = [[...flat.min], [...flat.max]];
    [min[axis], max[axis]] = span(depth(begun), Math.min(depth(ended), thick[kind]));
    const under = top({ min, max }).map((h) => h - slabs[begun][1]);
    const wall = span(0, thick[kind]);
    const [shared, first] = [kind === INNER, side === 0];
    const stretch = { at, axis, plane, wall, shared, first, level, floorM, along };
    return headed(stretch, { min, max }, low, [[flat.max[2], flat.max[2]], under]);
  });
}

/**
 * A stretch as the flights leave it that cross its face (`crossing`, flights.js): itself, where
 * none does. A flight that does - whose box, as it is fitted, reaches along the stretch, and as
 * the sketch has it, up it - parts the stretch along the wall where the flight begins and ends.
 * Beside the flight it is whole. Under the flight it ends under the lowest step that lies over
 * its thickness (`soffit`, steps.js), and is none where that step reaches down to the foot of
 * the flight, or lower than the wall begins. A stretch that ends under the flight as it is, is
 * left as it is. Each part keeps the head it had, and under the flight ends under the lower of
 * the two: a part is what `filled` gives of it.
 */
function underFlights(context, stretch) {
  const { things, boxOf } = context;
  const { at, axis, plane } = stretch;
  const run = 1 - axis;
  return crossing(context, at, axis, plane).reduce(
    (left, flight) => {
      const box = boxOf(things[flight.at]);
      return left.flatMap((one) => {
        const from = Math.max(one.min[run], box.min[run]);
        const to = Math.min(one.max[run], box.max[run]);
        const up = Math.min(one.max[2], box.max[2]) - Math.max(one.min[2], box.min[2]);
        const meets = to - from > HAIR_M && up > HAIR_M;
        const top = meets ? soffit(context, flight.at, [one.min[axis], one.max[axis]]) : Infinity;
        if (top >= one.max[2]) return [one];
        const part = (begins, ends, ...lower) => {
          const [min, max] = [[...one.min], [...one.max]];
          [min[run], max[run]] = [begins, ends];
          const head = lineAt(one.head, one, one.along, { min, max });
          return headed(one, { min, max }, one.min[2], [head, ...lower]);
        };
        return [
          ...part(one.min[run], from),
          ...part(from, to, [top, top]),
          ...part(to, one.max[run]),
        ];
      });
    },
    [stretch],
  );
}

// What the rule works out of a scene, once: for the box of every room its stretches of wall,
// face by face, and for every stretch the holes in it. A rule is asked box by box, and a door
// in a corner has to know every wall it meets before it opens one: so the first box that is
// asked has the whole house worked out, and that is kept for as long as the scene's context is.
const worked = new WeakMap();

function houseOf(context) {
  if (!worked.has(context)) {
    const rooms = new Map();
    context.things.forEach((thing, at) => {
      if (context.space.asOf(at) !== ROOM) return;
      const faces = Object.keys(FACES).map((word) => faceOf(context, at, word));
      rooms.set(
        at,
        faces
          .flatMap((face) => cut(context, face).flatMap((piece) => stretches(face, piece)))
          .flatMap((stretch) => underFlights(context, stretch)),
      );
    });
    worked.set(context, { rooms, holes: opened(context, rooms) });
  }
  return worked.get(context);
}

/**
 * The walls of the box at a place, and the panes in them: nothing, of open air and of glass.
 * They come face by face - `x0`, `x1`, `y0`, `y1` - and of a face stretch by stretch: what is
 * left of the stretch around its openings (`around`), and after it the panes that it holds
 * (`panes`), each the shape it is given as: a box, or under a head that slopes a slant. Every
 * door and window that opens a wall of the scene is taken.
 */
export function walls(context, at) {
  const { rooms, holes } = houseOf(context);
  const part = (of, surface) => (shape) => ({ of, ...shape, surface });
  return (rooms.get(at) ?? []).flatMap((stretch) => {
    const open = holes.get(stretch) ?? [];
    return [
      ...around(stretch, open).map(part('wall', WALL)),
      ...panes(stretch, open).map(part('pane', 'glass')),
    ];
  });
}
