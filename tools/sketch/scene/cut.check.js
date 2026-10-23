// The cut's check: a made-up scene of six solids on four floors, and what shows of it at every
// cut - of its solids, and of the parts they are built of, where the storey a cut stops at is
// open from above. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { partsShown, shown } from './cut.js';

// A made-up scene, as far as a cut reads it: each solid, the floor it stands on in metres above
// sea level, and how high its box reaches from where it begins. The tower stands on the lowest
// floor and rises above every other. The lamp stands on the living room's floor, and its box
// begins a metre above that: on a table. The tree stands on the ground, between two floors.
const solid = (name, floor, top, bottom = floor) => ({
  name,
  floor,
  min: [0, 0, bottom],
  max: [1, 1, top],
});
const scene = {
  solids: [
    solid('attic', 109, 111.5),
    solid('living', 106, 109),
    solid('lamp', 106, 107.5, 107),
    solid('tower', 103, 112),
    solid('cellar', 103, 106),
    solid('tree', 104.25, 108.25),
  ],
  levels: [109, 106, 103],
};
const names = (cut) => shown(scene, cut).map((each) => each.name);

// 'all' shows every solid, in the scene's order.
assert.deepEqual(names('all'), ['attic', 'living', 'lamp', 'tower', 'cellar', 'tree']);

// A level shows every solid that stands on it or below it, and none that stands above. The top
// level shows all. The next one takes the attic away, and keeps the lamp: it stands on that
// level, wherever its box begins. The lowest leaves what stands on it - not the tree, which
// stands a metre and a quarter above it.
assert.deepEqual(names(109), ['attic', 'living', 'lamp', 'tower', 'cellar', 'tree']);
assert.deepEqual(names(106), ['living', 'lamp', 'tower', 'cellar', 'tree']);
assert.deepEqual(names(103), ['tower', 'cellar']);
// Where no solid stands that low, nothing shows.
assert.deepEqual(names(102.5), []);

// What shows, shows whole: the tower rises 9 m above the lowest level, and is the scene's own
// solid, untouched. A cut changes nothing of the scene.
const before = JSON.stringify(scene);
assert.equal(shown(scene, 103)[0], scene.solids[3]);
assert.deepEqual(shown(scene, 103)[0].max, [1, 1, 112]);
assert.equal(JSON.stringify(scene), before);

// The parts of that scene, as far as a cut reads them: what each is, the place of the solid it
// is made of, the floor that solid stands on, and `over` on what closes it from above. The
// attic has a roof. The living room has none: the attic's floor is its ceiling. The tower is
// closed by a pane of glass, and the cellar by a roof. The lamp is one piece, the tree two.
const part = (of, thing, over) => ({
  of,
  thing,
  floor: scene.solids[thing].floor,
  ...(over ? { over: true } : {}),
});
const built = {
  ...scene,
  parts: [
    part('floor', 0),
    part('roof', 0, true),
    part('floor', 1),
    part('wall', 1),
    part('piece', 2),
    part('floor', 3),
    part('pane', 3, true),
    part('floor', 4),
    part('roof', 4, true),
    part('piece', 5),
    part('piece', 5),
  ],
};
const said = (cut) =>
  partsShown(built, cut)
    .map((each) => `${each.of} of the ${built.solids[each.thing].name}`)
    .join(', ');
const living = 'floor of the living, wall of the living, piece of the lamp';
const tree = 'piece of the tree, piece of the tree';

// 'all' shows every part, in the scene's order: each roof on its storey.
assert.equal(
  said('all'),
  `floor of the attic, roof of the attic, ${living}, floor of the tower, pane of the tower, ` +
    `floor of the cellar, roof of the cellar, ${tree}`,
);
// A level shows the parts of what stands on it or below it - but not what is over a thing that
// stands on that very level. At the top level the attic has no roof, and is looked into from
// above; the tower and the cellar, which stand lower, keep what closes them.
assert.equal(
  said(109),
  `floor of the attic, ${living}, floor of the tower, pane of the tower, ` +
    `floor of the cellar, roof of the cellar, ${tree}`,
);
// A level lower nothing of the attic shows: the living room has lost its ceiling with it, and
// is open. What closes a thing is `over`, of whatever it is: the tower keeps its pane.
assert.equal(
  said(106),
  `${living}, floor of the tower, pane of the tower, floor of the cellar, roof of the cellar, ${tree}`,
);
// At the lowest level the tower and the cellar are open too, and nothing shows of the tree,
// which stands above it. At the tree's own height, which is no level, both are closed still.
assert.equal(said(103), 'floor of the tower, floor of the cellar');
assert.equal(
  said(104.25),
  `floor of the tower, pane of the tower, floor of the cellar, roof of the cellar, ${tree}`,
);
assert.equal(said(102.5), '');

// What shows is the scene's own part, untouched, and a cut changes nothing of the scene.
const whole = JSON.stringify(built);
assert.equal(partsShown(built, 103)[0], built.parts[5]);
assert.equal(partsShown(built, 'all').length, built.parts.length);
assert.equal(JSON.stringify(built), whole);

process.stdout.write(
  'tools/sketch/scene: a cut shows what stands on a level or below it, whole, and opens the storey it stops at\n',
);
