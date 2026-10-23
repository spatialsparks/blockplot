// The browser's store of plots (ST-040, T-040.1): what the store is, and every rule of it that
// can be wrong - with no browser, no Node and no clock. held.js keeps by these names in the
// browser's IndexedDB, ways.js brings a plot in by a folder, and a page reads a plot's text with
// `read` of plot-file.js. docs/STORAGE_FORMAT.md, "The browser's store - version 1", is the
// contract; rules.check.js proves each rule by hand - and kept.check.js the rule of a kept
// sketch's name, which kept-ways.js states a second time for the page.
import { folderOf, freeOf } from '../new-plot/request.js';
import { areaOf } from '../plot-file.js';

// Two ids are the pad's own: the example, the made-up plot, whose file lies in the pad's own
// folder; and home, the plot of the pad's first key - the folder the owner's plot lies in.
export const EXAMPLE = 'example';
export const OWN = 'home';
// The key of before: a browser kept its sketch under it before a plot was a file - home's still.
export const SPACE = 'blockplot/sketch/space';

// A kept sketch is the file <name>.json, its ending in small letters.
export const KEPT_ENDING = '.json';
// A name is taken as it is or refused: letters of the English alphabet, figures, blanks, dots, -
// and _, so many at most, with no dot at its start and no blank at either end. So none is empty,
// none is `.` or `..`, none is hidden, and none holds a slash, a backslash, a colon or a %: a
// name is one file in the one folder, on whatever disk.
export const KEPT_NAME_MAX = 80;
const KEPT_NAME = /^[A-Za-z0-9_-]([A-Za-z0-9 ._-]*[A-Za-z0-9._-])?$/;

/** Whether a kept sketch can have a name: `KEPT_NAME` says what one is. */
export const keptName = (name) =>
  typeof name === 'string' && name.length <= KEPT_NAME_MAX && KEPT_NAME.test(name);

/** Whether a plot's folder can have a name: the rule of a kept sketch's name, the very one. */
export const plotName = (name) => keptName(name);

// The database, its version, and its two stores: the plots it holds, by their id, and the
// sketches kept in it, by their plot and their name, found by their plot.
export const BASE = 'blockplot';
export const BASE_VERSION = 1;
export const PLOTS = 'plots';
export const KEPT = 'kept';
export const STORES = Object.freeze({
  [PLOTS]: Object.freeze({ keyPath: 'id' }),
  [KEPT]: Object.freeze({ keyPath: Object.freeze(['plot', 'name']), index: 'plot' }),
});

// The two notes: the plot this tab shows, in sessionStorage, and the plot this browser showed
// last, in localStorage. Each holds an id. The note of before, blockplot/sketch/last, held the
// server's ids, and is read by nothing.
export const TAB = 'blockplot/plot/tab';
export const LAST = 'blockplot/plot/last';

// How a plot came: as its folder, as its file, or the example, which is the pad's own.
export const WAYS = Object.freeze({ folder: 'folder', file: 'file', example: 'example' });

// Why a picked folder is no plot: the sentences the pad's server said, when it read plots.
export const REFUSED = Object.freeze({
  name: 'Its folder has a name that the pad does not take.',
  file: 'It holds no plot.json.',
});

/**
 * The key a plot's sketch is kept under in localStorage: the first key for `home` - the owner's
 * sketch, found where it lies, with nothing copied - and a key of its own for every other id,
 * the example's too.
 */
export const keyOf = (id) => (id === OWN ? SPACE : `blockplot/sketch/plot/${id}/space`);

/** A note as an id: one that is no text, or is empty, is none. */
const noted = (note) => (typeof note === 'string' && note !== '' ? note : null);

/** The id to show: the tab's note, else the browser's last, else null - the example. */
export const shownOf = (tab, last) => noted(tab) ?? noted(last);

/**
 * The id of a picked folder, by its name: `{ id }`, the name itself, where the rule of a plot's
 * id takes it and it is not the example's in any letters - else `{ refused }`.
 */
export const folderId = (name) =>
  plotName(name) && name.toLowerCase() !== EXAMPLE ? { id: name } : { refused: REFUSED.name };

/**
 * The id of a plot given as its file. A held plot whose text is this very text is that plot -
 * so a file of a held folder is the folder's plot, and the folder wins. Else the id that New
 * plot gives a folder of that name: never `home` or `example`, and -2 and on where it is taken.
 * `held` is a list of `{ id, text }`.
 */
export function fileId(text, name, held) {
  const same = held.find((plot) => plot.text === text);
  if (same !== undefined) return same.id;
  return freeOf(
    folderOf(name),
    held.map((plot) => plot.id),
  );
}

/** A held plot, its fields in this order: what the store's `plots` holds. */
export const recordOf = ({ id, site, text, way, folder, day }) => ({
  id,
  name: site.name,
  areaM2: areaOf(site),
  text,
  way,
  folder: folder ?? null,
  opened: day,
});

/** Held plots, the one opened newest first, and of one day by their id. */
export const heldOrder = (records) =>
  records.toSorted((a, b) =>
    a.opened === b.opened ? byText(a.id, b.id) : byText(b.opened, a.opened),
  );

/** Kept sketches, `{ name, at }`, the newest first, and of one moment the later name. */
export const keptOrder = (list) => list.toSorted((a, b) => b.at - a.at || byText(b.name, a.name));

const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Of a folder's file names, the kept sketches: `{ names, other }` - the name of each that ends in
 * `.json` and that the rule of a kept sketch's name takes, and how many end so under a name it
 * does not take. A file of another ending is none of either.
 */
export function sketchesOf(files) {
  const ending = files.filter((file) => file.endsWith(KEPT_ENDING));
  const names = ending.map((file) => file.slice(0, -KEPT_ENDING.length)).filter(keptName);
  return { names, other: ending.length - names.length };
}

/** The file a kept sketch lies in, in a folder's `sketches/`. */
export const fileOf = (name) => `${name}${KEPT_ENDING}`;

/** The day of a moment as this machine has it, `2026-10-20`: its own day, not Greenwich's. */
export function dayOf(moment) {
  const two = (figure) => String(figure).padStart(2, '0');
  return [moment.getFullYear(), two(moment.getMonth() + 1), two(moment.getDate())].join('-');
}
