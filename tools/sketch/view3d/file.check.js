// The check of the house as a file, on a made-up room: what a file holds of the meshes of the
// stage - a mesh a surface and a material a surface, in White one white and glass, and nothing
// of the stage's own - and the saving, on a made-up page: the name with its day, the link, the
// file in the page's memory, what the page says, and why where nothing was saved. The bytes of
// the file are file-bytes.check.js's. three.js's exporter wants a browser's own reader of files,
// `FileReader`, and Node has none: one is made up here, of Node's own Blob. What a browser saves
// is tests/e2e/sketch-3d-file.spec.ts's. And the picture of the stage, on such a page: its name
// with its day, the same link, the picture as the stage gave it, the words - and where the stage
// gave none, nothing saved. No stage is drawn here: that a picture shows the house is
// tests/e2e/sketch-3d-picture.spec.ts's. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import { Blob, Buffer } from 'node:buffer';
import process from 'node:process';
import { SURFACES } from '../scene/surfaces.js';
import { bytesOf, houseOf, nameAt, pictureAt, save, savePicture } from './file.js';
import { frameOf } from './frame.js';
import { meshesOf } from './meshes.js';

// The reader of files, made up: it reads a Blob a moment after it was asked, as a browser's does
// - the exporter says what to do with the bytes only after it has asked for them.
class Reader {
  readAsArrayBuffer(blob) {
    void blob.arrayBuffer().then((bytes) => {
      this.result = bytes;
      this.onloadend();
    });
  }
}
globalThis.FileReader = Reader;

// The name says the day, as the pad's saved sketch has it: the day by the world's clock.
assert.equal(nameAt(new Date('2026-10-10T12:00:00Z')), 'house-2026-10-10.glb');
assert.equal(nameAt(new Date('2027-01-02T23:59:59Z')), 'house-2027-01-02.glb');
// So does the name of a picture of the stage, which ends as a PNG does.
assert.equal(pictureAt(new Date('2026-10-10T12:00:00Z')), 'house-2026-10-10.png');
assert.equal(pictureAt(new Date('2027-01-02T23:59:59Z')), 'house-2027-01-02.png');

// A room on a stage whose floor lies at 108 m: a floor of wood, a wall of plaster and a pane of
// glass, and in it a table of wood and a shower's glass - a box each, a metre along every edge.
const place = frameOf({ box: { min: [0, 0, 108] } });
const part = (of, surface, at) => ({
  of,
  shape: 'box',
  surface,
  min: [at, 0, 108],
  max: [at + 1, 1, 109],
});
const ROOM = [
  part('floor', 'wood', 0),
  part('wall', 'plaster', 2),
  part('pane', 'glass', 4),
  part('piece', 'wood', 6),
  part('piece', 'glass', 8),
];
const staged = (white) => meshesOf(ROOM, place, { sun: true, white }).all;
const [inWhite, inSurfaces] = [staged(true), staged(false)];
// On the stage, the house's own wood and glass and what stands in the room are a mesh each in
// the surfaces - under one name, with two faces - and one in White (meshes.js).
const named = (meshes) => meshes.map((mesh) => mesh.name);
const NAMES = ['wood', 'plaster', 'glass'];
assert.deepEqual(named(inSurfaces.children), [...NAMES, 'wood', 'glass']);
assert.deepEqual(named(inWhite.children), NAMES);
assert.notEqual(inSurfaces.children[0].material, inSurfaces.children[3].material);

// What the file holds of them: a mesh a surface, in the order the surfaces come, and no more -
// a mesh there says nothing of its parts, casts no shadow and lies where its points are.
const placesOf = (meshes) => meshes.flatMap((mesh) => [...mesh.geometry.attributes.position.array]);
for (const [stood, white] of [
  [inWhite, true],
  [inSurfaces, false],
]) {
  const before = stood.children.map((mesh) => [mesh.geometry, mesh.material, mesh.userData.parts]);
  const house = houseOf(stood.children);
  assert.ok(house.isScene && house.name === '' && house.background === null);
  assert.deepEqual(named(house.children), NAMES);
  for (const mesh of house.children) {
    assert.ok(mesh.isMesh && mesh.children.length === 0 && mesh.parent === house);
    assert.deepEqual([mesh.userData, mesh.castShadow, mesh.receiveShadow], [{}, false, false]);
    assert.deepEqual(mesh.matrix.elements, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    // Its face is three.js's standard material - the one its exporter takes as it is - with no
    // metal and no picture: in the surfaces the surface's own colour, as rough as it says, under
    // its name; in White the one white, as rough as chalk - and of glass a white that hides the
    // share glass hides, under the name of glass. No face of a file lies a step behind.
    const { material: face, name } = mesh;
    const { colour, rough, hides } = SURFACES[name];
    assert.ok(face.isMeshStandardMaterial && !face.isMeshPhysicalMaterial, name);
    assert.equal(face.name, white && hides === undefined ? 'white' : name);
    assert.equal(`#${face.color.getHexString()}`, white ? '#ffffff' : colour, name);
    assert.deepEqual([face.roughness, face.metalness], [white ? 1 : rough, 0], name);
    assert.deepEqual([face.transparent, face.opacity], [hides !== undefined, hides ?? 1], name);
    assert.deepEqual([face.polygonOffset, face.side, face.userData], [false, 0, {}], name);
    const pictures = Object.keys(face).filter((key) => /^(map|matcap)$|Map$/.test(key));
    assert.ok(pictures.includes('map') && pictures.every((key) => face[key] === null), name);
    // And it is no face of the stage: the stage's own are drawn with what no file keeps.
    assert.ok(stood.children.every((one) => one.material !== face));
    // Its shape is the stage's, point for point: of the stage's meshes of that surface, one
    // after the other - the house's own wood, then the table.
    const drawn = stood.children.filter((one) => one.name === name);
    assert.deepEqual(placesOf([mesh]), placesOf(drawn), name);
    const { position, normal } = mesh.geometry.attributes;
    const held = ROOM.filter((one) => one.surface === name).length;
    assert.deepEqual(
      [position.count, normal.count, mesh.geometry.index.count],
      [24, 24, 36].map((n) => n * held),
    );
  }
  // In White two faces - the white, and glass - and in the surfaces one a surface.
  const faces = new Set(house.children.map((mesh) => mesh.material));
  assert.equal(faces.size, white ? 2 : NAMES.length);
  // Made once: the next file has the same faces.
  assert.deepEqual(
    houseOf(stood.children).children.map((mesh) => mesh.material),
    house.children.map((mesh) => mesh.material),
  );
  // A mesh that is alone of its surface has the stage's own shape, and nothing was copied; and
  // the stage's meshes are what they were, where they stood.
  const plaster = stood.children.find((mesh) => mesh.name === 'plaster');
  assert.equal(house.children[1].geometry, plaster.geometry);
  assert.ok(stood.children.every((mesh) => mesh.parent === stood));
  assert.deepEqual(
    stood.children.map((mesh) => [mesh.geometry, mesh.material, mesh.userData.parts]),
    before,
  );
}
// A face of White and the face of a surface are two, though both are named after glass.
assert.notEqual(
  houseOf(inWhite.children).children[2].material,
  houseOf(inSurfaces.children).children[2].material,
);
// Nothing on the stage is a house of nothing.
assert.deepEqual(houseOf([]).children, []);

// The saving, on a made-up page: a link that says the file's name is made and clicked once, and
// leads to the file in the page's memory - the exporter's bytes, as a binary glTF; the page says
// that it was saved and under which name; and ten seconds on, the memory is given back.
const paged = () => {
  const made = { links: [], files: [], back: [], later: [] };
  const createElement = (tag) => {
    const link = { tag, clicks: 0, click: () => (link.clicks += 1) };
    made.links.push(link);
    return link;
  };
  const address = (file) => `blob:made-up/${made.files.push(file)}`;
  const URL = { createObjectURL: address, revokeObjectURL: (href) => made.back.push(href) };
  const setTimeout = (run, after) => made.later.push({ run, after });
  return { made, document: { createElement }, Blob, URL, setTimeout };
};
const NOW = new Date('2026-10-10T12:00:00Z');
{
  const page = paged();
  const SAVED = 'Saved as house-2026-10-10.glb, where this browser saves its files.';
  assert.deepEqual(await save(inSurfaces.children, NOW, page), { words: SAVED, wrong: false });
  const { links, files, back, later } = page.made;
  const [{ tag, download, href, clicks }] = links;
  assert.deepEqual(
    [links.length, tag, download, href],
    [1, 'a', 'house-2026-10-10.glb', 'blob:made-up/1'],
  );
  assert.deepEqual([clicks, files.length, files[0].type], [1, 1, 'model/gltf-binary']);
  const [saved, written] = [await files[0].arrayBuffer(), await bytesOf(inSurfaces.children)];
  assert.ok(written instanceof ArrayBuffer && written.byteLength > 0);
  assert.ok(Buffer.from(saved).equals(Buffer.from(written)), 'the file is not the bytes');
  assert.equal(Buffer.from(saved).toString('latin1', 0, 4), 'glTF');
  // Another way of showing is another file: White's is not the surfaces'.
  assert.ok(!Buffer.from(await bytesOf(inWhite.children)).equals(Buffer.from(written)));
  assert.deepEqual([back, later.map(({ after }) => after)], [[], [10_000]]);
  later[0].run();
  assert.deepEqual(back, ['blob:made-up/1']);
}
// Where nothing of a house stands on the stage, no file is made, and the page says so: nothing
// went wrong. And where the writing fails - a reader of files that refuses - nothing is saved
// either, and the page says why, in the words of what failed.
{
  const page = paged();
  const NOTHING = 'No 3D file was saved: nothing of a house is shown here.';
  assert.deepEqual(await save([], NOW, page), { words: NOTHING, wrong: false });
  globalThis.FileReader = class {
    readAsArrayBuffer() {
      throw new Error('This made-up reader reads nothing.');
    }
  };
  const FAILED = 'The 3D file was not saved: This made-up reader reads nothing.';
  assert.deepEqual(await save(inWhite.children, NOW, page), { words: FAILED, wrong: true });
  assert.deepEqual(page.made, { links: [], files: [], back: [], later: [] });
  // And with a reader that reads, the same page saves the same meshes.
  globalThis.FileReader = Reader;
  assert.equal((await save(inWhite.children, NOW, page)).wrong, false);
  assert.deepEqual(
    page.made.links.map(({ clicks }) => clicks),
    [1],
  );
}

// The picture of the stage, on such a page. What the stage gave - a PNG in the page's memory,
// made up here of the eight bytes that every PNG begins with - is handed to the browser as it
// is, and nothing is written for it: by a link that says the picture's name and is clicked
// once; the page says the name it was saved under; and ten seconds on, the memory is given back.
{
  const page = paged();
  const PNG = new Blob([Buffer.from('\x89PNG\r\n\x1a\n', 'latin1')], { type: 'image/png' });
  const SAVED = 'Saved as house-2026-10-10.png, where this browser saves its files.';
  assert.deepEqual(savePicture(PNG, NOW, page), { words: SAVED, wrong: false });
  const { links, files, back, later } = page.made;
  const [{ tag, download, href, clicks }] = links;
  assert.deepEqual(
    [links.length, tag, download, href, clicks],
    [1, 'a', 'house-2026-10-10.png', 'blob:made-up/1', 1],
  );
  assert.deepEqual([files.length, files[0].type], [1, 'image/png']);
  assert.equal(files[0], PNG, 'what is saved is not the picture that the stage gave');
  assert.deepEqual([back, later.map(({ after }) => after)], [[], [10_000]]);
  later[0].run();
  assert.deepEqual(back, ['blob:made-up/1']);
  // Where the stage gave no picture, nothing is saved, and the page says so: that went wrong.
  const none = paged();
  const NO_PICTURE = 'No picture was saved: this browser gave none of the stage.';
  assert.deepEqual(savePicture(null, NOW, none), { words: NO_PICTURE, wrong: true });
  assert.deepEqual(none.made, { links: [], files: [], back: [], later: [] });
}

process.stdout.write(
  'tools/sketch/view3d: a file of the house holds a mesh and a material a surface and nothing of the stage, a picture of the stage is saved as the stage gave it, and the page says under which name each was saved, or why not\n',
);
