// A stand: a station, fitted to the window. A station (scene/stations.js) says from which side a
// box is looked at, and stands far enough off for any window that takes in its angle: the ball
// around the box fits. Here the window is known - how much the camera takes in, and how wide its
// picture is for its height - and the box itself is fitted to it by its corners, looked at the
// way the station looks: it lies in the middle of the picture, and fills it. Plain arithmetic in
// the plot's frame, [x, y, h]: it imports nothing, and names no global.

/**
 * How much of the picture the box takes at the most, from the middle of the picture to its edge,
 * across and upright: the rest is the margin around it.
 */
export const FILLS = 0.9;

const minus = (a, b) => a.map((value, axis) => value - b[axis]);
const dot = (a, b) => a.reduce((sum, value, axis) => sum + value * b[axis], 0);
const cross = (a, b) =>
  [0, 1, 2].map((i) => a[(i + 1) % 3] * b[(i + 2) % 3] - a[(i + 2) % 3] * b[(i + 1) % 3]);
const unit = (a) => a.map((value) => value / Math.hypot(...a));

/**
 * Where a view stands that has a box in view and little else: `{ eye, target }`. `station` is a
 * station of that box, of which the way it looks is taken - from its `eye` to its `target` -
 * and its `up`; `box` is the box, `min` and `max`; `field` is the window's: `deg`, what the
 * camera takes in from the bottom of the picture to its top, in degrees, and `shape`, how wide
 * the picture is for its height.
 *
 * The eye looks the way the station looks, and no mirror image. It stands where the box lies in
 * the middle of the picture - it reaches as far out to the left as to the right, and to the top
 * as to the bottom - and as near as it can with every corner of the box within `FILLS` of the
 * way from the middle of the picture to an edge: across or upright, the box reaches that far on
 * both sides, and the other way no further, in a wide window as in a tall one. So the line of
 * sight does not run through the middle of the box where the box shows more of itself on one
 * side of that middle: seen from a little above, more below it. `target` is the place on the
 * line of sight that is nearest to the middle of the box: what the view turns about.
 */
export function fitted({ eye, target, up }, { min, max }, { deg, shape }) {
  const ahead = unit(minus(target, eye));
  const right = unit(cross(ahead, up));
  const above = cross(right, ahead);
  // How far out of the middle of the picture a place may lie, for each metre that it lies ahead
  // of the eye: upright, and across.
  const upright = FILLS * Math.tan((deg * Math.PI) / 360);
  const across = upright * shape;
  // The corners, from the middle of the box, and how far ahead of it each lies.
  const middle = min.map((low, axis) => (low + max[axis]) / 2);
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((n) =>
    middle.map((at, axis) => ((n >> axis) & 1 ? max : min)[axis] - at),
  );
  const depths = corners.map((corner) => dot(corner, ahead));

  /**
   * How far from the middle of the box the eye has to stand for one way of the picture, across
   * it or up it. A corner asks for so much that it is in the picture at one edge, and for less
   * the further the line of sight is moved towards that edge: with the line where the corner
   * that asks for the most on one side asks for as much as the one on the other, it is half of
   * what the two ask together.
   */
  const needs = (way, out) => {
    const asks = (side) =>
      Math.max(...corners.map((corner, at) => (side * dot(corner, way)) / out - depths[at]));
    return (asks(1) + asks(-1)) / 2;
  };
  const far = Math.max(needs(right, across), needs(above, upright));

  /**
   * How far the line of sight is moved one way of the picture, for the box to reach as far out
   * of the middle on one side as on the other, seen from so far off. Two corners show equally
   * far out on either side of a line that runs between them, nearer to the one that is nearer
   * to the eye; the two that take the most of the picture between them say where its middle is.
   */
  const aside = (way) => {
    // Of each corner: how far it lies that way, and how far ahead of the eye.
    const lying = corners.map((corner, at) => [dot(corner, way), far + depths[at]]);
    let [most, moved] = [-Infinity, 0];
    for (const [one, near] of lying) {
      for (const [other, off] of lying) {
        const taken = (one - other) / (near + off);
        if (taken > most) [most, moved] = [taken, (one * off + other * near) / (near + off)];
      }
    }
    return moved;
  };
  const [sideways, upward] = [aside(right), aside(above)];
  const looked = middle.map((at, axis) => at + sideways * right[axis] + upward * above[axis]);
  return { eye: looked.map((at, axis) => at - far * ahead[axis]), target: looked };
}
