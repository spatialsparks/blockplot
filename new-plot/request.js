// The order for a new plot (ST-031): what an order is, and in which sentence one is refused; the
// sentences that the making of a plot says, each written here once; how large a paper may be;
// and the folder that a plot gets of its name. Nothing here touches the network or the disk, and
// nothing is imported: the map's page and the browser's store load this module (ST-041).
// request.check.js proves it.

// An order: a name, of so many characters at the most, as a script counts them; an outline of
// three corners to so many, each an easting and a northing in LV95; the side of the outline that
// the paper lies along, by the corner it begins at; the ground around the plot, in metres, in
// steps of half a metre up to so many - and so many are what a page offers; and what the corners
// were marked on. One limit of corners for hand and parcel alike: a parcel's boundary is taken
// with all its corners, as the official survey gives them (ST-043) - the trial's had 35, and one
// along a stream or a curved road has hundreds.
export const NAME_MAX = 80;
export const CORNERS_MAX = 1000;
const CORNERS_LEAST = 3;
export const AROUND_MAX_M = 20;
export const AROUND_M = 5;
const FIELDS = ['name', 'corners', 'side', 'aroundM', 'on', 'parcel', 'file'];
// What corners are marked on: a map - the national map where the pad offers no cadastre, else
// the cadastral map from near (docs/sketch/cadastre.md) - the aerial photo, or a map and the photo,
// in that order. Never the two maps: at no level do both show.
const MARKED_ON = [
  ['national'],
  ['cadastral'],
  ['photo'],
  ['national', 'photo'],
  ['cadastral', 'photo'],
].map((on) => JSON.stringify(on));
// And, where the corners are a parcel's of the official survey, which: its EGRID, CH and twelve
// figures - `egridOf` of swisstopo/parcels.js has the rule, said again here for this module imports
// nothing, and the check holds the two to be one; its number, so many characters at the most;
// its canton, two capital letters; and whether the corners are still as given, or were changed.
export const NUMBER_MAX = 20;
const EGRID = /^CH\d{12}$/;
const CANTON = /^[A-Z]{2}$/;
const PARCEL = ['egrid', 'number', 'canton', 'asGiven'];

/** Whether an order's `parcel` is one: an object of the four, each of its form. */
function isParcel(parcel) {
  if (parcel === null || typeof parcel !== 'object' || Array.isArray(parcel)) return false;
  const { egrid, number, canton, asGiven } = parcel;
  const keys = Object.keys(parcel);
  const four = keys.length === PARCEL.length && keys.every((key) => PARCEL.includes(key));
  const named = typeof number === 'string' && number.trim() !== '' && number.length <= NUMBER_MAX;
  const formed = [
    [EGRID, egrid],
    [CANTON, canton],
  ].every(([rule, text]) => typeof text === 'string' && rule.test(text));
  return four && named && formed && typeof asGiven === 'boolean';
}

// And, where the corners came from a GeoJSON file the person gave (ST-045), whether they were
// converted from WGS84, and whether they are still as the file gave them: two booleans, no more.
// Such corners were shown on no map: `on` may then be `[]`, until a corner is set or moved.
const FILE = ['wgs84', 'asGiven'];

/** Whether an order's `file` is one: an object of the two, each true or false. */
function isFile(file) {
  if (file === null || typeof file !== 'object' || Array.isArray(file)) return false;
  const keys = Object.keys(file);
  const two = keys.length === FILE.length && keys.every((key) => FILE.includes(key));
  return two && FILE.every((key) => typeof file[key] === 'boolean');
}

// The sheet of the map, in LV95. swisstopo/hosts.js has it as SHEET; it is said again here, for
// this module imports nothing, and the check holds the two to be one.
const SHEET = { west: 2_420_000, east: 2_900_000, south: 1_030_000, north: 1_350_000 };

const isCorner = (corner) =>
  Array.isArray(corner) && corner.length === 2 && corner.every((figure) => Number.isFinite(figure));
const onSheet = ([east, north]) =>
  east >= SHEET.west && east <= SHEET.east && north >= SHEET.south && north <= SHEET.north;

/**
 * An order for a plot, read - `{ name, corners, side, aroundM, on }`, and `parcel` where it had
 * one, `{ egrid, number, canton, asGiven }` and no more, or `file`, `{ wgs84, asGiven }` and no
 * more, with which `on` may also be `[]` - never both - or why it is none:
 * `{ status: 400, refused }`, one sentence, the first of these that holds. `text` is the order as
 * JSON, as the map's page writes it. A name is given with no blank at either end, and a zero
 * with no minus. Whether the outline is one that a plot can have - no corner twice, an area, no
 * side across another - and how large its paper comes out, the computation of a plot says:
 * `SAID` has those sentences.
 */
export function orderOf(text) {
  const refuse = (refused) => ({ status: 400, refused });
  let order = null;
  try {
    order = typeof text === 'string' ? JSON.parse(text) : null;
  } catch {
    // No JSON: refused as what is no object is.
  }
  if (order === null || typeof order !== 'object' || Array.isArray(order)) {
    return refuse('It is no order for a plot: one object, as JSON.');
  }
  const other = Object.keys(order).find((field) => !FIELDS.includes(field));
  if (other !== undefined) {
    return refuse(`It holds ${JSON.stringify(other)}, which no order for a plot has.`);
  }
  const { name, corners, side, aroundM, on } = order;
  if (typeof name !== 'string' || name.trim() === '' || name.trim().length > NAME_MAX) {
    return refuse(`It has no name, or one of more than ${NAME_MAX} characters.`);
  }
  const counted =
    Array.isArray(corners) && corners.length >= CORNERS_LEAST && corners.length <= CORNERS_MAX;
  if (!counted || !corners.every(isCorner)) {
    return refuse(
      `It has no outline: three corners to ${CORNERS_MAX}, each an easting and a northing in metres.`,
    );
  }
  if (!corners.every(onSheet)) {
    const { west, east, south, north } = SHEET;
    return refuse(
      `A corner lies off the map of Switzerland: E ${west} to ${east}, N ${south} to ${north}.`,
    );
  }
  if (!Number.isInteger(side) || side < 0 || side >= corners.length) {
    return refuse("Its side is none of its outline's.");
  }
  const around = Number.isFinite(aroundM) && aroundM >= 0 && aroundM <= AROUND_MAX_M;
  if (!around || !Number.isInteger(aroundM * 2)) {
    return refuse(
      `The ground around the plot is none: 0 to ${AROUND_MAX_M} m, in steps of half a metre.`,
    );
  }
  const onNothing = Object.hasOwn(order, 'file') && Array.isArray(on) && on.length === 0;
  if (!MARKED_ON.includes(JSON.stringify(on)) && !onNothing) {
    return refuse(
      'It does not say what the corners were marked on: a map, the aerial photo, or a map and the photo.',
    );
  }
  const read = { name: name.trim(), corners, side: Math.abs(side), aroundM: Math.abs(aroundM), on };
  const [hasParcel, hasFile] = ['parcel', 'file'].map((key) => Object.hasOwn(order, key));
  if (hasParcel && !isParcel(order.parcel)) {
    return refuse(
      `Its parcel is none: an EGRID, CH and twelve figures; a number of ${NUMBER_MAX} characters at the most; a canton, two capital letters; and whether its corners are as given.`,
    );
  }
  if (hasFile && !isFile(order.file)) {
    return refuse(
      'Its file is none: whether its corners were converted from WGS84, and whether they are as given.',
    );
  }
  if (hasParcel && hasFile) {
    return refuse("It has a parcel and a file: its corners are the one's or the other's.");
  }
  if (hasFile) return { ...read, file: { wgs84: order.file.wgs84, asGiven: order.file.asGiven } };
  if (!hasParcel) return read;
  const { egrid, number, canton, asGiven } = order.parcel;
  return { ...read, parcel: { egrid, number, canton, asGiven } };
}

// A paper is so many metres at the most along the plot, across it and up. A paper over 120 m
// keeps its ground as squares (plot file version 3, ST-042). Tried, for the card of T-042.0: a
// made-up rough hillside of 1 000 m each way is a file of 5.8 MB, read in 0.2 s and made in
// 0.13 s, and 3D draws it in 0.3 ms a frame; at 2 km it is 23.5 MB, and New plot holds about half
// a gigabyte while it makes it. Raising it further is the owner's.
export const PAPER_MAX_M = 1000;

// The sentences that the making of a plot says, beyond those of an order: written here once, for
// the computation of a plot, and for the page that makes it.
export const SAID = Object.freeze({
  same: 'Two corners that follow each other lie at one place.',
  flat: 'Its outline encloses no area.',
  crosses: 'Its outline crosses itself.',
  large: (alongM, acrossM) =>
    `Its paper would be ${alongM} m by ${acrossM} m, and the pad takes ${PAPER_MAX_M} m each way: mark a smaller plot, or less ground around it.`,
  steep: (fromM, toM) =>
    `Its standing paper would be ${toM - fromM} m high, from ${fromM} m to ${toM} m above sea level, and the pad takes ${PAPER_MAX_M} m: the ground is too steep for it.`,
  ground: (why) => `The ground did not come: ${why}`,
  disk: (why) => `The plot could not be written: ${why} Nothing of it was left.`,
});

// The folder of a name. A plot's folder is its id, which the rule of routes.js takes or refuses
// (`plotName`): letters of the English alphabet, figures, blanks, dots, - and _. A folder is so
// many signs at the most; of a name that leaves nothing, it is this word; and two ids are the
// pad's own, which no new plot gets under whatever case - routes.js has them as OWN and EXAMPLE.
export const FOLDER_MAX = 60;
const NO_FOLDER = 'plot';
const ITS_OWN = ['home', 'example'];
// What is cut at either end: blanks and dots.
const ENDS = /^[ .]+|[ .]+$/g;
// A name that Windows keeps for a device, in whatever letters: a folder whose first part - what
// stands before its first dot, less the blanks that Windows passes over at its end - is one, a
// file manager there may not be able to take away again, and the owner deletes a plot that was
// marked wrong by hand. Such a folder gets this before it.
const DEVICE = /^(con|prn|aux|nul|com\d|lpt\d)$/i;
const NO_DEVICE = 'plot-';
const cut = (folder) => folder.slice(0, FOLDER_MAX).replace(ENDS, '');

/**
 * The folder that a plot gets of its name, by this rule and in this order. Letters with a sign
 * over them are written plain: the name is taken apart, each such letter into the letter and its
 * sign, and the signs go with the next step. Every sign that the rule of an id does not take is
 * left out - so a letter that has no plain form, as the sharp s, is left out too. Blanks that
 * follow each other are one. Blanks and dots at either end are cut. What is longer than
 * `FOLDER_MAX` is cut there, and its end cut again. Of nothing, `plot`. And a folder whose first
 * part is a name that Windows keeps for a device gets `plot-` before it, and is cut again. The
 * folder is an id: the name that the pad shows is the file's own.
 */
export function folderOf(name) {
  const apart = typeof name === 'string' ? name.normalize('NFD') : '';
  const taken = apart.replace(/[^A-Za-z0-9 ._-]/g, '').replace(/ {2,}/g, ' ');
  const folder = cut(taken.replace(ENDS, '')) || NO_FOLDER;
  return DEVICE.test(folder.split('.')[0].trimEnd()) ? cut(`${NO_DEVICE}${folder}`) : folder;
}

/**
 * The id that a new plot gets: the folder, where that is free - else the folder with -2, -3 and
 * so on after it, the first that is free. `taken` is what lies in the plots' folder, by name. A
 * name is free where no name of `taken` is that name in small letters - a disk may hold `Home`
 * and `home` to be one folder - and where it is neither of the pad's own two, in small letters.
 */
export function freeOf(folder, taken) {
  const held = new Set([...ITS_OWN, ...taken.map((name) => String(name).toLowerCase())]);
  const isFree = (id) => !held.has(id.toLowerCase());
  if (isFree(folder)) return folder;
  for (let count = 2; ; count += 1) {
    if (isFree(`${folder}-${count}`)) return `${folder}-${count}`;
  }
}
