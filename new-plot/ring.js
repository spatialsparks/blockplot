// The outline of a polygon (ST-045, T-045.2): of its parts, each a list of rings, the outer
// first, the part whose outer ring encloses the most, its outer ring as corners - a corner that
// repeats the one before it taken as one, the corner that closes the ring taken off - and what
// was left out, in words. One computation for a ring (directive 32), which a parcel read
// (parcel.js, the cadastre's) and a GeoJSON file's reader (geojson.js) use, in Blockplot's tree. It
// refuses nothing: how few or how many corners are too few or too many is its caller's
// sentence. No page, no request, no clock and no global. ring.check.js holds it by hand.
import { enclosed } from './frame.js';

// What is said, each sentence written here once.
const square = (m2) => `${Math.round(m2)} m²`;
const SAID = Object.freeze({
  parts: (count, m2) =>
    count === 2
      ? `The largest of its 2 parts is marked; the other, ${square(m2)}, is left out.`
      : `The largest of its ${count} parts is marked; the other ${count - 1}, ${square(m2)} in all, are left out.`,
  holes: (count, m2) =>
    count === 1
      ? `Its hole of ${square(m2)} is not left out of the plot.`
      : `Its ${count} holes, ${square(m2)} in all, are not left out of the plot.`,
});

/**
 * A ring's corners as they are given: a corner that repeats the one before it taken as one, and
 * the corner that closes the ring, a repeat of the first, taken off. Nothing rounded.
 */
function cornersOf(ring) {
  const same = (one, other) => one[0] === other[0] && one[1] === other[1];
  const corners = ring.filter((corner, at) => at === 0 || !same(corner, ring[at - 1]));
  if (corners.length > 1 && same(corners[0], corners.at(-1))) corners.pop();
  return corners.map(([e, n]) => [e, n]);
}

/** The area a ring encloses, in square metres - `enclosed`, its figures from its first corner. */
function areaOf(ring) {
  const [e0, n0] = ring[0];
  return enclosed(cornersOf(ring).map(([e, n]) => [e - e0, n - n0]));
}

/** What was left out of the part marked, in words - or empty: the parts' sentence first. */
function leftOf(parts, marked) {
  const sum = (rings) => rings.reduce((all, ring) => all + areaOf(ring), 0);
  const others = parts.filter((part) => part !== marked).map((part) => part[0]);
  const holes = marked.slice(1);
  return [
    others.length > 0 ? SAID.parts(parts.length, sum(others)) : '',
    holes.length > 0 ? SAID.holes(holes.length, sum(holes)) : '',
  ]
    .filter((sentence) => sentence !== '')
    .join(' ');
}

/**
 * The outline of a polygon's `parts` - each a list of rings, the outer first, each ring a list
 * of `[e, n]` in LV95 that its caller has read, none of them empty: `{ corners, left }`, the
 * outer ring of the part whose outer ring encloses the most, the first of two alike, as corners,
 * none rounded, moved or turned, and `left`, what was left out of it in words, or empty.
 */
export function largestOf(parts) {
  const areas = parts.map((part) => areaOf(part[0]));
  const marked = parts[areas.indexOf(Math.max(...areas))];
  return { corners: cornersOf(marked[0]), left: leftOf(parts, marked) };
}
