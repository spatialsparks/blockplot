// What shows of the scene (story ST-033): which solids and parts a tab's switches take away at a
// cut, and where the pad's slice of a standing view opens the house. Plain rules with no page:
// the switches and the slice are how a tab shows the sketch, and none is written into it. It
// imports its neighbours alone and names no global.
import { partsShown, shown } from './cut.js';
import { frameOf } from './scene.js';

/** The word, in the list of sections switched off, for a thing that is in no section. */
export const NO_SECTION = 'none';

/**
 * Whether a switch takes this solid away. `off` is `{ sections, levels, groups }`, three lists,
 * any of them missing or empty: of section ids and `NO_SECTION`; of levels in metres, as
 * `scene.levels` has them; of names of the pad's gallery groups. A solid goes where its
 * `section` is listed - `NO_SECTION` where it says none - or its `floor` is a listed level, or
 * its `gallery` is listed. A group that no solid is of, or a section the scene has not, takes
 * nothing away. Which groups are offered a switch is the page's: listed, a group goes.
 */
export function switchedOff(solid, off) {
  const { sections = [], levels = [], groups = [] } = off ?? {};
  return (
    sections.includes(solid.section ?? NO_SECTION) ||
    levels.includes(solid.floor) ||
    (solid.gallery !== undefined && groups.includes(solid.gallery))
  );
}

/**
 * What shows at a cut with switches: `{ solids, parts }` - what `shown` and `partsShown` give at
 * that cut (cut.js), less what a switch takes away, each in the scene's order. A part goes with
 * its thing, `scene.solids[part.thing]`. Nothing off and the cut 'all' is every solid and part.
 */
export function shownBy(scene, cut, off) {
  const on = (solid) => !switchedOff(solid, off);
  return {
    solids: shown(scene, cut).filter(on),
    parts: partsShown(scene, cut).filter((part) => on(scene.solids[part.thing])),
  };
}

/**
 * Of each of the pad's four standing views (paper.js, `VIEWS`), the slice it looks at and the
 * side it looks from, as the 3D page's stands look (stations.js): `side` from the small y, as
 * `left` does, and `far` from the large y, as `right` does - each at the slice along the plot,
 * a row of the top view, `on.side`; `front` from downhill, the large x, and `back` from the
 * small x - each at the slice across it, a column, `on.end`. What lies between the slice and the
 * eye is taken away: `keeps` is the other way.
 */
const LOOKS = {
  side: { axis: 1, plane: 'side', keeps: 1 },
  far: { axis: 1, plane: 'side', keeps: -1 },
  front: { axis: 0, plane: 'end', keeps: -1 },
  back: { axis: 0, plane: 'end', keeps: 1 },
};

/** The four standing views by their keys, in the pad's order: the sides the house opens along. */
export const OPENS = ['side', 'far', 'front', 'back'];

/**
 * Where the house opens along the slice of a view: null where `from` is none of `OPENS`; else
 * `{ axis, at, keeps }`. `axis` is 0 for x or 1 for y, as a place has them; `at` the plane, in
 * metres of the plot's frame, through the middle of the slice's row or column - so a box that
 * the slice runs through is cut in two, and one it does not run through lies wholly on one
 * side; `keeps` is 1 where what lies at a larger x or y than `at` is kept, and -1 where what
 * lies at a smaller one is. `on` is `{ side, end }`, a row and a column, as `sketch.on('side')`
 * and `sketch.on('end')` give them; `site` a `SITE`, whose frame says where they lie (scene.js).
 */
export function openAlong(site, on, from) {
  if (!Object.hasOwn(LOOKS, from)) return null;
  const { axis, plane, keeps } = LOOKS[from];
  const frame = frameOf(site);
  const at = axis === 1 ? frame.yOf(on[plane] + 0.5) : frame.xOf(on[plane] + 0.5);
  return { axis, at, keeps };
}
