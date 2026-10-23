// The lights of the stage: a soft light from everywhere, and a light from one side - and the
// backdrop behind all they light. For the volumes they are what the stage always had, and
// nothing casts a shadow. Where a way of showing is lit by the sun, the light from one side is
// the sun: it stands where it is told, casts the shadows of what stands on the stage - unless
// they are switched off - and the two have strengths of their own, for there no line tells one
// white face from the next: the light does. And the backdrop is a darker grey there, which a
// white house stands clear of. Where the house stands in its surfaces, the sun is the same sun
// with softer strengths, under a sky: there a colour tells too, and has to last in the shade.
// The sky is a dome around the stage, its colours worked out here from how high a point of it
// stands - pale at the horizon, bluer above - and no thing of the house. A shadow has a soft
// edge. No page: the lights and the dome are three.js's own, and are made without a browser.
import {
  BackSide,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
} from 'three';

// The soft light comes from everywhere, more of it from the sky than from the ground. The light
// from one side comes from the front, from above and from the left of one who stands in front:
// `from` is where it stands, and it shines at the middle.
const SOFT = { sky: '#ffffff', ground: '#9aa5b1' };
const SIDE = { colour: '#ffffff', from: [5.5, 7.8, 3] };
// How strong the two are for the volumes, by three.js's measure. Set by eye: the top of a box
// shows in the colour it was given, each of its sides in a darker one - the front lighter than
// the left, and both lighter than the two that face away - and none is black.
const VOLUMES = { soft: 1.6, side: 2.2 };
/**
 * How strong the two are by the sun, where the house is white and has no line along an edge. Set
 * by eye, on the made-up house from the front, from the side the sun stands on and from above,
 * over a plot that runs to the south-west and over one that runs to the south-east: a roof is
 * white, the two sides the sun reaches are a lighter and a darker white, and what the sun does
 * not reach is a grey - four tones, `TOLD_APART` from each other at the least (`lightOn`). A
 * stronger soft light makes the shade a paler grey, and a weaker sun takes as much from the
 * shadows, which are what it is there for.
 */
export const SUNLIT = { soft: 1.0, side: 2.6 };
/**
 * How far apart two faces are in the light they get, at the least, for the eye to tell them
 * apart with no line between them: a share of the most that a white face can show, in red, in
 * green and in blue. It is what was seen to be enough, and no less was tried: so far apart are
 * a roof and the lighter of two walls in the sun, on a plot that runs to the south-east.
 */
export const TOLD_APART = 0.14;
/**
 * How strong the two are by the sun, where the house stands in its surfaces: a softer pair. Set
 * by eye, on the made-up house in the colours of scene/surfaces.js, from every stand and from
 * above with a storey taken off, over a plot that runs to the south-west and over one that runs
 * to the south-east. A floor in the sun gets all but the whole of what a face can show, and no
 * more: it shows the colour its surface was given, and is not burnt out. And a wall the sun
 * does not reach gets `IN_SHADE` of that at the least, for its colour to last: by White's
 * strengths plaster in the shade was a dark grey, and a floor of wood in a shadow a dark brown,
 * in rooms that lie half in shadow once a storey is taken off. What that costs is the shadows:
 * a shadow on a floor is half as light as the floor, where in White it is a third.
 */
export const SURFACED = { soft: 1.5, side: 2.3 };
/**
 * The share of the light of a floor in the sun that a wall in the shade gets at the least, where
 * the house stands in its surfaces: on the screen that is some six tenths of the floor's level,
 * and a colour is the colour it was given, darker. It is what was seen to do: less was White's.
 */
export const IN_SHADE = 0.3;
/**
 * What lies behind the stage. For the volumes, the grey that lies around the paper in the pad's
 * other views. By the sun, a darker grey: no line runs along the edge of a white house, and
 * against the lighter one a wall in the sun was lost - it is as light. So this one is darker
 * than every face the sun reaches, by `TOLD_APART` at the least, and lighter than what the sun
 * does not reach, by half of that - which is as much on the screen, where the shade lies: a
 * roof and each wall stand clear of it, from whichever side. Between a darker and a lighter
 * wall in the sun there is no room for it: on the made-up plot they are too near each other.
 *
 * Where the house stands in its surfaces, a quiet sky - behind the dome of `SKY`, and seen
 * where that is not drawn. That grey would not do there: with a
 * soft light strong enough for a colour to last, plaster in the shade is that grey. A wall is
 * anything from its shade to its colour, by the angle the sun meets it at, so no backdrop is
 * lighter or darker than every wall - but a blue is none of the colours a house is built in.
 * This one is told from plaster in the sun and out of it, and from a roof, by `TOLD_APART` at
 * the least in red, in green or in blue.
 */
export const BACKDROP = { volumes: '#e5e7eb', sunlit: '#94989c', surfaced: '#b4c7d9' };
/**
 * The sky over a house in its surfaces (ST-033): a pale blue at the horizon and below it, and a
 * deeper one straight above, blended upward - and `BACKDROP.surfaced` behind it, where nothing
 * of the dome shows. Set by eye on the made-up house from every stand, against plaster, which is
 * a warm white, and a roof of concrete, a warm grey. Each is a blue whose red lies three tenths
 * of the light of white under its blue at the least, and so do the blues between them: a grey or
 * a warm white, however light, is told from each by `TOLD_APART` at the least in red or in blue
 * - which surfaced.check.js holds of plaster and a roof, in the sun and out of it.
 */
export const SKY = { horizon: '#c2d8ed', zenith: '#89b2e1' };
// How the sky turns from the horizon to the zenith, by how high a point of it stands: its share
// of the zenith is how high it looks, to this power - under one, so the pale band lies low and
// most of what shows over a house is blue. And the dome: so far off that the hill lies inside it,
// and as near as the camera sees (stage.js), in so many points around and up; drawn before
// everything else, whose first is the ground at -3 (build.js), and over by all of it.
const SKY_TURNS = 0.6;
const DOME = { radiusM: 1000, around: 48, up: 24, order: -100 };
// The shadows are worked out on a map: a picture of what the sun sees, `points` along either
// side, laid over the square that the sun is told. A place is in the shade where the map has
// something nearer to the sun than the place lies - `bias` nearer still, as a share of how deep
// the map reaches - and it is looked up `normalBias` metres off its face: two centimetres, so
// that the edge of one thing that lies in the face of another - a staircase as high as its room,
// under the roof - draws no dotted line of shade on that face. Set on pictures drawn in software
// and by a graphics card. Into the map three.js draws the faces that look away from the sun: a
// face in the sun is never in its own shade, and needs no `bias` - as long as every shape that
// casts is closed (shapes.js). Its edge is soft: three.js looks a place up at points around it,
// `radius` points of the map off, and it lies the more in shade, the more of them are. Where the
// sun sees 30 m across, a point is 7 mm, and the edge some four centimetres wide; set by eye,
// for more is grainy. The map's type, which this asks for, is the stage's to set (stage.js).
const SHADOW = { points: 4096, bias: 0, normalBias: 0.02, radius: 3 };

/**
 * The light that a white face gets by the way it looks, as three.js works it out for a face that
 * lies in no shadow: `[red, green, blue]`, each a share of the most a white face can show. At 1
 * the face is as white as the screen has it; over 1 it is burnt out, and shows no more than at 1.
 *
 * `looks` is the way the face looks and `toward` the way to the sun, each `[x, y, h]` of length
 * one in the plot's frame, where h is up. `strengths` are the two lights', `{ soft, side }` - by
 * the sun's own, unless it is told others.
 *
 * Of the soft light a face gets the sky's colour where it looks straight up, the ground's where
 * it looks straight down, and between the two by how far up it looks: half of each, where it
 * stands upright. Of the sun it gets the cosine of the angle between the two ways, and nothing
 * where it looks away. A face spreads what falls on it all round, and shows one part in pi of
 * it: a light as strong as pi, straight on, is all that a white face can show.
 */
export function lightOn(looks, toward, { soft, side } = SUNLIT) {
  const [sky, ground, sun] = [SOFT.sky, SOFT.ground, SIDE.colour].map((hex) =>
    new Color(hex).toArray(),
  );
  const up = (looks[2] + 1) / 2;
  const facing = Math.max(0, looks[0] * toward[0] + looks[1] * toward[1] + looks[2] * toward[2]);
  return sky.map(
    (above, channel) =>
      (soft * (ground[channel] + (above - ground[channel]) * up) + side * facing * sun[channel]) /
      Math.PI,
  );
}

/**
 * The sky's colour where a point of it stands so high: `up` is the sine of how far over the
 * horizon it lies, seen from the middle of the dome - 0 at the horizon, 1 straight above. Below
 * the horizon it is the horizon's. A Color of three.js, in light, as three.js works with it.
 */
export function skyAt(up) {
  const share = Math.min(1, Math.max(0, up)) ** SKY_TURNS;
  return new Color(SKY.horizon).lerp(new Color(SKY.zenith), share);
}

/**
 * The dome of the sky: a ball seen from inside, in the colours of `skyAt` - one a point, by how
 * high it stands on the ball - in no light, casting and taking no shadow, and drawn before
 * everything, behind it all. Its middle is the stage's to keep at the camera, so that no view
 * leaves it and the horizon lies level with the eye.
 */
function domeOfSky() {
  const ball = new SphereGeometry(DOME.radiusM, DOME.around, DOME.up);
  const { array } = ball.getAttribute('position');
  const colours = [];
  for (let at = 1; at < array.length; at += 3) {
    colours.push(...skyAt(array[at] / DOME.radiusM).toArray());
  }
  ball.setAttribute('color', new Float32BufferAttribute(colours, 3));
  const face = new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false });
  Object.assign(face, { depthTest: false, depthWrite: false });
  const dome = new Mesh(ball, face);
  Object.assign(dome, { name: 'sky', renderOrder: DOME.order, frustumCulled: false });
  Object.assign(dome, { castShadow: false, receiveShadow: false });
  return dome;
}

/**
 * Makes the lights, and gives `{ lights, shine, backdrop, sky }`. `lights` is what a stage adds
 * to its scene: the soft light, the light from one side, the place that one shines at, and the
 * dome of the sky - which is `sky` too, for the stage to keep it at its camera. `backdrop` is
 * the colour a stage has behind its scene: `shine` sets it with the lights.
 *
 * `shine()` lights the stage for the volumes: the two lights as they always were, no shadow,
 * and the backdrop that the stage always had. `shine({ from, at, reach, shadows, surfaces })`
 * lights it by the sun: the light from one side stands at `from` and shines at `at`, each
 * `[x, y, z]` of the stage. Where `shadows` is on, it casts the shadows of all that lies within
 * `reach` of the line through the two, and what takes them lies no further from `at` than `from`
 * does, on either side of it. The two are as strong as `SUNLIT` says, before the backdrop that
 * a white house stands clear of - or, where `surfaces` says that the house stands there in its
 * surfaces, as strong as `SURFACED` says, under the sky: the dome shows there, and nowhere
 * else. It says whether the sun casts its shadows: true or false. No drawing is asked for here.
 */
export function openLights() {
  const soft = new HemisphereLight(SOFT.sky, SOFT.ground, VOLUMES.soft);
  const side = new DirectionalLight(SIDE.colour, VOLUMES.side);
  // Which colour it is, `shine` says below, with the strengths.
  const backdrop = new Color();
  const { shadow } = side;
  shadow.mapSize.set(SHADOW.points, SHADOW.points);
  shadow.bias = SHADOW.bias;
  shadow.normalBias = SHADOW.normalBias;
  shadow.radius = SHADOW.radius;
  const sky = domeOfSky();

  function shine(sun = null) {
    const volumes = { from: SIDE.from, at: [0, 0, 0], shadows: false };
    const { from, at, reach, shadows = true, surfaces = false } = sun ?? volumes;
    const lit = sun === null ? 'volumes' : surfaces ? 'surfaced' : 'sunlit';
    const strengths = { volumes: VOLUMES, sunlit: SUNLIT, surfaced: SURFACED }[lit];
    [soft.intensity, side.intensity] = [strengths.soft, strengths.side];
    backdrop.set(BACKDROP[lit]);
    sky.visible = lit === 'surfaced';
    side.position.set(...from);
    side.target.position.set(...at);
    side.castShadow = shadows;
    if (sun === null) return false;
    // What the sun sees: a square of `reach` to either side of its line of sight, from where it
    // stands to as far behind `at` as it stands in front of it.
    const far = 2 * Math.hypot(...from.map((value, axis) => value - at[axis]));
    Object.assign(shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach });
    Object.assign(shadow.camera, { near: 0, far });
    shadow.camera.updateProjectionMatrix();
    return shadows;
  }

  shine();
  return { lights: [soft, side, side.target, sky], shine, backdrop, sky };
}
