// What shapes.js draws, and the five files that draw more kinds - stairs.js, kitchen.js,
// bathroom.js, garden.js and furniture.js - checked on their own: that every kind of object has
// a shape from above and one from the side, however it is turned, that the wide staircase is the
// staircase in a wider box, that a spiral staircase is one staircase in both views, and what the
// five kinds of furniture are. check.js runs it first.
import assert from 'node:assert/strict';

// figures.js says how high a door and a window are: shapes.js asks it.
const DRAWING = ['figures', 'shapes', 'stairs', 'kitchen', 'bathroom', 'garden', 'furniture'];
for (const file of DRAWING) await import(`./${file}.js`);
const { shapes } = globalThis;

// A canvas that keeps where it was drawn on: the places of a line, and how far an oval reaches -
// its upper half alone where it is drawn from half a turn on, as the bush is.
const BOX = [10, 20, 30, 60];
const QUARTERS = [0, 1, 2, 3];
const marks = [];
const canvas = {
  lineTo: (x, y) => marks.push([x, y]),
  ellipse: (x, y, wide, high, _, from) =>
    marks.push([x - wide, y - high], [x + wide, from ? y : y + high]),
};
for (const other of ['beginPath', 'closePath', 'fill', 'stroke', 'setLineDash']) {
  canvas[other] = () => {};
}
const within = (value, from, to) => value > from - 1e-9 && value < to + 1e-9;

/** Where a kind of object is drawn into the box, in a view and at a quarter: all of it inside. */
function drawn(kind, view, turn) {
  marks.length = 0;
  shapes.draw(canvas, { kind, turn }, view, BOX, '#000', 0.1);
  const inside = marks.every(([x, y]) => within(x, BOX[0], BOX[2]) && within(y, BOX[1], BOX[3]));
  assert.ok(marks.length > 0 && inside, `a ${kind} from the ${view}, turned by ${turn} quarters`);
  return [...marks];
}

// Every kind has both shapes, at every quarter: a kind without one would leave the paper undrawn.
// The standing shape serves both slices: the one along the plot, and the one across it.
for (const kind of Object.keys(shapes.KINDS)) {
  for (const turn of QUARTERS) for (const view of ['top', 'side', 'end']) drawn(kind, view, turn);
}

// The wide staircase stands in the list right after the staircase, under its name and of its
// size: as long and as high, and half as wide again - nine cells by three - and turned by a
// quarter as wide as it was long. It is drawn as the staircase is, in every view at every
// quarter, the same shape into the same box: from above the box, the eight lines between its
// nine steps and the arrow with its head; from the side, along its flight, nine steps.
const LISTED = Object.keys(shapes.KINDS);
const { stairs, widestairs } = shapes.KINDS;
assert.equal(LISTED[LISTED.indexOf('stairs') + 1], 'widestairs');
assert.deepEqual([stairs.name, stairs.size], ['Staircase, one storey', [4.5, 1, 3]]);
assert.deepEqual([widestairs.name, widestairs.size], ['Wide staircase, one storey', [4.5, 1.5, 3]]);
assert.deepEqual([widestairs.fill, widestairs.lift], [stairs.fill, undefined]);
assert.deepEqual(shapes.sizeOf({ kind: 'widestairs', turn: 1 }), [1.5, 4.5, 3]);
for (const turn of QUARTERS) {
  for (const view of ['top', 'side', 'end']) {
    const said = `a wide staircase from the ${view}, turned by ${turn} quarters`;
    assert.deepEqual(drawn('widestairs', view, turn), drawn('stairs', view, turn), said);
  }
}
const marked = ['top', 'side'].map((view) => drawn('widestairs', view, 0).length);
assert.deepEqual(marked, [4 + 2 * 8 + 2 + 3, 2 + 2 * 9]);

// A spiral staircase's first step is at the uphill side; and each step ends, on the slice along
// the plot, as far down the plot as it ends from above, however the staircase is turned - and
// on the slice across the plot, as far across it. From above the steps are drawn after the
// round, each a line from the post; standing up each is a box. The paper of the slice across
// the plot runs as the rows of the top view do: what is further down there is further right here.
assert.equal(drawn('spiral', 'side', 0)[1][0], BOX[0]);
const share = (value, from, to) => (value - from) / (to - from);
for (const turn of QUARTERS) {
  const above = drawn('spiral', 'top', turn);
  const [beside, behind] = [drawn('spiral', 'side', turn), drawn('spiral', 'end', turn)];
  for (let step = 0; step < 12; step += 1) {
    const [down, across] = above[2 * step + 3];
    const said = `step ${step}, turned by ${turn} quarters`;
    assert.ok(Math.abs(down - beside[4 * step + 1][0]) < 1e-9, said);
    const [far, there] = [share(across, BOX[1], BOX[3]), share(behind[4 * step + 1][0], 10, 30)];
    assert.ok(Math.abs(far - there) < 1e-9, `${said}, across the plot`);
  }
}

// The five kinds of furniture stand together in the list, from the sofa on, in this order, each
// under its name and of its size: on the floor whole cells of half a metre, as every kind but
// the window is, and turned by a quarter as wide as it was long. furniture.js draws each, and
// each fills its box in every view at every quarter: from above its edge runs along all four
// sides, and standing it reaches from its top down to the floor.
const FURNITURE = {
  sofa: ['Sofa', [2, 1, 0.8]],
  table: ['Table', [2, 1, 0.75]],
  chair: ['Chair', [0.5, 0.5, 0.9]],
  desk: ['Desk', [1.5, 1, 0.75]],
  wardrobe: ['Wardrobe', [1.5, 0.5, 2]],
};
const CELL_M = 0.5;
const sidesOf = (places) => [
  Math.min(...places.map(([x]) => x)),
  Math.min(...places.map(([, y]) => y)),
  Math.max(...places.map(([x]) => x)),
  Math.max(...places.map(([, y]) => y)),
];
assert.deepEqual(LISTED.slice(LISTED.indexOf('sofa')).slice(0, 5), Object.keys(FURNITURE));
for (const [kind, [name, size]] of Object.entries(FURNITURE)) {
  const [long, wide, high] = size;
  assert.deepEqual([shapes.KINDS[kind].name, shapes.KINDS[kind].size], [name, size]);
  assert.deepEqual(shapes.sizeOf({ kind, turn: 1 }), [wide, long, high]);
  assert.ok(
    [long, wide].every((metres) => Number.isInteger(metres / CELL_M)),
    `a ${kind}`,
  );
  for (const turn of QUARTERS) {
    for (const view of ['top', 'side', 'end']) {
      const said = `a ${kind} from the ${view}, turned by ${turn} quarters, fills its box`;
      sidesOf(drawn(kind, view, turn)).forEach((side, at) =>
        assert.ok(Math.abs(side - BOX[at]) < 1e-9, said),
      );
    }
  }
}

// A sofa and a chair have their backs at the far side until they are turned - at the top of the
// paper - and with every quarter a side on, clockwise: at the right, at the bottom, at the left.
// So far in from that side the back ends, and a line of the shape runs there.
const BACKS = { sofa: 0.25, chair: 0.16 };
const [ACROSS, DOWN] = [BOX[2] - BOX[0], BOX[3] - BOX[1]];
for (const [kind, deep] of Object.entries(BACKS)) {
  const ends = [
    [1, BOX[1] + deep * DOWN],
    [0, BOX[2] - deep * ACROSS],
    [1, BOX[3] - deep * DOWN],
    [0, BOX[0] + deep * ACROSS],
  ];
  ends.forEach(([axis, at], turn) => {
    const there = drawn(kind, 'top', turn).filter((place) => Math.abs(place[axis] - at) < 1e-9);
    assert.ok(there.length >= 2, `the back of a ${kind}, turned by ${turn} quarters`);
  });
}
