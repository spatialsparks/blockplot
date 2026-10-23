// The check of the flights: a made-up flight that runs over more than one block, against what a
// person worked out by hand - what it runs over, at each of its four turns; a flight of 4.5 m
// over a stair room and a storage, fitted as one thing, with its first and its last step and the
// one that is parted at the wall between the two; that wall, which ends under the steps, and a
// door in it; the roof that the storage has not, and the floor above; a storage wider than the
// flight, two stair rooms in a row, other figures - and nothing amiss in any of it. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { FLIGHTS, STAIR, crossing, flightOver, runOf } from './flights.js';
import { amiss } from './holds.js';
import { sceneOf } from './scene.js';
import { roofOver, slabs } from './slabs.js';
import { SOFFIT_M, steps } from './steps.js';
import { walls } from './walls.js';

// A made-up plot of 20 m by 12 m, in cells of half a metre: a column is x = column / 2, a row of
// the top view y = 12 - row / 2, and a level 120 - level / 2 metres above sea level. Its ground
// is flat, at 104.75 m, and its outline a triangle of three of its corners, a metre in.
const paper = { cellM: 0.5, xFromM: 0, xToM: 20, yFromM: 0, yToM: 12, sideM: [100, 120] };
const outline = [1, 19, 1].map((x, corner) => [x, corner < 2 ? 11 : 1]);
const ground = { baseM: 100, rowsCm: Array(25).fill(Array(41).fill('475').join(' ')) };
const site = { ...paper, outline, ground };
// Made-up figures, each a sum of halves of halves, so that every place below is exact: an outer
// wall of 0.375 m, half an inner one of 0.125 m, a floor of 0.375 m and a roof of 0.3125 m.
const slabbed = { outerWallM: 0.375, innerWallM: 0.25, floorSlabM: 0.375, roofSlabM: 0.3125 };
const figures = { ...slabbed, railingHighM: 1, doorHighM: 2, windowHighM: 1.5, sillHighM: 1 };
const grey = { name: 'grey', hex: '#8795a1' };
const box = (x, y, z, more) => ({ x, y, z, colour: grey, ...more });
const on = (kind, turn, x, y, z) => ({ x, y, z, kind, turn, fill: '#eceff2', floor: z[1] });
// What a rule gets, taken by a rule of the check's own: to ask what a flight runs over.
const contextOf = (things) => {
  const seen = [];
  sceneOf(site, things, figures, { blocks: [(context) => seen.push(context) && []] });
  return seen[0];
};

// WHAT A FLIGHT RUNS OVER. A flight of 4.5 m by 1 m on level 30, and blocks of its width laid
// along it from its foot on, a storey high: `row` says each by its name and how many cells long
// it is, `more` what else it has. Where the foot is, by hand: not turned, a flight climbs down
// the plot, its foot at its smallest column; a quarter on, towards the smaller y, its foot at
// its smallest row; then up the plot and towards the larger y, its foot at its largest column
// and at its largest row.
const laid = (turn, row, more = {}, z = [24, 30]) => {
  const lying = (along, across) => (turn % 2 === 0 ? [along, across] : [across, along]);
  let far = 0;
  const boxes = Object.entries(row).map(([name, long]) => {
    const [from, to] = [far, (far += long)];
    const along = turn < 2 ? [4 + from, 4 + to] : [13 - to, 13 - from];
    return box(...lying(along, [12, 14]), [24, 30], { ...(name && { name }), ...more[name] });
  });
  return [...boxes, on('stairs', turn, ...lying([4, 13], [12, 14]), z)];
};
const runIn = (things) => {
  const [context, flight] = [contextOf(things), things.find((thing) => thing.kind)];
  return [context, runOf(context, flight)];
};
const told = (things) => {
  const [context, run] = runIn(things);
  return run && run.over.map(({ at, is }) => `${context.space.nameOf(at)} ${is}`).join(', ');
};
const ends = (things) => runIn(things)[1].over.flatMap(({ from, to }) => [from, to]);
assert.deepEqual([FLIGHTS, STAIR], [['stairs', 'widestairs'], 'stair']);
// Its own room is the room under its foot, whatever it is called, at each of the four turns; the
// room after it lies under the flight. The two meet on a line of the grid, at x = 4 or at 4.5;
// the first begins nowhere and the last ends nowhere, and up the plot the figures count down.
const AB = { A: 4, B: 5 };
for (const turn of [0, 1, 2, 3]) assert.equal(told(laid(turn, AB)), 'A own, B under', `by ${turn}`);
assert.deepEqual(ends(laid(0, AB)), [-Infinity, 4, 4, Infinity]);
assert.deepEqual(ends(laid(2, AB)), [Infinity, 4.5, 4.5, -Infinity]);
// A second stair room is its own too: its name begins with the word, in whatever capitals, after
// a blank and before whatever words. A room with no name lies under the flight, and so does one
// whose name holds the word further on. Open air and glass are neither, at its foot too and
// whatever they are called. And a block that it meets twice is there twice, under its name.
const AIR = { Terrace: { as: 'open' }, 'Stair of glass': { as: 'glass' }, Stairs: { as: 'open' } };
const ROWS = [
  [{ Hall: 3, ' STAIRCASE to cellar': 3, '': 3 }, 'Hall own,  STAIRCASE to cellar own,  under'],
  [{ A: 4, Terrace: 3, 'Stair of glass': 2 }, 'A own, Terrace null, Stair of glass null', AIR],
  [{ Stairs: 4, B: 5 }, 'Stairs null, B under', AIR],
  [{ A: 3, B: 3, C: 3 }, 'A own, B under, A own', { A: { group: 5 }, C: { group: 5 } }],
];
for (const [row, over, more] of ROWS) assert.equal(told(laid(2, row, more)), over);
const ROOMS = { A: 3, 'Storage under the stairs': 2, Understairs: 2, 'Upstairs hall': 2 };
assert.match(told(laid(2, ROOMS)), /^A own(, [^,]+ under){3}$/);
// ONE BLOCK ALONE, whatever it is called: no run, and the flight stands as it stood, sixteen
// steps on its foot. Nor has one a run that stands on no level, a fifth of a metre up; has a cell
// over nothing; is of a kind that is no flight; or runs along two blocks that lie side by side.
const alone = laid(0, { Storage: 9 });
const beside = [12, 13].map((row) => box([4, 13], [row, row + 1], [24, 30], { name: `${row}` }));
const spiral = laid(0, AB).map((thing) => ({ ...thing, kind: thing.kind && 'spiral' }));
const NONE = [alone, laid(0, AB, {}, [23.6, 29.6]), laid(0, { A: 4, B: 4 }), spiral];
for (const things of [...NONE, [...beside, alone.at(-1)]]) assert.equal(told(things), null);
const stepsOf = (things, by = figures) => sceneOf(site, things, by, { kinds: steps, blocks: [] });
const feet = (things) => stepsOf(things).parts.map((one) => one.min[2]);
assert.deepEqual(feet(alone), Array(16).fill(105.375));
// Two rooms under it in a row part no step: one alone is parted, where solid meets open, and
// its part nearer the foot comes first, up the plot too. And a flight as low as two steps of
// 0.1 m, its foot on a terrace, is nowhere deeper than its foot.
const lows = feet(laid(2, { A: 3, B: 3, C: 3 }));
assert.deepEqual([lows.length, lows], [17, [...lows].sort((a, b) => a - b)]);
assert.deepEqual(feet(laid(0, { Terrace: 1, B: 8 }, AIR, [29.6, 30])), Array(3).fill(105.375));

// THE HOUSE, on level 30 at 105 m, a storey of 3 m. 0: a stair room of 3 m by 1 m, from x = 1 to
// 4 and from y = 5 to 6. 1: a storage after it down the plot, 2.5 m long and as wide, to x = 6.5.
// 2: a hall beside both, up the paper, to y = 9. 3: a flight from x = 2 to 6.5, its foot a metre
// inside the stair room and its upper 2.5 m over the storage. 4: a bedroom over all of them.
const house = [
  box([2, 8], [12, 14], [24, 30], { name: 'Staircase' }),
  box([8, 13], [12, 14], [24, 30], { name: 'Storage' }),
  box([2, 13], [6, 12], [24, 30], { name: 'Hall' }),
  on('stairs', 0, [4, 13], [12, 14], [24, 30]),
  box([2, 13], [6, 14], [18, 24], { name: 'Bedroom' }),
];
const BOX = { shape: 'box', floor: 105 };
const part = (of, surface) => (thing, min, max) => ({ ...BOX, of, min, max, surface, thing });
const [step, wall] = [part('step', 'concrete'), part('wall', 'plaster')];

// FITTED AS ONE THING. Along it 4.75 m are clear, between the stair room's outer wall behind its
// foot, which ends at x = 1.375, and the storage's beyond its last step, from 6.125: the flight
// keeps its 4.5 m and is moved 0.375 m up the plot, to 1.625. No wall between the two rooms ends
// it. Across, both rooms are clear from the outer wall at y = 5.375 to half the wall toward the
// hall at 5.875: half the flight's metre, and it is cut to that. The floor lifts it by 0.375 m.
// SIXTEEN STEPS, each 0.28125 m deep and 0.1875 m higher, from 105.375 m to 108.375 m. Over the
// stair room each stands on the foot. The ninth lies over the wall of the two rooms, from x =
// 3.875 to 4.15625: it is parted at x = 4, and over the storage it is its rise and `SOFFIT_M`
// thick, from 107.0625 - 0.3125 = 106.75 m. So is every step after it: seventeen parts.
const flight = stepsOf(house).parts;
const rises = [...new Set(flight.map((one) => (one.max[2] - 105.375) / 0.1875))];
assert.deepEqual([SOFFIT_M, flight.length, rises], [0.125, 17, [...Array(17).keys()].slice(1)]);
assert.deepEqual(flight[0], step(3, [1.625, 5.375, 105.375], [1.90625, 5.875, 105.5625]));
assert.deepEqual(flight[8], step(3, [3.875, 5.375, 105.375], [4, 5.875, 107.0625]));
assert.deepEqual(flight[9], step(3, [4, 5.375, 106.75], [4.15625, 5.875, 107.0625]));
assert.deepEqual(flight[16], step(3, [5.84375, 5.375, 108.0625], [6.125, 5.875, 108.375]));
flight.forEach((one, nth) => {
  assert.equal(one.min[0], nth > 0 ? flight[nth - 1].max[0] : 1.625, `part ${nth} begins`);
  assert.equal(one.max[2] - one.min[2], nth < 9 ? one.max[2] - 105.375 : 0.3125, `part ${nth}`);
});

// THE WALL ACROSS ends under the steps. Each room has its half of it, 0.125 m thick, from the
// floor's slab at 105.375 m to the bedroom's floor at 108 m. Over the flight's half metre the
// stair room's half is not there: the step over it stands on the foot. The storage's half ends
// under the part of the ninth step that lies over it, at 106.75 m, and no higher. Beside the
// flight both are whole: a stub in either side wall.
const wallsOf = (things, by = figures) => sceneOf(site, things, by, { kinds: {}, blocks: [walls] });
const across = (things, thing, x, to, by) => {
  const lies = (one) => one.thing === thing && one.min[0] === x && one.max[0] === to;
  return wallsOf(things, by).parts.filter(lies);
};
const stubs = (thing, x, to) => [
  wall(thing, [x, 5, 105.375], [to, 5.375, 108]),
  wall(thing, [x, 5.875, 105.375], [to, 6, 108]),
];
const low = (top, from = 105.375) => wall(1, [4, 5.375, from], [4.125, 5.875, top]);
const under = (...left) => [stubs(1, 4, 4.125)[0], ...left, stubs(1, 4, 4.125)[1]];
assert.deepEqual(across(house, 0, 3.875, 4), stubs(0, 3.875, 4));
assert.deepEqual(across(house, 1, 4, 4.125), under(low(106.75)));
// With a bed where the flight is, the two halves are whole, and no other wall of the three rooms
// differs: ten of them, three of the stair room, three of the storage and four of the hall.
const bedded = house.map((thing) => (thing.kind ? { ...thing, kind: 'bed' } : thing));
assert.deepEqual(across(bedded, 0, 3.875, 4), [wall(0, [3.875, 5, 105.375], [4, 6, 108])]);
assert.deepEqual(across(bedded, 1, 4, 4.125), [wall(1, [4, 5, 105.375], [4.125, 6, 108])]);
const inIt = ({ min, max }) => min[0] >= 3.875 && max[0] <= 4.125;
const rest = (things) => wallsOf(things).parts.filter((one) => one.thing < 3 && !inIt(one));
assert.deepEqual([rest(house), rest(house).length], [rest(bedded), 10]);
// The flight crosses the face between the two, of either room, and no other: not the same figure
// across the other extent, not the wall behind its foot, not a face of the hall.
const crosses = (at, ...face) => crossing(contextOf(house), at, ...face).map((run) => run.at);
const faces = [crosses(0, 0, 4), crosses(1, 0, 4), crosses(0, 1, 4), crosses(0, 0, 1)];
assert.deepEqual([...faces, crosses(2, 0, 4)], [[3], [3], [], [], []]);
// A wall toward open air that the flight runs on over is a wall across it too, up the plot and
// fitted from y = 5.25 to 5.75: its own room's outer wall is open but for a stub either side;
// that of a room under it, after open air at its foot, ends under the steps at 106.5625 m.
const spans = (row, ...its) =>
  across(laid(2, row, AIR), ...its).flatMap((one) => [one.min[1], one.max[1], one.max[2]]);
assert.deepEqual(spans(ROWS[1][0], 0, 4.5, 4.875), [5, 5.25, 107.6875, 5.75, 6, 107.6875]);
const closed = spans(ROWS[2][0], 1, 4.125, 4.5);
assert.deepEqual(closed, [5, 5.25, 108, 5.25, 5.75, 106.5625, 5.75, 6, 108]);
// A DOOR in that wall, a cell in each room and as wide as they are, opens it as far as the wall
// reaches. A door of 2 m leaves nothing of the low wall, and no lintel: the wall ends under the
// step. A hatch of 1 m leaves the 0.375 m over it, from 106.375 m. The stubs stand in the side
// walls, and stay. Either is taken: it opened a wall.
const door = (high) => on('door', 1, [7, 9], [12, 14], [30 - 2 * high, 30]);
for (const [high, ...left] of [[2], [1, low(106.75, 106.375)]]) {
  assert.deepEqual(across([...house, door(high)], 1, 4, 4.125), under(...left), `${high} m high`);
  const kept = wallsOf([...house, door(high)]).parts.some((one) => one.thing === 5);
  assert.ok(!kept, `a door of ${high} m opened no wall`);
}

// ITS CEILING IS THE FLIGHT. Without the bedroom the stair room has its roof, and the storage,
// all of it under the flight, has none, nor a strip of one: its walls run up to the top of its
// box, at 108 m, where the stair room's end under its roof. Its floor is as it was. And the
// bedroom's floor is open over the footprint as the sketch has it, from x = 2 to 6.5, as ever.
const slabsOf = (things, thing, of) => {
  const { parts } = sceneOf(site, things, figures, { blocks: [slabs], kinds: {} });
  return parts.filter((one) => one.thing === thing && one.of === of);
};
const [roofless, plain] = [house.slice(0, 4), house.slice(0, 3)];
const roofs = (things, thing) => slabsOf(things, thing, 'roof').length;
assert.deepEqual([roofs(roofless, 0), roofs(roofless, 1), roofs(plain, 1)], [3, 0, 3]);
assert.deepEqual(slabsOf(roofless, 1, 'floor'), slabsOf(plain, 1, 'floor'));
const top = (thing, x, to) => across(roofless, thing, x, to).map((one) => one.max[2]);
const tops = [top(0, 1, 1.375), top(1, 6.125, 6.5), top(1, 4, 4.125)].flat();
assert.deepEqual(tops, [107.6875, 108, 108, 106.75, 108]);
const above = slabsOf(house, 4, 'floor');
const overFlight = ({ min, max }) => min[0] < 6.5 && max[0] > 2 && min[1] < 6 && max[1] > 5;
assert.deepEqual([above.length > 0, above.some(overFlight)], [true, false]);
// A stair room two storeys high has its outer wall over the storage whole, from 108 m up: the
// flight does not reach up it.
const tall = roofless.map((thing, at) => (at === 0 ? { ...thing, z: [18, 30] } : thing));
assert.deepEqual(across(tall, 0, 3.625, 4), [wall(0, [3.625, 5, 108], [4, 6, 110.6875])]);

// A STORAGE WIDER THAN THE FLIGHT, 3 m across, down to y = 3. The flight is as it was - across,
// the stair room is the narrowest - and lies over the storage's upper metre. There a cell of the
// storage has the flight for its ceiling, on every level of the flight, and no roof; beside the
// flight the storage has its own, down from y = 5. The wall across is as it was, its stub at
// y = 5, which no side wall hides now, whole - and beside it the storage's outer wall, to y = 3.
const wider = (more) => roofless.map((thing, at) => (at === 1 ? { ...thing, ...more } : thing));
const wide = wider({ y: [12, 18] });
const asked = contextOf(wide);
for (const [cell, lies, roof] of [
  [[8, 12, 24], true, 0],
  [[12, 13, 24], true, 0],
  [[8, 12, 29], true, 0],
  [[8, 14, 24], false, 0.3125],
  [[7, 12, 24], false, 0.3125],
]) {
  assert.deepEqual([flightOver(asked, cell), roofOver(asked, cell)], [lies, roof], String(cell));
}
const own = slabsOf(wide, 1, 'roof');
assert.deepEqual([own.length > 0, own.every((one) => one.max[1] <= 5)], [true, true]);
assert.deepEqual(stepsOf(wide).parts, flight);
assert.deepEqual(across(wide, 1, 4, 4.125), under(low(106.75)));
assert.deepEqual(across(wide, 1, 4, 4.375), [wall(1, [4, 3, 105.375], [4.375, 5, 107.6875])]);
// A storage two storeys high has its roof over the flight too, 3 m over where the flight ends:
// nothing comes up to it. One of 1.5 m has none: the flight runs through where it would lie.
// And a loft on that one, which the flight does not run over, has its own.
const squat = wider({ z: [27, 30] });
const lofted = [...squat, box([8, 13], [12, 14], [24, 27], { name: 'Loft' })];
const roofAt = (things, level) => roofOver(contextOf(things), [8, 12, level]);
const roofed = [roofAt(wider({ z: [18, 30] }), 18), roofAt(squat, 27), roofAt(lofted, 24)];
assert.deepEqual(roofed, [0.3125, 0, 0.3125]);

// TWO STAIR ROOMS IN A ROW: the storage, named a staircase. The flight is solid throughout,
// sixteen parts on its foot, and no wall crosses it: of either half the stubs alone.
const two = house.map((thing, at) => (at === 1 ? { ...thing, name: 'Stairs up' } : thing));
assert.deepEqual(feet(two), Array(16).fill(105.375));
assert.deepEqual(across(two, 0, 3.875, 4), stubs(0, 3.875, 4));
assert.deepEqual(across(two, 1, 4, 4.125), under());

// WITH OTHER FIGURES every number follows: outer and inner walls of 0.5 m, and a floor of 0.5 m.
// Along it 4.5 m are clear, from x = 1.5 to 6: the flight is moved half a metre, and stands on
// 105.5 m. Across, the walls leave a quarter of a metre, and it keeps its half about y = 5.625.
// Its ninth step, 107.1875 m high, is parted at x = 4, and over the storage begins at 106.875 m:
// there ends the storage's half of the wall, 0.25 m thick, under the lower of two steps over it.
const stout = { ...figures, outerWallM: 0.5, innerWallM: 0.5, floorSlabM: 0.5 };
const four = (parts) => [0, 8, 9, 16].map((nth) => parts[nth]);
assert.deepEqual(four(stepsOf(house, stout).parts), [
  step(3, [1.5, 5.375, 105.5], [1.78125, 5.875, 105.6875]),
  step(3, [3.75, 5.375, 105.5], [4, 5.875, 107.1875]),
  step(3, [4, 5.375, 106.875], [4.03125, 5.875, 107.1875]),
  step(3, [5.71875, 5.375, 108.1875], [6, 5.875, 108.5]),
]);
const thick = across(house, 1, 4, 4.25, stout);
assert.deepEqual([thick.length, thick[1]], [3, wall(1, [4, 5.375, 105.5], [4.25, 5.875, 106.875])]);

// NOTHING IS AMISS in any of it, with every rule there is: the flight moved 0.375 m up the plot,
// its middle 0.125 m up the paper where it was cut, and lifted by its floor - or as the stout
// figures move it. A flight that fills its blocks is cut about its own middle, and lifted alone.
const MOVED = [-0.375, 0.125, 0.375];
const wrong = (things, moved, by) => amiss(sceneOf(site, things, by ?? figures), () => moved);
const HOUSES = [house, roofless, [...house, door(2)], wide, two, tall, squat, lofted];
for (const things of HOUSES) assert.deepEqual(wrong(things, MOVED), []);
assert.deepEqual(wrong(house, [-0.5, 0.125, 0.5], stout), []);
for (const [row, , more] of ROWS) assert.deepEqual(wrong(laid(2, row, more), 0.375), []);

// AT EVERY QUARTER the same house, its cells turned as the flight is - up the plot by counting
// its columns back, across it by taking its columns for rows - has the same steps and the same
// walls, box for box but for where they lie, a storage with no roof, and nothing amiss: a place
// along x is then a row, and rows count against y.
const sizes = (turn) => {
  const things = roofless.map((thing) => {
    const along = turn < 2 ? thing.x : [15 - thing.x[1], 15 - thing.x[0]];
    const [x, y] = turn % 2 === 0 ? [along, thing.y] : [thing.y, along];
    return { ...thing, x, y, ...(thing.kind && { turn }) };
  });
  const [dx, dy, dh] = [turn < 2 ? MOVED[0] : -MOVED[0], MOVED[1], MOVED[2]];
  assert.deepEqual(wrong(things, turn % 2 === 0 ? [dx, dy, dh] : [-dy, -dx, dh]), []);
  const built = sceneOf(site, things, figures).parts.filter((one) => /step|wall|roof/.test(one.of));
  assert.ok(!built.some((one) => one.of === 'roof' && one.thing === 1), `turned by ${turn}`);
  const lies = ({ min, max }) => [...[max[0] - min[0], max[1] - min[1]].sort(), min[2], max[2]];
  const said = (one) => (one.of === 'roof' ? [] : [[one.of, one.thing, ...lies(one)].join()]);
  return built.flatMap(said).sort();
};
for (const turn of [1, 2, 3]) assert.deepEqual(sizes(turn), sizes(0), `turned by ${turn}`);

process.stdout.write(
  'tools/sketch/scene: a flight that runs over more than one block is whole, and a room under it lies under its steps, behind a wall that ends under them\n',
);
