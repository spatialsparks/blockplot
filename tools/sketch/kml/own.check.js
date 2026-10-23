// The check that WGS84 lies in kml/ alone - directive 35, in the pad (ST-016) - but for New plot's
// reader of a GeoJSON file, which converts it to LV95 as it reads it (ST-045). One function,
// `amiss`, says what is amiss in a folder that is a pad's: of every .js and .html file of it, at
// whatever depth but node_modules and __fixtures__, each outside the folder's own kml/ that names
// wgs84.js, wgs84Of or lv95Of, by its name - but the reader's two, new-plot/geojson.js and its
// check, which may name wgs84.js and lv95Of and never wgs84Of; and the map's page's check,
// map/page.check.js, which may name kml/wgs84.js as a file the page loads (T-045.5), and never
// wgs84Of or lv95Of. The check runs it on the pad's
// folder, where it finds nothing, and - a rule that matches nothing passes for ever (directive 9)
// - on a folder of its own making in the system's temporary files, which it takes away however it
// ends. A link is neither a file nor a folder here: nothing is read through one. Run by check.js,
// as every check is.
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
const NAMES = /wgs84\.js|wgs84Of|lv95Of/;
const SAID = (name) =>
  `${name} names wgs84.js, wgs84Of or lv95Of: WGS84 lies in kml/ alone (directive 35).`;
// New plot's reader of a GeoJSON file, and its check: they turn a file's WGS84 into LV95.
const READER = ['new-plot/geojson.js', 'new-plot/geojson.check.js'];
const READER_NAMES = /wgs84Of/;
const READER_SAID = (name) =>
  `${name} names wgs84Of: the reader turns WGS84 into LV95, never back (directive 35).`;
// The check of the map's page, which lists kml/wgs84.js among the files that the page loads.
const LOADS = 'map/page.check.js';
const LOADS_NAMES = /wgs84Of|lv95Of/;
const LOADS_SAID = (name) =>
  `${name} names wgs84Of or lv95Of: it names kml/wgs84.js alone, a file the page loads (directive 35).`;

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

/** What is amiss in one file of a pad's folder outside its kml/: its sentence, or none. */
function amissIn(folder, name) {
  const text = fs.readFileSync(path.join(folder, name), 'utf8');
  if (READER.includes(name)) return READER_NAMES.test(text) ? [READER_SAID(name)] : [];
  if (name === LOADS) return LOADS_NAMES.test(text) ? [LOADS_SAID(name)] : [];
  return NAMES.test(text) ? [SAID(name)] : [];
}

/** What is amiss in a pad's folder: a sentence for each file outside its kml/ that names the conversion, in the order of their names. */
function amiss(folder) {
  return filesOf(folder)
    .filter((name) => !name.startsWith(OWN))
    .sort()
    .flatMap((name) => amissIn(folder, name));
}

assert.deepEqual(amiss(PAD), []);

const made = fs.mkdtempSync(path.join(tmpdir(), 'kml-own-'));
try {
  const write = (name, text) => {
    fs.mkdirSync(path.dirname(path.join(made, name)), { recursive: true });
    fs.writeFileSync(path.join(made, name), text);
  };
  // Inside kml/, and where the rule does not read: nothing.
  write('kml/wgs84.js', 'export function wgs84Of() {}\nexport function lv95Of() {}\n');
  write('kml/kml.js', "import { wgs84Of } from './wgs84.js';\n");
  write('node_modules/x/wgs84.js', 'export function wgs84Of() {}\n');
  write('scene/__fixtures__/a.js', "import { wgs84Of } from '../../kml/wgs84.js';\n");
  write('pad.css', '/* wgs84.js */\n');
  write('page.js', "import { kmlOf } from './kml/kml.js';\n");
  // The reader of a GeoJSON file and its check, importing lv95Of and SHEET_WGS84: nothing.
  const READS = "import { SHEET_WGS84, lv95Of } from '../kml/wgs84.js';\n";
  write('new-plot/geojson.js', READS);
  write('new-plot/geojson.check.js', `${READS}assert.ok(lv95Of([7, 46]));\n`);
  // The map's page's check, naming kml/wgs84.js among the files that the page loads: nothing.
  write('map/page.check.js', "const LOADS = 'map/page.js kml/wgs84.js';\n");
  assert.deepEqual(amiss(made), []);
  // The script the card of ST-016 names: one outside kml/ that imports ./kml/wgs84.js.
  write('script.js', "import { ACCURACY_M } from './kml/wgs84.js';\n");
  assert.deepEqual(amiss(made), [SAID('script.js')]);
  // And deeper, in a page, by the function's name, in a folder kml/ of another folder.
  write('view3d/deep/far.js', '// wgs84Of, of course\n');
  write('3d.html', '<script type="module">import \'./kml/wgs84.js\';</script>\n');
  write('scene/kml/b.js', 'const at = wgs84Of(place);\n');
  const FOUND = ['3d.html', 'scene/kml/b.js', 'script.js', 'view3d/deep/far.js'];
  assert.deepEqual(amiss(made), FOUND.map(SAID));
  // The reader's check naming wgs84Of; map/file.js importing lv95Of; new-plot/other.js naming it;
  // and the map's page's check naming lv95Of beside the file.
  write('new-plot/geojson.check.js', `${READS}const back = wgs84Of(place);\n`);
  write('map/file.js', "import { lv95Of } from '../kml/wgs84.js';\n");
  write('map/page.check.js', "const LOADS = 'kml/wgs84.js';\nlv95Of([7, 46]);\n");
  write('new-plot/other.js', 'const at = lv95Of(place);\n');
  assert.deepEqual(amiss(made), [
    SAID('3d.html'),
    SAID('map/file.js'),
    LOADS_SAID('map/page.check.js'),
    READER_SAID('new-plot/geojson.check.js'),
    SAID('new-plot/other.js'),
    ...['scene/kml/b.js', 'script.js', 'view3d/deep/far.js'].map(SAID),
  ]);
} finally {
  fs.rmSync(made, { recursive: true, force: true });
}

process.stdout.write(
  'tools/sketch/kml: no file of the pad outside kml/ names wgs84.js, wgs84Of or lv95Of - the reader of a GeoJSON file lv95Of alone, the check of the map page kml/wgs84.js alone - and one that does is said by its name\n',
);
