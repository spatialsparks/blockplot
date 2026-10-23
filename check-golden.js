// The golden files of the sketch file, as the pad's checks read them: the one place that says
// which version the pad writes, and which it read before (T-000.20). It reads the made-up files
// of tests/__fixtures__/sketch/ alone - `made-up.json` and `every-part.json` at the top, of the
// version the pad writes, and in each folder `v<N>/` the two of a version before, frozen. No
// check of its own, by its name: every check that imports it holds it. tests/e2e/sketch-golden.ts
// says the same for the browser tests.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const FOLDER = path.join(import.meta.dirname, '..', '..', 'tests', '__fixtures__', 'sketch');
const read = (file) => readFileSync(path.join(FOLDER, file), 'utf8');
const head = (version) => `{"space":${version},`;

/** The version the pad writes: the `space` of the newest made-up.json. */
export const VERSION = JSON.parse(read('made-up.json')).space;

/** The versions of the frozen corpora - the folders `v<N>` - as numbers, ascending. */
export const BEFORE = readdirSync(FOLDER, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^v\d+$/.test(entry.name))
  .map((entry) => Number(entry.name.slice(1)))
  .sort((a, b) => a - b);

/** The text of a golden file, 'made-up' or 'every-part', of a version: of VERSION at the top. */
export const golden = (name, version = VERSION) =>
  read(version === VERSION ? `${name}.json` : path.join(`v${version}`, `${name}.json`));

/** That file as the pad of now reads and writes it: its head made of VERSION. */
export const asNow = (name, version) => golden(name, version).replace(head(version), head(VERSION));
