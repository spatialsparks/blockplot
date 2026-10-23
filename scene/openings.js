// Openings: where a door or a window opens a wall, what is left of the wall around the opening,
// and the pane that a window's opening holds. The walls are walls.js's, which hands them over a
// stretch at a time and makes the parts of what is given back here. It imports its neighbour
// tops.js alone, and names no global.
//
// A STRETCH is a shape of wall before anything opens it, on one face of the box of a room:
// - `at`: the place of that box in `things`
// - `axis`: the extent it stands across - 0, x, or 1, y. It runs along the other one
// - `min`, `max`: its box, `[x, y, h]` in metres - under a top that slopes, the box around it
// - `along`, `head`: its head, as a line (tops.js) - the extent the head slopes along, which is
//   the one the wall runs along or the one it stands across, and `[h, h]`, how high the head
//   lies at `min[along]` and at `max[along]`. A level head is `max[2]`, twice. Its foot is
//   level, at `min[2]`: so a stretch is what `filled` gives, and a part of one is too
// - `plane`: where the face lies that it stands on, across, in metres
// - `wall`: from where to where the whole wall lies across, in metres. A wall thicker than a
//   cell is several stretches side by side where its floor or its roof differs, cell by cell
// - `shared`: whether it is half of a wall of two rooms, and `first`: whether its box begins
//   at that face - at its first column or its first row - and does not end there
// - `level`: the row its box stands on, and `floorM`: how thick the floor of its box is at the
//   wall, in metres, taken whole (`floorWhole`, slabs.js) - beside the opening of a staircase,
//   where no slab lies under the wall and the wall runs down, the floor's thickness all the same
//
// WHICH OBJECT OPENS WHICH WALL. A door and a window are read as they reach the scene, each a
// box in cells with a `turn` (scene.js). One meets a stretch where the face of that stretch
// runs through its box or along an edge of it, and its box, raised by `floorM` where it stands
// on the stretch's own level, reaches along the stretch and up it. Then:
// - a window opens what it meets of the walls that run along its length;
// - a door opens what it meets of the walls that run the way it closes - along the plot while
//   it is not turned or turned by a half, across it by a quarter and by three - and, where it
//   meets none of those, what it meets of the walls across them. So a door in a corner opens
//   one wall, the one its turn says;
// - where the walls that run a door's way lie along two opposite edges of its square, and none
//   runs through it - a door in a room as wide as itself - it opens those along the edge that
//   its leaf closes on, and leaves the others whole (`leafs`);
// - an opening ends where its wall ends: at the ends of the stretch, under its top, and where
//   a wall of the same room stands across it - in the corner of a room, a wall's thickness in;
// - an opening is a box, under a head that slopes too (story ST-026): it ends no higher than
//   the lowest place the head has along the opening's own width, and one that this leaves no
//   height is none. Beside it the wall has its own head; over it lies a lintel, up to the head,
//   and nothing where the two meet; and a window's pane is the box of its opening;
// - an object that opens a stretch is taken (`context.take`), and gives no part of its own.
//   One that opens nothing is left as it is, and nothing is said of it.
import { filled, lineAt } from './tops.js';

/** Two figures that are worked out in two ways differ by less than this, in metres. */
export const HAIR_M = 1e-9;
// A floor lies on a level where it is nearer to it than this, in cells.
const HAIR_CELLS = 1e-9;
/** How thick a pane is, in metres: a few centimetres, for the glass and the air in it. */
export const PANE_M = 0.04;

/** How far two spans reach into each other: nothing or less, where they do not. */
const overlap = (a, b, c, d) => Math.min(b, d) - Math.max(a, c);

/**
 * The hole that an object makes in a stretch, as far as the stretch reaches: `from` and `to`
 * along the wall, `low` and `high`, in metres - or null, where it does not meet the stretch.
 * `box` is the object's box in metres, and `floor` the row it stands on.
 */
function holeIn(stretch, box, floor) {
  const { axis, min, max, plane, level, floorM } = stretch;
  if (plane < box.min[axis] - HAIR_M || plane > box.max[axis] + HAIR_M) return null;
  const run = 1 - axis;
  const up = Math.abs(floor - level) < HAIR_CELLS ? floorM : 0;
  const hole = {
    from: Math.max(box.min[run], min[run]),
    to: Math.min(box.max[run], max[run]),
    low: Math.max(box.min[2] + up, min[2]),
    high: Math.min(box.max[2] + up, max[2]),
  };
  return hole.to - hole.from > HAIR_M && hole.high - hole.low > HAIR_M ? hole : null;
}

/**
 * A hole, ended where a wall of the same room stands across it: `beside` are the stretches of
 * the stretch's own box, and those of them that stand across the other extent and in the hole
 * take their end of it away. And then ended under the head of its stretch, at the lowest
 * place that the head has along what is left of the hole's width. Null, where nothing is left.
 */
function cleared(stretch, hole, beside) {
  const { axis, min, max } = stretch;
  const run = 1 - axis;
  let { from, to } = hole;
  for (const other of beside) {
    const stands =
      other.axis !== axis &&
      overlap(min[axis], max[axis], other.min[axis], other.max[axis]) > HAIR_M &&
      overlap(from, to, other.min[run], other.max[run]) > HAIR_M &&
      overlap(hole.low, hole.high, other.min[2], other.max[2]) > HAIR_M;
    if (!stands) continue;
    if (other.min[run] + other.max[run] < from + to) from = Math.max(from, other.max[run]);
    else to = Math.min(to, other.min[run]);
  }
  if (to - from <= HAIR_M) return null;
  const high = Math.min(hole.high, ...headOver(stretch, { from, to }));
  return high - hole.low > HAIR_M ? { ...hole, from, to, high } : null;
}

/**
 * Of the walls that run a door's way, which it meets, those it opens: all of them - but where
 * they lie along two opposite edges of its square and none runs through it, those along the
 * edge that its leaf closes on alone. `along` are the stretches it meets, each with its hole,
 * `box` its box in metres, and `own` the extent those walls stand across.
 *
 * The edge is the pad's to say, where it draws a door from above (`TOP.door` and `TURNS` of
 * shapes.js): down the paper while the door is not turned, and by quarters up the plot, up the
 * paper and down the plot. Across the walls that is the lower figure of the square, in metres,
 * until the door is turned by a half, and the higher one from there on.
 */
function leafs(along, box, own, turn) {
  const [low, high] = [box.min[own], box.max[own]].map((edge) =>
    along.filter(([stretch]) => Math.abs(stretch.plane - edge) <= HAIR_M),
  );
  const onBoth = low.length > 0 && high.length > 0;
  const through = along.length - low.length - high.length;
  if (!onBoth || through > 0) return along;
  return turn % 4 >= 2 ? high : low;
}

/**
 * The holes in the walls of a scene: for each stretch that something opens, its holes - each
 * `{ from, to, low, high, glass }`, `glass` where a window made it - in the order of the things
 * that made them. `rooms` has, for the place of every box of a room, the stretches of that box.
 * Every door and window that opens a stretch is taken.
 */
export function opened(context, rooms) {
  const { things, boxOf } = context;
  const all = [...rooms.values()].flat();
  const holes = new Map();
  things.forEach((thing, at) => {
    const glass = thing.kind === 'window';
    if (!glass && thing.kind !== 'door') return;
    const box = boxOf(thing);
    const met = [];
    for (const stretch of all) {
      const hole = holeIn(stretch, box, thing.floor);
      if (hole !== null) met.push([stretch, hole]);
    }
    // The walls that run its way stand across the plot's y, and by a quarter across its x.
    const own = thing.turn % 2 === 1 ? 0 : 1;
    const along = met.filter(([stretch]) => stretch.axis === own);
    const opens = glass ? along : along.length > 0 ? leafs(along, box, own, thing.turn) : met;
    for (const [stretch, hole] of opens) {
      const clear = cleared(stretch, hole, rooms.get(stretch.at));
      if (clear === null) continue;
      if (!holes.has(stretch)) holes.set(stretch, []);
      holes.get(stretch).push({ ...clear, glass });
      context.take(at);
    }
  });
  return holes;
}

/** A box of a stretch's own, but for where it lies along the wall, how high, and across. */
function boxed({ axis, min, max }, { from, to, low, high }, across = [min[axis], max[axis]]) {
  const [least, most] = [[...min], [...max]];
  [least[axis], most[axis]] = across;
  [least[1 - axis], most[1 - axis]] = [from, to];
  [least[2], most[2]] = [low, high];
  return { min: least, max: most };
}

/**
 * The head of a stretch over a part of its wall, from `from` to `to` along it: a line along
 * `stretch.along`, as the stretch says its own (`lineAt`, tops.js).
 */
const headOver = (stretch, part) =>
  lineAt(stretch.head, stretch, stretch.along, boxed(stretch, part));

/**
 * What is left of a stretch around its holes, each piece a shape as `filled` gives one
 * (tops.js) - a box, and under a head that slopes a slant: nothing is cut out of a shape
 * (story ST-024, rule 4). The stretch is cut along the wall wherever a hole begins or ends; a
 * strip beside the holes is one piece from the bottom to the head, and a strip that holes lie
 * in is the pieces under, between and over them - over them a lintel that ends under the
 * head, and is nothing where the head comes down to the hole. Strips next to each other that
 * are left alike are one. They come along the wall, the smaller x or y first, and in a strip
 * from the bottom up. Holes may lie in each other: what any of them opens is open.
 */
export function around(stretch, holes) {
  const { axis, min, max } = stretch;
  const run = 1 - axis;
  const ends = holes.flatMap((hole) => [hole.from, hole.to]);
  const cuts = [min[run], max[run], ...ends].sort((a, b) => a - b);
  const strips = [];
  cuts.slice(1).forEach((to, index) => {
    // Two cuts in one place, or a hair apart, have no strip between them.
    const from = cuts[index];
    if (to - from <= HAIR_M) return;
    const open = holes
      .filter((hole) => hole.from <= from + HAIR_M && hole.to >= to - HAIR_M)
      .sort((a, b) => a.low - b.low);
    const left = [];
    let low = min[2];
    for (const hole of open) {
      if (hole.low - low > HAIR_M) left.push([low, hole.low]);
      low = Math.max(low, hole.high);
    }
    if (max[2] - low > HAIR_M) left.push([low, max[2]]);
    const last = strips.at(-1);
    if (last !== undefined && String(last.left) === String(left)) last.to = to;
    else strips.push({ from, to, left });
  });
  return strips.flatMap(({ from, to, left }) =>
    left.flatMap(([low, high]) => {
      const tops = [[high, high], headOver(stretch, { from, to })];
      return filled(boxed(stretch, { from, to, low, high }), stretch.along, [[low, low]], tops);
    }),
  );
}

/**
 * From where to where across a stretch a pane lies, in metres, or null where it holds none.
 * In an outer wall the pane lies in the middle of the wall's thickness. Of a wall of two rooms
 * the middle is the face that the rooms share, and a part lies within its own block: so the
 * pane lies against that face, in the half of the room that begins there, and the other half
 * holds none - one pane to a wall. It is `PANE_M` thick, and ends where its stretch ends: a
 * pane is never thicker than its wall.
 */
function paneAcross({ axis, min, max, plane, wall, shared, first }) {
  if (shared && !first) return null;
  const middle = (wall[0] + wall[1] - PANE_M) / 2;
  const near = shared ? (plane === wall[0] ? plane : plane - PANE_M) : middle;
  const lies = [Math.max(near, min[axis]), Math.min(near + PANE_M, max[axis])];
  return lies[1] - lies[0] > HAIR_M ? lies : null;
}

/**
 * The panes of a stretch, each a box, `{ shape, min, max }`: one in every hole that a window
 * made, as wide and as high as the hole, in the order of the holes.
 */
export function panes(stretch, holes) {
  const across = paneAcross(stretch);
  if (across === null) return [];
  const pane = (hole) => ({ shape: 'box', ...boxed(stretch, hole, across) });
  return holes.filter((hole) => hole.glass).map(pane);
}
