// The lights' check: for the volumes the two lights are what the stage always had, and nothing
// casts a shadow; by the sun the light from one side stands where it is told and shines where it
// is told, the two have strengths of their own, and it casts shadows unless they are switched
// off; what the sun sees is the square it is told, as deep as from where it stands to as far
// behind what it shines at; and back for the volumes the lights are as they were - the backdrop
// with them, which is a darker grey by the sun, and a sky where the house stands in its
// surfaces, under the same sun with softer strengths - and there alone the dome of the sky, which
// casts and takes no shadow; the sun says whether it casts, and its shadow's edge is soft. Then
// the rule of the light that a white face
// gets, by hand - and under the named sun, on a plot that runs to the south-east and on the
// made-up one, a roof, the two sides the sun reaches and a side it does not reach are told
// apart, none is burnt out, and each stands clear of the backdrop. three.js makes its lights
// without a browser: what a shadow looks like, that a roof shows as the rule says and the
// backdrop as it is said here, is the browser tests', tests/e2e/sketch-3d-ways.spec.ts, -parts
// and -backdrop. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { BackSide, Vector3 } from 'three';
import { sunOf } from '../scene/sun.js';
import { BACKDROP, SUNLIT, SURFACED, TOLD_APART, lightOn, openLights } from './lights.js';

const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) =>
    assert.ok(Math.abs(value - expected[at]) < 1e-9, `${what}: ${actual} is not ${expected}`),
  );
};
const colourOf = (colour) => `#${colour.getHexString()}`;

const { lights, shine, backdrop, sky: given } = openLights();
const [soft, side, aim, dome] = lights;
assert.equal(lights.length, 4);
// The place that the light from one side shines at is a thing of the stage too: three.js works
// its place out with the scene's, and only of what stands in the scene. And so is the dome of
// the sky, which the stage keeps at its camera.
assert.equal(aim, side.target);
assert.equal(dome, given);
// The dome: seen from inside, lit by nothing - its colours are its own, one a point, worked out
// by how high the point stands (surfaced.check.js) - casting no shadow and taking none, and drawn
// before all else, over by all of it: the ground's order, the lowest of the rest, is -3.
assert.ok(dome.isMesh && dome.material.isMeshBasicMaterial && dome.material.vertexColors);
assert.deepEqual(
  [dome.material.side, dome.material.depthTest, dome.material.depthWrite],
  [BackSide, false, false],
);
assert.deepEqual(
  [dome.castShadow, dome.receiveShadow, dome.renderOrder < -3],
  [false, false, true],
);
const ball = dome.geometry.getAttribute('position');
assert.equal(dome.geometry.getAttribute('color').count, ball.count);

/** The lights of the volumes, as the stage of sprint 23 had them: by hand, off stage.js as it was. */
function asTheyWere() {
  assert.ok(soft.isHemisphereLight && side.isDirectionalLight);
  assert.deepEqual([colourOf(soft.color), colourOf(soft.groundColor)], ['#ffffff', '#9aa5b1']);
  assert.deepEqual([soft.intensity, side.intensity, colourOf(side.color)], [1.6, 2.2, '#ffffff']);
  // From the front, from above and from the left of one who stands in front, at the middle.
  assert.deepEqual(side.position.toArray(), [5.5, 7.8, 3]);
  assert.deepEqual(side.target.position.toArray(), [0, 0, 0]);
  // And nothing casts a shadow: no light does. No sky shows.
  assert.deepEqual([soft.castShadow, side.castShadow, dome.visible], [false, false, false]);
  // Behind them, the grey that lies around the paper in the pad's other views.
  assert.equal(colourOf(backdrop), '#e5e7eb');
}
// As they are made, before anything was asked.
asTheyWere();

// By the sun. By hand: it stands at [19, 25, 10] and shines at [10, 5, -2], which is 9, 20 and
// 12 m from there: sqrt(81 + 400 + 144) = 25 m off.
const sun = { from: [19, 25, 10], at: [10, 5, -2], reach: 6 };
// It says that it casts its shadows - which the stage draws its corners by (stage.js).
assert.equal(shine({ ...sun, shadows: true }), true);
assert.deepEqual(side.position.toArray(), sun.from);
assert.deepEqual(side.target.position.toArray(), sun.at);
assert.equal(side.castShadow, true);
// By the sun the two have strengths of their own: the soft light weaker than for the volumes,
// and the sun stronger than the light from one side was. Their colours are as they were: no
// other light is made, and none casts but the sun.
assert.deepEqual(SUNLIT, { soft: 1, side: 2.6 });
assert.deepEqual([soft.intensity, side.intensity, soft.castShadow], [1, 2.6, false]);
assert.deepEqual([colourOf(soft.color), colourOf(soft.groundColor)], ['#ffffff', '#9aa5b1']);
// And behind them the backdrop is the sun's: a darker grey, and no dome.
assert.deepEqual([BACKDROP.volumes, BACKDROP.sunlit], ['#e5e7eb', '#94989c']);
assert.deepEqual([backdrop.isColor, colourOf(backdrop), dome.visible], [true, '#94989c', false]);
// What it sees: a square of 6 m to either side of its line of sight, from where it stands to
// 50 m off - as far behind what it shines at as it stands in front of it.
const { camera } = side.shadow;
assert.ok(camera.isOrthographicCamera);
assert.deepEqual(
  [camera.left, camera.right, camera.bottom, camera.top, camera.near, camera.far],
  [-6, 6, -6, 6, 0, 50],
);
// And it sees so, as three.js works it out when it draws - with the light and what it shines at
// where the scene would have put them. A place of the stage lies on the shadow's map at so much
// of its width, of its height and of its depth, each from 0 to 1.
const onMap = (place) => {
  side.updateMatrixWorld(true);
  side.target.updateMatrixWorld(true);
  side.shadow.updateMatrices(side);
  return new Vector3(...place).applyMatrix4(side.shadow.matrix).toArray();
};
// What it shines at lies in the middle of the map, half way down its depth; where it stands, at
// the map's near end; and as far again behind, at its far end.
near(onMap(sun.at), [0.5, 0.5, 0.5], 'what the sun shines at');
near(onMap(sun.from), [0.5, 0.5, 0], 'where the sun stands');
near(onMap([1, -15, -14]), [0.5, 0.5, 1], 'as far behind as the sun stands in front');
// By hand, the places 6 m beside what it shines at. Level with it and square to the sun's line of
// sight lies [0.8, 0, -0.6] - 9 * 0.8 - 12 * 0.6 = 0 - so 6 m that way is 4.8 and -3.6 from
// there: an edge of the map, and 6 m the other way the edge across. Square to both, and upward,
// lies [-0.48, 0.6, -0.64] - 9 * -0.48 + 20 * 0.6 - 12 * 0.64 = 0, and 0.8 * -0.48 + 0.6 * 0.64
// = 0 - so 6 m that way is -2.88, 3.6 and -3.84 from there: the top of the map. Each lies half
// way down the map's depth, as what the sun shines at does.
near(onMap([14.8, 5, -5.6]), [1, 0.5, 0.5], 'the edge of the map to one side');
near(onMap([5.2, 5, 1.6]), [0, 0.5, 0.5], 'the edge of the map to the other');
near(onMap([7.12, 8.6, -5.84]), [0.5, 1, 0.5], 'the top of the map');

// The shadows switched off: the same sun in the same place, before its backdrop, and it casts
// none - and says so.
assert.equal(shine({ ...sun, shadows: false }), false);
assert.deepEqual([side.castShadow, side.position.toArray()], [false, sun.from]);
assert.deepEqual([camera.left, camera.far, side.intensity], [-6, 50, 2.6]);
assert.equal(colourOf(backdrop), '#94989c');
// And on again: a sun that is told nothing of its shadows casts them.
assert.deepEqual([shine(sun), side.castShadow], [true, true]);
// Another sun, nearer and with a wider square: 3, 4 and 0 from what it shines at, 5 m off.
shine({ from: [3, 4, 0], at: [0, 0, 0], reach: 9, shadows: true });
assert.deepEqual([camera.left, camera.right, camera.bottom, camera.top], [-9, 9, -9, 9]);
assert.deepEqual([camera.near, camera.far], [0, 10]);
near(onMap([-3, -4, 0]), [0.5, 0.5, 1], 'as far behind, for a nearer sun');

// The map of the shadows: so many points along either side that the edge of a shadow is a few
// centimetres on a house of fifty metres, and a place is looked up two centimetres off its face.
const { mapSize, bias, normalBias } = side.shadow;
assert.deepEqual([mapSize.x, mapSize.y], [4096, 4096]);
assert.ok(56 / mapSize.x < 0.02, 'a point of the map is wider than two centimetres on 56 m');
assert.deepEqual([bias, normalBias], [0, 0.02]);
// Its edge is soft: a place is looked up 3 points of the map around it - three.js's own is one -
// so the edge is some 3 points wide to either side, 9 mm on this sun's 12 m.
assert.equal(side.shadow.radius, 3);
assert.ok(side.shadow.radius * ((2 * 6) / mapSize.x) < 0.01);

// Where the house stands in its surfaces, the sun is the same sun: it stands where it stood,
// sees the square it saw and casts its shadows. The two lights have the softer strengths, in
// the colours they had, and behind them is the sky - a third backdrop, and none of the two
// greys. What those strengths do to a wall and a floor is surfaced.check.js's. Told nothing of
// surfaces, or told that there are none, the stage is lit for a white house again.
shine({ ...sun, surfaces: true });
assert.deepEqual([side.position.toArray(), side.target.position.toArray()], [sun.from, sun.at]);
assert.deepEqual([camera.left, camera.right, camera.far, side.castShadow], [-6, 6, 50, true]);
assert.deepEqual([soft.intensity, side.intensity], [SURFACED.soft, SURFACED.side]);
assert.deepEqual([colourOf(soft.color), colourOf(soft.groundColor)], ['#ffffff', '#9aa5b1']);
assert.deepEqual([colourOf(side.color), colourOf(backdrop)], ['#ffffff', BACKDROP.surfaced]);
assert.equal(Object.keys(BACKDROP).length, 3);
assert.equal(new Set(Object.values(BACKDROP)).size, 3);
// There, and there alone, the dome of the sky shows - with the shadows off too.
assert.equal(dome.visible, true);
assert.equal(shine({ ...sun, surfaces: true, shadows: false }), false);
assert.deepEqual([side.castShadow, side.intensity, dome.visible], [false, SURFACED.side, true]);
for (const white of [sun, { ...sun, surfaces: false }]) {
  shine(white);
  assert.deepEqual([soft.intensity, side.intensity, colourOf(backdrop)], [1, 2.6, '#94989c']);
  assert.equal(dome.visible, false);
}

// Back for the volumes: the lights as they were, no shadow - which it says - and no dome.
assert.equal(shine(), false);
asTheyWere();
shine({ ...sun, shadows: true });
shine(null);
asTheyWere();
shine({ ...sun, surfaces: true });
shine();
asTheyWere();

// The light that a white face gets by the way it looks, by hand - in red, in green and in blue,
// each a share of the most a white face can show. The soft light's ground is #9aa5b1: 154, 165
// and 177 of 255, which are 0.3231, 0.3763 and 0.4397 of the light of white - a level, 0.055
// more, by 1.055, to the power of 2.4. Its sky and the sun are white. With both lights as strong
// as pi, the one in pi of a face that spreads its light is gone, and what is left is plain:
const near4 = (actual, expected, what) => near(actual.map(round4), expected, what);
const round4 = (value) => Math.round(value * 1e4) / 1e4;
const [UP, DOWN, ALONG, BACK, ACROSS] = [
  [0, 0, 1],
  [0, 0, -1],
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
];
const PLAIN = { soft: Math.PI, side: Math.PI };
// - a face that looks straight up, under a sun straight above: the sky and the sun, each whole;
near4(lightOn(UP, UP, PLAIN), [2, 2, 2], 'a roof under a sun straight above');
// - one that looks straight down: the ground's colour, and no sun;
near4(lightOn(DOWN, UP, PLAIN), [0.3231, 0.3763, 0.4397], 'a face that looks down');
// - an upright one, under that sun: half sky and half ground - 0.6616, 0.6881 and 0.7198 - and
//   of a sun straight above an upright face gets none;
near4(lightOn(ALONG, UP, PLAIN), [0.6616, 0.6881, 0.7198], 'an upright face, the sun above');
// - an upright one that a level sun shines straight at: that, and the sun whole; one the sun
//   shines at a third of a turn off, half the sun: the cosine of 60 degrees; and one that looks
//   away from the sun, or along it, none of it.
near4(lightOn(ALONG, ALONG, PLAIN), [1.6616, 1.6881, 1.7198], 'a wall the sun shines at');
near4(lightOn(ALONG, [0.5, 0.866025, 0], PLAIN), [1.1616, 1.1881, 1.2198], 'a wall at 60 degrees');
near4(lightOn(BACK, ALONG, PLAIN), [0.6616, 0.6881, 0.7198], 'a wall that looks away');
near4(lightOn(ACROSS, ALONG, PLAIN), [0.6616, 0.6881, 0.7198], 'a wall the sun shines along');
// And each light counts by its strength: the soft light alone, and the sun alone.
near4(lightOn(UP, UP, { soft: Math.PI, side: 0 }), [1, 1, 1], 'the soft light alone');
near4(lightOn(DOWN, DOWN, { soft: 0, side: Math.PI / 2 }), [0.5, 0.5, 0.5], 'the sun alone');

// The strengths by the sun, under the named sun, 45 degrees high: by hand. A roof gets the sky,
// 1, and of the sun the sine of 45 degrees, 2.6 * 0.7071 = 1.8385: 2.8385 in pi, 0.9035. An
// upright face that the sun does not reach gets half sky and half ground, in pi: 0.2106, 0.2190
// and 0.2291. One that it reaches gets, beside that, 2.6 in pi of the level part of the way to
// the sun that lies along the way it looks (sun.check.js has those parts):
// - on a plot that runs to the south-east, 135 degrees, the front, which looks down the plot,
//   0.2988 - 0.2473 more - and the side that looks against y, 0.6409: 0.5304 more;
// - on the made-up plot, 232 degrees, the front 0.5997 - 0.4963 more - and the side that looks
//   along y, 0.3747: 0.3101 more.
const BY_HAND = [
  {
    bearing: 135,
    reached: [
      [ALONG, [0.4579, 0.4664, 0.4764]],
      [
        [0, -1, 0],
        [0.741, 0.7494, 0.7595],
      ],
    ],
    unreached: [BACK, ACROSS],
  },
  {
    bearing: 232,
    reached: [
      [ALONG, [0.7069, 0.7153, 0.7254]],
      [ACROSS, [0.5207, 0.5292, 0.5392]],
    ],
    unreached: [BACK, [0, -1, 0]],
  },
];
// The step that tells two faces apart is the one that was seen to: a roof and the lighter of
// two walls in the sun, on a plot to the south-east, are 0.144 apart in blue.
assert.equal(TOLD_APART, 0.14);
// The backdrop by the sun, in light, by hand: #94989c is 148, 152 and 156 of 255, which are
// 0.2961, 0.3140 and 0.3325 of the light of white, by the screen's curve as above.
shine(sun);
const sky = backdrop.toArray();
shine();
near4(sky, [0.2961, 0.314, 0.3325], 'the backdrop by the sun, in light');
const nearest = { over: Infinity, under: Infinity };
for (const { bearing, reached, unreached } of BY_HAND) {
  const { toward } = sunOf(bearing);
  const roof = lightOn(UP, toward);
  near4(roof, [0.9035, 0.9035, 0.9035], `a roof, on a plot to ${bearing}`);
  const shade = unreached.map((looks) => lightOn(looks, toward));
  for (const one of shade)
    near4(one, [0.2106, 0.219, 0.2291], `in the shade, on a plot to ${bearing}`);
  const walls = reached.map(([looks, expected]) => {
    near4(lightOn(looks, toward), expected, `a wall in the sun, on a plot to ${bearing}`);
    return lightOn(looks, toward);
  });
  // Four tones: a roof, each upright face the sun reaches, and one it does not. Each is told
  // from each other, in red, in green and in blue - and none is burnt out.
  const tones = [roof, ...walls, shade[0]];
  tones.forEach((one, first) => {
    assert.ok(Math.max(...one) <= 1, `burnt out, on a plot to ${bearing}: ${one}`);
    tones.slice(first + 1).forEach((other) => {
      const apart = Math.min(...one.map((share, channel) => Math.abs(share - other[channel])));
      assert.ok(apart >= TOLD_APART, `on a plot to ${bearing}, ${one} and ${other} are one tone`);
    });
  });
  // And each stands clear of the backdrop, in red, in green and in blue: a roof and both walls
  // that the sun reaches are lighter than it by the step at the least, and what the sun does
  // not reach is darker than it by half the step at the least. Half the step is as much on the
  // screen there as the whole step is in the sun, some seventeen of 255.
  for (const lit of [roof, ...walls]) {
    const over = Math.min(...lit.map((share, channel) => share - sky[channel]));
    assert.ok(over >= TOLD_APART, `on a plot to ${bearing}, ${lit} is lost against the backdrop`);
    nearest.over = Math.min(nearest.over, over);
  }
  const under = Math.min(...shade[0].map((share, channel) => sky[channel] - share));
  assert.ok(under >= TOLD_APART / 2, `on a plot to ${bearing}, the shade is lost: ${under}`);
  nearest.under = Math.min(nearest.under, under);
}
// By hand, the two that come nearest to it: the front on the plot to the south-east, in blue -
// 0.2291 and 0.2473 are 0.4764, and 0.3325 less - and the shade, in red: 0.2106 under 0.2961.
near4([nearest.over, nearest.under], [0.144, 0.0856], 'the nearest faces to the backdrop');

process.stdout.write(
  'tools/sketch/view3d: the volumes are lit as they were with no shadow, the sun stands where it is told and sees the square it is told, and by its light a roof, two walls and the shade are four tones, each clear of the backdrop\n',
);
