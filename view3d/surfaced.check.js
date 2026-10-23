// The check of the light where the house stands in its surfaces - the way Materials - by hand,
// under the named sun: a floor in the sun gets all but the whole of what a face can show, so it
// shows the colour its surface was given and is not burnt out; a wall the sun does not reach
// keeps its colour - it gets the named share of the floor's light, which by White's strengths it
// did not; a shadow on a floor is told from the floor; the sky's colours are worked out from how
// high a point of the dome stands, from its horizon up to its zenith; what a house shows of
// itself before the sky - plaster, and its roof - is told from the backdrop and from every
// colour of the dome by the named step, from above and at whatever angle the sun meets a wall;
// and the two woods are told apart, the floor's from the
// furniture's, and the furniture's from plaster. No colour of a surface is held here: whatever
// they are set to, plaster and a roof stand clear of the sky and a table of its floor, or this
// fails. That the stage is lit so is lights.check.js's, and what is drawn the browser test's,
// tests/e2e/sketch-3d-materials.spec.ts. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { Color } from 'three';
import { sunOf } from '../scene/sun.js';
import { ROOF, SURFACES } from '../scene/surfaces.js';
import { BACKDROP, IN_SHADE, SKY, SUNLIT, SURFACED, TOLD_APART, lightOn, skyAt } from './lights.js';

const round4 = (value) => Math.round(value * 1e4) / 1e4;
const near4 = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) =>
    assert.ok(
      Math.abs(round4(value) - expected[at]) < 1e-9,
      `${what}: ${actual} is not ${expected}`,
    ),
  );
};
const [UP, ALONG, BACK, ACROSS, AGAINST] = [
  [0, 0, 1],
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
];

// The strengths, and the share a wall in the shade keeps: as they were seen to do.
assert.deepEqual(SURFACED, { soft: 1.5, side: 2.3 });
assert.equal(IN_SHADE, 0.3);

// By hand, as lights.check.js works the rule out: the soft light's ground is 0.3231, 0.3763 and
// 0.4397 of the light of white, its sky and the sun are white, and the sun is 45 degrees high.
// - A floor, which looks straight up, gets the sky, 1.5, and of the sun the sine of 45 degrees,
//   2.3 * 0.7071 = 1.6263: 3.1263 in pi, 0.9951. In a shadow it gets the sky alone, 0.4775.
// - An upright face that the sun does not reach gets half sky and half ground - 0.6616, 0.6881
//   and 0.7198 - of 1.5 in pi: 0.3159, 0.3286 and 0.3437.
// - One that it reaches gets, beside that, 2.3 in pi - 0.7321 - of the level part of the way to
//   the sun that lies along the way it looks (sun.check.js has those parts): on a plot that runs
//   to the south-east, 135 degrees, the front 0.2988 - 0.2188 more - and the side that looks
//   against y 0.6409, 0.4692 more; on the made-up plot, 232 degrees, the front 0.5997 - 0.4390
//   more - and the side that looks along y 0.3747, 0.2743 more.
const BY_HAND = [
  {
    bearing: 135,
    reached: [
      [ALONG, [0.5347, 0.5473, 0.5625]],
      [AGAINST, [0.7851, 0.7977, 0.8129]],
    ],
    unreached: [BACK, ACROSS],
  },
  {
    bearing: 232,
    reached: [
      [ALONG, [0.7549, 0.7676, 0.7827]],
      [ACROSS, [0.5902, 0.6029, 0.618]],
    ],
    unreached: [BACK, AGAINST],
  },
];
for (const { bearing, reached, unreached } of BY_HAND) {
  const { toward } = sunOf(bearing);
  const on = `on a plot to ${bearing}`;
  const floor = lightOn(UP, toward, SURFACED);
  near4(floor, [0.9951, 0.9951, 0.9951], `a floor in the sun, ${on}`);
  // Not burnt out: no more than a face can show - so a floor seen from above shows the colour
  // its surface was given, darker by half a hundredth.
  assert.ok(Math.max(...floor) <= 1, `a floor is burnt out, ${on}: ${floor}`);
  for (const [looks, expected] of reached) {
    near4(lightOn(looks, toward, SURFACED), expected, `a wall in the sun, ${on}`);
  }
  for (const looks of unreached) {
    const shade = lightOn(looks, toward, SURFACED);
    near4(shade, [0.3159, 0.3286, 0.3437], `a wall in the shade, ${on}`);
    // It keeps its colour: of the light of a floor in the sun, the named share at the least -
    // 0.3 of 0.9951 is 0.2985 - in red, in green and in blue.
    shade.forEach((share, channel) =>
      assert.ok(share >= IN_SHADE * floor[channel], `the shade is too dark, ${on}: ${shade}`),
    );
  }
  // And by White's strengths it did not, which is why these are others: there the shade gets
  // 0.2106 in red, of a roof's 0.9035 - under three tenths of it, 0.2711.
  const [roof, grey] = [lightOn(UP, toward, SUNLIT), lightOn(BACK, toward, SUNLIT)];
  near4([roof[0], grey[0]], [0.9035, 0.2106], `White's roof and shade, ${on}`);
  assert.ok(grey[0] < IN_SHADE * roof[0]);
}
// A shadow on a floor: the sky alone, 1.5 in pi. It is told from the floor beside it, by more
// than the step: 0.5176 under it - half as light, where in White it is a third.
const shadow = lightOn(UP, UP, { ...SURFACED, side: 0 });
near4(shadow, [0.4775, 0.4775, 0.4775], 'a floor in a shadow');
assert.ok(0.9951 - shadow[0] >= TOLD_APART);

// The sky, in light, by hand: #b4c7d9 is 180, 199 and 217 of 255, which are 0.4564, 0.5711 and
// 0.6939 of the light of white, by the screen's curve - a level, 0.055 more, by 1.055, to the
// power of 2.4.
assert.equal(BACKDROP.surfaced, '#b4c7d9');
const sky = new Color(BACKDROP.surfaced).toArray();
near4(sky, [0.4564, 0.5711, 0.6939], 'the sky, in light');
/**
 * How far a colour is off the sky, in light: as far as its red, its green or its blue is, by
 * whichever is the furthest. A house in its surfaces is told from a sky by its colour too:
 * between its darkest wall and its lightest lies every grey, and no blue.
 */
const offSky = (shown, behind = sky) =>
  Math.max(...shown.map((share, channel) => Math.abs(share - behind[channel])));
// The rule, on made-up colours: the sky is not told from the sky; a colour that is the sky's
// but for its red, 0.15 lighter, is; and one that is 0.13 darker in each of the three is not.
near4([offSky(sky)], [0], 'the sky against the sky');
assert.ok(offSky([sky[0] + 0.15, sky[1], sky[2]]) >= TOLD_APART);
assert.ok(offSky(sky.map((share) => share - 0.13)) < TOLD_APART);

/** What a face of a surface shows: of the colour it was given, the light it gets. */
const shows = (surface, light) =>
  new Color(SURFACES[surface].colour).toArray().map((share, channel) => share * light[channel]);
// The sky that lies before it, a dome worked out by code (ST-033): its two colours, in light by
// hand as above - #c2d8ed is 194, 216 and 237 of 255, #89b2e1 137, 178 and 225 - and between
// them by how high a point stands. At the horizon, and under it, the horizon's; straight above,
// and over that, the zenith's; half way up, 0.5 to the power of 0.6 of the way: 0.6598, so red
// 0.5395 - 0.2893 * 0.6598 = 0.3486. Upward each of red, green and blue goes one way, from the
// horizon's to the zenith's.
assert.deepEqual(SKY, { horizon: '#c2d8ed', zenith: '#89b2e1' });
const [horizon, zenith] = [SKY.horizon, SKY.zenith].map((hex) => new Color(hex).toArray());
near4(horizon, [0.5395, 0.6867, 0.8469], 'the horizon, in light');
near4(zenith, [0.2502, 0.4452, 0.7529], 'the zenith, in light');
near4(skyAt(0).toArray(), [0.5395, 0.6867, 0.8469], 'the sky at the horizon');
near4(skyAt(-0.4).toArray(), [0.5395, 0.6867, 0.8469], 'the sky under the horizon');
near4(skyAt(1).toArray(), [0.2502, 0.4452, 0.7529], 'the sky straight above');
near4(skyAt(1.5).toArray(), [0.2502, 0.4452, 0.7529], 'the sky over the top');
near4(skyAt(0.5).toArray(), [0.3486, 0.5274, 0.7849], 'the sky half way up');
const HEIGHTS = 50;
const skies = Array.from({ length: HEIGHTS + 1 }, (_, at) => skyAt(at / HEIGHTS).toArray());
skies.slice(1).forEach((colour, at) =>
  colour.forEach((share, channel) => {
    const [was, from, to] = [skies[at][channel], horizon[channel], zenith[channel]];
    assert.ok(Math.sign(share - was) !== Math.sign(from - to), `the sky turns back at ${at}`);
  }),
);
// What a house shows of itself before the sky is plaster, and its roof. Each is told from the
// sky by the step - from `BACKDROP.surfaced`, which lies behind the dome, and from every colour
// of the dome, from its horizon to its zenith: from above, in the sun; and upright, at whatever
// angle the sun meets it - from the shade, through every wall of the two plots above, to a wall
// that the sun shines straight at, which gets 2.3 in pi of the cosine of 45 degrees. So it holds
// on every plot, and not on the two alone: of a wall the rule asks how much of the sun lies
// along the way it looks, and nothing else.
const ANGLES = 500;
assert.ok(Object.hasOwn(SURFACES, 'plaster') && Object.hasOwn(SURFACES, ROOF));
for (const [behind, where] of [[sky, 'the backdrop'], ...skies.map((one, at) => [one, at])]) {
  for (const surface of ['plaster', ROOF]) {
    const above = offSky(shows(surface, lightOn(UP, sunOf(232).toward, SURFACED)), behind);
    assert.ok(above >= TOLD_APART, `${surface} is lost against ${where}, from above: ${above}`);
    for (let step = 0; step <= ANGLES; step += 1) {
      const along = (step / ANGLES) * Math.SQRT1_2;
      const apart = offSky(shows(surface, lightOn(ALONG, [along, 0, 0], SURFACED)), behind);
      assert.ok(
        apart >= TOLD_APART,
        `a wall of ${surface} is lost against ${where} where ${along} of the sun lies along the way it looks: ${apart}`,
      );
    }
  }
}

// Two woods. A floor is of `wood`, and what stands on it of `joinery`, a tone apart: seen from
// above, the top of a table gets the light that the floor beside it gets, and of one colour the
// two would be one - a table would show by its shadow alone. So they are apart by the step, in
// red, in green or in blue, where both lie in the sun - which is where both lie with the shadows
// switched off - and by half of it in a shadow, where both get the sky alone: half the step is
// as much on the screen there (lights.check.js). And joinery is told from plaster so, in the
// sun and in the shade: a wardrobe from the wall it stands against.
const apart = (one, other, light) => {
  const [here, there] = [shows(one, light), shows(other, light)];
  return Math.max(...here.map((share, channel) => Math.abs(share - there[channel])));
};
const [inSun, inShadow] = [lightOn(UP, sunOf(232).toward, SURFACED), shadow];
const inShade = lightOn(BACK, sunOf(232).toward, SURFACED);
assert.ok(Object.hasOwn(SURFACES, 'wood') && Object.hasOwn(SURFACES, 'joinery'));
for (const [one, other, light, by, where] of [
  ['joinery', 'wood', inSun, TOLD_APART, 'a table on its floor, in the sun'],
  ['joinery', 'wood', inShadow, TOLD_APART / 2, 'a table on its floor, in a shadow'],
  ['joinery', 'plaster', lightOn(ALONG, sunOf(232).toward, SURFACED), TOLD_APART, 'a wardrobe'],
  ['joinery', 'plaster', inShade, TOLD_APART / 2, 'a wardrobe in the shade'],
]) {
  const off = apart(one, other, light);
  assert.ok(off >= by, `${one} is not told from ${other} - ${where}: ${off} apart, of ${by}`);
}
// The rule, on a made-up pair: a colour is not told from itself, in whatever light.
assert.equal(apart('wood', 'wood', inSun), 0);

// And that is why White's backdrop is none for these strengths. By hand: that grey is 0.2961,
// 0.314 and 0.3325 of the light of white (lights.check.js), and by these strengths a white wall
// in the shade gets 0.3159, 0.3286 and 0.3437 - two hundredths off at the most, where the step
// is fourteen. A wall the sun does not reach would be the backdrop, whatever it is made of that
// is nearly white.
const grey = new Color(BACKDROP.sunlit).toArray();
const whiteInShade = lightOn(BACK, sunOf(232).toward, SURFACED);
const offGrey = Math.max(...whiteInShade.map((share, channel) => Math.abs(share - grey[channel])));
assert.ok(offGrey < 0.02 && offGrey < TOLD_APART, `off the grey of White by ${offGrey}`);

process.stdout.write(
  'tools/sketch/view3d: where the house stands in its surfaces a floor in the sun shows its colour and is not burnt out, a wall in the shade keeps three tenths of that light, plaster and a roof are told from the sky at whatever angle the sun meets them, and a table from its floor\n',
);
