// The scene of the sketch: what the sketch adds up to in space, on the ground of its plot, for a
// view in 3D to draw. Plain data in metres of the plot's own frame - x down the plot, y across
// it, h above sea level - worked out from the site and from the sketch's things as the pad
// places them, each a box in cells (`sketch.rect`). The scene has no rule of its own for where a
// thing lies. With the figures of the house it also gives the parts the house is built of, by
// the rules of parts.js. It imports its neighbours alone and names no global: all it needs comes
// as arguments.
import { partsOf } from './parts.js';
import { isBlock, metres } from './space.js';
import { topOf } from './tops.js';

/** The colour of a block that is see-through: open air or glass, until a block says which (ST-024). */
export const SEE_THROUGH = 'green';

/** Of a thing, what it has of these: a thing without a name has none in the scene either. */
const had = (thing, keys) =>
  Object.fromEntries(
    keys.filter((key) => thing[key] !== undefined).map((key) => [key, thing[key]]),
  );

/**
 * The pad's frame, of a site: where a column, a row of the top view and a row of a standing view
 * lie, in metres - and where a place lies on the top view's paper, in cells. A column counts down
 * the plot from `xFromM`. A row of the top view counts across the plot from `yToM` downward, and
 * a row of a standing view from the top of `sideM` downward: the higher up a paper, the larger
 * the y or the h. The one formula of where they lie: whoever needs it asks this (shows.js).
 */
export const frameOf = ({ cellM, xFromM, yToM, sideM }) => ({
  xOf: (column) => xFromM + column * cellM,
  yOf: (row) => yToM - row * cellM,
  hOf: (row) => sideM[1] - row * cellM,
  cellOf: ([x, y]) => [(x - xFromM) / cellM, (yToM - y) / cellM],
});

/**
 * A solid for each thing: its box, in metres. A block stands on the bottom of its box, an object
 * on its `floor`, which a sill may lie above. The boxes of one group are one block; a thing
 * without a group is a block of its own, and gets the first number that no group has and no
 * thing before it. Only a block is see-through: a tree is green, and solid. A block whose top
 * slopes says `top`, in metres (`topOf`, tops.js): its box is its box still, the outer size. A
 * thing's `section` and `gallery` stay on its solid where it says them, as its name does.
 */
function solidsOf(frame, things) {
  const groups = new Set(things.map((thing) => thing.group));
  let last = 0;
  const own = () => {
    do last += 1;
    while (groups.has(last));
    return last;
  };
  return things.map((thing) => {
    const block = isBlock(thing);
    const top = topOf(frame, thing);
    return {
      ...metres(frame, thing),
      ...(top === null ? {} : { top }),
      colour: block ? thing.colour.hex : thing.fill,
      ...had(thing, ['name', 'kind', 'turn', 'section', 'gallery']),
      block: thing.group ?? own(),
      floor: frame.hOf(block ? thing.z[1] : thing.floor),
      see: block && thing.colour.name === SEE_THROUGH ? 'through' : 'solid',
    };
  });
}

/**
 * The ground: the site's height at every grid point of the top view's paper - `heights`, a row
 * of the paper after another, from the top one down - where each column of them lies (`xs`) and
 * each row (`ys`), and for every cell whether ground is drawn there (`drawn`). None is drawn
 * where a block stands, whatever its height: the hill is cut out along the outline of the
 * blocks. An object stands on the ground, and cuts nothing out of it.
 *
 * A site says its ground in one of two ways. As text: `rowsCm`, a row of grid points a line,
 * each in centimetres over `baseM` - read here. Or as `heights`, such a grid itself, in metres
 * above sea level (story ST-027): then that grid is the ground - the very one, neither copied
 * nor written into - and no `rowsCm` is read, whether the site has one beside it or not.
 *
 * Or, where the sketch reaches past the plot's paper or the paper is large (ST-042), as `near`,
 * `far` and `at` (view3d/reach.js): near rectangles `{ rect, heights }`, `rect` in cells; far
 * squares `[c0, r0, c1, r1, h00, h10, h01, h11]`, two corners in cells and four heights; `at`,
 * the ground at a place of the paper. Then the ground is `{ near, far, paper }` - `near` a grid
 * as above of each near rectangle, its top left grid point at `rect`; `far` each far square
 * `[x0, y0, x1, y1, h00, h10, h01, h11]`, its corners in metres; `paper`, the plot's paper from
 * above, `{ min, max }` as [x, y].
 */
function groundOf(frame, { ground, xFromM, xToM, yFromM, yToM }, things) {
  const blocks = things.filter(isBlock);
  if (ground.near !== undefined) {
    const { xOf, yOf } = frame;
    const near = ground.near.map(({ rect, heights }) => gridOf(frame, heights, blocks, rect));
    const far = ground.far.map(([c0, r0, c1, r1, ...h]) => [
      xOf(c0),
      yOf(r0),
      xOf(c1),
      yOf(r1),
      ...h,
    ]);
    return { near, far, paper: { min: [xFromM, yFromM], max: [xToM, yToM] } };
  }
  const { baseM, rowsCm, heights: said } = ground;
  const heights = said ?? rowsCm.map((row) => row.split(' ').map((cm) => baseM + Number(cm) / 100));
  return gridOf(frame, heights, blocks, [0, 0]);
}

/** A grid of ground: its grid points' heights, its top left grid point at a column and a row of the paper. */
function gridOf({ xOf, yOf }, heights, blocks, [left, top]) {
  const stands =
    (column, row) =>
    ({ x, y }) =>
      x[0] < column + 1 && column < x[1] && y[0] < row + 1 && row < y[1];
  return {
    xs: heights[0].map((height, column) => xOf(left + column)),
    ys: heights.map((line, row) => yOf(top + row)),
    heights,
    drawn: heights
      .slice(1)
      .map((line, row) =>
        line.slice(1).map((height, column) => !blocks.some(stands(left + column, top + row))),
      ),
  };
}

/**
 * The ground at a place of the top view's paper, in metres above sea level: between the four
 * grid points around it, as the pad's slices have it (`paper.groundAt`). Off the paper, the
 * ground is as high as at the paper's edge.
 */
function heightAt(heights, column, row) {
  const [cols, rows] = [heights[0].length - 1, heights.length - 1];
  const within = (value, most) => Math.min(Math.max(value, 0), most);
  const [c, r] = [within(column, cols), within(row, rows)];
  const [c0, r0] = [Math.min(Math.floor(c), cols - 1), Math.min(Math.floor(r), rows - 1)];
  const along = (line) => line[c0] + (line[c0 + 1] - line[c0]) * (c - c0);
  return along(heights[r0]) + (along(heights[r0 + 1]) - along(heights[r0])) * (r - r0);
}

/**
 * The ground at a place of the top view's paper, of a site's ground and the scene's: of one grid,
 * `heightAt` of it; of near grids, `heightAt` of the one that holds the place - every block stands
 * in one - and elsewhere the paper's own, `at`.
 */
function groundAtOf(said, ground) {
  if (said.near === undefined) return (column, row) => heightAt(ground.heights, column, row);
  const holds = (column, row) => (_, at) => {
    const [left, top, right, bottom] = said.near[at].rect;
    return column >= left && column <= right && row >= top && row <= bottom;
  };
  return (column, row) => {
    const at = ground.near.findIndex(holds(column, row));
    if (at < 0) return said.at(column, row);
    const [left, top] = said.near[at].rect;
    return heightAt(ground.near[at].heights, column - left, row - top);
  };
}

/**
 * The parcel's outline, lying on the ground: a ring of points, the last one joined to the first.
 * An edge has a point where it starts and one wherever it crosses a line of the grid - so at
 * least one in every cell it runs through, and the outline follows the ground cell by cell.
 */
function outlineOf({ cellOf }, outline, groundAt) {
  const onGround = ([x, y]) => [x, y, groundAt(...cellOf([x, y]))];
  const edge = (from, to) => {
    const [a, b] = [cellOf(from), cellOf(to)];
    // How far along the edge each point lies, as a share of it.
    const shares = [0];
    for (const axis of [0, 1]) {
      const [low, high] = [Math.min(a[axis], b[axis]), Math.max(a[axis], b[axis])];
      for (let line = Math.floor(low) + 1; line < high; line += 1) {
        shares.push((line - a[axis]) / (b[axis] - a[axis]));
      }
    }
    const at = (share) => [0, 1].map((axis) => from[axis] + share * (to[axis] - from[axis]));
    // Through a grid point an edge crosses two lines at once: one point, not two.
    return [...new Set(shares)].sort((s, t) => s - t).map((share) => onGround(at(share)));
  };
  return outline.flatMap((from, index) => edge(from, outline[(index + 1) % outline.length]));
}

/** The lowest and the highest that some points reach, along x, y and h. */
const boxOf = (points) => {
  const reach = (pick, from) =>
    [0, 1, 2].map((axis) => points.reduce((most, point) => pick(most, point[axis]), from));
  return { min: reach(Math.min, Infinity), max: reach(Math.max, -Infinity) };
};

/**
 * The scene of a site and of a sketch's things. `site` is a `SITE` (site.js) - or one whose
 * `ground` also says `heights`: the ground as a grid, `heights[row][column]` in metres above
 * sea level at every grid point of the top view's paper, a row of that paper after another,
 * the top one first. Where a site says that, it is the ground, the very grid, and `rowsCm` is
 * not read (`groundOf`): so the scene stands on a ground that a sketch has shaped (story
 * ST-027), and knows nothing of what shaped it. Where it says none, the ground is read off
 * `rowsCm`, as ever.
 *
 * `things` are the sketch's things as the pad places them, each a box in cells - `x: [from, to]`
 * along the plot, `y: [from, to]` in rows of the top view, `z: [top, bottom]` in rows of a
 * standing view. A block also has `colour: { name, hex }`, and `name` and `group` where the
 * sketch has them, and may say `as`, what it counts as - 'room', 'open' or 'glass' - being a
 * room where it says nothing; an object has `kind`, `turn`, `fill` - its colour - and `floor`,
 * the row it stands on. Any thing may say two more words (story ST-033): `section`, the id of
 * the section it is in, a number, where it is in one; and `gallery`, the name of the group of the
 * pad's gallery an object is of - 'Kitchen', 'Garden' (`shapes.GROUPS`). Not `group`, which is a
 * block's. A thing that says neither is the thing it was.
 *
 * A block whose top slopes (story ST-026) says `top: { axis, rows }` - what the pad reads of its
 * box (`blocks.topOf`): `axis` is 'x' or 'y', the extent the top slopes along, and `rows` the
 * row of a standing view it lies in at the box's first end along that extent and at its second,
 * whole or not, within the box's `z`. A block whose top is level says no `top`, and an object
 * says none: every thing of a sketch with no slope is the thing it was.
 *
 * `figures` are the eight figures of the house, plain numbers in metres: `outerWallM`,
 * `innerWallM`, `floorSlabM`, `roofSlabM`, `railingHighM`, `doorHighM`, `windowHighM`,
 * `sillHighM`. It gives:
 * - `solids`, one for each thing, in their order: `min` and `max` as [x, y, h], `colour`, `name`,
 *   `block`, `kind` and `turn` of an object, `section` and `gallery` where the thing says them,
 *   `floor` in metres, and `see`: 'through' or 'solid'.
 *   Of a block whose top slopes also `top: { along, high }` (tops.js): the extent it slopes
 *   along, 0 for x and 1 for y, and its height in metres at `min[along]` and at `max[along]`.
 *   Its `min` and its `max` are its box as it was drawn, and no solid of a level block has it;
 * - `levels`: the floors that blocks stand on, in metres, from the top down, each once;
 * - `ground`: `xs`, `ys`, `heights` and `drawn` (see `groundOf`) - of a site that says
 *   `heights`, that very grid; of one that says `near`, `{ near, far, paper }` (ST-042);
 * - `outline`: the parcel's outline as points [x, y, h] on the ground;
 * - `box`: the `min` and `max` of all of it - solids, ground and outline - but the far squares:
 *   what the camera is fitted to and the sun lights;
 * - `parts`: what the house is built of and what stands in it, by the rules of parts.js, which
 *   says what a part is - and none, where no figures are given.
 * `rules` are the house's own unless a check tells it others (`partsOf`).
 */
export function sceneOf(site, things, figures, rules) {
  const frame = frameOf(site);
  const solids = solidsOf(frame, things);
  const ground = groundOf(frame, site, things);
  const groundAt = groundAtOf(site.ground, ground);
  const outline = outlineOf(frame, site.outline, groundAt);
  const floors = things.filter(isBlock).map((thing) => thing.z[1]);
  const levels = [...new Set(floors)].sort((a, b) => a - b).map((row) => frame.hOf(row));
  const grid = (ground.near ?? [ground]).flatMap(({ xs, ys, heights }) =>
    ys.flatMap((y, row) => xs.map((x, column) => [x, y, heights[row][column]])),
  );
  const corners = solids.flatMap((solid) => [solid.min, solid.max]);
  const parts = figures ? partsOf({ ...frame, groundAt, things, figures, solids }, rules) : [];
  return { solids, levels, ground, outline, box: boxOf([...corners, ...outline, ...grid]), parts };
}
