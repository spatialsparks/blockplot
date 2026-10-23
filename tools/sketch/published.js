// The pad as the files a plain web host is given (ST-044, T-044.2): every file that `pnpm sketch`
// gives, at the path it gives it under, written into a folder - and nothing else. Of the pad's
// own folder each file whose path the rule of routes.js answers with that very file: its pages,
// scripts and stylesheets, in its folder and one deep, map/ among them as the pad that is not
// --demo gives it; under three/ what the rule gives there, the scripts of three.js's build and of
// its addons, read where pnpm links it, and three.js's own LICENSE beside them, which its licence
// asks of a copy; and an empty .nojekyll at the root, so GitHub Pages serves the folder as it
// lies. No node_modules, and no file the rule refuses. It reads the pad's files, and writes into
// the one folder it is given, which must not exist yet or be empty: else it refuses, writing
// nothing, and says why in one line - as it does for a pad where three.js is not installed. From
// the repository root, into a folder outside it:
//   node tools/sketch/published.js <folder>
// published.check.js holds it. What the folder is for: docs/sketch/pad-api.md, "What the server
// gives".
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { route } from './routes.js';

// Where the rule finds three.js, from the pad's folder on, and the path the page asks it under.
const THREE_IN = 'node_modules/three';
const THREE_AT = 'three';
// What lies beside three.js's scripts, of its own folder, and what tells GitHub Pages to leave
// the folder as it is: no Jekyll.
const LICENSE = 'LICENSE';
const NO_JEKYLL = '.nojekyll';
const NO_FOLDER = 'node_modules';
export const NOT_INSTALLED = 'three.js is not installed here: pnpm install';

/**
 * The files under a folder, each by its path from that folder on with / between its names, of
 * the folders `under` lets in. A link is neither a file nor a folder: it is not followed.
 */
function filesIn(folder, under = () => true, at = '') {
  return fs.readdirSync(path.join(folder, at), { withFileTypes: true }).flatMap((entry) => {
    const inner = at === '' ? entry.name : `${at}/${entry.name}`;
    if (entry.isDirectory()) return under(entry.name) ? filesIn(folder, under, inner) : [];
    return entry.isFile() ? [inner] : [];
  });
}

/**
 * What the pad gives, as `[path, file]`: the path a page asks it under, from the folder's root
 * on, and the file read for it, from the pad's folder on - each a file the rule gives for its
 * path, and three.js's LICENSE. `three` is three.js's folder, read through the link pnpm made.
 */
export function given(pad, three) {
  const asked = (address, file) => route(`/${address}`, false)?.file === file;
  const own = filesIn(pad, (name) => name.toLowerCase() !== NO_FOLDER)
    .filter((file) => asked(file, file))
    .map((file) => [file, file]);
  const its = filesIn(three)
    .filter((file) => asked(`${THREE_AT}/${file}`, `${THREE_IN}/${file}`))
    .map((file) => [`${THREE_AT}/${file}`, `${THREE_IN}/${file}`]);
  return [...own, ...its, [`${THREE_AT}/${LICENSE}`, `${THREE_IN}/${LICENSE}`]];
}

/** Why the pad cannot be written into `out` - one line - or null, where it can. */
function refusal(three, out) {
  if (fs.existsSync(out)) {
    if (!fs.statSync(out).isDirectory()) return `${out} is a file, not a folder.`;
    if (fs.readdirSync(out).length > 0) return `${out} holds something: give an empty folder.`;
  }
  if (!fs.existsSync(path.join(three, 'build')) || !fs.existsSync(path.join(three, LICENSE)))
    return NOT_INSTALLED;
  return null;
}

/**
 * The pad of the folder `pad`, written into the folder `out` as a plain web host is given it:
 * the paths it wrote, sorted, each with / between its names. It throws, having written nothing,
 * where `out` holds anything or is a file, and where three.js is not installed in the pad.
 */
export function published(pad, out) {
  const three = path.join(pad, THREE_IN);
  const refused = refusal(three, out);
  if (refused !== null) throw new Error(refused);
  const files = given(pad, fs.realpathSync(three));
  fs.mkdirSync(out, { recursive: true });
  for (const [address, file] of files) {
    const to = path.join(out, address);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(pad, file), to);
  }
  fs.writeFileSync(path.join(out, NO_JEKYLL), '');
  return [...files.map(([address]) => address), NO_JEKYLL].sort();
}

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [out, ...more] = process.argv.slice(2);
  if (out === undefined || more.length > 0) {
    process.stderr.write('Say: node tools/sketch/published.js <folder>\n');
    process.exitCode = 1;
  } else {
    try {
      const written = published(import.meta.dirname, path.resolve(out));
      process.stdout.write(`The pad, as published files: ${written.length} in ${out}\n`);
    } catch (error) {
      process.stderr.write(`Nothing was written: ${error.message}\n`);
      process.exitCode = 1;
    }
  }
}
