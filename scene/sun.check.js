// The sun's check: where the named sun stands over a plot, against what a person worked out by
// hand for the made-up plot and for one that runs down to the south-east; that the way to it is
// one long and as high as the named angle says; that it stands in one place of the sky wherever
// the plot points; and that its words name a wind and no hour. No browser and nothing of the
// site. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { SUN_BEARING_DEG, SUN_HEIGHT_DEG, SUN_NAME, sunOf } from './sun.js';

const radians = (degrees) => (degrees * Math.PI) / 180;
const degrees = (angle) => (angle * 180) / Math.PI;
// What was worked out by hand has four places after the point.
const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, axis) =>
    assert.ok(Math.abs(value - expected[axis]) < 5e-5, `${what}: ${actual} is not ${expected}`),
  );
};

// The named sun: in the south-south-west, 200 degrees by the compass, and 45 degrees high.
assert.deepEqual([SUN_BEARING_DEG, SUN_HEIGHT_DEG], [200, 45]);

// By hand, the made-up plot (demo-site.js): it runs down towards 232 degrees, so its x points
// there, 32 degrees past the sun, and its y a quarter back, to 142 degrees. The sun stands 32
// degrees short of x, towards y. 45 degrees high, its level part is cos 45 = 0.7071 long and its
// h is sin 45 = 0.7071. Of the level part, cos 32 = 0.8480 lies along x and sin 32 = 0.5299
// along y: 0.7071 * 0.8480 = 0.5997 and 0.7071 * 0.5299 = 0.3747.
const madeUp = sunOf(232);
near(madeUp.toward, [0.5997, 0.3747, 0.7071], 'over the made-up plot');
// By hand, a plot that runs down to the south-east, 135 degrees: its x points to the south-east
// and its y to the north-east, 45 degrees. The sun stands 65 degrees past x, away from y: of
// its level part cos 65 = 0.4226 lies along x - the front of a house there is in the sun - and
// sin 65 = 0.9063 against y: 0.7071 * 0.4226 = 0.2988 and 0.7071 * 0.9063 = 0.6409.
near(sunOf(135).toward, [0.2988, -0.6409, 0.7071], 'over a plot to the south-east');
// And four more, each a quarter on. A plot that runs down to where the sun stands has the sun
// straight down the plot; one that runs away from it, straight up it; one whose y points to the
// sun, 90 degrees further round, has it straight along y; and one whose y points away from it,
// straight against y.
near(sunOf(200).toward, [0.7071, 0, 0.7071], 'over a plot to the south-south-west');
near(sunOf(20).toward, [-0.7071, 0, 0.7071], 'over a plot to the north-north-east');
near(sunOf(290).toward, [0, 0.7071, 0.7071], 'over a plot to the west-north-west');
near(sunOf(110).toward, [0, -0.7071, 0.7071], 'over a plot to the east-south-east');

// The way to the sun is one long, and as high as the named angle says: its h is the sine of 45
// degrees, whatever the plot.
for (const bearing of [232, 135, 0, 90, 359.5, -40, 720]) {
  const { toward } = sunOf(bearing);
  assert.ok(Math.abs(Math.hypot(...toward) - 1) < 1e-12, `${bearing}: ${Math.hypot(...toward)}`);
  assert.ok(Math.abs(degrees(Math.asin(toward[2])) - SUN_HEIGHT_DEG) < 1e-9, String(bearing));
}

// Wherever the plot points, the sun stands in one place of the sky. Turned back to the compass
// by the rule of the frame - x points where the bearing says, east by its sine and north by its
// cosine, and y a quarter back from there - the level part of the way to it points to 200
// degrees: to the south and to the west, and of what it has to the south, tan 20 = 0.3640 to
// the west.
for (let bearing = 0; bearing < 360; bearing += 7.5) {
  const [x, y] = sunOf(bearing).toward;
  const [along, across] = [radians(bearing), radians(bearing - 90)];
  const east = x * Math.sin(along) + y * Math.sin(across);
  const north = x * Math.cos(along) + y * Math.cos(across);
  const compass = (degrees(Math.atan2(east, north)) + 360) % 360;
  assert.ok(Math.abs(compass - SUN_BEARING_DEG) < 1e-9, `${bearing}: the sun at ${compass}`);
  assert.ok(east < 0 && north < 0 && Math.abs(east / north - 0.364) < 5e-5, String(bearing));
}

// Another sun, where one is asked for, by hand: a sun in the south, 180 degrees, 30 degrees high
// - cos 30 = 0.8660 level, sin 30 = 0.5 up. Over a plot that runs down to the east, whose y
// points north, it stands straight against y. Over one that runs down to the south-west, whose
// y points to the south-east, the south lies midway between x and y, 45 degrees from each:
// 0.8660 * cos 45 = 0.6124 along either.
const south = { fromDeg: 180, highDeg: 30, name: 'sun in the south' };
near(sunOf(90, south).toward, [0, -0.866, 0.5], 'a sun in the south, over a plot to the east');
near(sunOf(225, south).toward, [0.6124, 0.6124, 0.5], 'a sun in the south, over the south-west');
assert.equal(sunOf(90, south).name, 'sun in the south');

// The words name the sun that the two figures place - of the sixteen winds of the compass, each
// 22.5 degrees from the next, the one that 200 degrees lies nearest to is the ninth after
// north, at 202.5: the south-south-west - and say a time of day and nothing nearer: no figure is
// in them, so no date and no hour (story ST-024, rule 5).
const WINDS = ['north', 'north-north-east', 'north-east', 'east-north-east', 'east'].concat(
  ['east-south-east', 'south-east', 'south-south-east', 'south', 'south-south-west'],
  ['south-west', 'west-south-west', 'west', 'west-north-west', 'north-west', 'north-north-west'],
);
assert.equal(WINDS.length, 16);
assert.equal(WINDS[Math.round(SUN_BEARING_DEG / 22.5) % 16], 'south-south-west');
assert.equal(madeUp.name, SUN_NAME);
assert.equal(SUN_NAME, 'early afternoon sun in the south-south-west');
assert.doesNotMatch(SUN_NAME, /\d|o'clock|\b(?:am|pm)\b/i);

process.stdout.write(
  'tools/sketch/scene: the named sun stands in the south-south-west, 45 degrees high, wherever the plot points\n',
);
