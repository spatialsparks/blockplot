// The stage of the sketch pad's 3D view: a renderer, a camera that looks at a middle, orbit
// controls to turn it with, a soft light and a light from one side before a backdrop, and a sky
// where the house stands in its surfaces (lights.js). What stands on it is its caller's to add.
// It draws when something changed - its place resized, the view turned, its caller asked - and
// never in a loop. It is drawn on the canvas as it always was; and where the sun shines with
// its shadows, three.js's ground-truth ambient occlusion shades its corners - where a wall meets
// a floor, under a sofa - a little, laid over that drawing. A length is in metres: a unit of
// three.js is one, and y is up. The front of what stands on it is the side of the large x
// (frame.js). And it gives a picture of itself as it shows, when it is asked for one.
import {
  CustomBlending,
  DstColorFactor,
  OneFactor,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderer,
  ZeroFactor,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { GTAOBlendShader } from 'three/addons/shaders/GTAOShader.js';
import { openLights } from './lights.js';

// How much the camera takes in from the bottom of the picture to its top, in degrees; and how
// near and how far a thing may be to show, in metres - further where more is drawn (`sightOf`).
const FIELD_DEG = 45;
export const SIGHT_M = [0.1, 2000];

/**
 * How far the camera sees, in metres, where a box `{ min, max }` holds all that is drawn: twice
 * across it, so it reaches every point of it from wherever the camera is fitted to the sketch
 * within it (ST-042) - and never less than `SIGHT_M` says.
 */
export const sightOf = ({ min, max }) =>
  Math.max(SIGHT_M[1], 2 * Math.hypot(...min.map((low, axis) => max[axis] - low)));
/**
 * The layer of three.js that what lies under the ground to close it - the skirts of near grids
 * and far squares (build.js, ST-042) - is on alone. The camera sees it; the shade in corners does
 * not: it draws the depth in a material of its own, with no offset to keep a skirt behind the
 * ground, and a skirt's top, as near as the ground's edge, shaded a dot of a corner wherever it
 * came first.
 */
export const UNDER = 1;
// Where the camera stands until it is stood elsewhere: in front of the middle, above it and to
// its left, in metres.
const EYE_M = [11, 6, 7];
// How far the view turns downward, from straight above: to level with its middle, and no
// further. It never looks up at the house from under it.
const LEVEL = Math.PI / 2;
/**
 * The shade in corners, three.js's ground-truth ambient occlusion: how far round a place it looks
 * for what hides the sky from it, in metres - so a corner darkens over a hand or two, and a room
 * not at all in its middle - and how much of the darkness it finds is laid on the picture, a
 * share. Set by eye on the made-up house, in White and in Materials, from the front and from
 * above: a corner a little darker, never a black seam. It darkens and never lightens.
 */
export const CORNERS = { reachM: 0.5, strength: 0.7 };
// How finely the shade in corners is worked out: so many samples a pixel, and so many - so many
// pixels round - to smooth it with. Set by eye, against a grain on a floor: more costs more.
const FINE = { samples: 24, smoothed: 32, smoothedPx: 12 };

/**
 * Has `draw` done at the next frame after it was asked for - once, however often it was asked
 * before that frame came - and never unasked: a drawing when something changed, and no loop.
 * `frame` is the browser's requestAnimationFrame.
 */
export function onDemand(frame, draw) {
  let asked = false;
  return () => {
    if (asked) return;
    asked = true;
    frame(() => {
      asked = false;
      draw();
    });
  };
}

/**
 * How wide a place of the page is for its height: the shape of the picture that is drawn into
 * it. A place that has no size yet counts as a square.
 */
export const shapeOf = ({ clientWidth: width, clientHeight: height }) =>
  width > 0 && height > 0 ? width / height : 1;

/**
 * Opens the stage in `place`, an element of the page, which it fills - or opens none, and
 * returns null, where the browser gives no WebGL 2: three.js draws with nothing else.
 *
 * The stage is `{ scene, camera, controls, draw, field, stand, looking, light, cut, picture }`.
 * Add to `scene` what is to be seen, and call `draw()` after every change to it: the drawing is done at
 * the next frame. `stand(eye, target)` stands the camera at `eye`, looking at `target` - each
 * `[x, y, z]` - and `target` is then the middle that the view turns about; `looking()` is where
 * it stands by now, as `{ eye, target }`: what `stand` would take to stand it there again.
 * `field()` is what the camera takes in as its place is shaped now, before the first drawing
 * too: `deg`, from the bottom of the picture to its top, in degrees, and `shape`, how wide the
 * picture is for its height - what a stand is fitted to (fit.js). `controls.target` is the
 * middle: after moving it or the camera by hand, call `controls.update()`. `light(sun)` lights
 * the stage - for the volumes with nothing told, and by the sun where it is told one - as
 * `shine` of lights.js does, and with the lights the backdrop behind the scene is the volumes'
 * or the sun's, and the sky shows where the house stands in its surfaces; a drawing is the
 * caller's to ask for. Where the sun casts its shadows - White and Materials, with "Shadows" on
 * - the corners of a drawing are shaded, over it; elsewhere it is as it always was. Either way a
 * drawing is one picture on the canvas. `drawn` is called after every drawing. `cut(plane)`
 * hands the shade in corners the plane of three.js that what stands is cut by - or null, for none
 * (sliced.js): what was taken away shades nothing. A drawing is the caller's to ask for.
 *
 * `picture()` is the stage as it shows: a promise of a PNG, as a Blob - a pixel of it for each
 * of the canvas's own, which are the screen's - or of null, where the browser gives none.
 */
export function openStage(place, drawn = () => {}) {
  const { document, requestAnimationFrame, ResizeObserver } = globalThis;
  const canvas = document.createElement('canvas');
  // Asked of the canvas here, and handed to three.js. Left to ask for itself, three.js says so
  // as an error on the console where the browser gives none - and the page says it in words.
  const context = canvas.getContext('webgl2', { antialias: true });
  if (context === null) return null;
  // In the page before the controls are made: they listen for keys on the document it is in.
  place.append(canvas);

  const renderer = new WebGLRenderer({ canvas, context, antialias: true });
  // Shadows are worked out wherever a light casts them: for the volumes none does, and nothing
  // is worked out. Their map is looked up around a place, and its edge is soft (lights.js):
  // three.js 0.186 has no other soft map, and turns one that asks for its old one into this.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  // A material may be cut by a plane of its own: what stands, where the house is opened along a
  // slice (sliced.js). With no plane on any, a drawing is as it was.
  renderer.localClippingEnabled = true;
  const scene = new Scene();
  // Behind everything, the backdrop: the lights' to say, for it changes with them - and the
  // dome of the sky, which shows where they say.
  const { lights, shine, backdrop, sky } = openLights();
  scene.background = backdrop;
  scene.add(...lights);
  const camera = new PerspectiveCamera(FIELD_DEG, 1, ...SIGHT_M);
  camera.position.set(...EYE_M);
  camera.layers.enable(UNDER);
  const corners = cornersOf(renderer, scene, camera);
  // Whether the sun casts its shadows now, and the corners are shaded.
  let shaded = false;
  const light = (sun) => {
    shaded = shine(sun);
  };
  // The controls turn the camera to their target, the middle: a drag turns the view about it,
  // the wheel comes nearer, a drag with the right button moves it. The view turns all the way
  // round, and from straight above down to level.
  const controls = new OrbitControls(camera, canvas);
  controls.cursorStyle = 'grab';
  controls.maxPolarAngle = LEVEL;

  // Nothing is drawn before the stage has the size of its place: the observer below says so at
  // once where the place shows, and again whenever its size changes. In a tab that does not show
  // it says nothing: no frame comes there, nothing is drawn, and `drawn` is not called.
  let sized = false;
  const show = () => {
    if (!sized) return;
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
    if (shaded) corners.shade();
    drawn();
  };
  const draw = onDemand(requestAnimationFrame, show);
  controls.addEventListener('change', draw);
  // The stage fills its place, a pixel of the screen for each of its own. A new size empties
  // the canvas: it is drawn again at once, before the browser shows it, and not a frame later.
  // The page's stylesheet sizes the canvas (3d.html): three.js is told the size, and no style.
  new ResizeObserver(() => {
    const { clientWidth: width, clientHeight: height } = place;
    if (width === 0 || height === 0) return;
    renderer.setPixelRatio(globalThis.devicePixelRatio);
    renderer.setSize(width, height, false);
    corners.setSize(width * globalThis.devicePixelRatio, height * globalThis.devicePixelRatio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    sized = true;
    show();
  }).observe(place);

  // Asked of the place, not of the camera: the camera learns its shape with the first drawing,
  // and whoever stands it somewhere before that has to know how much it will take in.
  const field = () => ({ deg: camera.fov, shape: shapeOf(place) });
  // The controls say that the view changed, and so it is drawn.
  const stand = (eye, target) => {
    camera.position.set(...eye);
    controls.target.set(...target);
    controls.update();
  };
  const looking = () => ({ eye: camera.position.toArray(), target: controls.target.toArray() });
  // The canvas keeps no drawing between two frames: asked for its picture later, it gives an
  // empty one. So the stage is drawn here, now - its corners shaded where they are - and the
  // canvas asked before this turn ends: what it then holds, it writes as a PNG in its own time.
  const picture = () =>
    new Promise((taken) => {
      show();
      canvas.toBlob(taken);
    });
  const { cut } = corners;
  // The camera sees all that is drawn: as far as `sightOf` says of the box that holds it.
  const sight = (box) => {
    camera.far = sightOf(box);
    camera.updateProjectionMatrix();
  };
  return { scene, camera, controls, draw, field, stand, looking, light, cut, picture, sight };
}

/**
 * The shade in corners, made once: three.js's pass works out how much of the sky each pixel's
 * place is hidden from, from the scene as the camera sees it, into pictures of its own - and
 * puts none of them anywhere. `shade()` lays that on the canvas, over what the renderer drew
 * there: each colour times one less a share of the shade, `CORNERS.strength` of it. It darkens
 * and never lightens, and leaves how opaque a pixel is as it was. So the canvas is drawn as it
 * always was, antialiased as it always was, and emptied once a drawing. `setSize` takes the
 * canvas's own pixels. `cut(plane)` cuts the scene as the pass draws its depth and the way each
 * face looks - with a material of its own, which stands in for every one of the scene's - by a
 * plane of three.js, or by none where it is null: where the house is opened along a slice, what
 * was taken away hides no sky from what is left (sliced.js).
 */
export function cornersOf(renderer, scene, camera) {
  const found = new GTAOPass(scene, camera);
  found.output = GTAOPass.OUTPUT.Off;
  found.updateGtaoMaterial({ radius: CORNERS.reachM, samples: FINE.samples });
  found.updatePdMaterial({ samples: FINE.smoothed, radius: FINE.smoothedPx });
  // It smooths by a noise of its own, which it draws anew, at random, wherever the page is
  // loaded: the same page would show two pictures. It smooths by the noise it shades with, which
  // is worked out the same every time.
  found.pdMaterial.uniforms.tNoise.value = found.gtaoMaterial.uniforms.tNoise.value;
  const { vertexShader, fragmentShader, uniforms } = GTAOBlendShader;
  const laid = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: UniformsUtils.clone(uniforms),
    ...{ transparent: true, depthTest: false, depthWrite: false, blending: CustomBlending },
    ...{ blendSrc: DstColorFactor, blendDst: ZeroFactor },
    ...{ blendSrcAlpha: ZeroFactor, blendDstAlpha: OneFactor },
  });
  laid.uniforms.intensity.value = CORNERS.strength;
  const over = new FullScreenQuad(laid);
  function shade() {
    const seen = camera.layers.mask;
    camera.layers.disable(UNDER);
    found.render(renderer);
    camera.layers.mask = seen;
    laid.uniforms.tDiffuse.value = found.gtaoMap;
    renderer.setRenderTarget(null);
    const clears = renderer.autoClear;
    renderer.autoClear = false;
    over.render(renderer);
    renderer.autoClear = clears;
  }
  const setSize = (width, height) => found.setSize(width, height);
  const cut = (plane) => {
    found.normalMaterial.clippingPlanes = plane && [plane];
  };
  return { found, laid, shade, setSize, cut };
}
