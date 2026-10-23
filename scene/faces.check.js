// The check of the faces: which wall the box of a room has toward what lies beyond a face, and
// how thick it is, by hand, on a made-up house of an ordinary kind - house.check.js's, and a
// door more. And what the two rules build of that, tried part by part with every rule there is:
// the facade is the wall's - no part of a room that lies on a face where an outer wall stands
// is of a floor's surface or of the roofs' - and a strip runs on under a window and a door. How
// thick a wall stands on a face of a cell is walls.check.js's. Run by tools/sketch/check.js.
import assert from 'node:assert/strict';
import process from 'node:process';
import { EXTENTS, FACES, INNER, OUTER, WALL, thickOf, toward } from './faces.js';
import { amiss } from './holds.js';
import { sceneOf } from './scene.js';
import { pieces } from './space.js';
import { SURFACES } from './surfaces.js';

// A made-up plot of 14 m by 9 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 10 - row / 2, a level 130 - level / 2 metres above sea level. Its ground
// falls 10 cm a column down the plot, from 108 m, and lies the same all the way across.
const site = {
  cellM: 0.5,
  xFromM: 0,
  xToM: 14,
  yFromM: 1,
  yToM: 10,
  sideM: [100, 130],
  outline: [
    [0.5, 9.5],
    [13.5, 9.5],
    [0.5, 1.5],
  ],
  ground: {
    baseM: 100,
    rowsCm: Array(19).fill(
      Array.from({ length: 29 }, (point, column) => 800 - 10 * column).join(' '),
    ),
  },
};
// Made-up figures, each a sum of halves of halves, so that every figure below is exact.
const figures = {
  outerWallM: 0.375,
  innerWallM: 0.25,
  floorSlabM: 0.375,
  roofSlabM: 0.3125,
  railingHighM: 1,
  doorHighM: 2,
  windowHighM: 1.25,
  sillHighM: 0.875,
};

// The house, in cells: its lower storey on level 46, at 107 m - dug into the hill at one end
// and clear of it at the other - and its upper one on level 40, at 110 m. A storey is 3 m.
const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, more) => ({ x, y, z, colour: grey, ...more });
const thing = (kind, x, y, z, floor) => ({ x, y, z, kind, turn: 0, fill: '#b0b0b0', floor });
const things = [
  // 0 to 3: a living room and a kitchen side by side; a bedroom over the one, and open air - a
  // terrace, a metre and a half high - over the other.
  box([2, 12], [2, 8], [40, 46], { name: 'Living room' }),
  box([12, 18], [2, 8], [40, 46], { name: 'Kitchen' }),
  box([2, 12], [2, 8], [34, 40], { name: 'Bedroom' }),
  box([12, 18], [2, 8], [37, 40], { name: 'Terrace', as: 'open' }),
  // 4 to 6: a garage of two boxes side by side, the second lower, and glass on the first.
  box([18, 24], [2, 8], [40, 46], { name: 'Garage', group: 2 }),
  box([24, 26], [4, 8], [42, 46], { group: 2 }),
  box([18, 22], [2, 6], [34, 40], { name: 'Greenhouse', as: 'glass' }),
  // 7: open air on the ground, against the living room's side.
  box([2, 12], [8, 14], [43, 46], { name: 'Garden', as: 'open' }),
  // 8 and 9: a stair tower of two boxes, one over the other, against the kitchen's side.
  box([12, 16], [8, 12], [40, 46], { name: 'Stairs', group: 5 }),
  box([12, 16], [8, 12], [34, 40], { group: 5 }),
  // 10: a bed in the bedroom. 11: a door across the face that the living room and the kitchen
  // share. 12: a window in the living room's face up the paper. 13 and 14: a staircase along
  // the living room's other side, and a spiral one as large as the tower's lower box. 15: a
  // tree on the ground. 16 and 17: a table on the terrace, and a chair on the bedroom's roof.
  thing('bed', [3, 7], [3, 7], [38, 40], 40),
  thing('door', [11, 13], [4, 6], [42, 46], 46),
  thing('window', [4, 7], [1.7, 2.3], [41.75, 44.25], 46),
  thing('stairs', [2, 11], [6, 8], [40, 46], 46),
  thing('spiral', [12, 16], [8, 12], [40, 46], 46),
  thing('tree', [3, 7], [15, 17], [33, 45], 45),
  thing('table', [13, 17], [4, 6], [38.5, 40], 40),
  thing('chair', [4, 5], [4, 5], [32.2, 34], 34),
  // 18: a door across the kitchen's face up the paper, a cell on either side: in an outer wall.
  thing('door', [14, 16], [1, 3], [42, 46], 46),
];

// What a rule gets, taken by a rule of the check's own: to ask the questions of a face.
const seen = [];
const probe = (given) => {
  seen.push(given);
  return [];
};
const contextOf = (by) => {
  sceneOf(site, things, by, { blocks: [probe] });
  return seen.at(-1);
};
const context = contextOf(figures);

// The faces are named as `pieces` names them (space.js): across which extent each lies, at
// which end of it, and so which cell lies beyond a square of it. They come as walls come.
assert.deepEqual(Object.keys(FACES), ['x0', 'x1', 'y0', 'y1']);
for (const [word, [axis, side]] of Object.entries(FACES)) {
  const squares = pieces(things[0], word, (within, beyond) => {
    const outward = [0, 0, 0];
    outward[axis] = side === 0 ? -1 : 1;
    assert.deepEqual(
      [0, 1, 2].map((way) => beyond[way] - within[way]),
      outward,
      word,
    );
    assert.equal(within[axis], things[0][EXTENTS[axis]][side] - side, word);
    return word;
  });
  assert.equal(squares.length, 1, word);
}

// Which wall has a box toward a cell beyond one of its faces? By hand, for each case.
for (const [at, beyond, wall, why] of [
  [0, [1, 3, 41], OUTER, 'the living room toward nothing'],
  [0, [1, 3, 45], OUTER, 'the living room toward the earth it is dug into: no block is there'],
  [0, [3, 3, 45], null, 'the living room toward a cell of its own'],
  [0, [12, 3, 45], INNER, 'the living room toward the kitchen'],
  [1, [11, 3, 45], INNER, 'the kitchen toward the living room'],
  [0, [3, 8, 45], OUTER, 'the living room toward the garden: open air is no room'],
  [0, [3, 8, 41], OUTER, 'the living room toward nothing, over the garden'],
  [2, [12, 3, 38], OUTER, 'the bedroom toward the terrace'],
  [1, [13, 8, 45], INNER, 'the kitchen toward the stair tower'],
  [1, [17, 8, 45], OUTER, 'the kitchen toward nothing, past the stair tower'],
  [4, [24, 5, 43], null, 'the garage toward its second box: one block'],
  [4, [24, 3, 43], OUTER, 'the garage beside its second box'],
  [4, [24, 5, 41], OUTER, 'the garage over its second box'],
  [4, [19, 3, 39], OUTER, 'the garage toward the greenhouse on it: glass is no room'],
]) {
  assert.equal(toward(context, at, beyond), wall, why);
}

// How thick are the walls of a box across an extent? By hand: an outer wall of 0.375 m and half
// an inner one of 0.25 m. And with an outer wall of 0.75 m and an inner one of 1.25 m: neither
// is more than half of what its box is wide there.
const stout = contextOf({ ...figures, outerWallM: 0.75, innerWallM: 1.25 });
for (const [given, at, axis, inner, outer, why] of [
  [context, 0, 0, 0.125, 0.375, 'the living room, 5 m along the plot'],
  [context, 0, 1, 0.125, 0.375, 'the living room, 3 m across it'],
  [context, 5, 0, 0.125, 0.375, 'the second box of the garage, a metre wide'],
  [stout, 0, 0, 0.625, 0.75, 'the living room, with thicker walls'],
  [stout, 5, 0, 0.5, 0.5, 'the second box of the garage: both walls half of its metre'],
  [stout, 5, 1, 0.625, 0.75, 'the same box along its 2 m'],
]) {
  assert.deepEqual(thickOf(given, at, axis), { [INNER]: inner, [OUTER]: outer }, why);
}

/**
 * What lies on a facade and is not the wall's: every part of a room that lies on an upright
 * face of its box, on a square where an outer wall stands, and is neither of the wall's surface
 * nor of glass - a pane may lie there, in a wall as thin as itself. In words, one for each
 * face of a part. Every square of every face is asked, on every level, of every part: of the
 * floors, the roofs and the walls, and of whatever a later rule builds of a room.
 */
function offFacade(scene, given) {
  const { space, xOf, yOf, hOf } = given;
  const reaches = (low, high, from, to) =>
    Math.min(high, Math.max(from, to)) - Math.max(low, Math.min(from, to)) > 1e-9;
  return scene.parts.flatMap((part, nth) => {
    const at = part.thing;
    if (space.asOf(at) !== 'room' || [WALL, 'glass'].includes(part.surface)) return [];
    const [solid, cells] = [scene.solids[at], things[at]];
    const faces = Object.entries(FACES).filter(([, [axis, side]]) => {
      // Metres count up with the columns and down with the rows: which end of the box a face is.
      const end = (axis === 0) === (side === 0) ? 'min' : 'max';
      if (Math.abs(part[end][axis] - solid[end][axis]) > 1e-9) return false;
      const [run, lineOf] = axis === 0 ? [1, yOf] : [0, xOf];
      for (let along = cells[EXTENTS[run]][0]; along < cells[EXTENTS[run]][1]; along += 1) {
        if (!reaches(part.min[run], part.max[run], lineOf(along), lineOf(along + 1))) continue;
        for (let level = cells.z[0]; level < cells.z[1]; level += 1) {
          if (!reaches(part.min[2], part.max[2], hOf(level + 1), hOf(level))) continue;
          const cell = [along, along, level];
          cell[axis] = cells[EXTENTS[axis]][side] - side;
          const beyond = [...cell];
          beyond[axis] += side === 0 ? -1 : 1;
          if (space.who(...cell) === at && toward(given, at, beyond) === OUTER) return true;
        }
      }
      return false;
    });
    return faces.map(([word]) => `part ${nth}, a ${part.of} of ${part.surface}, on ${word}`);
  });
}

// THE FACADE IS THE WALL'S. A wall is of a surface there is, and the rule of walls builds its
// walls of it. With every rule there is, nothing on a facade of this house is another's, and
// what holds of every part holds: by hand, how far each object is lifted, and how far the two
// staircases were moved out of the walls they were drawn in, each `[dx, dy, dh]` - as
// house.check.js works them out.
assert.ok(Object.hasOwn(SURFACES, WALL));
const moved = { 13: [0.375, 0.375, 0.375], 14: [0, 0.125, 0.375] };
const lift = (at) => moved[at] ?? ([10, 11, 12, 16].includes(at) ? 0.375 : 0);
const house = sceneOf(site, things, figures);
const walls = house.parts.filter((part) => part.of === 'wall');
assert.ok(walls.length > 0 && walls.every((part) => part.surface === WALL));
assert.deepEqual(amiss(house, lift), []);
assert.deepEqual(offFacade(house, context), []);
// And the question finds what it asks for: two floors and a roof as they were before they had
// a rim, each one box of its own surface out to the edge of its room. The living room's is
// found on its three outer walls and not toward the kitchen; the kitchen's up the paper, and
// down it for the metre past the stair tower; the bedroom's roof all round.
const before = [
  { of: 'floor', surface: 'wood', min: [1, 6, 107], max: [6, 9, 107.375], thing: 0 },
  { of: 'floor', surface: 'stone', min: [6, 6, 107], max: [9, 9, 107.375], thing: 1 },
  { of: 'roof', surface: 'concrete', min: [1, 6, 112.6875], max: [6, 9, 113], thing: 2 },
];
assert.deepEqual(offFacade({ ...house, parts: before }, context), [
  'part 0, a floor of wood, on x0',
  'part 0, a floor of wood, on y0',
  'part 0, a floor of wood, on y1',
  'part 1, a floor of stone, on y0',
  'part 1, a floor of stone, on y1',
  'part 2, a roof of concrete, on x0',
  'part 2, a roof of concrete, on x1',
  'part 2, a roof of concrete, on y0',
  'part 2, a roof of concrete, on y1',
]);

// A STRIP RUNS ON UNDER A WINDOW AND A DOOR: the question is where a wall stands, not where it
// is open. Both open their walls - neither gives a part of its own, and the window's wall holds
// a pane - and the floor under them is what it is under a whole wall. By hand: the living room,
// from x = 1 to 6 and from y = 6 to 9, has an outer wall up the plot, up the paper - the
// window's, from x = 2 to 3.5 - and toward the garden, and none toward the kitchen. The
// kitchen, on to x = 9, has one up the paper - the door's, from x = 7 to 8 - and down the paper
// along its last metre, past the stair tower: its field is two boxes.
assert.deepEqual(
  [12, 18].map((at) => house.parts.some((part) => part.thing === at)),
  [false, false],
);
assert.ok(house.parts.some((part) => part.thing === 0 && part.of === 'pane'));
const floor = (at, min, max, surface = WALL) => ({
  of: 'floor',
  shape: 'box',
  min,
  max,
  surface,
  thing: at,
  floor: 107,
});
const floorsOf = (at) => house.parts.filter((part) => part.thing === at && part.of === 'floor');
assert.deepEqual(floorsOf(0), [
  floor(0, [1.375, 6.375, 107], [6, 8.625, 107.375], 'wood'),
  floor(0, [1, 6, 107], [1.375, 9, 107.375]),
  floor(0, [1.375, 8.625, 107], [6, 9, 107.375]),
  floor(0, [1.375, 6, 107], [6, 6.375, 107.375]),
]);
assert.deepEqual(floorsOf(1), [
  floor(1, [6, 6.375, 107], [9, 8.625, 107.375], 'stone'),
  floor(1, [6, 6, 107], [8, 6.375, 107.375], 'stone'),
  floor(1, [6, 8.625, 107], [9, 9, 107.375]),
  floor(1, [8, 6, 107], [9, 6.375, 107.375]),
]);

process.stdout.write(
  "tools/sketch/scene: a room has no wall toward its own block, half an inner one toward a room and an outer one toward all else, and on a facade every part is the wall's\n",
);
