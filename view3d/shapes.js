// The shapes a part of the scene can have, as points and triangles: a box; for what is round
// and for a tread of a spiral staircase alone, an upright cylinder, a ball, a dome and a slice
// of a ring; and for what slopes, a slant (scene/parts.js says what each is). Arithmetic in the
// plot's own frame - x down the plot, y across it, h up, in metres: where a shape lies is its
// part's to say, and nothing is worked out here but its faces. Every shape is closed, and
// every triangle runs against the clock for one who looks at it from outside: a shape that
// casts a shadow has to be both. No three.js and no page: it imports nothing, and names no
// global.

/** How many flat pieces a round shape is made of, all the way around it. */
export const ROUND = 24;
// How many of them a ball has from its lowest point to its highest, and a dome from its foot.
const [BALL_HIGH, DOME_HIGH] = [ROUND / 2, ROUND / 4];
const TURN = 2 * Math.PI;
const [UP, DOWN] = [
  [0, 0, 1],
  [0, 0, -1],
];

/**
 * What a shape is written into: `{ positions, normals, indices }` - three numbers a point,
 * `[x, y, h]`; for each point the way its face looks there, of length one; and three points a
 * triangle, each by its place among the points - with the three ways to write into it.
 */
function written() {
  const [positions, normals, indices] = [[], [], []];
  /** So many points in a row, each `[where, the way its face looks there]`: the place of the first. */
  const row = (count, pointAt) => {
    const first = positions.length / 3;
    for (let at = 0; at < count; at += 1) {
      const [where, looks] = pointAt(at);
      positions.push(...where);
      normals.push(...looks);
    }
    return first;
  };
  /**
   * The face between two rows of so many points: for one who looks at it from outside, the
   * second row lies to the left of the way the first one runs. `closed`, the rows are rings.
   */
  const band = (first, second, count, closed = false) => {
    for (let at = 0; at < (closed ? count : count - 1); at += 1) {
      const next = (at + 1) % count;
      indices.push(first + at, first + next, second + next);
      indices.push(first + at, second + next, second + at);
    }
  };
  /** The flat face inside a ring of so many points, which runs against the clock seen from outside. */
  const fan = (first, count) => {
    for (let at = 1; at < count - 1; at += 1) indices.push(first, first + at, first + at + 1);
  };
  return { shape: { positions, normals, indices }, row, band, fan };
}

/** A vector of length one that points the way this one does. */
const one = (vector) => {
  const long = Math.hypot(...vector);
  return vector.map((value) => value / long);
};

/** The middle of a box seen from above, and how far it reaches from there along x and y. */
const acrossOf = ({ min, max }) => ({
  middle: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2],
  reach: [(max[0] - min[0]) / 2, (max[1] - min[1]) / 2],
});

/** A box: six faces of four points each, from `min` to `max`. */
function box({ min, max }) {
  const { shape, row, band } = written();
  const ends = [min, max];
  for (const axis of [0, 1, 2]) {
    // The two extents a face lies along, in the order that turns to the face's own: x, y, h.
    const [along, up] = [(axis + 1) % 3, (axis + 2) % 3];
    for (const side of [0, 1]) {
      const looks = [0, 0, 0];
      looks[axis] = side === 0 ? -1 : 1;
      const edge = (high) =>
        row(2, (at) => {
          const where = [0, 0, 0];
          [where[axis], where[along], where[up]] = [
            ends[side][axis],
            ends[at][along],
            ends[high][up],
          ];
          return [where, looks];
        });
      // Seen from outside, the far face runs one way round and the near one the other.
      const [first, second] = side === 1 ? [edge(0), edge(1)] : [edge(1), edge(0)];
      band(first, second, 2);
    }
  }
  return shape;
}

/**
 * The rings of a round shape that stands in a box and fills it from side to side: `ring(h,
 * looks, way, wide)` writes one at a height - `ROUND` points, against the clock seen from above,
 * or with it where `way` is -1, at the share `wide` of how far the box reaches - each with the
 * way its face looks there: what `looks` says of the cosine and the sine of the point's angle.
 */
function ringsOf(part, row) {
  const { middle, reach } = acrossOf(part);
  return (h, looks, way = 1, wide = 1) =>
    row(ROUND, (at) => {
      const angle = (way * TURN * at) / ROUND;
      const [across, along] = [Math.cos(angle), Math.sin(angle)];
      const where = [middle[0] + wide * reach[0] * across, middle[1] + wide * reach[1] * along, h];
      return [where, looks(across, along)];
    });
}

/** An upright cylinder: as wide and as deep as its box, from the bottom of it to its top. */
function round(part) {
  const { shape, row, band, fan } = written();
  const ring = ringsOf(part, row);
  const { reach } = acrossOf(part);
  const [foot, top] = [part.min[2], part.max[2]];
  const outward = (across, along) => one([across / reach[0], along / reach[1], 0]);
  band(ring(foot, outward), ring(top, outward), ROUND, true);
  fan(
    ring(top, () => UP),
    ROUND,
  );
  fan(
    ring(foot, () => DOWN, -1),
    ROUND,
  );
  return shape;
}

/**
 * A ball, or its upper half: the rings of a ball that is `high` from its middle to its top, the
 * middle at `from`, each joined to the one under it. There are `rings` of them over the first,
 * which lies `lowest` quarter turns up from the middle - -1 is the foot of a ball, where a ring
 * is one point, and 0 its middle - and the last is the top, one point too.
 */
function rounded(part, from, high, rings, lowest) {
  const into = written();
  const { row, band } = into;
  const ring = ringsOf(part, row);
  const { reach } = acrossOf(part);
  let below = null;
  for (let at = 0; at <= rings; at += 1) {
    const angle = (lowest + ((1 - lowest) * at) / rings) * (TURN / 4);
    const [wide, up] = [Math.cos(angle), Math.sin(angle)];
    const looks = (across, along) =>
      one([(wide * across) / reach[0], (wide * along) / reach[1], up / high]);
    const here = ring(from + high * up, looks, 1, wide);
    if (below !== null) band(below, here, ROUND, true);
    below = here;
  }
  return into;
}

/** A ball: it fills its box from side to side, and from its bottom to its top. */
function ball(part) {
  const high = (part.max[2] - part.min[2]) / 2;
  return rounded(part, part.min[2] + high, high, BALL_HIGH, -1).shape;
}

/** A dome: the upper half of a ball, as high as its box, standing on the bottom of it - and closed below. */
function dome(part) {
  const foot = part.min[2];
  const { shape, row, fan } = rounded(part, foot, part.max[2] - foot, DOME_HIGH, 0);
  fan(
    ringsOf(part, row)(foot, () => DOWN, -1),
    ROUND,
  );
  return shape;
}

/**
 * A wedge: a slice of a ring about `about`, from the angle `from` to the angle `to` - degrees,
 * counted from the plot's x towards its y - between `inner` and `outer` metres from there, and
 * as high as its box. Its two bent faces are of flat pieces, one for every `ROUND`th of a turn
 * or part of it.
 */
function wedge({ min, max, about, from, to, inner, outer }) {
  const { shape, row, band } = written();
  const [low, high] = [Math.min(from, to), Math.max(from, to)].map((deg) => (deg * TURN) / 360);
  const pieces = Math.max(1, Math.ceil(((high - low) / TURN) * ROUND - 1e-9));
  const [foot, top] = [min[2], max[2]];
  const wayAt = (at) => {
    const angle = low + ((high - low) * at) / pieces;
    return [Math.cos(angle), Math.sin(angle)];
  };
  /** A row of points along the bend, so far from the middle and so high, each looking one way. */
  const bend = (far, h, looks) =>
    row(pieces + 1, (at) => {
      const [across, along] = wayAt(at);
      return [[about[0] + far * across, about[1] + far * along, h], looks(across, along)];
    });
  const outward = (across, along) => [across, along, 0];
  const inward = (across, along) => [-across, -along, 0];
  band(bend(outer, foot, outward), bend(outer, top, outward), pieces + 1);
  band(bend(inner, top, inward), bend(inner, foot, inward), pieces + 1);
  band(
    bend(outer, top, () => UP),
    bend(inner, top, () => UP),
    pieces + 1,
  );
  band(
    bend(inner, foot, () => DOWN),
    bend(outer, foot, () => DOWN),
    pieces + 1,
  );
  // The two flat ends: each looks along the ring, away from the slice.
  for (const [at, turn] of [
    [0, -1],
    [pieces, 1],
  ]) {
    const [across, along] = wayAt(at);
    const looks = [-turn * along, turn * across, 0];
    const edge = (h) =>
      row(2, (end) => {
        const far = end === 0 ? inner : outer;
        return [[about[0] + far * across, about[1] + far * along, h], looks];
      });
    const [first, second] = turn < 0 ? [edge(foot), edge(top)] : [edge(top), edge(foot)];
    band(first, second, 2);
  }
  return shape;
}

/**
 * A slant: all that lies over the rectangle of its box between its bottom and its top, two
 * planes that each rise or fall along the extent `along` - 0, x, or 1, y - and run level across
 * the other: `low` and `high` are their heights at `min[along]` and at `max[along]`. Eight
 * corners and six faces of four points, as a box has them; its top and its bottom each look
 * square off their own plane. Where it comes down to an edge, the face at that end has no size.
 */
function slant({ min, max, along, low, high }) {
  const { shape, row, fan } = written();
  const [ends, across] = [[min, max], 1 - along];
  /** A corner, by three figures: its end along the slope, its side across it, and 1 on the top. */
  const corner = (named) => {
    const [end, side, top] = [...named].map(Number);
    const where = [0, 0, (top ? high : low)[end]];
    [where[along], where[across]] = [ends[end][along], ends[side][across]];
    return where;
  };
  // A face is a ring of four corners, against the clock seen from outside where the slope runs
  // along x. Along y the slant is the mirror image of that one, and its rings run the other way.
  const face = (ring, looks) => {
    const corners = ring.split(' ').map(corner);
    if (along === 1) corners.reverse();
    const first = row(4, (at) => [corners[at], looks]);
    fan(first, 4);
  };
  /** The way a plane looks that is as high as a line at the two ends: square off it, up or down. */
  const off = (line, up) => {
    const looks = [0, 0, up * (max[along] - min[along])];
    looks[along] = up * (line[0] - line[1]);
    return one(looks);
  };
  const out = (axis, sign) => [0, 1, 2].map((extent) => (extent === axis ? sign : 0));
  // The top and the bottom, the two ends along the slope, and the two sides across it.
  face('001 101 111 011', off(high, 1));
  face('000 010 110 100', off(low, -1));
  face('000 001 011 010', out(along, -1));
  face('100 110 111 101', out(along, 1));
  face('000 100 101 001', out(across, -1));
  face('010 011 111 110', out(across, 1));
  return shape;
}

/** The shape of each word a part can say (`SHAPES` of scene/parts.js). */
const DRAWN = { box, round, ball, dome, wedge, slant };
/** The shapes that are drawn: every one a part can have. */
export const SHAPES = Object.keys(DRAWN);

/**
 * The shape of a part, in the plot's frame: `{ positions, normals, indices }` - three numbers a
 * point, `[x, y, h]` in metres; for each point the way its face looks there, of length one; and
 * three points a triangle, against the clock seen from outside.
 */
export const shapeOf = (part) => DRAWN[part.shape](part);
