import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The golden files of the sketch file, as the pad's browser tests read them: the one place that
// says which version the pad writes, and which it read before (T-000.20). It reads the made-up
// files of tests/__fixtures__/sketch/ alone - `made-up.json` and `every-part.json` at the top, of
// the version the pad writes, and in each folder `v<N>/` the two of a version before, frozen. No
// test file, by its name. tools/sketch/check-golden.js says the same for the pad's checks.

const FOLDER = fileURLToPath(new URL('../__fixtures__/sketch/', import.meta.url));
const read = (file: string): string => readFileSync(`${FOLDER}${file}`, 'utf8');
const head = (version: number): string => `{"space":${version},`;

/** A golden file of the sketch file: the made-up house, or the studio that holds every field. */
export type Golden = 'made-up' | 'every-part';

/** The version the pad writes: the `space` of the newest made-up.json. */
export const VERSION = (JSON.parse(read('made-up.json')) as { space: number }).space;

/** The versions of the frozen corpora - the folders `v<N>` - as numbers, ascending. */
export const BEFORE: readonly number[] = readdirSync(FOLDER, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^v\d+$/.test(entry.name))
  .map((entry) => Number(entry.name.slice(1)))
  .sort((a, b) => a - b);

/** The text of a golden file of a version: of VERSION at the top of the folder, else in v<N>/. */
export const golden = (name: Golden, version = VERSION): string =>
  read(version === VERSION ? `${name}.json` : `v${version}/${name}.json`);

/** That file as the pad of now reads and writes it: its head made of VERSION. */
export const asNow = (name: Golden, version: number): string =>
  golden(name, version).replace(head(version), head(VERSION));
