// Where a view in 3D stands: for each of five stations, where the eye is, what it looks at and
// which way is up - in metres of the plot's frame: x down the plot, y across it, h above sea
// level. It imports nothing and names no global.

/**
 * How wide the view is that the stations are worked out for, in degrees: a camera that sees so
 * wide or wider, upright and across, has the whole scene in view. three.js gives a new camera 50.
 */
export const FIELD_DEG = 50;
/** How far below level a standing station looks, in degrees: a little down on the house. */
export const DOWN_DEG = 20;

const radians = (degrees) => (degrees * Math.PI) / 180;

/**
 * The stations of a scene: `front`, `back`, `left`, `right` and `above`, each with `eye`,
 * `target` and `up` as [x, y, h]. Every eye looks at the middle of the scene's `box`, from so far
 * off that the ball around the box just fits into `fieldDeg` about its line of sight: the whole
 * box is in view, and the scene is the same size from every station.
 * - `front` is from below the house: downhill of it, looking up the slope and `downDeg` down on
 *   it. `back` is from uphill. `left` is the side that lies to the left of one who stands in
 *   front: the side of the small y. Each shows what the pad's view of it shows, and no mirror
 *   image: `left` the pad's side view, with x to the right, `right` its other side.
 * - `above` looks straight down, with x to the right and y up, as the top view lies. Straight
 *   down, h is no way up: its `up` is y.
 */
export function stations(scene, { fieldDeg = FIELD_DEG, downDeg = DOWN_DEG } = {}) {
  const { min, max } = scene.box;
  const middle = min.map((low, axis) => (low + max[axis]) / 2);
  const reach = Math.hypot(...min.map((low, axis) => max[axis] - low)) / 2;
  const far = reach / Math.sin(radians(fieldDeg) / 2);
  const [level, lift] = [Math.cos(radians(downDeg)), Math.sin(radians(downDeg))];
  const from = (toward, up = [0, 0, 1]) => ({
    eye: middle.map((at, axis) => at + far * toward[axis]),
    target: middle,
    up,
  });
  return {
    front: from([level, 0, lift]),
    back: from([-level, 0, lift]),
    left: from([0, -level, lift]),
    right: from([0, level, lift]),
    above: from([0, 0, 1], [0, 1, 0]),
  };
}
