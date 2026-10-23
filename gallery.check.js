// The check of the gallery of the objects (story ST-029, object-groups.js and gallery.js): the
// pad's own scripts and those two on a made-up store, the made-up plot and a made-up page that
// keeps what is made - with a canvas that keeps what it is asked to draw. The groups' tiles
// against the story's table, typed in row for row, and their kinds - a named starting size
// (ST-035) by its own name and size; the gallery as it is built of them, a heading a group and a
// tile a key, with its name and size; the picture of every tile, the paper's own drawing from
// above, fitted into its square and all of it inside, a start's at its size; what `show` does - the tile that is
// picked, the button of the Objects group, the gallery in the place of what is selected, and a
// size read anew from the sketch's figures; and a click on a tile, which is the page's to take.
// The starts themselves, and what a pick of one sets down, are gallery-starts.check.js's.
// The text of page.js and index.html, which want a whole page, is gallery-text.check.js's. No
// browser, and no site but the made-up one. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/gallery.check.js
import assert from 'node:assert/strict';
import process from 'node:process';

const store = (kept = new Map()) => ({
  getItem: (key) => kept.get(key) ?? null,
  setItem: (key, text) => kept.set(key, text),
});
for (const name of ['localStorage', 'sessionStorage'])
  Object.defineProperty(globalThis, name, { value: store(), configurable: true });

// A MADE-UP PAGE that keeps what is made. A part has what it was given, the parts put into it,
// what was put after it, what it was told to say of itself (`said`) and the listeners it was
// told, one of a kind. As a canvas it keeps what it is asked to draw: where a line goes and how
// far an oval reaches (`marks`), in which unit (`unit`) and with what pen (`pen`) - and, as a
// canvas is, it is empty again once its width is set. `made` keeps the tags of all that was
// made, and `asked` what else a canvas was asked to do.
const [made, asked] = [new Set(), new Set()];
function part(tagName) {
  const one = { tagName: tagName.toUpperCase(), parts: [], hears: {}, said: {}, dataset: {} };
  one.append = (...more) => void one.parts.push(...more);
  one.after = (...more) => void (one.followed = more);
  one.addEventListener = (type, hear) => void (one.hears[type] = hear);
  one.setAttribute = (what, value) => void (one.said[what] = value);
  const [marks, pen] = [[], {}];
  pen.setTransform = (...unit) => void (one.unit = unit);
  pen.lineTo = (x, y) => void marks.push([x, y]);
  pen.ellipse = (x, y, wide, high) => void marks.push([x - wide, y - high], [x + wide, y + high]);
  const ctx = new Proxy(pen, { get: (held, key) => held[key] ?? (asked.add(key), () => {}) });
  one.getContext = (kind) => (assert.equal(kind, '2d'), ctx);
  let wide = 0;
  const width = { get: () => wide, set: (to) => void ((wide = to), (marks.length = 0)) };
  return Object.defineProperty(Object.assign(one, { marks, pen }), 'width', width);
}
// What the script asks the page for: what is selected, which the gallery is put after and shown
// in the place of, and the two parts of the button of the Objects group.
const page = { selected: part('section'), 'object-picture': part('canvas') };
page['object-name'] = part('span');
const createElement = (tagName) => (made.add(tagName), part(tagName));
const document = { getElementById: (id) => page[id], createElement };
Object.assign(globalThis, { document, location: { hash: '#top' } });

// The pad's scripts on the made-up plot, in the order of index.html, as far as the gallery needs
// them - the five files that draw more kinds, and the sketch for its figures - and its own two.
const NEEDED =
  'demo-site paper figures shapes stairs kitchen bathroom garden furniture object-groups';
for (const one of [...NEEDED.split(' '), 'blocks', 'legacy', 'sketch', 'gallery'])
  await import(`./${one}.js`);
const { SITE, paper, sketch, shapes, figures, gallery } = globalThis;
assert.equal(SITE.name, 'Made-up hillside plot');
assert.deepEqual([paper.PLANE, Object.keys(gallery)], ['top', ['show', 'onPick']]);

// THE STORY'S TABLE, typed in row for row: a group, and under it its tiles in their order - each
// by its key, a kind's or a start's, its name and its size while the sketch says no figure.
const TABLE = `
Doors, windows and stairs
  door: Door | 1 by 1 m, 2.1 m high
  window: Window | 1.5 by 0.3 m, 1.5 m high
  stairs: Staircase, one storey | 4.5 by 1 m, 3 m high
  widestaircase: Wide staircase, one storey | 4.5 by 1.5 m, 3 m high
  spiral: Spiral staircase, one storey | 2 by 2 m, 3 m high
Kitchen
  island: Kitchen island | 2.5 by 1 m, 0.9 m high
  counter: Kitchen counter | 2.5 by 0.5 m, 0.9 m high
  hob: Hob | 0.5 by 0.5 m, 0.1 m high
  sink: Sink | 1 by 0.5 m, 0.3 m high
  fridge: Fridge | 0.5 by 0.5 m, 2 m high
Bathroom
  toilet: Toilet | 0.5 by 0.5 m, 0.4 m high
  basin: Washbasin | 0.5 by 0.5 m, 0.85 m high
  bath: Bathtub | 2 by 1 m, 0.6 m high
  shower: Shower | 1 by 1 m, 2 m high
  towelrail: Towel rail | 0.5 by 0.5 m, 1.2 m high
Furniture
  singlebed: Single bed | 2 by 1 m, 1 m high
  doublebed: Double bed | 2 by 1.5 m, 1 m high
  kingbed: King-size bed | 2 by 2 m, 1 m high
  sofa: Sofa | 2 by 1 m, 0.8 m high
  table: Table | 2 by 1 m, 0.75 m high
  chair: Chair | 0.5 by 0.5 m, 0.9 m high
  desk: Desk | 1.5 by 1 m, 0.75 m high
  wardrobe: Wardrobe | 1.5 by 0.5 m, 2 m high
  cupboard: Cupboard | 1 by 0.5 m, 2 m high
  sideboard: Sideboard | 1.5 by 0.5 m, 0.8 m high
  shelf: Shelf | 1 by 0.5 m, 2 m high
  officechair: Office chair | 0.5 by 0.5 m, 1.1 m high
  armchair: Armchair | 1 by 1 m, 0.8 m high
  cornersofa: Corner sofa | 3 by 2 m, 0.8 m high
  floorlamp: Floor lamp | 0.5 by 0.5 m, 1.6 m high
  tablelamp: Table lamp | 0.5 by 0.5 m, 0.5 m high
  pendant: Pendant lamp | 0.5 by 0.5 m, 1.1 m high
  plant: Plant | 0.5 by 0.5 m, 1.2 m high
Garden
  tree: Tree | 6 by 6 m, 8 m high
  bush: Bush | 1.5 by 1.5 m, 1.2 m high
  fountain: Fountain | 2 by 2 m, 1 m high
  bench: Bench | 1.5 by 0.5 m, 0.8 m high
  gardentable: Garden table | 1 by 1 m, 0.75 m high
  lounger: Sun lounger | 2 by 0.5 m, 0.8 m high
  parasol: Parasol | 2.5 by 2.5 m, 2.5 m high
  grill: Grill | 0.5 by 0.5 m, 1 m high
People and cars
  person: Person | 0.5 by 0.5 m, 1.8 m high
  car: Car | 4.5 by 2 m, 1.5 m high`.slice(1);
/** Groups as that text: a line a group, by its name, and under it a line for each of its `rows`. */
const tabled = (groups) =>
  groups.flatMap(({ name, rows }) => [name, ...rows.map((row) => `  ${row}`)]).join('\n');

// THE GROUPS, written once beside the kinds: six, in the table's order, each `{ name, kinds,
// tiles }` - every key of `KINDS` in one group and in no second, and none that `KINDS` has not;
// its tiles the table's, by their keys, and its kinds those tiles, each start by the kind it
// stands in place of: so the bed and the wide staircase stay kinds of their groups. A kind's name and size are
// `KINDS`' own; a START's (object-groups.js) are its name and its kind at its sizes.
const { KINDS, GROUPS, STARTS } = shapes;
const sized = ([long, wide, high]) => `${long} by ${wide} m, ${high} m high`;
const thingOf = (key) =>
  STARTS[key] ? { kind: STARTS[key].kind, ...STARTS[key].sizes } : { kind: key };
const row = (key) =>
  `${key}: ${(STARTS[key] ?? KINDS[key]).name} | ${sized(shapes.sizeOf(thingOf(key)))}`;
assert.equal(tabled(GROUPS.map(({ name, tiles }) => ({ name, rows: tiles.map(row) }))), TABLE);
const placeOf = (key) => STARTS[key]?.place ?? key;
for (const { kinds, tiles } of GROUPS) assert.deepEqual(kinds, [...new Set(tiles.map(placeOf))]);
const [grouped, tiled] = ['kinds', 'tiles'].map((of) => GROUPS.flatMap((group) => group[of]));
assert.deepEqual([GROUPS.length, grouped.length, new Set(grouped).size], [6, 41, 41]);
assert.deepEqual([tiled.length, new Set(tiled).size], [43, 43]);
assert.deepEqual(grouped.toSorted(), Object.keys(KINDS).toSorted());
assert.deepEqual(GROUPS.map(Object.keys), Array(6).fill(['name', 'kinds', 'tiles']));
assert.ok(
  !shapes.known({ kind: 'bed', deep: 0.5 }) && !shapes.known({ kind: 'stairs', long: 8.5 }),
);

// THE GALLERY, as the script built it: one part right after what is selected, hidden at first,
// and in it a part a group - its heading, and under that a tile a kind, in the table's order. A
// tile is a button that says its kind and holds a picture, the name and, under the name, the
// size: a door 2.1 m high and a window 1.5 m, while the sketch says no figure. No image is made.
// A tile says its key, a kind's or a start's.
const [shown, ...more] = page.selected.followed;
assert.equal([more.length, shown.id, shown.tagName, shown.hidden].join(), '0,gallery,SECTION,true');
const built = shown.parts.map(({ tagName, parts: [heading, ...tiles] }) => {
  assert.deepEqual([tagName, heading.tagName], ['SECTION', 'H2']);
  return { name: heading.textContent, tiles };
});
const tiles = built.flatMap((group) => group.tiles);
const tags = (parts) => parts.map((one) => one.tagName).join();
for (const tile of tiles)
  assert.equal(
    [tile.tagName, tile.type, tags(tile.parts)].join(' '),
    'BUTTON button CANVAS,SPAN,SMALL',
  );
const said = ({ dataset, parts: [, name, size] }) =>
  `${dataset.kind}: ${name.textContent} | ${size.textContent}`;
assert.equal(
  tabled(built.map((group) => ({ name: group.name, rows: group.tiles.map(said) }))),
  TABLE,
);
assert.deepEqual([...made].toSorted(), ['button', 'canvas', 'h2', 'section', 'small', 'span']);
const tileOf = (kind) => tiles.find((tile) => tile.dataset.kind === kind);

// A PICTURE is the paper's own drawing of the kind from above (shapes.js), in the paper's ink
// with the paper's thin line, into a canvas of 44 pixels square: every tile's was drawn on, and
// all of it lies inside, two pixels clear of the edge. It is fitted by the kind's size along the
// plot and across it: the longer of the two reaches from margin to margin, the other is in
// proportion, and the drawing lies in the middle - worked out by hand, to a thousandth. And a
// canvas was asked nothing that the paper does not ask of one for an object: no image, no text.
/** How far a drawing reaches on its canvas: its left, its top, its right and its foot, in the canvas's unit. */
const reach = ({ marks }) =>
  [Math.min, Math.max]
    .flatMap((most) => [0, 1].map((axis) => most(...marks.map((mark) => mark[axis]))))
    .map((far) => Math.round(far * 1000) / 1000);
for (const tile of tiles) {
  const [canvas] = tile.parts;
  const [left, top, right, foot] = reach(canvas);
  assert.deepEqual([canvas.width, canvas.height, canvas.unit], [44, 44, [1, 0, 0, 1, 0, 0]]);
  assert.ok(canvas.marks.length > 0, `the picture of a ${tile.dataset.kind} is empty`);
  assert.ok(left >= 2 && top >= 2 && right <= 42 && foot <= 42, `${tile.dataset.kind}: cut off`);
  assert.deepEqual([canvas.pen.strokeStyle, canvas.pen.lineWidth], ['#1f2933', 1.25]);
}
assert.deepEqual([...asked].toSorted(), [
  'beginPath',
  'closePath',
  'fill',
  'setLineDash',
  'stroke',
]);
const FITTED = {
  tree: [2, 2, 42, 42], // 6 m by 6 m: a circle, as large as the square lets it be.
  bush: [2, 2, 42, 42], // 1.5 m by 1.5 m: as large as the tree.
  door: [2, 2, 42, 42], // 1 m by 1 m: the leaf and the way it swings.
  window: [2, 18, 42, 26], // 1.5 m by 0.3 m: a thin bar, 40 pixels by 8.
  stairs: [2, 17.556, 42, 26.444], // 4.5 m by 1 m: 40 pixels by 8.889.
  widestaircase: [2, 15.333, 42, 28.667], // 4.5 m by 1.5 m: 40 pixels by 13.333.
  singlebed: [2, 12, 42, 32], // 2 m by 1 m: 40 pixels by 20, at its own size.
  doublebed: [2, 7, 42, 37], // 2 m by 1.5 m: 40 pixels by 30.
  kingbed: [2, 2, 42, 42], // 2 m by 2 m: the square, as the bed was.
  car: [2, 13.111, 42, 30.889], // 4.5 m by 2 m: 40 pixels by 17.778.
};
for (const [kind, lies] of Object.entries(FITTED))
  assert.deepEqual(reach(tileOf(kind).parts[0]), lies, kind);
// A bush is a plain circle, one oval and no more; a door is not turned, its leaf along the left
// edge of its box, from its foot up; and the wide staircase's tile is the staircase, drawn into a
// wider box: the same places, each half as far again from the middle across the plot.
assert.equal(tileOf('bush').parts[0].marks.length, 2);
assert.equal(tileOf('door').parts[0].marks.slice(0, 2).join(' to '), '2,42 to 2,2');
const across = (kind, by) =>
  tileOf(kind).parts[0].marks.map(([x, y]) => [x, Math.round((22 + (y - 22) * by) * 1e6) / 1e6]);
assert.deepEqual(across('widestaircase', 1), across('stairs', 1.5));

// `show('car', true)`, as the page calls it while Object is the tool: the gallery shows, and what
// is selected does not; the car's tile is marked as picked, and no other; and the button of the
// Objects group says "Car" beside the car's picture, 18 pixels square - 14 by 6.222 in its middle.
const [button, named] = [page['object-picture'], page['object-name']];
/** What the page shows: whether the gallery is hidden, whether what is selected is, the name on the button, and of every tile whether it is marked as picked. */
const shows = () => [
  ...[shown.hidden, page.selected.hidden, named.textContent],
  ...tiles.map((tile) => tile.said['aria-pressed']),
];
const only = (kind) => tiled.map((key) => String(key === kind));
gallery.show('car', true);
assert.deepEqual(shows(), [false, true, 'Car', ...only('car')]);
assert.deepEqual([button.width, button.height, reach(button)], [18, 18, [2, 5.889, 16, 12.111]]);
// `show('car', false)`, with another tool: the other way round - and the button says "Car" still.
gallery.show('car', false);
assert.deepEqual(shows(), [true, false, 'Car', ...only('car')]);
// ANOTHER KIND: its tile alone is picked, and the button has its picture alone - a canvas is
// empty again once its size is set: a tree is two ovals, and no line of the car is left.
gallery.show('tree', false);
assert.deepEqual(shows(), [true, false, 'Tree', ...only('tree')]);
assert.deepEqual([button.marks.length, reach(button)], [4, [2, 2, 16, 16]]);
// A START: its tile alone is picked, and the button has its name and its picture at its size.
gallery.show('singlebed', false);
assert.deepEqual(
  [shows(), reach(button)],
  [
    [true, false, 'Single bed', ...only('singlebed')],
    [2, 5.5, 16, 12.5],
  ],
);
gallery.show('tree', false);
// ON A SCREEN WITH MORE PIXELS a canvas has more of them, and a unit of the drawing is a pixel of
// the page all the same: the tree reaches as far. A size that is no whole number is rounded.
for (const [ratio, pixels] of Object.entries({ 2: 36, 1.5: 27, 1.25: 23 })) {
  globalThis.devicePixelRatio = Number(ratio);
  gallery.show('tree', true);
  assert.deepEqual([button.width, button.height, reach(button)], [pixels, pixels, [2, 2, 16, 16]]);
  assert.deepEqual(button.unit, [pixels / 18, 0, 0, pixels / 18, 0, 0], `at ${ratio}`);
}
delete globalThis.devicePixelRatio;

// A SIZE IS READ ANEW at every `show`: with a door of 2.4 m in the sketch's figures, the door's
// tile says so - shown or not - and no other tile says another size; so a window of 1.2 m; and
// with the figures as they were, each tile says what it said. Showing writes nothing.
const sizes = () => tiles.map((tile) => tile.parts[2].textContent);
const both = () => [tileOf('door'), tileOf('window')].map((tile) => tile.parts[2].textContent);
const [plain, text] = [sizes(), JSON.stringify(sketch.doc)];
figures.set(sketch.doc, 'doorHighM', 2.4);
gallery.show('tree', false);
assert.deepEqual(both(), ['1 by 1 m, 2.4 m high', '1.5 by 0.3 m, 1.5 m high']);
figures.set(sketch.doc, 'windowHighM', 1.2);
gallery.show('tree', true);
assert.deepEqual(both(), ['1 by 1 m, 2.4 m high', '1.5 by 0.3 m, 1.2 m high']);
assert.equal(sizes().filter((size, at) => size !== plain[at]).length, 2);
for (const figure of ['doorHighM', 'windowHighM'])
  figures.set(sketch.doc, figure, figures.FIGURES[figure].default);
gallery.show('tree', true);
assert.deepEqual([sizes(), JSON.stringify(sketch.doc), sketch.past.length], [plain, text, 0]);

// A CLICK ON A TILE is a pick, and the page's to take: `onPick` is called once, with the tile's
// key - of every tile its own - and the script changes nothing by itself: the tree is picked
// still, the button says "Tree", and the gallery shows. Until the page sets it, a pick is nobody's.
const before = [shows(), reach(button)];
tileOf('sofa').hears.click();
const picks = [];
gallery.onPick = (...told) => picks.push(told);
tileOf('sofa').hears.click();
assert.deepEqual([picks.splice(0), shows(), reach(button)], [[['sofa']], ...before]);
for (const tile of tiles) tile.hears.click();
assert.deepEqual([picks.flat(), shows()], [tiled, before[0]]);
assert.deepEqual([JSON.stringify(sketch.doc), sketch.past.length], [text, 0]);

process.stdout.write(
  "tools/sketch: the gallery shows every kind in its group - the paper's own drawing of it, its name and its size - marks the one that is picked - a kind or a named starting size - writes it on the button of the Objects group, and leaves a pick to the page\n",
);
