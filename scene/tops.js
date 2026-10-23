// The top of a block that slopes (story ST-026), said once for the rules that build under it:
// where a block's top lies, in metres; where it lies over a part of the block; and all that
// lies between some bottoms and some tops, as the fewest shapes that fill it - the one place
// where a part that slopes is made. A rule imports this module, and this module no rule. It
// imports its neighbour space.js alone, and names no global.
//
// A top slopes along one extent of the plot and runs level across the other (rule 3). An extent
// is 0, x, or 1, y, as a place has them. Seen across its extent a top is a LINE: `[h, h]`, its
// height in metres at the two ends of a rectangle along that extent - at `min[along]` and at
// `max[along]` - and straight between them. A level is a line too: one height, twice.
//
// A slope takes away from the top of a box, and adds nothing to it (rule 2): the box of a block
// stays the outer size of the house, and its top lies within it. So a rule builds a block as it
// did, and hands what it built to `filled`, with the top of its block among the tops.
import { metres } from './space.js';

/**
 * Two figures that are worked out in two ways differ by less than this, in metres: closer than
 * that two heights are one, and what is no higher, or no longer, is nothing.
 */
export const HAIR_M = 1e-9;

/**
 * A line at a share of the way between its two ends. At an end it is the figure it was handed,
 * and a level is that figure all the way: nothing is worked out where nothing has to be.
 */
const between = ([first, second], share) =>
  share === 1 ? second : first + (second - first) * share;

const isLevel = ([first, second]) => Math.abs(second - first) <= HAIR_M;
const isOne = (line, other) =>
  Math.abs(line[0] - other[0]) <= HAIR_M && Math.abs(line[1] - other[1]) <= HAIR_M;

/**
 * The top of a thing, where it slopes: `{ along, high }` in metres - `along` the extent it
 * slopes along, and `high` its height at `min[along]` and at `max[along]` of the thing's box
 * in metres (`metres`, space.js). Null where the top is level: where the thing says no `top`
 * (scene.js). `frame` is whatever has `xOf`, `yOf` and `hOf`: a rule's context is one.
 *
 * A thing says its top in rows of a standing view, at the first end of its box along the
 * top's axis and at the second. Rows count down the top view's paper and metres up: under `y`
 * the box's first end is its `max`. So a top is turned over here, once, as `metres` turns a box.
 */
export function topOf({ hOf }, thing) {
  if (thing.top === undefined) return null;
  const { axis, rows } = thing.top;
  const [first, second] = rows.map((row) => hOf(row));
  return axis === 'x' ? { along: 0, high: [first, second] } : { along: 1, high: [second, first] };
}

/**
 * A line said anew, at the two ends of a rectangle. `line` is `[h, h]` at `min[along]` and at
 * `max[along]` of `whole`; this is its height at those two of `{ min, max }`, on the same
 * straight line - within `whole`, and on past it. What `lineOver` is made of, and what a
 * solid and a slant are asked with (holds.js): of the two rectangles the heights are not read.
 */
export function lineAt(line, whole, along, { min, max }) {
  const [start, long] = [whole.min[along], whole.max[along] - whole.min[along]];
  return [min, max].map((corner) => between(line, (corner[along] - start) / long));
}

/**
 * The top of a thing over a rectangle within it, as a line along the top's own extent: its
 * height at `min[along]` and at `max[along]` of the rectangle, `[h, h]` in metres. Where the
 * top is level it is the top of the thing's box, twice. Of the rectangle the heights are not
 * read: a part of the block is one.
 */
export function lineOver(frame, thing, rectangle) {
  const [box, top] = [metres(frame, thing), topOf(frame, thing)];
  return top === null ? [box.max[2], box.max[2]] : lineAt(top.high, box, top.along, rectangle);
}

/**
 * All that lies over a rectangle seen from above - `{ min, max }`, of which the heights are
 * not read - over every one of the `bottoms` and under every one of the `tops`, as the fewest
 * shapes that fill it. What a rule builds with. `bottoms` and `tops` are lines along the extent
 * `along`, one of each at the least: `[h at min[along], h at max[along]]`. Where all of them are
 * levels, either extent serves.
 *
 * The rectangle is cut across that extent wherever the highest bottom or the lowest top passes
 * from one line to another, and where the two meet. Each piece is a shape as a part says one
 * (parts.js) - `{ shape: 'box', min, max }` where it is level above and below, and else
 * `{ shape: 'slant', min, max, along, low, high }` - and they come in their order along the
 * extent. A piece that is nowhere higher than a hair, or no longer than one, is left out: so
 * nothing is given where no bottom lies under a top.
 *
 * Of levels alone it gives the one box, with the figures it was handed and nothing worked out
 * of them: a rule that builds a level block through it gives the parts it gave.
 */
export function filled({ min, max }, along, bottoms, tops) {
  const reach = [min[along], max[along]];
  const long = reach[1] - reach[0];
  // Where two of the lines cross, as a share of the way: nowhere else can the highest bottom
  // or the lowest top pass to another line, and nowhere else can the two meet.
  const lines = [...bottoms, ...tops];
  const crossings = lines.flatMap(([a, b], first) =>
    lines
      .slice(first + 1)
      .flatMap(([c, d]) => ((a - c) * (b - d) < 0 ? [(a - c) / (a - c - (b - d))] : [])),
  );
  // A cut a hair from the one before it, or from the end, would cut off a piece of no length.
  const cuts = [0];
  for (const share of crossings.sort((one, other) => one - other)) {
    if ((share - cuts.at(-1)) * long > HAIR_M && (1 - share) * long > HAIR_M) cuts.push(share);
  }
  cuts.push(1);
  // Between two cuts no two lines cross: one bottom is the highest all the way, and one top
  // the lowest. Two stretches side by side are one piece where neither passes to another line
  // - other lines crossed there, further down or further up - unless the two meet between them.
  const stretches = [];
  cuts.slice(1).forEach((to, at) => {
    const middle = (cuts[at] + to) / 2;
    const most = (of, way) =>
      of.reduce((best, line) =>
        way * (between(line, middle) - between(best, middle)) > 0 ? line : best,
      );
    const [bottom, top] = [most(bottoms, 1), most(tops, -1)];
    const open = between(top, middle) > between(bottom, middle);
    const last = stretches.at(-1);
    if (last && last.open === open && isOne(last.bottom, bottom) && isOne(last.top, top)) {
      last.to = to;
    } else stretches.push({ from: cuts[at], to, bottom, top, open });
  });
  return stretches.flatMap(({ from, to, bottom, top }) => {
    const [low, high] = [bottom, top].map((line) => [between(line, from), between(line, to)]);
    const ends = [between(reach, from), between(reach, to)];
    if (ends[1] - ends[0] <= HAIR_M) return [];
    if (Math.max(high[0] - low[0], high[1] - low[1]) <= HAIR_M) return [];
    const corner = (of, end, h) => {
      const place = [of[0], of[1], h];
      place[along] = ends[end];
      return place;
    };
    const box = { min: corner(min, 0, Math.min(...low)), max: corner(max, 1, Math.max(...high)) };
    return isLevel(low) && isLevel(high)
      ? [{ shape: 'box', ...box }]
      : [{ shape: 'slant', ...box, along, low, high }];
  });
}
