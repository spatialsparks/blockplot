// The check that the pad's folder holds no plot but the made-up one (ST-030, rule 1). A plot is
// a file among the owner's data, design/plots/<id>/plot.json, and the pad's folder is the tool's:
// of a plot it holds the made-up one, as the example's file and as the script demo-site.js. The
// owner's plot lay there as a script named site.js until 2026-10-13, and is to lie there never
// again. One function, `amiss`, says what is amiss in a folder that is a pad's - each fault of a
// file by its name, and by nothing of what the file holds:
//
//   - a file named site.js, in the folder or in a folder under it, under whatever case. It is
//     said by its name and never opened: not by this rule, and not by the two after it;
//   - of the files that end in .json, each that reads as a plot's - JSON that says the plot's
//     format - but the one, example/plot.json;
//   - of the scripts, each that leaves a site - anything under the name SITE, where a page reads
//     its plot - but the one, demo-site.js. A script is run as a page runs it, with nothing of a
//     page: its text as a classic script in a context of its own, whose global answers to
//     globalThis, window and self, under a limit of time. One that asks for a page, or is a
//     module, fails there and leaves none: that is no fault;
//   - and the one plot, where it is not the made-up one: the example's file reads, by the one
//     reader, and is named "Made-up hillside plot". That it is that plot figure for figure, and
//     the plot of demo-site.js, is plot-file.check.js's, by hand.
//
// node_modules is left out, and a link is neither a file nor a folder of the pad's: nothing is
// listed and nothing opened through one. The check runs the function on the pad's own folder,
// where it finds nothing, and - a rule that matches nothing passes for ever (directive 9) - on a
// folder of its own making in the system's temporary files, which is taken away however it ends.
//
// What it does not hold: that no figure of a real plot stands in a file of the pad - typed into a
// script under another name than SITE, into a page, into a note. No check could, without the
// plot. Run by check.js, as every check is.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import vm from 'node:vm';
import { FORMAT, read } from '../plot-file.js';

// What a pad's folder holds of a plot, each by its name from the folder on: the made-up one, twice.
const EXAMPLE = 'example/plot.json';
const SCRIPT = 'demo-site.js';
const MADE_UP = 'Made-up hillside plot';
// The name that no file of a pad's folder has, in small letters: it is asked under whatever case.
const NO_NAME = 'site.js';
// How long a script may run, in milliseconds. No figure of the design, and far more than a script
// of the pad takes: all of them together, some 160, are run in a tenth of a second.
const LIMIT_MS = 1000;
// A byte-order mark, by its number: the one reader takes a plot's file behind one, and so does
// this check.
const BOM = String.fromCodePoint(0xfeff);
// What is said of a file, after its name.
const SAID = {
  named: "is named site.js: no file of a pad's folder is, under whatever case.",
  plot: "is a plot's file: a pad's folder holds one alone, example/plot.json.",
  site: "is a script that leaves a site: in a pad's folder one alone does, demo-site.js.",
  lacks: "is no plot's file: in a pad's folder the made-up plot lies there.",
  other: 'is not the made-up plot, as the one reader reads it.',
  leaves: "leaves no site: in a pad's folder that script is the made-up site.",
};

// A script that fails later than its last line - in a promise of its own that is rejected, with
// nobody waiting for it - is no fault either. Left to Node, such a promise ends the process that
// ran the script: this check, which itself does all it does at once, and waits for nothing.
process.on('unhandledRejection', () => {});

/**
 * What lies in a folder and in the folders under it: each by its name from the folder on, a
 * slash between its parts, and whether it is a file. node_modules is left out. A link is
 * neither a file nor a folder here: it is listed by its name, and nothing through it.
 */
function lying(folder, under = '') {
  const here = fs.readdirSync(path.join(folder, under), { withFileTypes: true });
  return here
    .filter((entry) => entry.name !== 'node_modules')
    .flatMap((entry) => {
      const name = under + entry.name;
      const below = entry.isDirectory() ? lying(folder, `${name}/`) : [];
      return [{ name, file: entry.isFile() }, ...below];
    });
}

/** Whether a name, from a folder on, is the one that no file has - under whatever case. */
const isNamed = (name) => name.split('/').at(-1).toLowerCase() === NO_NAME;

/** Whether a text reads as a plot's file: JSON that says the plot's format. */
function saysPlot(text) {
  try {
    return JSON.parse(text.startsWith(BOM) ? text.slice(BOM.length) : text)?.format === FORMAT;
  } catch {
    return false;
  }
}

// A page with nothing of a page: its global, under the names that a script may say it by.
const PAGE = new vm.Script('var window = globalThis, self = globalThis;');
// What a script is asked for after it ran: anything but nothing under the name SITE.
const LEFT = new vm.Script("typeof SITE !== 'undefined' && SITE !== null");

/**
 * Whether a script leaves a site, run as a page runs it, with nothing of a page: its text as a
 * classic script in a context of its own, and with it what it left to a promise, all under the
 * limit of time. A script that fails - it asks for a page, it is a module, its time is up -
 * leaves what it had left until then, and is asked for that.
 */
function leavesSite(text, limitMs = LIMIT_MS) {
  const page = vm.createContext({}, { microtaskMode: 'afterEvaluate' });
  PAGE.runInContext(page);
  try {
    vm.runInContext(text, page, { timeout: limitMs });
  } catch {
    // No fault: it is asked what it left all the same.
  }
  try {
    return LEFT.runInContext(page) === true;
  } catch {
    return false;
  }
}

/**
 * What is amiss in a folder that is a pad's: a sentence a fault, each of a file by its name from
 * the folder on, in the order of the names - and nothing, where the folder holds no plot but the
 * made-up one. A file named site.js is never opened.
 */
function amiss(folder) {
  const all = lying(folder);
  const textOf = (name) => fs.readFileSync(path.join(folder, name), 'utf8');
  const named = all.map(({ name }) => name).filter(isNamed);
  // What may be opened: a file, and none of that name.
  const open = all.filter(({ name, file }) => file && !isNamed(name)).map(({ name }) => name);
  const plots = open.filter((name) => name.endsWith('.json') && saysPlot(textOf(name)));
  const sites = open.filter((name) => name.endsWith('.js') && leavesSite(textOf(name)));
  const faults = [];
  const say = (name, fault) => faults.push(`${name} ${SAID[fault]}`);
  for (const name of named) say(name, 'named');
  for (const name of plots) if (name !== EXAMPLE) say(name, 'plot');
  for (const name of sites) if (name !== SCRIPT) say(name, 'site');
  if (!plots.includes(EXAMPLE)) say(EXAMPLE, 'lacks');
  else if (read(textOf(EXAMPLE)).site?.name !== MADE_UP) say(EXAMPLE, 'other');
  if (!sites.includes(SCRIPT)) say(SCRIPT, 'leaves');
  return faults.sort();
}

// The pad's own folder: nothing is amiss in it. A fault is printed as its sentence, which names
// the file and holds nothing of it.
const pad = path.join(import.meta.dirname, '..');
const found = amiss(pad);
const HELD = 'tools/sketch holds a plot that is not the made-up one, or lacks that one (ST-030):';
assert.equal(found.length, 0, [HELD, ...found].join('\n'));

// The proof. A folder that is a pad's, made up: a page, the made-up site as its script, the
// example - and what is no fault: a package.json and a sketch, which are no plot; three scripts
// that fail before they could leave the site they say - one asks for a page, one is a module, one
// asks for a page in a promise that nobody waits for; and, with a file named site.js, a second
// plot's file and a second script that leaves a site in each, a node_modules and a link to a
// folder that lies elsewhere - under a name that a file to open might have. Then one file at a
// time is put there, is another or is gone: each is said by its name, in its sentence, and alone.
const fixtures = path.join(pad, '..', '..', 'tests', '__fixtures__', 'plots');
const TERRACE = fs.readFileSync(path.join(fixtures, 'terrace', 'plot.json'), 'utf8');
const OF_VERSION_4 = fs.readFileSync(path.join(fixtures, 'of-version-4', 'plot.json'), 'utf8');
const A_SITE = "var SITE = { name: 'A plot of the proof, which is none' };\n";
const NO_PAGE = "document.title = 'A script that asks for a page';\n";
const SKETCH = '{"space":6,"things":[],"floors":[],"notes":[],"on":{},"show":{"top":{}}}';
const NO_FAULT = {
  'index.html': '<!doctype html><title>A made-up pad</title><script src="site.js"></script>\n',
  [SCRIPT]: fs.readFileSync(path.join(pad, SCRIPT)),
  [EXAMPLE]: fs.readFileSync(path.join(pad, EXAMPLE)),
  'package.json': '{ "name": "a-made-up-pad", "type": "module" }\n',
  'kept/plan.json': SKETCH,
  'page.js': `${NO_PAGE}globalThis.SITE = {};\n`,
  'view3d/main.js': `import path from 'node:path';\n${A_SITE}`,
  'late.js': `(async () => {\n  await null;\n  ${NO_PAGE}  globalThis.SITE = {};\n})();\n`,
};
const ELSEWHERE = { 'site.js': A_SITE, 'plot.json': TERRACE, 'other.js': A_SITE };
const made = fs.mkdtempSync(path.join(tmpdir(), 'blockplot-own-'));
try {
  const folder = path.join(made, 'pad');
  const put = (name, text, into = folder) => {
    fs.mkdirSync(path.dirname(path.join(into, name)), { recursive: true });
    fs.writeFileSync(path.join(into, name), text);
  };
  for (const [name, text] of Object.entries(NO_FAULT)) put(name, text);
  for (const [name, text] of Object.entries(ELSEWHERE)) {
    put(`node_modules/three/${name}`, text);
    put(name, text, path.join(made, 'elsewhere'));
  }
  fs.symlinkSync(path.join(made, 'elsewhere'), path.join(folder, 'linked.json'), 'junction');
  const linked = fs.readdirSync(path.join(folder, 'linked.json')).sort();
  assert.deepEqual(linked, Object.keys(ELSEWHERE).sort());
  assert.deepEqual(amiss(folder), []);

  /**
   * What is amiss once one file of the folder is put there, is another or - with no text - is
   * gone. After it the folder is as it was.
   */
  const tried = (name, text) => {
    const file = path.join(folder, name);
    const was = fs.existsSync(file) ? fs.readFileSync(file) : null;
    if (text === null) fs.rmSync(file);
    else put(name, text);
    const faults = amiss(folder);
    if (was === null) fs.rmSync(file);
    else fs.writeFileSync(file, was);
    return faults;
  };
  const said = (name, fault) => [`${name} ${SAID[fault]}`];
  // The four. The file named site.js says a site, and the one under it too: run, each would be
  // said a second time, as a script that leaves a site.
  const FOUR = [
    ['site.js', A_SITE, 'named'],
    ['view3d/Site.JS', A_SITE, 'named'],
    ['plots/terrace/plot.json', TERRACE, 'plot'],
    ['scene/other.js', A_SITE, 'site'],
  ];
  for (const [name, text, fault] of FOUR) assert.deepEqual(tried(name, text), said(name, fault));
  // A plot's file is told by what it says it is, and not by whether it reads: one of another
  // version, which the reader refuses, and one behind a byte-order mark, which it takes.
  assert.equal(read(OF_VERSION_4).site, undefined);
  assert.deepEqual(tried('old.json', OF_VERSION_4), said('old.json', 'plot'));
  assert.deepEqual(tried('marked.json', BOM + TERRACE), said('marked.json', 'plot'));
  // What a pad's folder lacks: the example - gone, no plot's file, another plot, a plot that
  // does not read - and the script that is the made-up site, gone or failing.
  for (const text of [null, SKETCH]) assert.deepEqual(tried(EXAMPLE, text), said(EXAMPLE, 'lacks'));
  for (const text of [TERRACE, OF_VERSION_4]) {
    assert.deepEqual(tried(EXAMPLE, text), said(EXAMPLE, 'other'));
  }
  for (const text of [null, NO_PAGE]) assert.deepEqual(tried(SCRIPT, text), said(SCRIPT, 'leaves'));
  fs.mkdirSync(path.join(made, 'empty'));
  const BOTH = [...said(SCRIPT, 'leaves'), ...said(EXAMPLE, 'lacks')];
  assert.deepEqual(amiss(path.join(made, 'empty')), BOTH);
  // After all of it the folder is as it was made, and nothing is amiss in it.
  assert.deepEqual(amiss(folder), []);
} finally {
  fs.rmSync(made, { recursive: true, force: true, maxRetries: 5 });
}

// A site is what a script leaves, however it says it and whatever it does after: as a global by
// each of its names, as a name of the page's scripts, in a promise, and before it fails.
const SITES = ['SITE = {};', 'window.SITE = {};', 'self.SITE = {};', 'const SITE = {};'];
SITES.push('Promise.resolve().then(() => {\n  globalThis.SITE = {};\n});');
SITES.push(`globalThis.SITE = {};\n${NO_PAGE}`);
for (const text of SITES) assert.equal(leavesSite(text), true, text);
// And nothing under that name is none - nor is what a script would have said after it failed.
const NONE = ['globalThis.SITE = undefined;', 'var SITE = null;', 'const SITE = nothing();'];
for (const text of NONE) assert.equal(leavesSite(text), false, text);
// The limit of time, on scripts that never end - one of them in promises: each is stopped, and
// leaves what it had left by then. A short limit, for them alone: the proof waits it out.
const SHORT_MS = 50;
const NO_END = ['for (;;);', 'const again = () => Promise.resolve().then(again);\nagain();'];
for (const text of NO_END) assert.equal(leavesSite(text, SHORT_MS), false, text);
assert.equal(leavesSite(`globalThis.SITE = {};\n${NO_END[0]}`, SHORT_MS), true);

process.stdout.write(
  "tools/sketch/example: the pad's folder holds no plot but the made-up one, and a site.js, a second plot's file and a second script that leaves a site are each said by name\n",
);
