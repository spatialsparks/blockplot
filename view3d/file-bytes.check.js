// The check of the bytes of a file of the house, on a made-up room worked out by hand: what
// three.js's exporter writes of the meshes of the stage, read here as the glTF specification
// lays a binary file out. Its length is its own; it holds a scene of meshes with their
// materials and their numbers, and no camera, no light and no picture; every number lies where
// the file says, and the least and the most it states are the least and the most there are;
// every place is where the stage has it - metres, y up - point for point; every face looks one
// way, of length one, and every triangle runs against the clock; and the box around all of it
// is the room's, by hand. The room has a roof that slopes and a pane that comes down to an
// edge: the corners of both lie in the file where the stage has them, by hand, and the
// triangles of no size are the ones counted here. In White and in the surfaces. The exporter
// wants a browser's own reader of files, `FileReader`, and Node has none: one is made up here,
// of Node's own Blob. So these are the exporter's bytes as that reader hands them on; what a
// browser saves is tests/e2e/sketch-3d-file.spec.ts's. Run by tools/sketch/check.js, as every
// *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { TextDecoder } from 'node:util';
import { SURFACES } from '../scene/surfaces.js';
import { bytesOf } from './file.js';
import { frameOf } from './frame.js';
import { meshesOf } from './meshes.js';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    void blob.arrayBuffer().then((bytes) => {
      this.result = bytes;
      this.onloadend();
    });
  }
};

// A room, in metres of the plot - x, y and the height over the sea - on a stage whose floor lies
// at 108 m: a floor of wood 4 m by 3 m, a wall of plaster along one side and a pane of glass
// along the other; in it a table of wood, a step of concrete and a shower's glass; and beside it
// the crown of a tree, a ball of 2 m. Every figure is an eighth of a metre: a file has it whole.
// And what slopes (story ST-026), a slant of either kind and along either extent: over the room
// a roof of concrete, 0.25 m thick, that falls across the plot, from the wall down to the pane
// - both its planes slope - and beside the wall, in line with it, a pane of glass 2 m long whose
// head falls down the plot from the wall's 2.5 m to nothing: its bottom is level, and it comes
// down to an edge.
const place = frameOf({ box: { min: [0, 0, 108] } });
const box = (of, surface, min, max) => ({ of, shape: 'box', surface, min, max });
const slant = (of, surface, min, max, along, low, high) => ({
  ...box(of, surface, min, max),
  ...{ shape: 'slant', along, low, high },
});
const ROOM = [
  box('floor', 'wood', [0, 0, 108], [4, 3, 108.25]),
  box('wall', 'plaster', [0, 2.5, 108.25], [4, 3, 110.75]),
  box('pane', 'glass', [0, 0, 108.25], [4, 0.125, 110.75]),
  box('piece', 'wood', [1, 1, 108.25], [2, 2, 109]),
  box('step', 'concrete', [3, 1, 108.25], [4, 2, 108.5]),
  { of: 'piece', shape: 'ball', surface: 'leaf', min: [6, 0, 109], max: [8, 2, 112] },
  box('piece', 'glass', [2.5, 0.5, 108.25], [3.5, 0.625, 110.25]),
  slant('roof', 'concrete', [0, 0, 110.75], [4, 3, 112.5], 1, [110.75, 112.25], [111, 112.5]),
  slant('pane', 'glass', [4, 2.875, 108.25], [6, 3, 110.75], 0, [108.25, 108.25], [110.75, 108.25]),
];
// By hand: the room and the tree lie within 8 m along the plot and 3 m across it, and the upper
// edge of the roof, at the wall, is the highest of all: 4.5 m, half a metre over the tree. On
// the stage that is x from 0 to 8, y - the height - from 0 to 4.5, and z, the plot's y the other
// way round, from -3 to 0.
const BOX = [0, 0, -3, 8, 4.5, 0];
// A box is 24 points and 12 triangles; a ball 13 rings of 24 points, and two triangles between
// every two points of two rings: 312 and 576. A slant is what a box is, six faces of four
// points and two triangles each - also where it comes down to an edge, with triangles of no
// size there.
const SHAPE = { box: [24, 12], ball: [312, 576], slant: [24, 12] };
// The corners of the two slants where the stage has them, by hand, each as `x height z`: the
// roof's eight - at the pane, z = 0, its bottom lies 2.75 m and its top 3 m over the stage's
// floor, at the wall, z = -3, 4.25 m and 4.5 m - and the pane's six, for at its edge, x = 6, its
// top and its bottom are one line, 0.25 m up. A corner is a point of the three faces that meet
// there: three times a point of its mesh, and six times where two corners are one place.
const ROOF = '0 2.75 0|4 2.75 0|0 3 0|4 3 0|0 4.25 -3|4 4.25 -3|0 4.5 -3|4 4.5 -3'.split('|');
const EDGED = '4 0.25 -2.875|4 0.25 -3|4 2.75 -2.875|4 2.75 -3|6 0.25 -2.875|6 0.25 -3'.split('|');
// The surfaces in the order they first come: what the file has a mesh of, and a material.
const NAMES = ['wood', 'plaster', 'glass', 'concrete', 'leaf'];
// A colour of the pad as light takes it, which is how a file of glTF states one: three shares.
const linear = (level) => (level <= 0.04045 ? level / 12.92 : ((level + 0.055) / 1.055) ** 2.4);
const shares = (hex) =>
  [1, 3, 5].map((at) => linear(Number.parseInt(hex.slice(at, at + 2), 16) / 255));
const near = (actual, expected, what) => {
  assert.equal(actual.length, expected.length, what);
  actual.forEach((value, at) => assert.ok(Math.abs(value - expected[at]) < 1e-6, what));
};

// The layout: twelve bytes of a header - the word glTF, version 2, the length of the whole -
// then a chunk of JSON, padded with blanks, and a chunk of numbers, each with its length and its
// kind before it, and each a multiple of four long. Two chunks, and nothing after them.
const [JSON_CHUNK, BIN_CHUNK] = [0x4e4f534a, 0x004e4942];
function chunksOf(file) {
  const view = new DataView(file);
  const word = String.fromCharCode(...new Uint8Array(file, 0, 4));
  const [version, stated, long] = [4, 8, 12].map((at) => view.getUint32(at, true));
  assert.deepEqual([word, version, stated], ['glTF', 2, file.byteLength]);
  const numbers = view.getUint32(20 + long, true);
  const kinds = [view.getUint32(16, true), view.getUint32(24 + long, true)];
  assert.deepEqual(kinds, [JSON_CHUNK, BIN_CHUNK]);
  assert.deepEqual([long % 4, numbers % 4, 28 + long + numbers], [0, 0, file.byteLength]);
  const text = new TextDecoder().decode(new Uint8Array(file, 20, long));
  assert.match(text, /^\{.*\} {0,3}$/s);
  return { json: JSON.parse(text), bin: new DataView(file, 28 + long, numbers) };
}

// How a kind of number is read, and how many bytes it is: a corner of a triangle is a whole
// number of two bytes or of four, and all else a number of four.
const READ = { 5123: ['getUint16', 2], 5125: ['getUint32', 4], 5126: ['getFloat32', 4] };
// What a run of numbers is for, as the file says it: points, or the corners of triangles.
const [POINTS, CORNERS] = [34962, 34963];
/**
 * The numbers of an accessor of a file, read out of its chunk of numbers - `per` in a row for a
 * point, one for a corner: the run lies within its view and the view within the buffer, on a
 * multiple of four, and the least and the most it states are the least and the most there are.
 */
function numbersOf({ json, bin }, at, per) {
  const { bufferView, componentType, count, type, min, max, ...more } = json.accessors[at];
  const { buffer, byteOffset, byteLength, target, byteStride } = json.bufferViews[bufferView];
  const [reads, size] = READ[componentType];
  const stride = byteStride ?? size * per;
  assert.deepEqual([more, buffer, type], [{}, 0, per === 3 ? 'VEC3' : 'SCALAR']);
  assert.deepEqual([target, byteStride], per === 3 ? [POINTS, 12] : [CORNERS, undefined]);
  assert.ok(byteOffset % 4 === 0 && byteOffset + byteLength <= json.buffers[0].byteLength);
  assert.ok(count > 0 && (count - 1) * stride + size * per <= byteLength);
  const all = [];
  for (let item = 0; item < count * per; item += 1) {
    all.push(bin[reads](byteOffset + Math.floor(item / per) * stride + (item % per) * size, true));
  }
  const end = (pick) =>
    min.map((_, axis) => pick(...all.filter((__, item) => item % per === axis)));
  near(min, end(Math.min), `the least of accessor ${at}`);
  near(max, end(Math.max), `the most of accessor ${at}`);
  return all;
}

/** A file, read whole: what it holds, and of each of its meshes the points, where their faces look, and the corners of its triangles. */
function readOf(file) {
  const chunks = chunksOf(file);
  const { json, bin } = chunks;
  // It holds a scene of meshes with their materials, and their numbers: no camera, no light -
  // which would be an extension - no picture, no sampler of one, nothing that moves.
  const HELD = ['accessors', 'asset', 'bufferViews', 'buffers', 'materials', 'meshes', 'nodes'];
  assert.deepEqual(Object.keys(json).sort(), [...HELD, 'scene', 'scenes']);
  assert.deepEqual(json.asset, { version: '2.0', generator: json.asset.generator });
  const every = json.nodes.map((_, at) => at);
  assert.deepEqual([json.scene, json.scenes], [0, [{ nodes: every }]]);
  // One buffer, which lies in the file itself: the chunk of numbers, to the padding.
  const [{ byteLength, ...elsewhere }] = json.buffers;
  assert.deepEqual([json.buffers.length, elsewhere], [1, {}]);
  assert.ok(byteLength <= bin.byteLength && bin.byteLength - byteLength < 4);
  const meshes = json.nodes.map((node, at) => {
    // A node is a name and a mesh, and a mesh one run of triangles of one material.
    assert.deepEqual(node, { name: node.name, mesh: at });
    const [{ attributes, indices, material, mode, ...more }, ...others] =
      json.meshes[at].primitives;
    assert.deepEqual(
      [Object.keys(json.meshes[at]), others, more, mode],
      [['primitives'], [], {}, 4],
    );
    assert.deepEqual(Object.keys(attributes).sort(), ['NORMAL', 'POSITION']);
    const [points, looks] = ['POSITION', 'NORMAL'].map((key) =>
      numbersOf(chunks, attributes[key], 3),
    );
    const corners = numbersOf(chunks, indices, 1);
    assert.ok(points.length === looks.length && corners.length % 3 === 0, node.name);
    assert.ok(corners.every((corner) => Number.isInteger(corner) && corner < points.length / 3));
    return { name: node.name, material: json.materials[material], points, looks, corners };
  });
  // Every run of numbers in the file is some mesh's: nothing lies in it unasked.
  const asked = json.meshes.flatMap(({ primitives: [one] }) => [
    ...Object.values(one.attributes),
    one.indices,
  ]);
  assert.deepEqual(
    asked.sort((one, next) => one - next),
    json.accessors.map((_, at) => at),
  );
  assert.deepEqual(
    json.accessors.map((one) => one.bufferView),
    json.bufferViews.map((_, at) => at),
  );
  return { json, meshes };
}

const three = (all, at) => all.slice(3 * at, 3 * at + 3);
for (const white of [true, false]) {
  const stood = meshesOf(ROOM, place, { sun: true, white }).all.children;
  const { json, meshes } = readOf(await bytesOf(stood));
  assert.deepEqual(
    meshes.map(({ name }) => name),
    NAMES,
  );
  // The materials: in White the white - which a file says by saying nothing of a colour - and
  // glass, white and see-through by the share it does not hide; in the surfaces one a surface,
  // in the colour that scene/surfaces.js says, as light takes it, and as rough. No metal.
  const WHITE = { pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 1 }, name: 'white' };
  for (const { name, material } of meshes) {
    const { colour, rough, hides } = SURFACES[name];
    const { pbrMetallicRoughness: face, alphaMode, ...more } = material;
    if (white && hides === undefined) assert.deepEqual(material, WHITE);
    assert.deepEqual([more, alphaMode], [{ name: material.name }, hides && 'BLEND'], name);
    const light = [...(white ? [1, 1, 1] : shares(colour)), hides ?? 1];
    near(face.baseColorFactor ?? [1, 1, 1, 1], light, name);
    assert.deepEqual([face.metallicFactor, face.roughnessFactor], [0, white ? 1 : rough], name);
    assert.deepEqual(
      Object.keys(face).filter((key) => !key.endsWith('Factor')),
      [],
      name,
    );
  }
  assert.deepEqual(
    json.materials.map((one) => one.name),
    white ? ['white', 'glass'] : NAMES,
  );
  // The places: point for point where the stage has them - the stage's meshes of a surface, one
  // after the other - with the way each face looks, of length one. So many points and so many
  // triangles as the parts have, by hand; and every triangle runs against the clock for one who
  // looks at it from the side its face looks to: no program shows the house inside out. Those
  // of no size are counted, mesh by mesh.
  const flat = {};
  for (const { name, points, looks, corners } of meshes) {
    const of = stood.filter((mesh) => mesh.name === name);
    const drawn = (what) => of.flatMap((mesh) => [...mesh.geometry.attributes[what].array]);
    assert.deepEqual([points, looks], [drawn('position'), drawn('normal')], name);
    const parts = ROOM.filter((part) => part.surface === name).map((part) => SHAPE[part.shape]);
    const sum = (at) => parts.reduce((total, counts) => total + counts[at], 0);
    assert.deepEqual([points.length / 3, corners.length / 3], [sum(0), sum(1)], name);
    for (let at = 0; at < looks.length / 3; at += 1) {
      assert.ok(Math.abs(Math.hypot(...three(looks, at)) - 1) < 1e-6, `${name}: face ${at}`);
    }
    for (let at = 0; at < corners.length; at += 3) {
      const [a, b, c] = [0, 1, 2].map((corner) => three(points, corners[at + corner]));
      const [u, v] = [b, c].map((point) => point.map((value, axis) => value - a[axis]));
      const out = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const way = three(looks, corners[at]);
      const along = out[0] * way[0] + out[1] * way[1] + out[2] * way[2];
      assert.ok(along >= -1e-9, `${name}: triangle ${at / 3} runs with the clock`);
      if (Math.hypot(...out) === 0) flat[name] = (flat[name] ?? 0) + 1;
    }
  }
  // The two slants by hand: every corner is a point of its mesh, as often as faces meet there -
  // so the file has the roof along the plot's y the right way round, high at the wall. And the
  // triangles of no size, by hand: four of the sloping pane's twelve - the two of the face at
  // its edge, and one of each of its two sides, which are triangles - and the 24 around either
  // pole of the ball. The roof, whose planes meet nowhere, has none.
  const timesIn = (name, corners) => {
    const { points } = meshes.find((mesh) => mesh.name === name);
    const all = Array.from({ length: points.length / 3 }, (_, at) => three(points, at).join(' '));
    return corners.map((corner) => all.filter((point) => point === corner).length);
  };
  assert.deepEqual(timesIn('concrete', ROOF), [3, 3, 3, 3, 3, 3, 3, 3]);
  assert.deepEqual(timesIn('glass', EDGED), [3, 3, 3, 3, 6, 6]);
  assert.deepEqual(flat, { glass: 4, leaf: 48 });
  // And the box around all of them is the room's and the tree's, by hand: in metres, y for the
  // height, from the stage's floor.
  const all = meshes.flatMap(({ points }) => points);
  const reach = (pick) => [0, 1, 2].map((axis) => pick(...all.filter((_, at) => at % 3 === axis)));
  near([...reach(Math.min), ...reach(Math.max)], BOX, 'the box around the room');
}

process.stdout.write(
  'tools/sketch/view3d: the bytes of a file of the house are a binary glTF of version 2, as long as it says, with every place where the stage has it, in metres with y up - and no camera, no light and no picture\n',
);
