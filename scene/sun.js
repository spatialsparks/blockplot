// Where the sun stands over the plot: one sun, named - an early afternoon sun in the
// south-south-west - as the way to it in the plot's own frame: x down the plot, y across it, h
// up. It is the sun of no day and of no hour: nothing here knows a date, and nothing that shows
// it may claim one (story ST-024, rule 5). It imports nothing and names no global.

/**
 * Where the sun stands by the compass, in degrees: counted from north by way of east, as the
 * bearing of a plot is. 200 is a little west of south: the south-south-west, which is 202.5, to
 * the nearest ten. So a plot that runs downhill to the south-east has the sun on the front of
 * its house, and not along it.
 */
export const SUN_BEARING_DEG = 200;
/** How high the sun stands over the horizon, in degrees: a shadow is as long as what casts it is high. */
export const SUN_HEIGHT_DEG = 45;
/** The words that name this sun, for a view to say of it: a time of day and a wind, and no more. */
export const SUN_NAME = 'early afternoon sun in the south-south-west';

const radians = (degrees) => (degrees * Math.PI) / 180;

/**
 * The sun over a plot: `{ toward, name }`. `toward` is the way to the sun as [x, y, h] of length
 * one, and `name` the words that name it.
 *
 * `bearingDeg` is the plot's bearing, a site's `bearingDeg`: where its x points by the compass.
 * Its y points a quarter back from there - seen from above y lies to the left of x, and a compass
 * counts to the right. So a sun that stands so many degrees short of the plot's bearing stands as
 * many degrees round from x towards y: of its level part, the cosine of them lies along x and
 * the sine along y. And it stands `highDeg` over the horizon: its level part is the cosine of
 * that, and its h the sine.
 *
 * It is the named sun - at `SUN_BEARING_DEG` by the compass, `SUN_HEIGHT_DEG` high, under
 * `SUN_NAME` - unless it is told another: `fromDeg`, `highDeg` and the `name` that goes with them.
 */
export function sunOf(
  bearingDeg,
  { fromDeg = SUN_BEARING_DEG, highDeg = SUN_HEIGHT_DEG, name = SUN_NAME } = {},
) {
  const short = radians(bearingDeg - fromDeg);
  const [level, lift] = [Math.cos(radians(highDeg)), Math.sin(radians(highDeg))];
  return { toward: [level * Math.cos(short), level * Math.sin(short), lift], name };
}
