// The view of the sketch on the stage: a scene is stood on it, in the place of the one that
// stood there, in a way of showing, cut at a level and with its ground or without. The first
// scene is seen from where the tab was looking the last time, or - the first time - from the
// front: from below the house, looking up the slope. Every later one is seen from where the view
// was looking by then: nothing a change in the sketch does moves the camera. A stand does: it
// puts the view on the line of sight of a station, as near as the window lets it. And where the
// tab opens the house along a slice of the pad, what stands is cut along it (sliced.js).
import { BASE_BELOW_M } from '../scene/ground.js';
import { shownBy } from '../scene/shows.js';
import { stations } from '../scene/stations.js';
import { build, casts } from './build.js';
import { fitted } from './fit.js';
import { frameOf } from './frame.js';
import { meshesOf, opaque } from './meshes.js';
import { wayOf } from './showing.js';
import { opened, planeOf } from './sliced.js';

/** The box around some things of a scene, each with its `min` and `max` - or `otherwise`, where there are none. */
function boxAround(things, otherwise) {
  if (things.length === 0) return otherwise;
  const reach = (pick, end, from) =>
    [0, 1, 2].map((axis) => things.reduce((most, thing) => pick(most, thing[end][axis]), from));
  return { min: reach(Math.min, 'min', Infinity), max: reach(Math.max, 'max', -Infinity) };
}

/**
 * What a stand has in view: the house, and not the whole paper. It is the box around the scene's
 * blocks alone - a tree or a car at the edge of the plot is no part of the house, and does not
 * push it away - and the scene's own box, its ground's, where it has no block. So a tree
 * downhill of the house stands between the eye and the house at the front, and large, for the
 * eye is near; and one beside the house is cut off by the edge of the picture.
 */
const houseOf = ({ solids, box }) =>
  boxAround(
    solids.filter((solid) => solid.kind === undefined),
    box,
  );

/** How far a box reaches, from one corner to the one across it. */
const across = ({ min, max }) => Math.hypot(...min.map((low, axis) => max[axis] - low));

/**
 * Where the sun stands over a scene, in the plot's frame: `{ eye, target, reach }`. Its shadows
 * are worked out for what casts one - the box around every part that is not see-through, or,
 * where the solids stand there and not the `parts`, around every solid that is not: a tree
 * beside the house as the house - and not for the whole paper: it shines at the middle of that
 * box, from the way `toward` points, and `reach` is how far the box reaches from its middle. It
 * stands so far off that all of the scene, down to the base of its hill, lies nearer to that
 * middle than it does: whatever a shadow falls on.
 */
function sunOver(scene, toward, parts) {
  const casting = boxAround(
    parts ? scene.parts.filter(opaque) : scene.solids.filter(casts),
    scene.box,
  );
  const target = casting.min.map((low, axis) => (low + casting.max[axis]) / 2);
  const off = across(scene.box) + BASE_BELOW_M;
  return {
    eye: target.map((at, axis) => at + off * toward[axis]),
    target,
    reach: across(casting) / 2,
  };
}

/**
 * Opens the view on a stage (stage.js), and gives `{ show, stand, looking }`.
 *
 * `show(scene, { cut, ground, way, shadows, off, along })` puts the scene on the stage, takes off the
 * one before, has the stage lit and drawn, and returns what stands there now: what build.js
 * gave, and `parts`, the meshes of the scene's parts (meshes.js) - none, where the solids stand
 * there. `way` is the way it is shown in, by its name (`WAYS` of showing.js), and the volumes
 * where it is none. What shows is what `shownBy` gives (scene/shows.js): what the cut shows -
 * 'all', or a level - less what `off`, the tab's switches, takes away (story ST-033), each
 * whole or not at all. In the volumes its solids stand on the stage, and those show. In a way
 * that shows the parts of the house - White, and Materials - they stand there in the solids'
 * place, and no solid: the parts that show, so that the storey a level stops at has no roof -
 * built anew where the cut or `off` changed since the last, as a few meshes, white or each in
 * its surface as the way says. The land - the ground and its outline - shows where `ground` is
 * on, whatever is switched off. In a way that is lit by the sun, the stage's light from one side
 * is the sun, put on the stage by the frame, and casts shadows unless `shadows` is off; in any
 * other, the stage is lit as it always was. The same scene shown again in the same way -
 * without its ground or its shadows, and its solids at another cut - is not built anew.
 *
 * `along` opens the house along a slice of the pad (story ST-033): what `openAlong` of
 * scene/shows.js gave, `{ axis, at, keeps }`, or null - the house whole. Its plane (`planeOf`)
 * is put on what stands, built or raised, by `opened`: the solids or the parts and the land are
 * cut through, and dark inside where they are cut. The stage is handed the plane, `cut(plane)`,
 * for its shade in corners - where it changed, and so never where no house was ever opened. It
 * moves no camera, and builds nothing anew: a slice moved in the pad is a new `along`.
 *
 * The frame is the first scene's, and stays: a later scene is drawn in the same frame, though a
 * block that reaches lower than all before it would give it another - or the house would jump
 * in a view that was looking at it. The first scene is seen from `look` - `{ eye, target }` in
 * the plot's frame, where a tab kept one - and else from the front.
 *
 * `sun` is the way to the sun in the plot's frame, `[x, y, h]` of length one (scene/sun.js):
 * a view that shows nothing in sunlight needs none.
 *
 * `stand(name)` puts the view at a stand of the scene that stands there: `front`, `back`,
 * `left`, `right` or `above`. It looks the way the station of that name looks (stations.js),
 * from where the house lies in the middle of the picture and fills it, as the window is shaped
 * now (fit.js): the house is in view, whole, and little else is - whatever is cut, and with
 * the ground or without. The view then turns about a place in the house.
 *
 * `looking()` is where the view looks by now, as `{ eye, target }` in the plot's frame: what a
 * later page takes as `look`. Null before a scene was shown.
 */
export function openView(stage, look = null, sun = null) {
  let place = null;
  // The scene that stands on the stage, the way it is shown in, and what was built of it.
  let stood = null;
  let shownAs = null;
  let standing = null;
  // The parts that stand there, where the way shows them, and the cut they were built for.
  let raised = null;
  let raisedAt = null;
  // The plane the house is opened along, and where it runs, as one text: none, the first time.
  let plane = null;
  let planeAt = 'null';

  function stand(name) {
    if (stood === null) return;
    const box = houseOf(stood);
    // Of the station, the way it looks is taken: how far off the eye stands is the window's. Its
    // `up` is not handed on: the stage's controls turn about the stage's y whatever a camera
    // says, and from straight above they leave x to the right and the plot's y up the picture.
    const { eye, target } = fitted(stations({ box })[name], box, stage.field());
    stage.stand(place(eye), place(target));
  }

  /** The stage's light for a scene in a way: the sun where the way has one, put on the stage - and whether it shines on a house in its surfaces, and not on a white one. */
  function lit(scene, way, shadows) {
    if (!way.sun) return null;
    const { eye, target, reach } = sunOver(scene, sun, way.parts);
    return { from: place(eye), at: place(target), reach, shadows, surfaces: !way.white };
  }

  /** Takes the parts off the stage, and stands there `parts`, which show at `at`: none, in a way that shows the solids. */
  function raise(parts, at, way) {
    if (raised !== null) {
      raised.all.removeFromParent();
      raised.dispose();
    }
    [raised, raisedAt] = [way.parts ? meshesOf(parts, place, way) : null, at];
    if (raised !== null) standing.all.add(raised.all);
    standing.parts = raised === null ? [] : raised.all.children;
  }

  /** Cuts what stands along `along`: the plane made anew where it moved, and handed to the stage. */
  function slice(along) {
    const at = JSON.stringify(along ?? null);
    if (at !== planeAt) {
      [plane, planeAt] = [planeOf(along ?? null, place), at];
      stage.cut(plane);
    }
    opened(standing.all, plane, standing);
  }

  function show(scene, { cut = 'all', ground = true, way, shadows = true, off, along } = {}) {
    const first = place === null;
    place ??= frameOf(scene);
    const as = wayOf(way);
    const anew = scene !== stood || as !== shownAs;
    if (anew) {
      if (standing !== null) {
        stage.scene.remove(standing.all);
        standing.dispose();
      }
      [stood, shownAs, standing] = [scene, as, build(scene, place, as)];
      stage.scene.add(standing.all);
    }
    const { solids, parts } = shownBy(scene, cut, off);
    const whole = new Set(solids);
    standing.solids.forEach((solid, at) => {
      solid.visible = whole.has(scene.solids[at]);
    });
    // The cut and what is switched off, as one text: where either changed, the parts are new.
    const at = JSON.stringify([cut, off ?? null]);
    if (anew || (as.parts && at !== raisedAt)) raise(parts, at, as);
    standing.land.visible = ground;
    slice(along);
    stage.light(lit(scene, as, shadows));
    if (first && look !== null) stage.stand(place(look.eye), place(look.target));
    else if (first) stand('front');
    stage.draw();
    return standing;
  }

  function looking() {
    if (place === null) return null;
    const { eye, target } = stage.looking();
    return { eye: place.back(eye), target: place.back(target) };
  }

  return { show, stand, looking };
}
