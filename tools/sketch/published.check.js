// The check of published.js (ST-044, T-044.2): the pad as the files a plain web host is given.
// Into a folder of the system's temporary files, taken away however the check ends, it writes
// the pad's own folder, and holds:
//
//   - that the pages, the map's page, three.js's module and LICENSE and .nojekyll are there;
//   - that no path holds node_modules, and none lies two folders deep but under three/;
//   - that what lies there is what the rule of routes.js gives, found here on its own: of the
//     pad's folder and of three.js's, each file, asked for by the path a page asks it under - no
//     file the rule refuses is written, and none it gives is left out;
//   - that each file's bytes are the pad's or three.js's, and .nojekyll is empty;
//   - that a second run into that folder refuses, and writes nothing.
//
// And - a rule that matches nothing passes for ever (directive 9) - on a pad folder of its own
// making: a file of a kind the rule does not give, a file two deep, a node_modules of the pad's
// and of three.js's files those of no folder the rule gives, all left out; a pad without three.js
// refused, with nothing written; and a folder that is a file refused. Run by check.js, as every
// check is.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NOT_INSTALLED, published } from './published.js';
import { route } from './routes.js';

const PAD = import.meta.dirname;
const THREE = fs.realpathSync(path.join(PAD, 'node_modules', 'three'));
const made = fs.mkdtempSync(path.join(tmpdir(), 'blockplot-published-'));

/** Every file under a folder, by its path with / between its names, links not followed. */
const filesOf = (folder) =>
  fs
    .readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(folder, path.join(entry.parentPath, entry.name)))
    .map((file) => file.replaceAll('\\', '/'))
    .sort();

/** A file written with its folders, into a made-up pad. */
const put = (root, file, text = '') => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), text);
};

/** The paths the rule gives, found anew: each file of a pad, and of its three.js, asked for. */
function givenBy(pad, three) {
  const own = filesOf(pad).filter((file) => route(`/${file}`, false)?.file === file);
  const its = filesOf(three)
    .map((file) => [`three/${file}`, `node_modules/three/${file}`])
    .filter(([address, file]) => route(`/${address}`, false)?.file === file)
    .map(([address]) => address);
  return [...own, ...its, 'three/LICENSE', '.nojekyll'].sort();
}

/** It throws, says that, and writes nothing into `out`, which is as it was. */
const refuses = (pad, out, said) => {
  const state = () => {
    if (!fs.existsSync(out)) return null;
    return fs.statSync(out).isDirectory() ? filesOf(out) : fs.readFileSync(out, 'utf8');
  };
  const before = state();
  assert.throws(() => published(pad, out), said);
  assert.deepEqual(state(), before, 'a refusal wrote something');
};

try {
  // The pad's own folder.
  const out = path.join(made, 'pad');
  const written = published(PAD, out);
  const lies = filesOf(out);
  assert.deepEqual(written, lies, 'what it says it wrote is not what lies there');
  for (const file of [
    'index.html',
    '3d.html',
    'info.html',
    'map/index.html',
    'three/build/three.module.js',
    'three/LICENSE',
    '.nojekyll',
  ])
    assert.ok(lies.includes(file), `${file} is not written`);
  // The example's file is no file the pad gives: a page gets the example from demo-site.js.
  assert.equal(route('/example/plot.json', false), null);
  assert.ok(!lies.includes('example/plot.json'), 'a file the pad does not give is written');
  for (const file of lies) {
    const names = file.split('/');
    assert.ok(!names.some((name) => name.toLowerCase() === 'node_modules'), `${file} is written`);
    assert.ok(names.length <= 2 || names[0] === 'three', `${file} lies two folders deep`);
  }
  assert.deepEqual(lies, givenBy(PAD, THREE), 'not what the pad gives, and that alone');
  for (const file of lies) {
    if (file === '.nojekyll') continue;
    const from = file.startsWith('three/')
      ? path.join(THREE, file.slice('three/'.length))
      : path.join(PAD, file);
    assert.ok(fs.readFileSync(path.join(out, file)).equals(fs.readFileSync(from)), `${file}`);
  }
  assert.equal(fs.readFileSync(path.join(out, '.nojekyll')).length, 0);
  refuses(PAD, out, /holds something: give an empty folder/);

  // A made-up pad: what the rule gives of it, and nothing it refuses.
  const pad = path.join(made, 'made-up');
  for (const file of [
    'index.html',
    'a.js',
    'a.css',
    'notes.md',
    'plot.json',
    'one/b.js',
    'one/two/c.js',
    'map/index.html',
    'node_modules/other/d.js',
    'node_modules/three/build/three.module.js',
    'node_modules/three/build/three.cjs',
    'node_modules/three/examples/jsm/a/b/e.js',
    'node_modules/three/examples/jsm/e.json',
    'node_modules/three/src/f.js',
    'node_modules/three/LICENSE',
  ])
    put(pad, file, `the made-up ${file}`);
  const there = path.join(made, 'made-up-out');
  const expected = [
    '.nojekyll',
    'a.css',
    'a.js',
    'index.html',
    'map/index.html',
    'one/b.js',
    'three/LICENSE',
    'three/build/three.module.js',
    'three/examples/jsm/a/b/e.js',
  ];
  assert.deepEqual(published(pad, there), expected);
  assert.deepEqual(filesOf(there), expected);
  assert.equal(
    fs.readFileSync(path.join(there, 'three/LICENSE'), 'utf8'),
    'the made-up node_modules/three/LICENSE',
  );

  // Refused, with nothing written: into a file; from a pad where three.js is not installed - into
  // a folder that is not there, which stays away, and into an empty one, which stays empty.
  put(made, 'a-file', 'a file');
  refuses(pad, path.join(made, 'a-file'), /is a file, not a folder/);
  const bare = path.join(made, 'bare');
  put(bare, 'index.html');
  refuses(bare, path.join(made, 'none'), new RegExp(NOT_INSTALLED));
  fs.mkdirSync(path.join(made, 'empty'));
  refuses(bare, path.join(made, 'empty'), new RegExp(NOT_INSTALLED));
} finally {
  fs.rmSync(made, { recursive: true, force: true, maxRetries: 5 });
}
