// The check of the 3D view's rules of who may name what, read off the scripts as they are
// written: read.js alone names the pad's globals - of them the list of the categories where a
// thing is read, and not as it loads - and the 3D view alone imports three.js - no other script
// of the pad does, nor a module of the scene. And of who may write the sketch: read.js alone,
// and of the sketch a figure of the house alone, by the pad's own way of changing it. And of
// what is drawn: no module of the view names an image or gives a face one. No browser, and
// nothing of the real site: site.js is data, and is never read. Run by tools/sketch/check.js,
// as every *.check.js is.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// read.js alone names the pad's globals. The linter knows no global here, so each is reached
// through `globalThis`: no other script of the view takes one of the pad's from it.
const PAD = [
  'SITE',
  'PLOT',
  'paper',
  'figures',
  'shapes',
  'categories',
  'blocks',
  'earth',
  'legacy',
  'sketch',
  'sections',
  'views',
];
const here = import.meta.dirname;
const scripts = (folder) => readdirSync(folder).filter((name) => name.endsWith('.js'));
const taken = (text) => [
  ...[...text.matchAll(/globalThis\s*\??\.\s*(\w+)/g)].map(([, name]) => name),
  ...[...text.matchAll(/\{([^{}]*)\}\s*=\s*globalThis\b/g)].flatMap(([, names]) =>
    names.split(',').map((name) => name.split(/[:=]/)[0].trim()),
  ),
];
assert.deepEqual(taken('const { a, b: c, d = 1 } = globalThis; globalThis.e; globalThis?.f'), [
  'e',
  'f',
  'a',
  'b',
  'd',
]);
const modules = scripts(here).filter((name) => !name.endsWith('.check.js'));
const MODULES = [
  'build',
  'file',
  'fit',
  'frame',
  'lights',
  'main',
  'meshes',
  'panel',
  'read',
  'settings',
  'shapes',
  'showing',
  'stage',
  'switches',
  'view',
];
assert.ok(MODULES.every((name) => modules.includes(`${name}.js`)));
// Of the pad, read.js takes the site, the paper, the shapes, the sketch, the switch of views,
// which keeps what a tab shows - and the blocks and the figures, which say what a block counts
// as and what the house's figures are - and the categories, the pad's list, which says whether
// one was picked for a block (story ST-028) - and the sections, the pad's one reading of them,
// which says what section a thing is in, and lists them (story ST-033).
for (const name of modules) {
  const names = taken(readFileSync(path.join(here, name), 'utf8')).filter((one) =>
    PAD.includes(one),
  );
  if (name === 'read.js') {
    const TAKEN = ['SITE', 'blocks', 'categories', 'figures', 'paper', 'sections', 'shapes'];
    assert.deepEqual(names.sort(), [...TAKEN, 'sketch', 'views']);
  } else assert.deepEqual(names, [], `${name} names a global of the pad`);
}

// And read.js alone writes the sketch, and writes figures alone. The sketch is kept in the
// browser's store, under the pad's key: a script writes it through the store itself, or through
// the pad's own sketch. No other module of the view names a store, in a comment either - and
// none names the pad's sketch, by the rule above.
const STORE = /\b(?:local|session)Storage\b/;
assert.match('globalThis.sessionStorage.setItem(key, text)', STORE);
for (const name of modules.filter((one) => one !== 'read.js')) {
  assert.doesNotMatch(readFileSync(path.join(here, name), 'utf8'), STORE, name);
}
// What read.js does is its code, with what it says in words taken off: a comment that names the
// pad's sketch writes nothing.
const codeOf = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const code = codeOf(readFileSync(path.join(here, 'read.js'), 'utf8'));
/**
 * What a script asks of one of the pad's, by its name: every name it reaches for there, and
 * every name it takes out of it, each once. What it takes out of an answer is not the pad's.
 */
const askedOf = (text, of) => {
  const reached = [...text.matchAll(new RegExp(`\\b${of}\\s*\\??\\.\\s*(\\w+)`, 'g'))];
  const picked = [
    ...text.matchAll(new RegExp(`\\{([^{}]*)\\}\\s*=\\s*${of}\\b(?!\\s*[?.(])`, 'g')),
  ];
  const names = [
    ...reached.map(([, name]) => name),
    ...picked.flatMap(([, list]) => list.split(',').map((name) => name.split(/[:=]/)[0].trim())),
  ];
  return [...new Set(names)].sort();
};
const MADE_UP =
  'const { a, b: c } = pad; pad.d(pad.e); pad?.a; x.pad.f; padded.g; const { h } = pad.i();';
assert.deepEqual(askedOf(MADE_UP, 'pad'), ['a', 'b', 'd', 'e', 'f', 'i']);
// Of the store, read.js asks what it holds, and nothing else: it puts nothing there itself.
assert.deepEqual(askedOf(code, 'localStorage'), ['getItem']);
// Of the pad's sketch it takes what it reads with, and one thing that writes: `change`, the
// pad's own way of changing a sketch, which keeps it and makes it a step to undo. Not `keep`,
// not `step`, and no tool of the pad.
// And `on`, where the slices run (story ST-033) - and not `shows`, which says no of what a section
// hidden on the paper holds: the 3D page shows it. Of the sections it asks their list and what
// section a thing is in, and not `hides`.
const ASKED = ['KEY', 'blockOf', 'change', 'doc', 'isBox', 'nameOf', 'on', 'rect', 'stored'];
assert.deepEqual(askedOf(code, 'sketch'), [...ASKED, 'trouble']);
assert.deepEqual(askedOf(code, 'sections'), ['list', 'of']);
// It changes the sketch in one place, and there the pad's `figures.set` writes one figure, by
// its name, and nothing else: no other place writes a figure.
const changes = [...code.matchAll(/\bsketch\s*\.\s*change\s*\(([^;]*)\);/g)].map(([, how]) => how);
assert.deepEqual(changes, ['(doc) => figures.set(doc, name, value)']);
assert.equal(code.match(/\bfigures\s*\.\s*set\b/g).length, 1);
assert.deepEqual(askedOf(code, 'figures'), ['FIGURES', 'of', 'set', 'typed']);
// The sketch that the pad's scripts hold is handed over whole - the one that was read - and
// never reached into; and nothing else of the pad's sketch is set.
const set = [...code.matchAll(/\bsketch\s*\.\s*(\w+)\s*=(?!=)/g)].map(([, name]) => name);
assert.deepEqual([...new Set(set)], ['doc']);
assert.doesNotMatch(code, /\bsketch\s*\.\s*doc\s*\??\s*[.[]/);
assert.match('sketch.doc.things.push(box)', /\bsketch\s*\.\s*doc\s*\??\s*[.[]/);

// The list of the categories is the one global of the pad's that read.js does not take as it
// loads: it reaches for it where a thing is read, in `wanted`, and names it nowhere else - so
// the list is the page's at the moment a block is read, as the pad's own scripts ask it
// (blocks.js). And of the list it asks one thing, what a block is (`of`): it reads no row for
// itself, and no `category` of a box.
const WANTED = /^function wanted\(thing\) \{$[\s\S]*?^\}$/m;
/** Whether a script names the list of the categories anywhere but in its `wanted`. */
const beforeAsked = (text) => /\bcategories\b/.test(text.replace(WANTED, ''));
const ASKED_THEN = 'function wanted(thing) {\n  return globalThis.categories.of(thing);\n}\n';
const TAKEN_FIRST = `const { categories } = globalThis;\n${ASKED_THEN.replace('globalThis.', '')}`;
assert.deepEqual([beforeAsked(ASKED_THEN), beforeAsked(TAKEN_FIRST)], [false, true]);
assert.match(code, WANTED);
assert.equal(beforeAsked(code), false, 'read.js names the list of the categories as it loads');
assert.deepEqual(askedOf(code, 'categories'), ['of']);
assert.doesNotMatch(code, /\.\s*category\b/);
assert.match('const picked = thing.category;', /\.\s*category\b/);

// And the 3D view alone imports three.js: no other script of the pad does, nor a module of the
// scene. site.js is the real plot, and is not read here: it is data, written by a script.
const pad = path.join(here, '..');
const others = [
  ...scripts(pad)
    .filter((name) => name !== 'site.js')
    .map((name) => path.join(pad, name)),
  ...scripts(path.join(pad, 'scene')).map((name) => path.join(pad, 'scene', name)),
];
const IMPORTS_THREE = /\b(?:from|import)\s*\(?\s*['"]three(?:\/|['"])/;
assert.match("import { Mesh } from 'three';", IMPORTS_THREE);
assert.match('await import("three/addons/x.js")', IMPORTS_THREE);
assert.doesNotMatch("const THREE = 'three';", IMPORTS_THREE);
assert.ok(others.length > 20, 'the scripts of the pad were not found');
for (const file of others) assert.doesNotMatch(readFileSync(file, 'utf8'), IMPORTS_THREE, file);
assert.ok(modules.some((name) => IMPORTS_THREE.test(readFileSync(path.join(here, name), 'utf8'))));

// And no module of the view draws an image: a surface is a plain colour and how rough it is
// (story ST-024, rule 6). three.js draws an image as a texture, which a loader of its own loads,
// or the browser's `Image` or a bitmap of it: no module names one of those, in a comment either.
// And a face holds an image as a map - under that name, as a `matcap`, or under a name that ends
// in `Map`: no module's code gives a face one as it is made, or sets one later. So none loads a
// picture, and none makes one. What three.js works out for itself, the shadows' map, is no
// image, and no module writes it.
const NAMED = /[Tt]exture|\w+Loader\b|\bImage\b|ImageBitmap/;
const MAPPED = /\b(?:map|matcap|\w+Map)\s*:|\.\s*(?:map|matcap|\w+Map)\s*=(?!=)/;
/** What of a script's text names an image, or gives a face one: the words, or null. */
const imageIn = (text) => (NAMED.exec(text) ?? MAPPED.exec(codeOf(text)))?.[0] ?? null;
// A made-up line for each way to an image, with what is refused of it.
const REFUSED = [
  ["const grain = new TextureLoader().load('/oak.jpg');", 'Texture'],
  ['const grain = new CanvasTexture(drawn);', 'Texture'],
  ['scene.background = target.texture;', 'texture'],
  ['// The floor has a texture of oak.', 'texture'],
  ['new ImageLoader().load(address, drawn);', 'ImageLoader'],
  ['const model = await new GLTFLoader().loadAsync(address);', 'GLTFLoader'],
  ['const picture = new Image();', 'Image'],
  ['const bitmap = await createImageBitmap(blob);', 'ImageBitmap'],
  ['floor.material = new MeshStandardMaterial({ color, map: grain });', 'map:'],
  ['new MeshStandardMaterial({ color, roughness, roughnessMap : grain })', 'roughnessMap :'],
  ['new MeshMatcapMaterial({ matcap: grain })', 'matcap:'],
  ['face.normalMap = bumps;', '.normalMap ='],
  ['face . map = grain;', '. map ='],
];
for (const [line, found] of REFUSED) assert.equal(imageIn(line), found, line);
// And lines that are none: what a list and a store are called, the shadows that three.js works
// out, a plain colour, an image that is said to be none - and a comment that speaks of a map.
const TAKEN = [
  'const shapes = parts.map(shapeOf);',
  'const veils = new Map();',
  'renderer.shadowMap.enabled = true;',
  'shadow.mapSize.set(SHADOW.points, SHADOW.points);',
  'shape.setAttribute("position", new Float32BufferAttribute(outline.flatMap(place), 3));',
  'if (face.map === null) return;',
  'const face = { name: surface, color: colour, roughness: rough, metalness: 0 };',
  'scene.background = backdrop;',
  '// A plain colour, as rough as the surface says, and no image.',
  '// The shadows are worked out on a map: a picture of what the sun sees.',
];
for (const line of TAKEN) assert.equal(imageIn(line), null, line);
for (const name of modules) {
  const found = imageIn(readFileSync(path.join(here, name), 'utf8'));
  assert.equal(found, null, `${name} names an image, or gives a face one: "${found}"`);
}

process.stdout.write(
  'tools/sketch/view3d: read.js alone names the pad - its list of the categories only where a thing is read - and writes the sketch, a figure alone, the 3D view alone imports three.js, and no module of it names an image\n',
);
