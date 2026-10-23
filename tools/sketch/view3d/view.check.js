// The view's check, on a made-up stage: the first scene is stood on the stage and seen from the
// front, the house filling the picture, in a square window and in a tall one - or from where a
// tab kept that it was looking; a cut shows whole solids and hides the rest, and the ground goes
// and comes, without the scene being built anew; a later scene takes its place - nothing of the
// one before stays on the stage - and is seen from where the view was looking, in the same
// frame; and a stand puts the view where its station looks from, fitted to the blocks. What a
// tab's switch takes away does not show, and in White the parts are built anew for it. No
// browser: the stage here is a scene of three.js and four functions that note what they were
// asked. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { Scene } from 'three';
import { sceneOf } from '../scene/scene.js';
import { openView } from './view.js';

// A made-up plot of 8 m by 4 m in cells of half a metre, on a ground that is a plane: 110 m at
// the uphill edge, x = 0, and 2 m lower at the downhill one, the same all the way across.
const row = Array.from({ length: 17 }, (_, column) => 1000 - 12.5 * column).join(' ');
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 8,
  yFromM: 0,
  yToM: 4,
  sideM: [100, 120],
  outline: [
    [1, 1],
    [7, 1],
    [7, 3],
    [1, 3],
  ],
  ground: { baseM: 100, rowsCm: Array(9).fill(row) },
};
const grey = { name: 'grey', hex: '#8795a1' };
// A house of 2 m by 2 m, from 109 m up to 112 m; the same house with a cellar under it, down to
// 104 m - lower than the ground reaches anywhere; and those two with a window of a storey nobody
// drew, which stands on the roof at 112 m.
const house = { x: [6, 10], y: [2, 6], z: [16, 22], colour: grey };
const cellar = { x: [6, 10], y: [2, 6], z: [22, 32], colour: grey };
const pane = { x: [7, 9], y: [3.75, 4.25], z: [11, 14], kind: 'window', turn: 0, floor: 16 };
const [alone, dug] = [sceneOf(site, [house]), sceneOf(site, [house, cellar])];
const full = sceneOf(site, [house, cellar, { ...pane, fill: '#d9ecf7' }]);
assert.deepEqual(
  [alone.box.min, alone.box.max],
  [
    [0, 0, 108],
    [8, 4, 112],
  ],
);
assert.equal(dug.box.min[2], 104);
assert.deepEqual(full.levels, [109, 104]);

/**
 * A made-up stage: what stands on it, and what it was asked - to stand somewhere, to be lit,
 * and to draw. Its camera takes in 60 degrees from the bottom of the picture to its top, in a
 * picture so wide for its height: a place lies nine tenths of the way to the top of the picture
 * where it is 0.9 * tan 30 = 0.5196 m above the line of sight for every metre ahead of the eye.
 */
function madeUp(shape = 1) {
  const asked = { stood: [], lit: [], drawn: 0 };
  const stage = {
    scene: new Scene(),
    field: () => ({ deg: 60, shape }),
    stand: (eye, target) => asked.stood.push({ eye, target }),
    looking: () => asked.stood.at(-1),
    light: (sun) => asked.lit.push(sun),
    draw: () => (asked.drawn += 1),
  };
  return { stage, asked };
}
// What was worked out by hand is compared to the millimetre.
const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) =>
    assert.ok(Math.abs(value - expected[at]) < 1e-3, `${what}: ${actual} is not ${expected}`),
  );
};
const off = ({ eye, target }) => Math.hypot(...eye.map((value, axis) => value - target[axis]));

// The first scene: on the stage, drawn, and seen from the front - once. Nothing is looked at
// before a scene is shown.
const { stage, asked } = madeUp();
const view = openView(stage);
assert.equal(view.looking(), null);
const first = view.show(alone);
assert.deepEqual(stage.scene.children, [first.all]);
assert.equal(first.solids.length, 1);
assert.deepEqual([asked.stood.length, asked.drawn], [1, 1]);
// By hand (fit.check.js has the rule). A stand has the house in view, not the whole paper: the
// box around the house is 2 m by 2 m by 3 m about [4, 2, 110.5 m]. The front is downhill, the
// side of the large x, and the eye looks 20 degrees down on it, straight from the front. Along
// that line the top of the near face lies 1 * cos 20 + 1.5 * sin 20 = 1.453 m nearer than the
// middle and 1.5 * cos 20 - 1 * sin 20 = 1.068 m above the line through it; its foot lies
// 1 * cos 20 - 1.5 * sin 20 = 0.427 m nearer and 1.5 * cos 20 + 1 * sin 20 = 1.752 m below. The
// top asks the eye to stand 1.068 / 0.5196 + 1.453 = 3.507 m from the middle, the foot
// 1.752 / 0.5196 + 0.427 = 3.798 m; the sides, 1 m beside the line, ask for less,
// 1 / 0.5196 + 1.453 = 3.377 m. So the line of sight is moved down by
// 0.5196 * (3.798 - 3.507) / 2 = 0.0754 m, and the eye stands (3.507 + 3.798) / 2 = 3.652 m
// back: the house fills the picture from top to bottom, and lies in its middle.
// Down in the picture is sin 20 down the plot and cos 20 lower: the view looks at
// [4.0258, 2, 110.4291 m] - on the stage, where heights count from 108 m, the scene's lowest
// point, at [4.0258, 2.4291, -2] - and that is what it turns about. The eye stands
// 3.6524 * cos 20 = 3.4321 m further down the plot and 3.6524 * sin 20 = 1.2492 m higher.
near(asked.stood[0].target, [4.0258, 2.4291, -2], 'what the view turns about');
near(asked.stood[0].eye, [4.0258 + 3.4321, 2.4291 + 1.2492, -2], 'the eye at the front');
// In a tall window, half as wide as high, the sides of the picture are the nearer edges: the
// sides of the house ask for 1 / (0.5 * 0.5196) + 1.453 = 5.302 m, and the eye stands that far
// back.
const tall = madeUp(0.5);
openView(tall.stage).show(alone);
near([off(asked.stood[0]), off(tall.asked.stood[0])], [3.652, 5.302], 'how far off the eye is');
// With no block, a stand has the ground in view: the scene's own box, 8 m by 4 m by 2 m about
// [4, 2, 109 m]. The two top corners of its downhill edge lie 2 m beside the line of sight and
// 4 * cos 20 + 1 * sin 20 = 4.101 m nearer than the middle, and ask for the most:
// 2 / 0.5196 + 4.101 = 7.950 m, straight in front.
const bare = madeUp();
openView(bare.stage).show(sceneOf(site, []));
near([off(bare.asked.stood[0])], [7.95], 'how far off the eye is, with no block');
near([bare.asked.stood[0].eye[2], bare.asked.stood[0].target[2]], [-2, -2], 'straight in front');

// Where the view looks, for a later page: in the plot's frame, metres above sea level. Here it
// is where it was stood, at the front.
near(view.looking().eye, [7.4579, 2, 111.6783], 'where the eye is, on the plot');
near(view.looking().target, [4.0258, 2, 110.4291], 'what it looks at, on the plot');
// A page that opens with what a tab kept is seen from there, and not from the front: a place of
// the plot, put on the stage by the frame - 111 m is 3 m over the floor.
const kept = madeUp();
openView(kept.stage, { eye: [7, 1, 111], target: [4, 2, 110.5] }).show(alone);
assert.deepEqual(kept.asked.stood, [{ eye: [7, 3, -1], target: [4, 2.5, -2] }]);

// A later scene takes the place of the first: on the stage is the new one alone, the old one's
// own shapes were given back, and it was drawn - but the view was not stood anywhere again.
let gone = 0;
first.ground.geometry.addEventListener('dispose', () => (gone += 1));
const second = view.show(dug);
assert.deepEqual(stage.scene.children, [second.all]);
assert.equal(first.all.parent, null);
assert.equal(gone, 1);
assert.equal(second.solids.length, 2);
assert.deepEqual([asked.stood.length, asked.drawn], [1, 2]);
// And the house did not jump: it stands where it stood, though the cellar reaches 4 m lower than
// anything did - which a frame of the new scene's own would lift everything by. The cellar lies
// under the floor of the stage instead.
near(second.solids[0].position.toArray(), first.solids[0].position.toArray(), 'the house');
near(second.solids[0].position.toArray(), [4, 2.5, -2], 'the house, by hand');
near(second.solids[1].position.toArray(), [4, -1.5, -2], 'the cellar');

// A stand puts the view where a station of the scene that stands there now looks from. By hand:
// the box around the house and its cellar is 2 m by 2 m by 8 m about [4, 2, 108 m] - on the
// stage [4, 0, -2]. From the front, the top of the near face lies 1 * cos 20 + 4 * sin 20 =
// 2.308 m nearer than the middle and 4 * cos 20 - 1 * sin 20 = 3.417 m above the line through
// it: it asks for 3.417 / 0.5196 + 2.308 = 8.883 m. The foot of the near face leans away, for
// the box is tall: 4 * sin 20 - 1 * cos 20 = 0.428 m further than the middle, and
// 4 * cos 20 + 1 * sin 20 = 4.101 m below the line: 4.101 / 0.5196 - 0.428 = 7.464 m. The line
// of sight is moved up by 0.5196 * (8.883 - 7.464) / 2 = 0.3689 m - 0.1262 m up the plot and
// 0.3466 m higher - and the eye stands (8.883 + 7.464) / 2 = 8.1735 m back: 7.6805 m beside
// what it looks at and 2.7955 m over it. The house is as wide as it is long, so every standing
// stand is the front's, turned: uphill at the back; on the left at the side of the plot's small
// y, which is three.js's large z; on the right at the other. From above, the top of the box,
// 4 m over the middle, reaches 1 m to either side: the eye stands 1 / 0.5196 = 1.9245 m over
// it, and straight over the middle.
const [lean, beside, low, high] = [0.1262, 7.6805, 0.3466, 0.3466 + 2.7955];
const STANDS = {
  front: { eye: [4 - lean + beside, high, -2], target: [4 - lean, low, -2] },
  back: { eye: [4 + lean - beside, high, -2], target: [4 + lean, low, -2] },
  left: { eye: [4, high, -2 - lean + beside], target: [4, low, -2 - lean] },
  right: { eye: [4, high, -2 + lean - beside], target: [4, low, -2 + lean] },
  above: { eye: [4, 4 + 1.9245, -2], target: [4, 0, -2] },
};
for (const [name, { eye, target }] of Object.entries(STANDS)) {
  view.stand(name);
  near(asked.stood.at(-1).eye, eye, `the eye at the stand ${name}`);
  near(asked.stood.at(-1).target, target, `what the stand ${name} looks at`);
}
assert.deepEqual([asked.stood.length, asked.drawn], [1 + 5, 2]);
// The house is its blocks. A window that stands on its roof and a tree at the far corner of the
// plot are no part of it, and do not push it away: with them, the view opens at the front as it
// stands there with the house and its cellar alone - on the plot, 108 m over the stage's floor.
const tree = { x: [14, 16], y: [0, 2], z: [15.75, 23.75], kind: 'tree', turn: 0, floor: 23.75 };
const garden = madeUp();
const planted = openView(garden.stage);
planted.show(
  sceneOf(site, [house, cellar, { ...pane, fill: '#d9ecf7' }, { ...tree, fill: '#cfe8c5' }]),
);
view.stand('front');
near(planted.looking().eye, view.looking().eye, 'the eye, with a tree and a window');
near(planted.looking().target, view.looking().target, 'what it looks at, with a tree and a window');
near(view.looking().target, [4 - lean, 2, 108 + low], 'what the front looks at, on the plot');

// A cut shows whole solids, and hides the rest: all of them at 'all'; at 109 m the house and the
// cellar, which stand on that level and below it, and not the window that stands above it; at
// 104 m the cellar alone. The scene is not built anew for it - what stands there stays, and no
// shape is given back - and what shows is as it was built: the same faces, and none paler.
const third = view.show(full);
const visible = (standing) => standing.solids.map((solid) => solid.visible);
const facesOf = (standing) => standing.solids.map((solid) => solid.material);
const [faces, drawings, stands] = [facesOf(third), asked.drawn, asked.stood.length];
third.ground.geometry.addEventListener('dispose', () => (gone += 1));
assert.deepEqual(visible(third), [true, true, true]);
assert.equal(view.show(full, { cut: 109 }), third);
assert.deepEqual(visible(third), [true, true, false]);
view.show(full, { cut: 104 });
assert.deepEqual(visible(third), [false, true, false]);
// A stand is the same whatever is cut: the house is where it is, whether it shows or not.
view.stand('front');
near(asked.stood.at(-1).eye, STANDS.front.eye, 'the eye at the front, at a cut');
view.show(full, { cut: 'all' });
assert.deepEqual(visible(third), [true, true, true]);
assert.deepEqual(stage.scene.children, [third.all]);
assert.deepEqual(facesOf(third), faces);
assert.ok(faces.every((face) => face.opacity === 1 && !face.transparent));
// Without the ground, nothing of the land shows - the ground, the outline and the hill are one
// thing, hidden - and every solid does; with it, the land is back. Each time, one drawing.
view.show(full, { ground: false });
assert.deepEqual([third.land.visible, visible(third)], [false, [true, true, true]]);
assert.deepEqual(third.land.children, [third.ground, third.outline, third.hill]);
view.show(full, { cut: 104, ground: true });
assert.deepEqual([third.land.visible, visible(third)], [true, [false, true, false]]);
assert.deepEqual([asked.drawn - drawings, gone, asked.stood.length - stands], [5, 1, 1]);
// What a tab's switch takes away does not show either (story ST-033), whole: the cellar with
// its level switched off, and the house too with its own - the window on the roof stands on
// neither - at any cut; and the land stays. The scene is not built anew for it.
assert.equal(view.show(full, { off: { levels: [104] } }), third);
assert.deepEqual(visible(third), [true, false, true]);
view.show(full, { off: { levels: [104, 109], groups: ['Garden'] } });
assert.deepEqual([third.land.visible, visible(third)], [true, [false, false, true]]);
view.show(full, { cut: 109, off: { levels: [109] } });
assert.deepEqual(visible(third), [false, true, false]);
view.show(full, { cut: 109, off: { levels: [] } });
assert.deepEqual([visible(third), gone], [[true, true, false], 1]);
// The next scene is cut where it is asked to be as it is put there: here at 104 m, under the
// floor of the house, so that nothing of it shows.
const fourth = view.show(alone, { cut: 104 });
assert.deepEqual(visible(fourth), [false]);
assert.equal(gone, 2);

// Back to all of it, and on to an empty one: each time one scene on the stage, and the view is
// stood nowhere for it.
view.show(alone);
assert.deepEqual(visible(fourth), [true]);
const last = view.show(sceneOf(site, []));
assert.deepEqual(stage.scene.children, [last.all]);
assert.deepEqual([last.solids.length, last.land.visible], [0, true]);
assert.equal(asked.stood.length - stands, 1);

// All of it was shown as the volumes, for no way was asked for: each time the stage was told to
// be lit as it always was - with no sun - once for each drawing. The way White, and the sun, are
// white.check.js's.
assert.equal(asked.lit.length, asked.drawn);
assert.ok(asked.lit.every((sun) => sun === null));

// In White the parts stand there: built anew where what is switched off changed - fewer, with
// the cellar's level off - and not where it did not. A block is one part here, by a rule of this
// check's own; and White has a sun: one high in the south.
const wall = ({ things, boxOf }, at) => [
  { of: 'wall', shape: 'box', ...boxOf(things[at]), surface: 'plaster' },
];
const rooms = sceneOf(site, [house, cellar], { floorSlabM: 0.3 }, { blocks: [wall], kinds: {} });
const sunlit = openView(madeUp().stage, null, [0, -0.6, 0.8]);
const counted = (meshes) => meshes.reduce((sum, mesh) => sum + mesh.userData.parts, 0);
const white = sunlit.show(rooms, { way: 'white' });
const everyPart = counted(white.parts);
sunlit.show(rooms, { way: 'white', off: { levels: [104] } });
assert.ok(counted(white.parts) > 0 && counted(white.parts) < everyPart);
const fewer = white.parts;
sunlit.show(rooms, { way: 'white', off: { levels: [104] } });
assert.equal(white.parts, fewer);

process.stdout.write(
  'tools/sketch/view3d: a scene opens from the front with the house filling the picture, is cut and stood at a stand, and the next one stands where the view was looking\n',
);
