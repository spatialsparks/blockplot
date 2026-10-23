// The steps of a staircase: a straight flight as boxes one can count, and a spiral one as treads
// round a post (story ST-024) - the rules of the kinds of flight (`FLIGHTS`, flights.js) and of
// `spiral`, for objects.js. It imports its neighbour and names no global.
//
// HOW MANY. A staircase is as high as its box, and that is its kind's: one storey of 3 m (the
// pad's shapes.js). It has the fewest steps of which none rises more than `RISE_M`, all of one
// rise, and the last is as high as the staircase. A flight that says a length of its own, `long`
// (story ST-037), has as many as the whole number nearest (2 x height + long) / `STRIDE_M`, at
// the least two - by its own long and not its box's, so a flight its room cuts (clear.js) keeps
// its count. The pad says the rule a second time (`shapes.stepsOf`, stairs.js), and
// flight-steps.check.js holds the two to one count at every size. Its treads share its box's
// length. Every part is lifted onto the slab of its floor (objects.js): so the last step is level
// with the floor above, where that storey is as high as the staircase and its floor as thick. How many steps the pad draws on its paper -
// nine of a flight, twelve of a spiral one - is not how many there are.
//
// WHICH WAY. A flight climbs the way the pad's top view draws its arrow, and a spiral one winds
// as that view draws it: `TOP.stairs`, `TOP.spiral` and `TURNS` of shapes.js. In the scene it is
// said a second time: of a flight in flights.js (`climbOf`), of a spiral one here. steps.check.js
// has the pad draw both at every quarter, and fails where the two differ: who changes one
// changes the other.
//
// OPEN UNDERNEATH (story ST-026). A flight that runs on over a room that is not its own
// (flights.js) is open there: a step is its rise and `SOFFIT_M` thick, and the room's space is
// what is under the steps. Over its own room and over what is no room it is solid, as it was.
import { FLIGHTS, UNDER, climbOf, quartersOf, runOf } from './flights.js';

/**
 * The most a step rises, in metres: a staircase has the fewest steps of which none rises more -
 * sixteen of 0.1875 m in a storey of 3 m. A common figure for the stairs of a home, as the sizes
 * of the pad's kinds are common ones: it is read off no building rule, and is none (ST-005).
 */
export const RISE_M = 0.19;
/**
 * Twice a rise and a going, in metres, of a flight with a length of its own: 0.63 m, a common
 * figure of comfort, read off no building rule, and none (ST-037: rule 3 is comfort, not law).
 * The pad's stairs.js says it a second time; whoever changes one changes the other.
 */
export const STRIDE_M = 0.63;
/**
 * How thick the slab is that a step has under its rise where the flight is open underneath, in
 * metres: an eighth of a metre. A step there is a box of its rise and this, and no deeper; two
 * steps that follow each other meet over this height, so the flight is one piece. A common
 * figure for a flight of concrete, read off no building rule, and no setting.
 */
export const SOFFIT_M = 0.125;
// A height that was worked out is off by its last figure. Within this share of a rise, a height
// is a whole number of rises: ten rises hold ten steps, and not eleven.
const HAIR_RISES = 1e-9;
// And two places that are worked out in two ways differ by less than this, in metres.
const HAIR_M = 1e-9;
// The post of a spiral staircase, as the pad draws it: so much of the staircase's width across -
// 0.2 m of 2 m - and as high as the staircase.
const POST_WIDE = 0.1;
// Where the first tread of a spiral staircase begins while it is not turned: at the uphill side,
// in degrees as a wedge counts them (parts.js).
const UPHILL_DEG = 180;
// What a staircase is made of. A flight is of concrete, as a flight is that is solid down to its
// foot - and so it shows on a floor of wood, the commonest. A spiral one is of metal, its post
// too: a post of another surface would lie in the boxes of the treads round it (holds.js).
// First values, as the colours of the surfaces are.
const [FLIGHT, SPIRAL] = ['concrete', 'metal'];

/** How many steps a height in metres holds: the fewest of which none rises more than `RISE_M`. */
const stepsIn = (high) => Math.ceil(high / RISE_M - HAIR_RISES);

/**
 * How many steps a flight of a height in metres has: by its own `long` where it says one - the
 * whole number nearest (2 x height + long) / `STRIDE_M`, at the least two - else `stepsIn`.
 */
const flightSteps = ({ long }, high) =>
  typeof long === 'number' ? Math.max(2, Math.round((2 * high + long) / STRIDE_M)) : stepsIn(high);

/**
 * A place a share of the way on between two. Two steps that meet in a place work it out alike,
 * and so have one number for it: they touch, with no gap and neither in the other.
 */
const between = (first, second, share) => first + (second - first) * share;

/**
 * A step's tread, parted where the flight begins or ceases to be open underneath: its pieces in
 * the order the flight climbs, each `[low, high, open]` - from where to where along the flight,
 * in metres, and whether a room lies under it there. `edges` are where the tread begins and
 * ends, and `open` the reaches along the flight over a room under it, each `[low, high]`. A
 * tread that lies over one of the two alone is one piece, and so is one over two rooms under it
 * that meet: a step is parted only where solid meets open.
 */
function parted(edges, open) {
  const [low, high] = [Math.min(...edges), Math.max(...edges)];
  const cuts = open.flat().filter((place) => place - low > HAIR_M && high - place > HAIR_M);
  const places = [low, ...cuts.sort((a, b) => a - b), high];
  const pieces = [];
  places.slice(1).forEach((to, nth) => {
    const [from, last] = [places[nth], pieces.at(-1)];
    const middle = (from + to) / 2;
    const under = open.some((reach) => reach[0] < middle && middle < reach[1]);
    if (to - from <= HAIR_M) return;
    if (last !== undefined && last[2] === under) last[1] = to;
    else pieces.push([from, to, under]);
  });
  return edges[0] < edges[1] ? pieces : pieces.reverse();
}

/**
 * A staircase: a straight flight of steps, each a box as wide as the flight and one tread deep
 * that stands on the foot of the staircase and is a rise higher than the step before it - the
 * first a rise high, the last as high as the staircase. Side by side, they fill its box.
 *
 * Where the flight runs over a room under it (`runOf`, flights.js) a step does not reach down
 * to the foot: it is its rise and `SOFFIT_M` thick, and never lower than the foot. A step that
 * lies over both is two parts of one top, parted where the two meet - the one nearer the foot
 * first: so a flight has as many steps as its parts have tops, and may have a part more.
 */
function stairs(context, at) {
  const thing = context.things[at];
  const { min, max } = context.boxOf(thing);
  const [run, larger] = climbOf(thing);
  const [begins, ends] = larger ? [min[run], max[run]] : [max[run], min[run]];
  const count = flightSteps(thing, max[2] - min[2]);
  const under = (runOf(context, thing)?.over ?? []).filter(({ is }) => is === UNDER);
  const open = under.map(({ from, to }) => [Math.min(from, to), Math.max(from, to)]);
  return Array.from({ length: count }, (_, before) => {
    const edges = [before, before + 1].map((nth) => between(begins, ends, nth / count));
    const top = between(min[2], max[2], (before + 1) / count);
    const slab = Math.max(min[2], between(min[2], max[2], before / count) - SOFFIT_M);
    return parted(edges, open).map(([from, to, hollow]) => {
      const [low, high] = [[...min], [...max]];
      [low[run], high[run]] = [from, to];
      [low[2], high[2]] = [hollow ? slab : min[2], top];
      return { of: 'step', shape: 'box', min: low, max: high, surface: FLIGHT };
    });
  }).flat();
}

/**
 * How high the underside of the flight at a place lies over a reach along its length, `[low,
 * high]` in metres: the bottom of the lowest of its steps that lie over the reach, lifted as the
 * flight is (parts.js) - the foot of the flight, where a step reaches down to it. `Infinity`,
 * where none of its steps lies over the reach. A wall across a flight ends under it (walls.js).
 */
export function soffit(context, at, [low, high]) {
  const [run] = climbOf(context.things[at]);
  const over = stairs(context, at).filter(
    (step) => Math.min(step.max[run], high) - Math.max(step.min[run], low) > HAIR_M,
  );
  return Math.min(...over.map((step) => step.min[2])) + context.lift(at);
}

/** The way an angle points, in degrees as a wedge counts them: [along x, along y], one long. */
function wayAt(deg) {
  const angle = (deg * Math.PI) / 180;
  return [Math.cos(angle), Math.sin(angle)];
}

/**
 * The box around a slice of a ring seen from above: its `min` and its `max`, each [x, y]. A slice
 * reaches furthest at one of its four corners, or where its outer bend crosses a way along an
 * axis.
 */
function around(about, [from, to], inner, outer) {
  const [low, high] = [Math.min(from, to), Math.max(from, to)];
  const reach = [low, high].flatMap((deg) => [inner, outer].map((far) => [far, wayAt(deg)]));
  for (let deg = 90 * Math.ceil(low / 90); deg <= high; deg += 90) reach.push([outer, wayAt(deg)]);
  const most = (pick, axis) => about[axis] + pick(...reach.map(([far, way]) => far * way[axis]));
  return [Math.min, Math.max].map((pick) => [most(pick, 0), most(pick, 1)]);
}

/**
 * A spiral staircase: a post, round and as high as the staircase, in the middle of its box, and
 * treads round it - as many as a flight of its height has steps. Each tread is a wedge a rise
 * thick, from the post out to the nearer sides of the box, whose top lies as many rises up as
 * the tread counts: the first lies on the foot of the staircase, and the top of the last is the
 * staircase's. They wind once, clockwise seen from above: each begins where the one before it
 * ends, the first at the uphill side - and a quarter on for every quarter the staircase is
 * turned by. `from` is where a tread begins and `to` where it ends, in degrees that count down
 * past nought and on: the last tread ends a whole turn after the first began.
 */
function spiral(context, at) {
  const thing = context.things[at];
  const { min, max } = context.boxOf(thing);
  const about = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2];
  const outer = Math.min(max[0] - min[0], max[1] - min[1]) / 2;
  const inner = POST_WIDE * outer;
  const count = stepsIn(max[2] - min[2]);
  const first = UPHILL_DEG - 90 * quartersOf(thing);
  const beginsAt = (nth) => first - (360 * nth) / count;
  const highAt = (nth) => between(min[2], max[2], nth / count);
  const post = {
    of: 'piece',
    shape: 'round',
    min: [about[0] - inner, about[1] - inner, min[2]],
    max: [about[0] + inner, about[1] + inner, max[2]],
    surface: SPIRAL,
  };
  const treads = Array.from({ length: count }, (_, before) => {
    const [from, to] = [beginsAt(before), beginsAt(before + 1)];
    const [low, high] = around(about, [from, to], inner, outer);
    return {
      of: 'step',
      shape: 'wedge',
      min: [...low, highAt(before)],
      max: [...high, highAt(before + 1)],
      surface: SPIRAL,
      about: [...about],
      from,
      to,
      inner,
      outer,
    };
  });
  return [post, ...treads];
}

/**
 * The rule of each kind of staircase: for `KINDS` of objects.js, which lifts their parts. Every
 * kind of flight has the one rule of a flight.
 */
export const steps = { ...Object.fromEntries(FLIGHTS.map((kind) => [kind, stairs])), spiral };
