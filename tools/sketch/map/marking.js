// What a plot is while it is marked (ST-031), with nothing of the page in it: its corners in LV95,
// set one after the other where the map is near enough; from the third the outline closes, its
// area shows, and the paper lies around it as it will lie in the pad - along the outline's
// longest side, with 5 m of ground around, until another side is picked or another figure set.
// A corner is moved, the last is undone, all are taken away; or a parcel's corners are taken
// whole, or a GeoJSON file's (ST-045), and the marking says whose they are, and whether still as
// given (ST-043). What is said
// is said by the server's own rule: the area and the paper are `paperOf` of new-plot/frame.js,
// and a figure that is none is said in the sentence of `orderOf` - neither is stated here a
// second time. Nothing is asked of anybody. marking.check.js holds it by hand, and
// marking-parcel.check.js a parcel taken, marking-geojson.check.js a file's outline; the marks on
// the map are marks.js's.
import { longest, paperOf } from '../new-plot/frame.js';
import { AROUND_M, CORNERS_MAX, orderOf } from '../new-plot/request.js';
import { GEOPORTAL, MARK_FROM, SHEET } from '../swisstopo/hosts.js';

// An outline closes from its third corner on: fewer enclose nothing, and have no paper.
const CLOSES_FROM = 3;
// What a corner is marked on - a layer of the map by its name - in the order of an order's `on`;
// and what the corners of a parcel are marked on, taken whole: its boundary is the cadastral map's.
const MARKED_ON = ['national', 'cadastral', 'photo'];
const TAKEN_ON = 'cadastral';
// A corner is taken to the centimetre, as the paper takes it: so many parts of a metre.
const CM = 100;
const toCm = (metres) => Math.round(metres * CM) / CM;
// A length is said to the decimetre, and a whole one with no decimal.
const said1 = (metres) => String(Math.round(metres * 10) / 10);
// Three places that an order can have for its corners, on the sheet of the map: of an order that
// is one but for the ground around it, what is asked is that figure alone.
const ON_SHEET = [0, 1, 2].map((at) => [SHEET.west + at, SHEET.south + (at % 2)]);
// What is said, each sentence written here once. A paper that is none is said in `paperOf`'s.
const SAID = {
  none: 'No corner yet. Go near, and click the corners of your plot, one after the other.',
  survey: 'Marked by hand on a map: good to a few decimetres, no survey, and of no legal effect.',
  far: 'Come nearer to mark a corner: here a pixel of the map is more than half a metre.',
  full: `An outline has ${CORNERS_MAX} corners at the most.`,
  few: 'A parcel of fewer than three corners encloses nothing.',
  fewOfFile: 'An outline of fewer than three corners encloses nothing.',
  given: ({ number, canton }) =>
    `Parcel ${number} (${canton}) of the official survey, as ${GEOPORTAL} gives it: no extract of the land register, and of no legal effect.`,
  changed: ({ number, canton }) =>
    `After parcel ${number} (${canton}) of the official survey, changed by hand: no survey, and of no legal effect.`,
  // A file's (ST-045): as given or after it, converted from WGS84 or not.
  file: ({ wgs84, asGiven }) =>
    `${asGiven ? 'From' : 'After'} a file you gave${wgs84 ? ', converted from WGS84 to about a metre' : ''}${asGiven ? '' : ', changed by hand'}: no survey, and of no legal effect.`,
  corners: (count, area) => `${count} corner${count === 1 ? '' : 's'}${area}.`,
  paper: (side, count, longM, alongM, acrossM) =>
    `The paper lies along side ${side} of ${count}, ${longM} m long, and will be ${alongM} m by ${acrossM} m.`,
};

/** Whose the corners are, in a sentence: the hand's, a parcel's or a file's, as given or changed. */
function surveyOf(parcel, file) {
  if (file !== null) return SAID.file(file);
  if (parcel === null) return SAID.survey;
  return parcel.asGiven ? SAID.given(parcel) : SAID.changed(parcel);
}

/**
 * What the page says of a plot that is marked - `{ corners, survey, paper }`, each a sentence or
 * empty. How many corners there are, and from the third the area that they enclose, to a whole
 * square metre; beside the area, whose the corners are - marked by hand and no survey, or the
 * parcel's as given, or after it, changed by hand; and the paper: the side that it lies along
 * - counted from 1 - with that side's length and how large the paper will be, or the sentence
 * that `paperOf` refused it with. `paper` is what `paperOf` gave, or null: no outline yet;
 * `parcel` and `file` what `read` gives of one, or null.
 */
function saidOf(count, side, paper, parcel, file) {
  if (count === 0) return { corners: SAID.none, survey: '', paper: '' };
  if (paper === null) return { corners: SAID.corners(count, ''), survey: '', paper: '' };
  if (paper.refused !== undefined) {
    return { corners: SAID.corners(count, ''), survey: '', paper: paper.refused };
  }
  const { outline, areaM2, xFromM, xToM, yFromM, yToM } = paper;
  // In its frame the side begins at nought and runs along x: its far corner says how long it is.
  const longM = said1(outline[(side + 1) % count][0]);
  return {
    corners: SAID.corners(count, `, ${Math.round(areaM2)} m²`),
    survey: surveyOf(parcel, file),
    paper: SAID.paper(side + 1, count, longM, xToM - xFromM, yToM - yFromM),
  };
}

/**
 * A plot while it is marked: its corners in LV95, in the order they were set, each with what
 * showed while it was set or moved; the side that the paper lies along - the longest, until
 * another is picked, and the longest again once a corner is added or taken away; and the ground
 * around, `AROUND_M` until another figure is set. It gives:
 *
 * - `add({ e, n }, level, shows)` - a corner set, at the place to the centimetre: empty, or why
 *   none was set, in a sentence - the map is further than `MARK_FROM`, or the outline is full.
 * - `move(at, { e, n }, shows)` - corner `at` at another place; `undo()` - the last corner
 *   gone; `clear()` - all of them.
 * - `pick(by)` - the side before, -1, or the next, 1, round the outline.
 * - `around(figure)` - the ground around, in metres: empty, or - for what is no such figure -
 *   the order's own sentence, with the ground as it was.
 * - `take(corners, { egrid, number, canton })` - a parcel's corners, each `[e, n]`, in the place
 *   of every corner marked, as if each were set on the cadastral map, to the centimetre; the side
 *   the longest again, the ground around as it was, and no level asked: empty, or why nothing was
 *   taken - fewer than three corners, or more than `CORNERS_MAX` - and then nothing changes.
 *   A file's outline taken before is let go.
 * - `takeFile(corners, { wgs84 })` - a GeoJSON file's corners (ST-045), each `[e, n]` in LV95,
 *   in the place of every corner marked, to the centimetre, marked on nothing; the side the
 *   longest again, the ground around as it was; any parcel let go: empty, or why nothing was
 *   taken - fewer than three corners, or more than `CORNERS_MAX` - and then nothing changes.
 * - `read()` - `{ corners, side, aroundM, on, paper, parcel, file, said }`: the corners, `[e, n]`;
 *   the corner that the side begins at; the ground around; what the corners were marked on, as an
 *   order says it; `paper`, what `paperOf` gives of these - its `areaM2`, its `sheet`, or
 *   `refused` - or null with fewer than three corners; `parcel`, null, or the parcel taken,
 *   `{ egrid, number, canton, asGiven }` - `asGiven` false once a corner was added, moved or
 *   undone, and the parcel let go with the last corner; `file`, null, or the file's taken,
 *   `{ wgs84, asGiven }`, as the parcel's; and `said`, the sentences (`saidOf`).
 * - `order(name)` - the order for the plot, as `orderOf` of request.js reads one: with the
 *   parcel or the file as its sixth field where there is one, and no such key where there is none.
 */
export function marking() {
  let corners = [];
  let picked = null;
  let aroundM = AROUND_M;
  let parcel = null;
  let file = null;
  let asGiven = false;
  const corner = ({ e, n }, shown) => ({ place: [toCm(e), toCm(n)], on: new Set(shown) });
  const places = () => corners.map(({ place }) => place);
  const sideOf = (all) => picked ?? (all.length === 0 ? 0 : longest(all));
  // The corners changed: the side is the longest again, and they are no parcel's or file's as
  // given - and no parcel's or file's at all once none is left.
  const changed = (now) => {
    corners = now;
    picked = null;
    asGiven = false;
    if (now.length === 0) [parcel, file] = [null, null];
  };
  // Corners given whole, a parcel's or a file's: why none were taken, or empty and taken.
  const given = (all, shown, few) => {
    if (all.length < CLOSES_FROM) return few;
    if (all.length > CORNERS_MAX) return SAID.full;
    changed(all.map(([e, n]) => corner({ e, n }, shown)));
    asGiven = true;
    return '';
  };

  function read() {
    const all = places();
    const side = sideOf(all);
    const paper = all.length < CLOSES_FROM ? null : paperOf(all, side, aroundM);
    const on = MARKED_ON.filter((layer) => corners.some((one) => one.on.has(layer)));
    const of = parcel === null ? null : { ...parcel, asGiven };
    const ofFile = file === null ? null : { ...file, asGiven };
    const said = saidOf(all.length, side, paper, of, ofFile);
    return { corners: all, side, aroundM, on, paper, parcel: of, file: ofFile, said };
  }

  return {
    add(place, level, shows) {
      if (level < MARK_FROM) return SAID.far;
      if (corners.length >= CORNERS_MAX) return SAID.full;
      changed([...corners, corner(place, [shows])]);
      return '';
    },
    move(at, place, shows) {
      if (corners[at] === undefined) return;
      corners[at] = corner(place, [...corners[at].on, shows]);
      asGiven = false;
    },
    undo: () => changed(corners.slice(0, -1)),
    clear: () => changed([]),
    take(all, { egrid, number, canton }) {
      const why = given(all, [TAKEN_ON], SAID.few);
      if (why === '') [parcel, file] = [{ egrid, number, canton }, null];
      return why;
    },
    takeFile(all, { wgs84 }) {
      const why = given(all, [], SAID.fewOfFile);
      if (why === '') [parcel, file] = [null, { wgs84 }];
      return why;
    },
    pick(by) {
      const count = corners.length;
      if (count >= CLOSES_FROM) picked = (sideOf(places()) + by + count) % count;
    },
    around(figure) {
      const order = { name: 'plot', corners: ON_SHEET, side: 0, aroundM: figure, on: ['photo'] };
      const asked = orderOf(JSON.stringify(order));
      if (asked.refused !== undefined) return asked.refused;
      aroundM = asked.aroundM;
      return '';
    },
    read,
    order(name) {
      const { corners: all, side, on, parcel: of, file: ofFile } = read();
      const order = { name, corners: all, side, aroundM, on };
      if (ofFile !== null) return { ...order, file: ofFile };
      return of === null ? order : { ...order, parcel: of };
    },
  };
}
