// The stage's check, as far as it goes with no browser: a drawing is done when it was asked
// for, once a frame and never unasked; the shape of the picture is the shape of its place, and
// a square where the place has no size yet; and where the browser gives no WebGL, no stage opens
// and three.js is asked for nothing. Loading stage.js here also proves that three.js, its orbit
// controls and the addons of the shade in corners are there for the pad, under every name
// stage.js asks them for - and that it is the three.js the pad's manifest names. The shade in
// corners is worked out as it was set, darkens and never lightens, and is laid on the canvas
// once, over its drawing, and never empties it; it is cut by the plane it is handed, and blind
// to what lies under the ground (`UNDER`), which the camera sees again once it has drawn. What
// is drawn, and that it turns, is the browser test's: tests/e2e/sketch-3d.spec.ts. What a stand
// makes of the shape is fit.check.js's. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  CustomBlending,
  DstColorFactor,
  OneFactor,
  PerspectiveCamera,
  Plane,
  REVISION,
  Scene,
  Vector3,
  ZeroFactor,
} from 'three';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { GTAOBlendShader } from 'three/addons/shaders/GTAOShader.js';
import { CORNERS, UNDER, cornersOf, onDemand, openStage, shapeOf } from './stage.js';

// A browser's frames, made up: `frame` takes what is to be done at the next one, as
// requestAnimationFrame does, and `comes()` is that frame coming.
const waiting = [];
const frame = (work) => waiting.push(work);
const comes = () => waiting.splice(0).forEach((work) => work());
let drawings = 0;
const draw = onDemand(frame, () => {
  drawings += 1;
});

// Nothing is drawn unasked: no frame is asked for, and a frame that comes draws nothing.
comes();
assert.deepEqual([waiting.length, drawings], [0, 0]);
// Asked three times before the frame comes: one frame is asked for, and one drawing is done -
// at the frame, not before it.
draw();
draw();
draw();
assert.deepEqual([waiting.length, drawings], [1, 0]);
comes();
assert.deepEqual([waiting.length, drawings], [0, 1]);
// And then no more, whatever frames come: no loop.
comes();
comes();
assert.deepEqual([waiting.length, drawings], [0, 1]);
// Asked again, it draws again, once.
draw();
comes();
assert.deepEqual([waiting.length, drawings], [0, 2]);

// A change made while a drawing is done is drawn at the frame after, and not forgotten.
let changes = 1;
const redraw = onDemand(frame, () => {
  drawings += 1;
  if (changes > 0) redraw();
  changes -= 1;
});
redraw();
comes();
assert.deepEqual([waiting.length, drawings], [1, 3]);
comes();
assert.deepEqual([waiting.length, drawings], [0, 4]);
// And a drawing that fails does not keep the next one from being asked for.
const failing = onDemand(frame, () => {
  throw new Error('a made-up failure');
});
failing();
assert.throws(comes, /a made-up failure/);
failing();
assert.equal(waiting.length, 1);

// The shape of the picture is the shape of the place it is drawn into, as wide for its height:
// a window of 1440 by 861 is 1.672 wide for its height, one of 430 by 860 is half as wide as
// high. A place that has no size yet - no width, no height, or neither - counts as a square, so
// that a view can be fitted to it before it shows.
assert.equal(shapeOf({ clientWidth: 1440, clientHeight: 861 }), 1440 / 861);
assert.ok(Math.abs(shapeOf({ clientWidth: 1440, clientHeight: 861 }) - 1.672) < 0.0005);
assert.equal(shapeOf({ clientWidth: 430, clientHeight: 860 }), 0.5);
assert.deepEqual(
  [
    [0, 0],
    [1440, 0],
    [0, 861],
  ].map(([clientWidth, clientHeight]) => shapeOf({ clientWidth, clientHeight })),
  [1, 1, 1],
);

// Where the browser gives no WebGL 2, no stage opens: the canvas is asked, once, and that is
// all - nothing is put into the page, and three.js is not left to say so as an error.
const asked = [];
const place = { append: () => asked.push('append') };
globalThis.document = {
  createElement(tag) {
    asked.push(`createElement ${tag}`);
    return {
      getContext(kind) {
        asked.push(`getContext ${kind}`);
        return null;
      },
    };
  },
};
assert.equal(openStage(place), null);
assert.deepEqual(asked, ['createElement canvas', 'getContext webgl2']);

// three.js is the pad's one dependency, at one exact version, and the one this check loaded is
// that one: version 0.186.1 is revision 186.
const manifest = path.join(import.meta.dirname, '..', 'package.json');
const { dependencies } = JSON.parse(readFileSync(manifest, 'utf8'));
assert.deepEqual(Object.keys(dependencies), ['three']);
assert.match(dependencies.three, /^0\.\d+\.\d+$/, 'three.js is not at one exact version');
assert.equal(dependencies.three.split('.')[1], REVISION);

// The shade in corners, under the names stage.js asks for its parts - each a thing three.js
// makes. Its share, by which a corner darkens, is more than none and no more than all; and it
// looks some decimetres round a place, so a corner darkens, and the middle of a room does not.
for (const [name, made] of Object.entries({ GTAOPass, FullScreenQuad })) {
  assert.deepEqual([typeof made, made.name], ['function', name]);
}
assert.equal(GTAOBlendShader.name, 'GTAOBlendShader');
assert.ok(CORNERS.strength > 0 && CORNERS.strength <= 1, 'the corners lighten');
assert.ok(CORNERS.reachM > 0.1 && CORNERS.reachM < 1, 'the corners reach into the room');
// Made with no browser: the pass looks as far as was set, for the scene and the camera of the
// stage, and puts what it works out nowhere itself. What is laid on the canvas is a colour times
// the share of it - the pixel's own, times the laid one, plus none of the pixel - and so never
// lighter, as the laid one is one less a share of the shade, at most one; and how opaque the
// pixel is, it takes none of the laid one's, and all of its own.
const [scene, camera] = [new Scene(), new PerspectiveCamera()];
const { found, laid, setSize, cut } = cornersOf(null, scene, camera);
assert.deepEqual([found.scene, found.camera], [scene, camera]);
assert.equal(found.gtaoMaterial.uniforms.radius.value, CORNERS.reachM);
assert.equal(found.output, GTAOPass.OUTPUT.Off);
// It smooths by the noise it shades with, worked out the same at every load - and not by one it
// draws at random, which would make two loads of a page two pictures.
const { tNoise } = found.pdMaterial.uniforms;
assert.equal(tNoise.value, found.gtaoMaterial.uniforms.tNoise.value);
assert.deepEqual(
  [laid.blending, laid.blendSrc, laid.blendDst, laid.blendSrcAlpha, laid.blendDstAlpha],
  [CustomBlending, DstColorFactor, ZeroFactor, ZeroFactor, OneFactor],
);
assert.deepEqual([laid.uniforms.intensity.value, laid.depthTest], [CORNERS.strength, false]);
setSize(600, 400);
assert.deepEqual([found.width, found.height], [600, 400]);
// Where the house is opened along a slice (sliced.js), the pass draws the depth and the way each
// face looks cut by that plane - by its own material, which stands in for every one of the
// scene's - so what was taken away shades nothing; closed, by none, as before.
const plane = new Plane(new Vector3(-1, 0, 0), 12);
assert.equal(found.normalMaterial.clippingPlanes, null);
cut(plane);
assert.deepEqual(found.normalMaterial.clippingPlanes, [plane]);
cut(null);
assert.equal(found.normalMaterial.clippingPlanes, null);
// Laid on by a made-up renderer that says what it is asked: the pass draws into its own
// pictures, and the canvas is drawn on once - last, over what it holds, never emptied, and the
// renderer is left emptying a canvas before a drawing, as it was. The pass draws the scene with
// the stage's camera blind to what lies under the ground (`UNDER`), the skirts: it draws them in
// its own material, with no offset to keep them behind the ground, and each edge of a far square
// shaded a dot of a corner (T-042.5's Look). The camera sees them again once it has drawn.
const [heard, under] = [[], []];
camera.layers.enable(UNDER);
const kept = { autoClear: true, on: 'canvas' };
const renderer = new Proxy(kept, {
  get: (made, name) =>
    name === 'autoClear'
      ? made.autoClear
      : (...told) => {
          if (name === 'setRenderTarget') made.on = told[0] === null ? 'canvas' : 'its own';
          if (name === 'clear' || name === 'render') heard.push(`${name} ${made.on}`);
          if (name === 'render' && made.on === 'canvas') heard.push(`emptied ${made.autoClear}`);
          if (name === 'render' && told[1] === camera) under.push(camera.layers.isEnabled(UNDER));
          return name === 'getClearColor' ? told[0] : 1;
        },
});
cornersOf(renderer, scene, camera).shade();
assert.ok(heard.length > 2 && heard.slice(0, -2).every((one) => one.endsWith('its own')), heard);
assert.deepEqual([heard.slice(-2), kept.autoClear], [['render canvas', 'emptied false'], true]);
assert.ok(under.length > 0 && !under.includes(true), `${under}`);
assert.ok(camera.layers.isEnabled(UNDER) && camera.layers.isEnabled(0));

process.stdout.write(
  'tools/sketch/view3d: the stage draws when it is asked and never in a loop, and opens none without WebGL\n',
);
