// The house for Google Earth (ST-016, T-016.4; ST-038): of the 3D page's scene and the plot's
// site, the text of a KML file - the parts that the 3D page's White builds of the blocks that
// stand above the ground, less what a switch of the page takes away, each plain white faces at
// the plot, raised by the metres typed under File's entry - and the raise itself: what a typed
// text says of it, and where the browser keeps it for the plot. The 3D page asks this module,
// and never the conversion: WGS84 lies in kml/ alone (directive 35). It imports kmlOf,
// ACCURACY_M, aboveGround, shownBy and SURFACES, and nothing else; it runs in a page and in
// Node, and reaches for the browser's store and the page's plot only where it is asked to keep
// or give the raise. house.check.js and white.check.js prove it.
import { aboveGround } from '../scene/above.js';
import { shownBy } from '../scene/shows.js';
import { SURFACES } from '../scene/surfaces.js';
import { kmlOf } from './kml.js';
import { ACCURACY_M } from './wgs84.js';

// What the entry says where the plot says no place - and the page under it, in 3d.html.
export const NO_PLACE =
  'This plot does not say where it lies in the national grid, so it makes no Google Earth file.';
// Where the browser keeps the raise: under the plot's id - the example's too, since T-040.4 - or
// this alone where a page has no plot. The raise is no design figure: neither sketch nor plot holds it.
export const RAISE_KEY = 'blockplot/earth/raise';
// Every part is white, as White draws it; one of a block with no name is named as kmlOf names one.
const WHITE = '#ffffff';
const BLOCK = 'Block';
// What the description adds where a switch of the 3D page took a part of a kept block away.
const SWITCHED = ', and what is switched off in 3D';
// A raise as it may be typed: a sign or none, figures, and a decimal point or comma.
const NUMBER = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;

/** The raise of a field's text, in metres: 0 of an empty text or of blanks; a number with a sign and a decimal point or comma; else null. */
export function raiseOf(text) {
  const typed = text.trim();
  if (typed === '') return 0;
  if (!NUMBER.test(typed)) return null;
  return Number(typed.replace(',', '.')) + 0;
}

/** The key of the store that the raise of a plot is kept under: `plot` the page's PLOT, or nothing. */
export const raiseKey = (plot) => (plot?.id === undefined ? RAISE_KEY : `${RAISE_KEY}/${plot.id}`);

/** The text of the raise that the browser keeps for the page's plot, or an empty one. `page` is the window. */
export const keptRaise = (page = globalThis) =>
  page.localStorage.getItem(raiseKey(page.PLOT)) ?? '';

/** Keeps a text typed as the raise for the page's plot, as it was typed, where it is a number of metres. */
export function keepRaise(text, page = globalThis) {
  if (raiseOf(text) !== null) page.localStorage.setItem(raiseKey(page.PLOT), text);
}

/**
 * The Google Earth file of a scene (`sceneOf`, its `solids`, `ground` and `parts`) on a site -
 * its `name`, `outline`, `bearingDeg` and `originLV95` - raised by `raiseM` metres, saved at
 * `now`, a Date, less what `off` switches off, `{ sections, levels, groups }` as the 3D page
 * holds them (`switchedOff`, scene/shows.js). One of: `{ refused }`, where the site says no
 * place, in the entry's sentence; `{ unraised: true }`, where the raise is no number;
 * `{ text: null }`, where no block of the house stands above the ground, or no part of one is
 * left on; `{ failed }`, where kmlOf throws, in its sentence; else `{ text, under, parts }` -
 * the file, how many blocks it left under the ground, and how many parts it holds.
 */
export function houseFile(scene, site, raiseM, now, off = {}) {
  if (site.originLV95 === undefined) return { refused: NO_PLACE };
  if (raiseM === null) return { unraised: true };
  const { boxes, under } = aboveGround(scene);
  const kept = new Set(boxes);
  const ofKept = (part) => kept.has(scene.solids[part.thing]);
  const parts = shownBy(scene, 'all', off).parts.filter(ofKept);
  if (parts.length === 0) return { text: null };
  const switched = parts.length < scene.parts.filter(ofKept).length;
  try {
    const text = kmlOf({
      name: `${site.name} — house`,
      about: aboutOf(site.name, raiseM, { switched, under }, now),
      place: { originLV95: site.originLV95, bearingDeg: site.bearingDeg },
      raiseM,
      boxes: parts.map((part) => whiteOf(part, scene.solids[part.thing])),
      outline: site.outline,
    });
    return { text, under, parts: parts.length };
  } catch (error) {
    return { failed: error instanceof Error ? error.message : String(error) };
  }
}

/** A part as kmlOf takes a box: its shape and its place, white, see-through where its surface is, named by its block and what it is. */
function whiteOf(part, block) {
  const { shape, min, max, along, low, high } = part;
  return {
    shape,
    min,
    max,
    ...(shape === 'slant' ? { along, low, high } : {}),
    colour: WHITE,
    see: SURFACES[part.surface]?.hides === undefined ? 'solid' : 'through',
    name: `${block.name ?? BLOCK} — ${part.of}`,
  };
}

/** The lines of the file's description: what it is, its raise, how near its places are, and what it left out. */
const aboutOf = (plot, raiseM, { switched, under }, now) => [
  `The house of the sketch on ${plot}, as White shows it in 3D, saved on ${now.toISOString().slice(0, 10)}.`,
  raiseM === 0
    ? "Not raised: its heights are the sketch's, in metres above sea level."
    : `Raised by ${raiseM} m, tuned by eye to Google Earth's ground.`,
  `Places to within about ${ACCURACY_M.toFixed(1)} m, by swisstopo's approximate formulas from LV95 to WGS84.`,
  `Left out: the objects, and the ground as the sketch shapes it${switched ? SWITCHED : ''}${underOf(under)}.`,
];
const underOf = (under) =>
  under === 0 ? '' : `, and ${under} ${under === 1 ? 'block' : 'blocks'} under the ground`;
