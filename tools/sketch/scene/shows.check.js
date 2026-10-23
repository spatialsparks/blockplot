// What shows' check: a made-up scene typed by hand - two levels, three rooms, what stands in them
// and a car on the ground - and what a tab's switches leave of it at every cut; then, on a plot
// typed by hand, the two words a thing may say kept on its solid, and where the slice of each of
// the four standing views opens the house. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { partsShown, shown } from './cut.js';
import { sceneOf } from './scene.js';
import { NO_SECTION, OPENS, openAlong, shownBy, switchedOff } from './shows.js';

// A made-up scene, as far as what shows reads it: two levels, 103 m and 106 m. On the lower a
// room in section 1, with a sofa and a table of "Furniture" in it. On the upper a room in
// section 2, with a window of "Doors, windows and stairs" in a wall of it, and a room in none.
// A car of "People and cars" stands on the ground, at 102 m: on no level, and in no section.
const solid = (name, floor, words = {}) => ({
  name,
  floor,
  min: [0, 0, floor],
  max: [1, 1, floor + 3],
  ...words,
});
const furniture = { section: 1, gallery: 'Furniture' };
const scene = {
  solids: [
    solid('room 1', 103, { section: 1 }),
    solid('room 2', 106, { section: 2 }),
    solid('room 3', 106),
    solid('sofa', 103, furniture),
    solid('table', 103, furniture),
    solid('car', 102, { gallery: 'People and cars' }),
    solid('window', 106, { section: 2, gallery: 'Doors, windows and stairs' }),
  ],
  levels: [106, 103],
};
// Its parts: a floor, a wall and a roof of each room - the roof `over` it - a piece of the sofa,
// of the table and of the car, and the window's pane.
const part = (of, thing, over) => ({
  of,
  thing,
  floor: scene.solids[thing].floor,
  ...(over ? { over: true } : {}),
});
const room = (thing) => [part('floor', thing), part('wall', thing), part('roof', thing, true)];
scene.parts = [
  ...room(0),
  ...room(1),
  ...room(2),
  part('piece', 3),
  part('piece', 4),
  part('piece', 5),
  part('pane', 6),
];
const before = JSON.stringify(scene);

const said = (cut, off) => {
  const { solids, parts } = shownBy(scene, cut, off);
  return {
    solids: solids.map((each) => each.name).join(', '),
    parts: parts.map((each) => `${each.of} of ${scene.solids[each.thing].name}`).join(', '),
  };
};
const of = (name, ...ofs) => ofs.map((each) => `${each} of ${name}`).join(', ');
const r1 = of('room 1', 'floor', 'wall', 'roof');
const r2 = of('room 2', 'floor', 'wall', 'roof');
const r3 = of('room 3', 'floor', 'wall', 'roof');
const things = 'piece of sofa, piece of table, piece of car';

// Nothing off - no `off`, an empty one, three empty lists - is what the cut shows, solid for
// solid and part for part, at 'all' and at each level. By hand: at 'all' everything; at 106 m
// everything, but the rooms that stand on that very level are open, with no roof; at 103 m
// what stands on it or below - room 1, open, what is in it, and the car.
const all = {
  solids: 'room 1, room 2, room 3, sofa, table, car, window',
  parts: `${r1}, ${r2}, ${r3}, ${things}, pane of window`,
};
const at106 = {
  solids: all.solids,
  parts: `${r1}, ${of('room 2', 'floor', 'wall')}, ${of('room 3', 'floor', 'wall')}, ${things}, pane of window`,
};
const at103 = {
  solids: 'room 1, sofa, table, car',
  parts: `${of('room 1', 'floor', 'wall')}, ${things}`,
};
for (const off of [undefined, {}, { sections: [], levels: [], groups: [] }]) {
  for (const cut of ['all', ...scene.levels]) {
    const { solids, parts } = shownBy(scene, cut, off);
    assert.deepEqual(solids, shown(scene, cut));
    assert.deepEqual(parts, partsShown(scene, cut));
    solids.forEach((each, at) => assert.equal(each, shown(scene, cut)[at]));
  }
  assert.deepEqual(said('all', off), all);
  assert.deepEqual(said(106, off), at106);
  assert.deepEqual(said(103, off), at103);
}

// Section 2 off takes that room, the window in it and their parts away, and nothing else - at
// every cut. At 103 m none of it shows anyway: the cut alone.
const lessTwo = { sections: [2] };
assert.deepEqual(said('all', lessTwo), {
  solids: 'room 1, room 3, sofa, table, car',
  parts: `${r1}, ${r3}, ${things}`,
});
assert.deepEqual(said(106, lessTwo), {
  solids: 'room 1, room 3, sofa, table, car',
  parts: `${r1}, ${of('room 3', 'floor', 'wall')}, ${things}`,
});
assert.deepEqual(said(103, lessTwo), at103);

// "No section" off takes what is in none: room 3 and the car on the ground.
assert.equal(NO_SECTION, 'none');
assert.deepEqual(said('all', { sections: [NO_SECTION] }), {
  solids: 'room 1, room 2, sofa, table, window',
  parts: `${r1}, ${r2}, piece of sofa, piece of table, pane of window`,
});

// The upper level off takes what stands on it, roofs and all: room 2, room 3 and the window.
// Room 1 keeps its roof, and the car, on no level, stays. At the lower level it is the cut alone.
assert.deepEqual(said('all', { levels: [106] }), {
  solids: 'room 1, sofa, table, car',
  parts: `${r1}, ${things}`,
});
assert.deepEqual(said(103, { levels: [106] }), at103);

// "Furniture" off takes the sofa and the table, and no part of a room.
assert.deepEqual(said('all', { groups: ['Furniture'] }), {
  solids: 'room 1, room 2, room 3, car, window',
  parts: `${r1}, ${r2}, ${r3}, piece of car, pane of window`,
});

// A group that no thing is of, a section the scene has not and a height that is no level take
// nothing away.
assert.deepEqual(said('all', { sections: [7], levels: [104.5], groups: ['Garden'] }), all);

// Three lists at once: section 2, the lower level and "Furniture". Room 3 and the car are left.
const three = { sections: [2], levels: [103], groups: ['Furniture'] };
assert.deepEqual(said('all', three), { solids: 'room 3, car', parts: `${r3}, piece of car` });
assert.deepEqual(said(106, three), {
  solids: 'room 3, car',
  parts: `${of('room 3', 'floor', 'wall')}, piece of car`,
});

// One solid at a time: a section is its number, and a thing in section 1 is not in none.
assert.equal(switchedOff(scene.solids[0], { sections: [NO_SECTION] }), false);
assert.equal(switchedOff(scene.solids[0], { sections: [1] }), true);
assert.equal(switchedOff(scene.solids[2], undefined), false);
// What is shown is the scene's own, untouched; nothing changes the scene.
assert.equal(shownBy(scene, 'all', three).solids[0], scene.solids[2]);
assert.equal(JSON.stringify(scene), before);

// A made-up plot of 14 m by 9 m, in cells of half a metre, as house.check.js types one: a column
// is x = column / 2, a row of the top view y = 10 - row / 2, a row of a standing view
// h = 130 - row / 2. Its ground falls 10 cm a column down the plot.
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
// A box in section 2, of rows 4 to 6 and columns 2 to 6; a box that says nothing more, of rows 4
// to 8 and columns 8 to 12; a bush of "Garden". Both boxes stand on row 58, h = 101 m, up to row
// 52, h = 104 m.
const grey = { name: 'grey', hex: '#8795a1' };
const [inTwo, plain, bush] = sceneOf(site, [
  { x: [2, 6], y: [4, 6], z: [52, 58], colour: grey, section: 2 },
  { x: [8, 12], y: [4, 8], z: [52, 58], colour: grey },
  {
    x: [16, 17],
    y: [2, 3],
    z: [54, 58],
    kind: 'bush',
    turn: 0,
    fill: '#6aa84f',
    floor: 58,
    gallery: 'Garden',
  },
]).solids;
// The words stay on the solid; a thing that says neither has neither, and is the solid it was.
assert.equal(inTwo.section, 2);
assert.equal(Object.hasOwn(inTwo, 'gallery'), false);
assert.equal(bush.gallery, 'Garden');
assert.equal(Object.hasOwn(bush, 'section'), false);
assert.deepEqual(plain, {
  min: [4, 6, 101],
  max: [6, 8, 104],
  colour: '#8795a1',
  block: 2,
  floor: 101,
  see: 'solid',
});

// The slices: along the plot at row 6, across it at column 10. A slice runs through the middle
// of its row or column: row 6 runs from y = 10 - 6 / 2 = 7 to 10 - 7 / 2 = 6.5, so through
// y = 6.75; column 10 from x = 5 to 5.5, so through x = 5.25. Which half is kept follows from
// where each view's eye is (stations.js): `side` looks as `left` does, from the side of the
// small y, so the small y goes and the larger is kept, 1; `far` as `right`, from the large y,
// keeps the smaller, -1; `front` from downhill, the large x, keeps the smaller, -1; `back` from
// the small x keeps the larger, 1.
const on = { side: 6, end: 10 };
assert.deepEqual(OPENS, ['side', 'far', 'front', 'back']);
assert.deepEqual(openAlong(site, on, 'side'), { axis: 1, at: 6.75, keeps: 1 });
assert.deepEqual(openAlong(site, on, 'far'), { axis: 1, at: 6.75, keeps: -1 });
assert.deepEqual(openAlong(site, on, 'front'), { axis: 0, at: 5.25, keeps: -1 });
assert.deepEqual(openAlong(site, on, 'back'), { axis: 0, at: 5.25, keeps: 1 });
assert.equal(openAlong(site, on, 'top'), null);
assert.equal(openAlong(site, on, 'toString'), null);
assert.equal(openAlong(site, on, undefined), null);

// A box of rows 4 to 6, y = 7 to 8, is not cut by the slice along row 6, which runs through rows
// 6 to 7: it lies wholly at a larger y than 6.75 - kept from the side, gone from the far side. A
// box of rows 4 to 8, y = 6 to 8, is cut in two. Across the plot, column 10 cuts the box of
// columns 8 to 12, x = 4 to 6; the one of columns 2 to 6, x = 1 to 3, lies wholly before it.
const along = openAlong(site, on, 'side');
assert.deepEqual([inTwo.min[1], inTwo.max[1], plain.min[1], plain.max[1]], [7, 8, 6, 8]);
assert.ok(inTwo.min[1] > along.at);
assert.ok(plain.min[1] < along.at && along.at < plain.max[1]);
const across = openAlong(site, on, 'front');
assert.ok(inTwo.max[0] < across.at);
assert.ok(plain.min[0] < across.at && across.at < plain.max[0]);

process.stdout.write(
  'tools/sketch/scene: what shows is the cut less what a switch takes away, and a slice opens the house\n',
);
