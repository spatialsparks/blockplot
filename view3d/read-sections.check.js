// The check of what the 3D page hands on for its switches (story ST-033): the browser tests'
// file of every part, tests/__fixtures__/sketch/every-part.json, in a made-up store, read by the
// pad's own scripts - every one 3d.html names, in its order, the sections' reading among them -
// on the made-up plot. By hand: the section each thing is in, as the pad reads it - the studio's
// and the workshop's boxes and the six objects in them in section 1, the rest in none; the group
// of the gallery of three kinds of object; the sections as the file lists them, "Yard" hidden
// among them; where the file's two slices run; the gallery's groups, five with a switch; and,
// handed to the scene, what shows with the first section switched off. What read.js hands on
// else is read.check.js's. No browser, nothing of the real site: site.js is never read. Run by
// tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { sceneOf } from '../scene/scene.js';
import { NO_SECTION, shownBy } from '../scene/shows.js';
import { switchable } from './showing.js';

const pad = path.join(import.meta.dirname, '..');
const golden = path.join(pad, '..', '..', 'tests', '__fixtures__', 'sketch');
const SKETCH = readFileSync(path.join(golden, 'every-part.json'), 'utf8');
const KEY = 'blockplot/sketch/space';
// A browser's two stores, with the sketch where the pad keeps it, and the page's address and
// switch of views beside them. Whatever is written into a store is noted: reading writes none.
const kept = new Map([[KEY, SKETCH]]);
const written = [];
const store = { getItem: (key) => kept.get(key) ?? null, setItem: (key) => written.push(key) };
Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: store, configurable: true });
Object.assign(globalThis, { location: { hash: '' }, views: { seen: {}, keep() {} } });

// The scripts the page loads before its module, read off the page - those in a folder of their
// own too: the groups of the gallery after the shapes, and the sections' reading after the
// switch of views, which wants a page and is made up above. The site is the made-up plot's.
const page = readFileSync(path.join(pad, '3d.html'), 'utf8');
const scripts = [...page.matchAll(/<script src="([\w/-]+\.js)"><\/script>/g)].map(([, src]) => src);
assert.deepEqual(scripts.slice(-2), ['views.js', 'sections/model.js']);
assert.equal(scripts[scripts.indexOf('shapes.js') + 1], 'object-groups.js');
for (const script of scripts.filter((one) => one !== 'views.js')) {
  await import(`../${script === 'site.js' ? 'demo-site.js' : script}`);
}
const { groups, read } = await import('./read.js');

// The file's things but its bank, which is ground, and its dig, a cut: thirteen, in their order.
const { things, figures, land, sections, on, trouble } = read();
const called = things.map(({ name, kind }) => name ?? kind);
assert.deepEqual(called, [
  'Studio',
  'Workshop "L"',
  'Workshop "L"',
  undefined,
  'window',
  'bed',
  'spiral',
  'sink',
  'person',
  'bush',
  'desk',
  'widestairs',
  'cupboard',
]);
assert.equal(trouble, '');
// Section 1 holds the studio and both boxes of the workshop, which say so, and the seven objects
// that stand in them: the window on the studio's edge, the bed, the spiral, the desk and the
// cupboard; the sink and the wide staircase in the workshop. The cellar says none, and the
// person and the bush stand on the ground: none of the three has a `section`.
const IN_ONE = [true, true, true, false, true, true, true, true, false, false, true, true, true];
assert.deepEqual(
  things.map((thing) => thing.section),
  IN_ONE.map((one) => (one ? 1 : undefined)),
);
assert.ok(things.filter((_, at) => !IN_ONE[at]).every((thing) => !Object.hasOwn(thing, 'section')));
// An object's group of the gallery, by its name, for three kinds by hand: the sink a kitchen's,
// the bed furniture, the person among people and cars. A box has none.
const galleryOf = (kind) => things.find((thing) => thing.kind === kind).gallery;
assert.deepEqual(['sink', 'bed', 'person'].map(galleryOf), [
  'Kitchen',
  'Furniture',
  'People and cars',
]);
assert.equal(galleryOf('window'), 'Doors, windows and stairs');
assert.ok(things.slice(0, 4).every((box) => !Object.hasOwn(box, 'gallery')));
assert.ok(things.slice(4).every((object) => typeof object.gallery === 'string'));

// The sections as the file lists them, in its order - "Yard" hidden on the paper, and listed as
// any other - and where its two slices run: row 20 of the top view and column 30.
assert.deepEqual(sections, [
  { id: 1, name: 'Atelier "Süd"', hidden: false },
  { id: 2, name: 'Yard', hidden: true },
]);
assert.deepEqual(on, { side: 20, end: 30 });
// The gallery's six groups, in its order; five of them have a switch.
assert.deepEqual(
  groups.map(({ name }) => name),
  ['Doors, windows and stairs', 'Kitchen', 'Bathroom', 'Furniture', 'Garden', 'People and cars'],
);
assert.deepEqual(switchable(groups), [
  'Kitchen',
  'Bathroom',
  'Furniture',
  'Garden',
  'People and cars',
]);

// Handed to the scene, thirteen solids - the cupboard among them: with section 1 off, the
// cellar, the person and the bush show - the studio and the workshop are gone with all that
// stands in them; with "No section" off, the other way round; and with people and cars off,
// all but the person.
const scene = sceneOf(land, things, figures);
assert.equal(scene.solids.length, 13);
const showing = (off) => shownBy(scene, 'all', off).solids.map(({ name, kind }) => name ?? kind);
assert.deepEqual(showing({ sections: [1] }), [undefined, 'person', 'bush']);
assert.deepEqual(
  showing({ sections: [NO_SECTION] }),
  called.filter((_, at) => IN_ONE[at]),
);
assert.deepEqual(showing({ groups: ['People and cars'] }), called.toSpliced(8, 1));
assert.deepEqual(written, []);

process.stdout.write(
  'tools/sketch/view3d: the 3D page hands on the section of each thing and the gallery group of each object as the pad reads them, the sections, where the slices run and the gallery, and a section switched off takes its blocks and what stands in them\n',
);
