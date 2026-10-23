// The check of the patterns of Materials (story ST-033): a row for every surface and no other; the
// four patterns where the story puts them - wood in planks, stone in tiles, concrete in panels,
// grass in spots - and the ten other surfaces plain; how much of a face a pattern takes, worked
// out by hand for wood and for grass, and under a third for every row (rule 3); every figure
// more than nothing; a program a pattern; and what a pattern puts into three.js's shader: after
// the lines that three.js as installed has, and naming no image, in the words of rules.check.js.
// How a pattern looks is a look's, not a check's (directive 14). Run by tools/sketch/check.js, as
// every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { ShaderLib } from 'three';
import { SURFACES } from '../scene/surfaces.js';
import { coverOf, patterned, PATTERNS } from './patterns.js';

// A row for every surface, and no row of a surface there is not.
assert.deepEqual(Object.keys(PATTERNS).sort(), Object.keys(SURFACES).sort());
// The four patterns where the story puts them, and the rest plain.
const FOUR = { wood: 'joints', stone: 'joints', concrete: 'joints', grass: 'spots' };
for (const [surface, row] of Object.entries(PATTERNS)) {
  assert.equal(row.kind, FOUR[surface] ?? 'none', surface);
}
// Planks are long and narrow, their ends staggered from one row to the next; tiles are square,
// panels twice as long as they are wide - and their joints the faintest.
const { wood, stone, concrete, grass } = PATTERNS;
assert.ok(wood.long >= 10 * wood.wide, 'a plank is long');
assert.ok(wood.stagger > 0 && wood.stagger < 1, 'the ends of the planks line up');
assert.equal(stone.long, stone.wide, 'a tile is square');
assert.equal(concrete.long, 2 * concrete.wide, 'a panel');
assert.ok(concrete.dark < Math.min(wood.dark, stone.dark), 'the panels are not the faintest');
assert.ok(2 * grass.spot < 0.1, 'a spot of grass is a few centimetres across');
// Every figure more than nothing - a stagger may be none - and a share less than one; a joint
// narrower than what it parts, and a spot wholly in its cell.
for (const [surface, row] of Object.entries(PATTERNS)) {
  for (const [name, figure] of Object.entries(row)) {
    if (name === 'kind') continue;
    assert.ok(Number.isFinite(figure), `${surface}: ${name}`);
    assert.ok(name === 'stagger' ? figure >= 0 : figure > 0, `${surface}: ${name} is ${figure}`);
  }
  for (const share of ['stagger', 'dark', 'shade']) {
    if (share in row) assert.ok(row[share] < 1, `${surface}: ${share}`);
  }
  if (row.kind === 'joints') assert.ok(row.joint < Math.min(row.long, row.wide), surface);
  if (row.kind === 'spots') assert.ok(2 * row.spot <= row.cell, surface);
}

// How much of a face a pattern takes, by hand. A plank 2.4 m by 0.2 m, with a joint of 12 mm
// along it and across it: 1 - (1 - 0.012 / 2.4) * (1 - 0.012 / 0.2) = 1 - 0.995 * 0.94 = 0.0647.
// A cell of 0.12 m square with a spot of 0.03 m's radius: pi * 0.03^2 / 0.12^2 = pi / 16, which
// is 0.19635. And a made-up row of each, so that the sum holds whatever the figures are set to:
// a tile of 1 m by 0.5 m with a joint of 0.1 m, 1 - 0.9 * 0.8 = 0.28; a cell of 1 m, a spot of
// 0.5 m, pi / 4.
const near = (actual, expected, what) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${what}: ${actual} is not ${expected}`);
near(coverOf({ kind: 'joints', long: 2.4, wide: 0.2, joint: 0.012 }), 0.0647, 'planks');
near(coverOf({ kind: 'spots', cell: 0.12, spot: 0.03 }), 0.19634954084936207, 'spots');
near(coverOf({ kind: 'joints', long: 1, wide: 0.5, joint: 0.1 }), 0.28, 'a made-up grid');
near(coverOf({ kind: 'spots', cell: 1, spot: 0.5 }), Math.PI / 4, 'made-up spots');
near(coverOf(PATTERNS.wood), 0.0647, 'the wood as set');
near(coverOf(PATTERNS.grass), Math.PI / 16, 'the grass as set');
// And every pattern keeps its colour: what it takes is less than a third of the face.
for (const [surface, row] of Object.entries(PATTERNS)) {
  const cover = coverOf(row);
  assert.ok(cover >= 0 && cover < 1 / 3, `${surface} takes ${cover} of its face`);
  assert.equal(cover === 0, row.kind === 'none', surface);
}

// A plain surface has nothing put into its shader, and neither has a name that is no surface.
for (const surface of [...Object.keys(SURFACES), 'marble']) {
  assert.equal(patterned(surface) === null, !(surface in FOUR), surface);
}
// The four each have a program of their own.
const four = Object.keys(FOUR).map(patterned);
assert.equal(new Set(four.map(({ key }) => key)).size, 4);
// Into three.js's own shaders of its standard material, as installed: the place and the way of a
// point kept after the vertex's place is read, and the colour made darker or lighter after it is
// read - each a line more, after the line it follows, and all of three.js's lines as they were.
const { vertexShader, fragmentShader } = ShaderLib.standard;
/** The lines of a made shader that the given one has not, three.js's own lines taken in order. */
function addedTo(given, made) {
  const [theirs, added] = [given.split('\n'), []];
  let at = 0;
  for (const line of made.split('\n')) {
    if (line === theirs[at]) at += 1;
    else added.push(line);
  }
  assert.equal(at, theirs.length, 'a line of three.js was lost or moved');
  assert.ok(added.length > 0, 'nothing was put in');
  return added.join('\n');
}
// What a pattern puts into a shader names no image, in the words of rules.check.js - no texture,
// no loader, no Image, and no face given a map - and reads none: no sampler.
const NAMED = /[Tt]exture|\w+Loader\b|\bImage\b|ImageBitmap/;
const MAPPED = /\b(?:map|matcap|\w+Map)\s*:|\.\s*(?:map|matcap|\w+Map)\s*=(?!=)/;
for (const { vertex, fragment } of four) {
  const [seen, shaded] = [vertex(vertexShader), fragment(fragmentShader)];
  for (const added of [addedTo(vertexShader, seen), addedTo(fragmentShader, shaded)]) {
    assert.doesNotMatch(added, NAMED);
    assert.doesNotMatch(added, MAPPED);
    assert.doesNotMatch(added, /sampler|\bmap\b/i);
  }
  assert.match(seen, /#include <begin_vertex>\nvPatternAt = transformed;/);
  assert.match(shaded, /#include <color_fragment>\ndiffuseColor\.rgb \*= patternShade\(/);
  assert.ok(shaded.indexOf('patternShade(vec2') < shaded.indexOf('void main'), 'declared late');
  // A joint and a spot fade by the width of a pixel.
  assert.match(shaded, /fwidth\(/);
}
// And a shader that has not the line a pattern follows - a three.js that names it otherwise - is
// refused, and not drawn plain without a word.
assert.throws(() => four[0].vertex('void main() {}'), /begin_vertex|common/);
assert.throws(() => four[0].fragment(vertexShader), /color_fragment/);

process.stdout.write(
  'tools/sketch/view3d: wood in planks, stone in tiles, concrete in panels, grass in spots - each under a third of its face, and no image\n',
);
