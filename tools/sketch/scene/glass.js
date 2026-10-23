// Glass: a rule of blocks (house.js). The box of a block that counts as glass has no wall and
// no roof slab: panes in thin frames close it.
// - On each of its four upright faces, by what lies beyond the face: a room, or glass - a box
//   of its own block, or another block of glass: nothing. The room has its wall there, and
//   glass beside glass is one house of glass. Nothing at all, the ground, or open air: a pane
//   in a frame, on the floor slab where the box has one under it, up to the top of the box.
// - On its top, wherever no block lies over it: a pane lying flat, in a frame. All of that is
//   `over`: it closes the block, and a cut at its level takes it off (cut.js).
//
// HOW A FRAME IS LAID. A frame is of metal, of members `FRAME_M` square, and lies inside the
// box: on the face and inward of it, under the top and down. Two members run along the whole
// of its rectangle - at the foot and at the head of a standing one; at the edges up the plot
// and down it of a lying one. Between those two stand the posts - of a roof, the bars, which
// run down the plot: one at either end, and so many between that no bay is wider than
// `FRAME_EVERY_M`, the bays all of one width. A post between two bays stands astride the line
// between them. A pane of glass, `PANE_M` thick, fills each bay, in the middle of the
// members' depth. The glass lies between the members and not in them: they are two surfaces,
// and touch. Frames that meet - in a corner, and a wall's head with a roof's edge - lie in
// each other, which one surface may.
//
// A rectangle is as `pieces` cuts it: a face is several where what lies beyond it changes,
// and where its floor does. One too low for two members has them meet in its middle, with no
// post and no pane.
//
// UNDER A TOP THAT SLOPES (story ST-026, tops.js) every rectangle is laid as it was - where it
// was, with the bays it had and a post where one stood - and each of its parts is what lies
// of it under the top, as `filled` gives it: a box where it is level above and below, a slant
// where it is not, and nothing where the top leaves it no height. A depth is measured
// straight down and a width level: no member is thicker or wider for a slope.
// - A standing rectangle keeps the member at its foot. The member at its head lies under the
//   top and follows it, as deep as it was; the posts and the panes stand on the foot member
//   and end under the head. Along a face that the top falls along, all of that slopes. The
//   face at the high end and the one at the low end are as high as the top is there, and
//   their heads slope across their own depth.
// - The rectangle on the top lies on the slope: its members hang `FRAME_M` deep under the top
//   and its panes in the middle of that depth, all `over`. Its bars run down the plot still:
//   along a top that falls down the plot or up it, and level across one that falls across -
//   there the two long members are the ones that slope.
// - Nothing of glass lies in the floor slab: where the top comes down to the floor, a part
//   ends on the slab. A member is as thick as its rectangle had it, so where the top leaves
//   less than two of them the head of a face lies in its foot. And at the low end of a block
//   that comes down to its floor stands nothing, neither a face nor the roof's member along
//   it: the roof ends on the floor, and the slab goes on beyond it as it was. Such a roof is
//   cut where its floor changes, as a face is; one that comes down to no floor is one
//   rectangle, whatever lies under it.
// It imports its neighbours and names no global.
import { HAIR_M, PANE_M } from './openings.js';
import { floorUnder } from './slabs.js';
import { GLASS, OPEN, pieces } from './space.js';
import { filled, lineOver, topOf } from './tops.js';

/** How wide and how deep a member of a frame is, in metres: it is square, and thin. */
export const FRAME_M = 0.05;
/** How wide a bay of a frame is at most, in metres: a post, or a bar, every so far. */
export const FRAME_EVERY_M = 1;

// The upright faces of a box, as `pieces` names them: which extent each lies across - 0, x,
// or 1, y, as a place has them - and at which of that extent's two figures.
const FACES = { x0: [0, 0], x1: [0, 1], y0: [1, 0], y1: [1, 1] };

// A height as a line (tops.js): a level is one height twice, and a line so far under another
// is that line, let down.
const level = (height) => [height, height];
const under = (line, far) => line.map((height) => height - far);

/**
 * Where the posts of a frame stand along its rectangle - of a roof, the bars: one at either
 * end, inside the edge, and so many between that no bay is wider than `FRAME_EVERY_M`, the
 * bays all of one width. A post between two bays stands astride the line between them.
 */
function postsOf(along) {
  // A rectangle as wide as a bay may be, to a hair, is one bay.
  const bays = Math.ceil((along[1] - along[0]) / FRAME_EVERY_M - HAIR_M);
  const wide = (along[1] - along[0]) / bays;
  return Array.from({ length: bays + 1 }, (none, at) => {
    if (at === 0) return [along[0], along[0] + FRAME_M];
    if (at === bays) return [along[1] - FRAME_M, along[1]];
    const line = along[0] + at * wide;
    return [line - FRAME_M / 2, line + FRAME_M / 2];
  });
}

/**
 * A pane in its frame, standing: the parts of one rectangle of a face. `top` says the top of
 * the block: `along`, the extent it slopes along, and `line(rectangle)`, where it lies over a
 * rectangle seen from above (tops.js). `axis` is the extent the face lies across - 0, x, or
 * 1, y - `across` where the frame lies across it, `run` where the rectangle lies along the
 * face, and `low` and `high` from where to where it stands, all in metres.
 *
 * The rectangle ends under its own top and under the block's, whichever is the lower, and one
 * that its floor leaves no height is nothing. Its parts come as the member at the foot and
 * the one at the head; the posts, along the rectangle; and the panes, one for each bay - each
 * as the pieces `filled` makes of it, in their order along the slope.
 */
function stood(top, axis, across, run, [low, high]) {
  if (high - low <= HAIR_M) return [];
  // A rectangle seen from above: so deep across the face, and so wide along it.
  const seen = (deep, wide) => {
    const [min, max] = [[], []];
    [min[axis], max[axis]] = deep;
    [min[1 - axis], max[1 - axis]] = wide;
    return { min, max };
  };
  // A part: all that lies over a rectangle, over some bottoms and under some tops (tops.js).
  const part = (of, surface, at, ...lines) =>
    filled(at, top.along, ...lines).map((shape) => ({ of, ...shape, surface }));
  const whole = seen(across, run);
  const tops = [level(high), top.line(whole)];
  // A member is never thicker than half of what its rectangle is high: the two meet.
  const thick = Math.min(FRAME_M, (high - low) / 2);
  const sill = level(low + thick);
  const foot = part('frame', 'metal', whole, [level(low)], [sill, ...tops]);
  // The head hangs under the lower of the two tops: stretch by stretch, under the one line
  // that is the top there, and no further down than the floor.
  const head = filled(whole, top.along, [level(low)], tops).flatMap((stretch) => {
    const edge = stretch.shape === 'slant' ? stretch.high : level(stretch.max[2]);
    return part('frame', 'metal', stretch, [under(edge, thick), level(low)], [edge]);
  });
  // What stands between the two members: on the one at the foot, and under the one at the head.
  const between = (of, surface, at) =>
    part(of, surface, at, [sill], [level(high - thick), under(top.line(at), thick)]);
  const posts = postsOf(run);
  const middle = (across[0] + across[1]) / 2;
  const glass = [middle - PANE_M / 2, middle + PANE_M / 2];
  return [
    ...foot,
    ...head,
    ...posts.flatMap((post) => between('frame', 'metal', seen(across, post))),
    ...posts
      .slice(1)
      .flatMap((post, bay) => between('pane', 'glass', seen(glass, [posts[bay][1], post[0]]))),
  ];
}

/**
 * A pane in its frame, lying on the top of the block: the parts of one rectangle of its roof,
 * all `over`. `top` is as `stood` gets it. `run` is where the rectangle lies across the plot,
 * and `reach` where it lies down the plot, in metres; `floor` is how far down it may come, in
 * metres above sea level: the top of the floor slab it comes down to, or the bottom of its box.
 *
 * Every part hangs under the top and follows it - a member `FRAME_M` deep, a pane in the
 * middle of that depth - and ends on the floor, where the top comes down to it. They come as
 * the two long members, which run across the plot, the one up the plot first; the bars, which
 * run down the plot; and the panes, one for each bay - each as the pieces `filled` makes of it.
 */
function lain(top, run, reach, floor) {
  const seen = (down, across) => ({ min: [down[0], across[0]], max: [down[1], across[1]] });
  // A part over a rectangle: `deep` says where it lies under a top of some height, as the
  // height of its bottom and of its top.
  const part = (of, surface, at, deep) => {
    const hung = top.line(at).map(deep);
    const [bottom, upper] = [0, 1].map((side) => hung.map((heights) => heights[side]));
    return filled(at, top.along, [bottom, level(floor)], [upper]).map((shape) => ({
      of,
      ...shape,
      surface,
      over: true,
    }));
  };
  const member = (height) => [height - FRAME_M, height];
  const pane = (height) => {
    const middle = (height - FRAME_M + height) / 2;
    return [middle - PANE_M / 2, middle + PANE_M / 2];
  };
  // A member is never wider than half of what its rectangle is long: the two meet.
  const thick = Math.min(FRAME_M, (reach[1] - reach[0]) / 2);
  const between = [reach[0] + thick, reach[1] - thick];
  const edges = [
    [reach[0], between[0]],
    [between[1], reach[1]],
  ];
  const long = edges.flatMap((edge) => part('frame', 'metal', seen(edge, run), member));
  if (between[1] - between[0] <= HAIR_M) return long;
  const bars = postsOf(run);
  return [
    ...long,
    ...bars.flatMap((bar) => part('frame', 'metal', seen(between, bar), member)),
    ...bars
      .slice(1)
      .flatMap((bar, bay) => part('pane', 'glass', seen(between, [bars[bay][1], bar[0]]), pane)),
  ];
}

/**
 * The panes and the frames of the box at a place: nothing, of a room and of open air. First
 * the standing ones, face by face - `x0`, `x1`, `y0`, `y1` - and of a face rectangle by
 * rectangle, as `stood` gives each; then the lying ones, which are `over`, as `lain` does.
 */
export function glass(context, at) {
  const { things, space, boxOf } = context;
  if (space.asOf(at) !== GLASS) return [];
  const box = things[at];
  const whole = boxOf(box);
  // The top of the box, for what is built under it. Where it is level, either extent serves.
  const slope = topOf(context, box);
  const top = { along: slope?.along ?? 0, line: (seen) => lineOver(context, box, seen) };
  // Of two blocks drawn into each other the later holds the cell: a box has glass only on the
  // cells it holds.
  const own = (cell) => space.who(...cell) === at;
  // How thick a floor the box has under a cell of its own, at its foot, in metres: 0 for none.
  const floorAt = ([column, row]) => {
    const foot = [column, row, box.z[1] - 1];
    return own(foot) ? floorUnder(context, foot) : 0;
  };
  // What a square of a face says: how thick a floor the box has under it at the face, in
  // metres - 0 for none - where a pane stands in it, and nothing where none does.
  const pane = (within, beyond) => {
    const other = space.who(...beyond);
    return !own(within) || (other >= 0 && space.asOf(other) !== OPEN) ? null : floorAt(within);
  };
  const standing = Object.entries(FACES).flatMap(([face, [axis, side]]) =>
    pieces(box, face, pane).flatMap(({ word: floorM, ...cells }) => {
      const { min, max } = boxOf(cells);
      const low = Math.max(min[2], whole.min[2] + floorM);
      // Metres count up with the columns and down with the rows: inward is up them, or down.
      const up = (axis === 0) === (side === 0);
      const across = up ? [min[axis], min[axis] + FRAME_M] : [min[axis] - FRAME_M, min[axis]];
      const run = 1 - axis;
      return stood(top, axis, across, [min[run], max[run]], [low, max[2]]);
    }),
  );
  // Whether the roof comes down to a floor so thick: whether its frame, `FRAME_M` deep under
  // the top where that lies lowest, reaches into the slab. Never under a level top: that roof
  // is the one rectangle it was, and asks no floor.
  const downTo = (floorM) =>
    slope !== null && Math.min(...slope.high) - FRAME_M < whole.min[2] + floorM;
  // What a square of the top says, where a roof lies on it: how thick a floor that roof comes
  // down to there, in metres - 0 where it comes down to none - and nothing where a block lies
  // over the square.
  const roof = (within, beyond) => {
    if (!own(within) || space.who(...beyond) >= 0) return null;
    const floorM = floorAt(within);
    return downTo(floorM) ? floorM : 0;
  };
  const lying = pieces(box, 'z0', roof).flatMap(({ word: floorM, ...cells }) => {
    const { min, max } = boxOf(cells);
    return lain(top, [min[1], max[1]], [min[0], max[0]], whole.min[2] + floorM);
  });
  return [...standing, ...lying];
}
