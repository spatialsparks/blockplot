// The check that WGS84 lies in kml/ alone - directive 35, in the pad (ST-016). One function,
// `amiss`, says what is amiss in a folder that is a pad's: of every .js and .html file of it, at
// whatever depth but node_modules and __fixtures__, each outside the folder's own kml/ that
// names wgs84.js or wgs84Of, by its name. The check runs it on the pad's folder, where it finds
// nothing, and - a rule that matches nothing passes for ever (directive 9) - on a folder of its
// own making in the system's temporary files, which it takes away however it ends. A link is
// neither a file nor a folder here: nothing is read through one. Run by check.js, as every check is.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';

const PAD = fileURLToPath(new URL('../', import.meta.url));
const KINDS = ['.js', '.html'];
const LEFT_OUT = ['node_modules', '__fixtures__'];
const OWN = 'kml/';
const NAMES = /wgs84\.js|wgs84Of/;
const SAID = (name) =>
  `${name} names wgs84.js or wgs84Of: WGS84 lies in kml/ alone (directive 35).`;

/** The files of a folder that the rule reads, each by its name from the folder on, a slash between its parts. */
function filesOf(folder, under = '') {
  const here = fs.readdirSync(path.join(folder, under), { withFileTypes: true });
  return here.flatMap((entry) => {
    const name = under + entry.name;
    if (entry.isDirectory())
      return LEFT_OUT.includes(entry.name) ? [] : filesOf(folder, `${name}/`);
    return entry.isFile() && KINDS.includes(path.extname(name)) ? [name] : [];
  });
}

/** What is amiss in a pad's folder: a sentence for each file outside its kml/ that names the conversion, in the order of their names. */
function amiss(folder) {
  return filesOf(folder)
    .filter((name) => !name.startsWith(OWN))
    .filter((name) => NAMES.test(fs.readFileSync(path.join(folder, name), 'utf8')))
    .sort()
    .map(SAID);
}

assert.deepEqual(amiss(PAD), []);

const made = fs.mkdtempSync(path.join(tmpdir(), 'kml-own-'));
try {
  const write = (name, text) => {
    fs.mkdirSync(path.dirname(path.join(made, name)), { recursive: true });
    fs.writeFileSync(path.join(made, name), text);
  };
  // Inside kml/, and where the rule does not read: nothing.
  write('kml/wgs84.js', 'export function wgs84Of() {}\n');
  write('kml/kml.js', "import { wgs84Of } from './wgs84.js';\n");
  write('node_modules/x/wgs84.js', 'export function wgs84Of() {}\n');
  write('scene/__fixtures__/a.js', "import { wgs84Of } from '../../kml/wgs84.js';\n");
  write('pad.css', '/* wgs84.js */\n');
  write('page.js', "import { kmlOf } from './kml/kml.js';\n");
  assert.deepEqual(amiss(made), []);
  // The script the card names: one outside kml/ that imports ./kml/wgs84.js.
  write('script.js', "import { ACCURACY_M } from './kml/wgs84.js';\n");
  assert.deepEqual(amiss(made), [SAID('script.js')]);
  // And deeper, in a page, by the function's name, in a folder kml/ of another folder.
  write('view3d/deep/far.js', '// wgs84Of, of course\n');
  write('3d.html', '<script type="module">import \'./kml/wgs84.js\';</script>\n');
  write('scene/kml/b.js', 'const at = wgs84Of(place);\n');
  const FOUND = ['3d.html', 'scene/kml/b.js', 'script.js', 'view3d/deep/far.js'];
  assert.deepEqual(amiss(made), FOUND.map(SAID));
} finally {
  fs.rmSync(made, { recursive: true, force: true });
}

process.stdout.write(
  'tools/sketch/kml: no file of the pad outside kml/ names wgs84.js or wgs84Of, and one that does is said by its name\n',
);
