// The check of the map's pictures under the top view (ST-046, T-046.2): the decisions of
// under/lay.js that need no page, by hand, with nothing of the real site - whom the top view asks,
// and whether it offers a map at all; the page's second policy, and that its first stays
// `connect-src 'self'`; how strongly the map shows; which pictures a view lays, of which layer
// and level, at which address, with which words in the corner; which pictures stay, go and are
// asked for when the view moves; and where index.html names the script, its element and its
// stylesheet. On a made-up place, E 2 600 000, N 1 200 000, the paper's corner at its nought,
// in a window of 512 by 512 - its middle on the place. Run by tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/under/lay.check.js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import process from 'node:process';
import { URL } from 'node:url';
import { pictures } from '../map/view.js';
import { CADASTRAL_FROM, HOSTS, LAYERS, asksOf } from '../swisstopo/hosts.js';
import { NO_PLACE, underOf } from './place.js';
import { FIRST, NEARER_IN, NOT_COME, arithmetic, laidOf, offeredOf, planOf } from './lay.js';
import { policyOf, strengthOf, viewKeyOf } from './lay.js';

// The page's script, loaded in Node, lays nothing: it has no page.
assert.equal(globalThis.under, undefined);
// It imports hosts.js alone as it loads, and the arithmetic - place.js and map/view.js, which
// the made-up pad does not serve - only where the map is offered.
const script = fs.readFileSync(new URL('lay.js', import.meta.url), 'utf8');
assert.deepEqual(
  [...script.matchAll(/^import .* from '([^']+)';$/gm)].map(([, from]) => from),
  ['../swisstopo/hosts.js'],
);
assert.throws(() => laidOf(null, 'photo', {}, { px: 1, left: 0, top: 0 }, { wide: 1, high: 1 }));
await arithmetic();
assert.deepEqual(FIRST, { on: false, layer: 'photo', strength: 0.5 });
assert.equal(NOT_COME, 'Some pictures of the map did not come.');
assert.equal(NEARER_IN, 'The cadastral map shows from nearer in.');

// WHOM IT ASKS (story, rules 1 and 2). A stand-in wherever the page was told one; swisstopo's map
// service where it was told nobody and the pad offers New plot; nobody where it offers none - the
// made-up pad, the browser tests - or where the word `asks` is refused.
const STAND_IN = asksOf('?asks=5123').map;
const SWISSTOPO = asksOf('').map;
assert.deepEqual([new URL(STAND_IN).protocol, new URL(STAND_IN).port], ['http:', '5123']);
assert.deepEqual([new URL(SWISSTOPO).protocol, new URL(SWISSTOPO).host], ['https:', HOSTS.map]);
assert.equal(offeredOf('', true), SWISSTOPO);
assert.equal(offeredOf('', false), null, 'no New plot, no stand-in: no map');
assert.equal(offeredOf('', undefined), null, 'not known whether New plot is offered: no map');
assert.equal(offeredOf('?asks=5123', false), STAND_IN, 'a stand-in on the made-up pad');
assert.equal(offeredOf('?asks=5123', true), STAND_IN);
for (const query of ['?asks=', '?asks=word', '?asks=05123', '?asks=1&asks=2', '?asks=99999'])
  for (const newPlot of [true, false]) assert.equal(offeredOf(query, newPlot), null, query);

// THE PAGE'S SECOND POLICY: pictures from its own address, from `data:` - the toolbar's drawings
// of icons.css - and from the one origin asked, and nothing else; no word of requests.
assert.equal(policyOf(null), "img-src 'self' data:");
assert.equal(policyOf(STAND_IN), `img-src 'self' data: ${STAND_IN}`);
assert.equal(policyOf(SWISSTOPO), `img-src 'self' data: ${SWISSTOPO}`);
for (const origin of [null, STAND_IN, SWISSTOPO]) {
  assert.equal(policyOf(origin).split(';').length, 1, 'one directive, img-src');
  assert.ok(!policyOf(origin).includes('connect-src'));
}
// And the first, in the page's markup, is `connect-src 'self'` to the letter, and the only one there.
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const policies = [...html.matchAll(/http-equiv="Content-Security-Policy" content="([^"]*)"/g)];
assert.deepEqual(
  policies.map(([, content]) => content),
  ["connect-src 'self'"],
);

// HOW STRONGLY: a figure from 0 to 1, held to them; anything else half.
assert.deepEqual([0.2, 0, 1, 1.5, -1].map(strengthOf), [0.2, 0, 1, 1, 0]);
assert.deepEqual([Number.NaN, '0.3', null, undefined].map(strengthOf), [0.5, 0.5, 0.5, 0.5]);

// WHAT A VIEW LAYS. The place under the window's middle is the plot's nought, at a bearing of 90
// - x east, y north, the map unturned: a zoom of `px` pixels a cell, the window's corner 256 / px
// cells up and left of the paper's.
const PLACE = { originLV95: [2_600_000, 1_200_000], bearingDeg: 90, xFromM: 0, yToM: 0 };
const SIZE = { wide: 512, high: 512 };
const zoomOf = (px) => ({ px, left: -256 / px, top: -256 / px });
const address = (layer, picture) =>
  `${STAND_IN}/1.0.0/${LAYERS[layer].id}/default/current/2056/${picture}`;

// The photo at a pixel a cell, 0.5 m a CSS pixel: level 26, a pixel of the map a pixel, the box
// the window. Its corner lies (2 600 000 - 2 420 000) / 0.5 - 256 = 359 744 pixels east of the
// sheet's west edge and (1 350 000 - 1 200 000) / 0.5 - 256 = 299 744 south of its north edge:
// columns 1405 to 1407 - 359 744 / 256 is 1405.25 - and rows 1170 to 1172 - 1170.875 - nine
// pictures, the first at 1405 x 256 - 359 744 = -64, 1170 x 256 - 299 744 = -224.
const photo = laidOf(STAND_IN, 'photo', PLACE, zoomOf(1), SIZE);
assert.deepEqual(
  [photo.level, photo.box, photo.turnDeg, photo.scale, photo.centre],
  [26, SIZE, 0, 1, [256, 256]],
);
assert.equal(photo.pictures.length, 9);
assert.deepEqual(photo.pictures[0], {
  key: 'photo/26/1405/1170',
  address: address('photo', '26/1405/1170.jpeg'),
  left: -64,
  top: -224,
});
assert.deepEqual(photo.pictures.at(-1).key, 'photo/26/1407/1172');
assert.deepEqual(photo.said, ['© swisstopo']);
assert.ok(
  photo.pictures.every((one) => one.address.startsWith(`${STAND_IN}/`)),
  'one origin',
);
// Of swisstopo, the same pictures of the map service.
const real = laidOf(SWISSTOPO, 'photo', PLACE, zoomOf(1), SIZE).pictures[0].address;
assert.equal(real, `${SWISSTOPO}/1.0.0/${LAYERS.photo.id}/default/current/2056/26/1405/1170.jpeg`);

// A turned plot lays the box that underOf gives, and the pictures of map/view.js in it, unchanged.
for (const bearingDeg of [0, 232, (Math.atan2(3, 4) * 180) / Math.PI]) {
  const place = { ...PLACE, bearingDeg };
  const under = underOf(place, zoomOf(1), SIZE);
  const laid = laidOf(STAND_IN, 'photo', place, zoomOf(1), SIZE);
  assert.deepEqual([laid.box, laid.turnDeg, laid.scale], [under.box, under.turnDeg, under.scale]);
  assert.equal(laid.pictures.length, pictures(under.view, under.box).length, String(bearingDeg));
}

// Nearer than a layer's last level. At 4 pixels a cell, 0.125 m a CSS pixel: the photo at level
// 28, 0.1 m, a scale of 0.8, a box of 512 / 0.8 = 640. The national map ends at 27, 0.25 m: its
// pictures shown larger - a scale of 2, a box of 640 / 2.5 = 256 - and its corner
// 180 000 / 0.25 - 128 = 719 872 east, 150 000 / 0.25 - 128 = 599 872 south: column 2812 alone -
// 719 872 / 256 is 2812 and the box ends at 2813 - and rows 2343 and 2344 - 2343.25 to 2344.25.
const nearPhoto = laidOf(STAND_IN, 'photo', PLACE, zoomOf(4), SIZE);
assert.deepEqual([nearPhoto.level, nearPhoto.box.wide, nearPhoto.scale], [28, 640, 0.8]);
const national = laidOf(STAND_IN, 'national', PLACE, zoomOf(4), SIZE);
assert.deepEqual([national.level, national.box, national.scale], [27, { wide: 256, high: 256 }, 2]);
assert.deepEqual(
  national.pictures.map(({ key, left, top }) => [key, left, top]),
  [
    ['national/27/2812/2343', 0, -64],
    ['national/27/2812/2344', 0, 192],
  ],
);
assert.equal(national.pictures[0].address, address('national', '27/2812/2343.jpeg'));
// At a pixel a cell the national map has its level, 26, as the photo has.
assert.equal(laidOf(STAND_IN, 'national', PLACE, zoomOf(1), SIZE).pictures.length, 9);

// The cadastral map, where this tree has it: from its own level alone, and further out no picture
// and the sentence in the corner, after both credits. At 0.1 pixel a cell, 5 m a CSS pixel: level 21.
if (Object.hasOwn(LAYERS, 'cadastral')) {
  assert.ok(CADASTRAL_FROM > 21 && CADASTRAL_FROM <= 26);
  const far = laidOf(STAND_IN, 'cadastral', PLACE, zoomOf(0.1), SIZE);
  assert.deepEqual([far.level, far.pictures], [21, []]);
  assert.deepEqual(far.said, [...LAYERS.cadastral.credits, NEARER_IN]);
  assert.equal(LAYERS.cadastral.credits.length, 2);
  const near = laidOf(STAND_IN, 'cadastral', PLACE, zoomOf(1), SIZE);
  assert.deepEqual([near.pictures.length, near.said], [9, [...LAYERS.cadastral.credits]]);
  assert.equal(near.pictures[0].key, 'cadastral/26/1405/1170');
} else assert.equal(CADASTRAL_FROM, null);
// Far out, the photo has pictures of a coarse level, and the sentence is the cadastral map's alone.
const farPhoto = laidOf(STAND_IN, 'photo', PLACE, zoomOf(0.1), SIZE);
assert.deepEqual([farPhoto.level, farPhoto.said], [21, ['© swisstopo']]);
assert.ok(farPhoto.pictures.length > 0);

// What is refused: a plot with no place, one off the sheet, and a layer that is none.
assert.deepEqual(laidOf(STAND_IN, 'photo', { ...PLACE, originLV95: null }, zoomOf(1), SIZE), {
  refused: NO_PLACE,
});
const offSheet = { ...PLACE, originLV95: [2_400_000, 1_200_000] };
assert.deepEqual(laidOf(STAND_IN, 'photo', offSheet, zoomOf(1), SIZE), { refused: NO_PLACE });
assert.deepEqual(laidOf(STAND_IN, 'satellite', PLACE, zoomOf(1), SIZE), {
  refused: 'The map has no layer satellite.',
});
assert.deepEqual(laidOf(STAND_IN, 'hasOwnProperty', PLACE, zoomOf(1), SIZE), {
  refused: 'The map has no layer hasOwnProperty.',
});

const keys = (laid) => laid.pictures.map(({ key }) => key);
// WHICH PICTURES STAY, GO AND ARE ASKED FOR: those still wanted stay, the others go; of those
// wanted, those not shown - a picture that did not come among them - are asked for.
assert.deepEqual(planOf(['a', 'b', 'c'], ['b', 'c', 'd']), {
  keep: ['b', 'c'],
  drop: ['a'],
  ask: ['d'],
});
assert.deepEqual(planOf([], ['a', 'b']), { keep: [], drop: [], ask: ['a', 'b'] });
assert.deepEqual(planOf(['a', 'b'], []), { keep: [], drop: ['a', 'b'], ask: [] });
assert.deepEqual(planOf(['a'], ['a']), { keep: ['a'], drop: [], ask: [] });
// A view panned by a picture keeps the pictures that still show and asks for the new ones: 256
// pixels east, its corner at 360 000, 1406.25 pictures, the first column goes - 1405 - and the
// fourth, 1408, comes. Panned by half a picture, 1405.75, it has the same nine.
const half = laidOf(STAND_IN, 'photo', PLACE, { px: 1, left: -128, top: -256 }, SIZE);
assert.deepEqual(planOf(keys(photo), keys(half)).ask, []);
const panned = laidOf(STAND_IN, 'photo', PLACE, { px: 1, left: 0, top: -256 }, SIZE);
const moved = planOf(keys(photo), keys(panned));
assert.deepEqual(
  [moved.keep.length, moved.drop, moved.ask],
  [
    6,
    ['photo/26/1405/1170', 'photo/26/1405/1171', 'photo/26/1405/1172'],
    ['photo/26/1408/1170', 'photo/26/1408/1171', 'photo/26/1408/1172'],
  ],
);
// Another layer asks for all of its own.
assert.equal(
  planOf(keys(photo), keys(laidOf(STAND_IN, 'national', PLACE, zoomOf(1), SIZE))).keep.length,
  0,
);

// WHEN A VIEW MOVED: the same view twice is one, and asks nothing more; panned, zoomed or of
// another layer it is another.
const again = laidOf(STAND_IN, 'photo', PLACE, zoomOf(1), SIZE);
assert.equal(viewKeyOf(again), viewKeyOf(photo));
assert.notEqual(viewKeyOf(panned), viewKeyOf(photo));
assert.notEqual(viewKeyOf(nearPhoto), viewKeyOf(photo));
const panByOne = laidOf(STAND_IN, 'photo', PLACE, { px: 1, left: -255, top: -256 }, SIZE);
assert.notEqual(viewKeyOf(panByOne), viewKeyOf(photo));
assert.notEqual(viewKeyOf(laidOf(STAND_IN, 'national', PLACE, zoomOf(1), SIZE)), viewKeyOf(photo));

// OF index.html: the element under the canvas, the stylesheet, and the script - a module, once,
// after the zoom and Open plot that it asks for, and before page.js, which draws first.
const trimmed = html.split('\n').map((line) => line.trim());
const after = (line) => trimmed[trimmed.indexOf(line) + 1];
assert.equal(after('<div id="under-map" hidden></div>'), '<canvas id="paper" role="img"></canvas>');
const SCRIPT = '<script type="module" src="under/lay.js"></script>';
const SHEET = '<link rel="stylesheet" href="under/under.css" />';
for (const once of [SCRIPT, SHEET, 'id="under-map"'])
  assert.equal(html.split(once).length, 2, once);
const place = trimmed.indexOf(SCRIPT);
for (const before of ['zoom.js', 'open-plot.js', 'draw.js'])
  assert.ok(trimmed.indexOf(`<script src="${before}"></script>`) < place, before);
assert.equal(after(SCRIPT), '<script src="page.js"></script>');
// The holder is shown before the window is measured: hidden, it is 0 by 0, and the first view of
// a map switched on would have no picture until the view moved (found by T-046.3).
const shownAt = script.indexOf('holder.hidden = false;');
assert.ok(shownAt > 0 && shownAt < script.indexOf('wide: holder.clientWidth'), 'measured hidden');

process.stdout.write(
  'under/lay.js holds: whom the top view asks, its policy, and which pictures it lays and asks for\n',
);
