// A plot's file (ST-030): the stored format `blockplot/plot`, its one reader and its writer.
// A plot's file is a site as the pad has it - what `globalThis.SITE` is to a page - as one JSON
// document, with what says that it is a plot's file before it. docs/STORAGE_FORMAT.md, "The plot
// file - version 3", says every field. The one place that reads such a file; nothing here touches
// the network, the disk or a page. A text is read whole or refused in one sentence, the first
// that holds of the format's list. What the pad could not draw at all is refused; what it draws
// and says in red as it opens (`paper.siteFaults`) is read. Versions 1 to 3 are read: version 2
// is version 3 with its ground as rows of heights, version 1 is version 2 without `originLV95`,
// and a plot is written as the oldest that holds it - so a file of before reads and writes back
// byte for byte. Its ground as squares is squares.js's (ST-042). It imports nothing of Node, and
// neither do the modules it loads: a page loads it as the server does (ST-040).
import { isLV95 } from './new-plot/frame.js';
import './squares.js';

const { squares } = globalThis;
export const FORMAT = 'blockplot/plot';
export const VERSION = 3;
// The oldest version read; the one that added the field of where the frame's zero lies, in LV95.
const [FIRST, PLACED, PLACE] = [1, 2, 'originLV95'];

// What says that a file is a plot's.
const HEAD = ['format', 'version'];
// A site's fields, in the order of the format's table: the order they are written in.
const FIELDS = [
  'name',
  'officialAreaM2',
  'cellM',
  'bearingDeg',
  PLACE,
  'xFromM',
  'xToM',
  'yFromM',
  'yToM',
  'sideM',
  'outline',
  'notes',
  'house',
  'ground',
  'credit',
  'sources',
];
// The ground's fields: as rows of heights to version 2, as squares in version 3.
const GROUND = ['baseM', 'rowsCm'];
const SQUARES = ['baseM', 'squares', 'cornersCm'];
const groundOf = (version) => (version === VERSION ? SQUARES : GROUND);
// The cell is the pad's own, half a metre: a plot's file says it, and may say no other.
const CELL_M = 0.5;
const FULL_TURN_DEG = 360;
const CORNERS_LEAST = 3;
// A byte-order mark before a text, by its number: the canonical form has none, and one is read
// all the same.
const BOM = String.fromCodePoint(0xfeff);
const NOT_BACK = 'It does not read back as it was written.';
const NO_PLACE =
  'Its place in LV95 is none: an east of 2 000 000 to under 3 000 000 and a north of 1 000 000 to under 2 000 000, in metres.';
/** A site's fields in a version: version 1 has all but its place. */
const fieldsOf = (version) =>
  version === FIRST ? FIELDS.filter((field) => field !== PLACE) : FIELDS;

/** A number is one that JSON holds and that is finite: `1e999` is none. */
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const isText = (value) => typeof value === 'string';
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
/** A list of as many parts as kinds are named, each part of its kind. */
const isRow = (value, ...kinds) =>
  Array.isArray(value) && value.length === kinds.length && kinds.every((is, at) => is(value[at]));
const isPlace = (value) => isRow(value, isNumber, isNumber);
const isNote = (value) => isRow(value, isNumber, isNumber, isText);
/** How many cells lie between two figures of the paper, as paper.js counts them. */
const cells = (from, to) => (to - from) / CELL_M;
/** A span of the paper: two numbers, the first the smaller, whole cells apart. */
const isSpan = (span) =>
  isRow(span, isNumber, isNumber) && span[0] < span[1] && Number.isInteger(cells(...span));
/** A row of the ground as its texts, a text a height: what stands between two blanks. */
const heightsOf = (row) => (row === '' ? [] : row.split(' '));
/** A height is what `Number` makes of such a text, where that is finite and the text holds something. */
const isHeight = (text) => text.trim() !== '' && Number.isFinite(Number(text));

/** The area that an outline encloses, in square metres - as `paper.siteFaults` works it out. */
function enclosed(outline) {
  const twice = outline.reduce((sum, [x, y], index) => {
    const [x2, y2] = outline[(index + 1) % outline.length];
    return sum + x * y2 - x2 * y;
  }, 0);
  return Math.abs(twice) / 2;
}

/**
 * What JSON makes of a text - or undefined, which JSON holds none of: the text is no JSON. And
 * neither is what is no text: nothing of it can be asked how it begins.
 */
function parsed(text) {
  try {
    return JSON.parse(text.startsWith(BOM) ? text.slice(BOM.length) : text);
  } catch {
    return undefined;
  }
}

/**
 * The first field that no plot has, in the file's order - one of `ground` under that name, as
 * the format's table names it: `ground.heights` - or undefined.
 */
function strange(file) {
  const fields = fieldsOf(file.version);
  for (const field of Object.keys(file)) {
    if (!HEAD.includes(field) && !fields.includes(field)) return field;
    const inner = field === 'ground' && isObject(file.ground) ? Object.keys(file.ground) : [];
    const other = inner.find((name) => !groundOf(file.version).includes(name));
    if (other !== undefined) return `ground.${other}`;
  }
  return undefined;
}

/** Why a file is no plot's of a version that this pad reads: by what it says it is, and by its fields' names - or null. */
function head(file) {
  if (!isObject(file)) return "It is no plot: a plot's file is one object.";
  if (file.format !== FORMAT) return `It is no plot: its format is not "${FORMAT}".`;
  if (![FIRST, PLACED, VERSION].includes(file.version)) {
    // The version as the file writes it. A file that writes none is of no version.
    const written = Object.hasOwn(file, 'version') ? JSON.stringify(file.version) : null;
    const said = written === null ? 'no version' : `version ${written}`;
    return `It is a plot of ${said}, and this pad reads versions ${FIRST} to ${VERSION}.`;
  }
  const field = strange(file);
  if (field === undefined) return null;
  // The file's own version: a field of version 2 is one too many in a file of version 1.
  return `It holds ${JSON.stringify(field)}, which no plot of version ${file.version} has.`;
}

/** Why a plot's name, its stated area, its cell, its bearing, its place or its paper is none - or null. */
function facts(file) {
  const { name, officialAreaM2: area, bearingDeg: bearing } = file;
  if (!isText(name) || name.trim() === '') return 'It has no name.';
  if (area !== undefined && !(isNumber(area) && area > 0)) {
    return 'Its area of the land register is no area.';
  }
  if (file.cellM !== CELL_M) return 'Its cell is not half a metre: the pad draws on no other.';
  if (!(isNumber(bearing) && bearing >= 0 && bearing < FULL_TURN_DEG)) {
    return `Its bearing is no bearing: degrees from 0 to under ${FULL_TURN_DEG}.`;
  }
  if (file[PLACE] !== undefined && !isLV95(file[PLACE])) return NO_PLACE;
  const spans = [[file.xFromM, file.xToM], [file.yFromM, file.yToM], file.sideM];
  if (spans.every(isSpan)) return null;
  return 'Its paper is none: from a metre to a larger one, in whole cells, down the plot, across it and up.';
}

/** Why a plot's outline, its notes or its point of a house is none - or null. */
function drawn(file) {
  const { outline, notes, house } = file;
  if (!Array.isArray(outline) || outline.length < CORNERS_LEAST || !outline.every(isPlace)) {
    return 'It has no outline: three corners at the least, each two numbers.';
  }
  if (!(enclosed(outline) > 0)) return 'Its outline encloses no area.';
  if (!Array.isArray(notes) || !notes.every(isNote)) {
    return 'Its notes are none: each is a place and its words.';
  }
  return house === undefined || isPlace(house) ? null : 'Its point of a house is no place.';
}

/** Why a plot's ground is none, or lacks a height at a grid point of the plot's own paper - or null. */
function ground(file) {
  const { baseM, rowsCm, squares: tree, cornersCm } = file.ground ?? {};
  const [across, along] = [cells(file.yFromM, file.yToM), cells(file.xFromM, file.xToM)];
  const texts = (list) => Array.isArray(list) && list.every(isText);
  if (file.version === VERSION) {
    const kinds = isNumber(baseM) && isText(tree) && texts(cornersCm);
    return kinds ? squares.fault(file.ground, along, across) : 'It has no ground.';
  }
  if (!isNumber(baseM) || !texts(rowsCm)) return 'It has no ground.';
  // A height at every grid point: one more than the paper has cells, across the plot and along it.
  const [rows, heights] = [across + 1, along + 1];
  const lacks = 'Its ground lacks a height:';
  const needed = `${lacks} ${rows} rows of ${heights} heights are needed, and`;
  if (rowsCm.length !== rows) {
    return `${needed} it has ${rowsCm.length} ${rowsCm.length === 1 ? 'row' : 'rows'}.`;
  }
  const counts = rowsCm.map((row) => heightsOf(row).length);
  const other = counts.findIndex((count) => count !== heights);
  if (other >= 0) return `${needed} row ${other + 1} has ${counts[other]}.`;
  const amiss = rowsCm.findIndex((row) => !heightsOf(row).every(isHeight));
  return amiss < 0 ? null : `${lacks} row ${amiss + 1} holds what is no number.`;
}

/** Why a plot does not say where its figures came from, as a plot says it - or null. */
function sourced(file) {
  if (!isText(file.credit)) return 'It does not say where its figures came from.';
  const { sources } = file;
  if (sources === undefined || (Array.isArray(sources) && sources.every(isText))) return null;
  return 'Its sources are none: each is a text.';
}

/** A file's own object without what says that it is a plot's file, its fields in the file's order. */
const siteOf = (file) =>
  Object.fromEntries(Object.entries(file).filter(([field]) => !HEAD.includes(field)));

/**
 * A plot's file, read: `{ site }` - the file's own object without `format` and `version`, its
 * fields in the file's order: what `globalThis.SITE` is to be - or `{ refused }`, one sentence
 * that says why the text is no plot this pad reads: the first that holds, in the order of the
 * format's list. A file in another form than the canonical one is read all the same.
 */
export function read(text) {
  const file = parsed(text);
  if (file === undefined) return { refused: 'It is no JSON.' };
  const refused = head(file) ?? facts(file) ?? drawn(file) ?? ground(file) ?? sourced(file);
  return refused === null ? { site: siteOf(file) } : { refused };
}

/** An object's fields in the order they are written in - and after them, as they stand, what is none of them. */
function inOrder(object, fields) {
  const named = fields.filter((field) => Object.hasOwn(object, field));
  return { ...Object.fromEntries(named.map((field) => [field, object[field]])), ...object };
}

/**
 * The canonical text of what is handed over as a site - or '', where there is none: nothing
 * has no fields to lay, and JSON takes no ring. What is no site is found out as it is read back.
 * It is of the oldest version that holds the site: 3 where its ground says squares, else 2 where
 * it says where it lies, else 1 - so a plot's file of version 1 or 2 is written back as it was.
 */
function textOf(site) {
  try {
    const squared = isObject(site.ground) && Object.hasOwn(site.ground, 'squares');
    const version = squared ? VERSION : Object.hasOwn(site, PLACE) ? PLACED : FIRST;
    const laid = inOrder(site, FIELDS);
    if (isObject(site.ground)) laid.ground = inOrder(site.ground, groundOf(version));
    return `${JSON.stringify({ format: FORMAT, version, ...laid }, null, 2)}\n`;
  } catch {
    return '';
  }
}

/** What JSON holds of a thing: a plain list, or a plain object, of this context - else null. */
function heldAs(value) {
  if (typeof value !== 'object' || value === null) return null;
  const kind = Object.getPrototypeOf(value);
  if (Array.isArray(value)) return kind === Array.prototype ? 'list' : null;
  return kind === Object.prototype ? 'object' : null;
}

/**
 * Whether two things are one as JSON holds them: a number, a text, `true`, `false` and `null` by
 * `Object.is` - so `-0` is not `0` - lists part for part in their order, a hole as none, and
 * objects by their own keys, in no order. A thing that JSON does not hold is the same as itself
 * alone. What `isDeepStrictEqual` of `node:util` was to `write`, with nothing of Node.
 */
function same(one, other) {
  if (Object.is(one, other)) return true;
  const kind = heldAs(one);
  if (kind === null || kind !== heldAs(other)) return false;
  if (kind === 'list') {
    return (
      one.length === other.length && Array.from(one).every((part, at) => same(part, other[at]))
    );
  }
  const keys = Reflect.ownKeys(one);
  const all = (key) => Object.hasOwn(other, key) && same(one[key], other[key]);
  return keys.length === Reflect.ownKeys(other).length && keys.every(all);
}

/**
 * A site as a plot's file: `{ text }`, its canonical form - the fields in the order of the
 * format's table, two blanks of indentation, a line end - or `{ refused }`. It writes, reads its
 * own text back, and gives the text only where the site that it read is the site it was given,
 * figure for figure (`same`): so what `write` gives, `read` takes. A value that a file does not
 * hold - `NaN`, a hole, `undefined`, a site of another `node:vm` context - does not read back as
 * it was written; what `read` refuses of a text that holds the site, `write` refuses in its words.
 */
export function write(site) {
  const text = textOf(site);
  const back = read(text);
  if (back.site !== undefined && same(back.site, site)) return { text };
  const file = parsed(text);
  const held = isObject(file) && same(siteOf(file), site);
  return { refused: held && back.refused !== undefined ? back.refused : NOT_BACK };
}

/**
 * A plot's area in square metres, not rounded: the one it states, and where it states none, the
 * one its outline encloses.
 */
export const areaOf = (site) => site.officialAreaM2 ?? enclosed(site.outline);
