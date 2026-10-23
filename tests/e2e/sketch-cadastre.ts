import { readFileSync } from 'node:fs';

// The cadastre, as the browser tests expect it (ST-044, T-044.12): what the map's page shows from
// near, the credits beside it and what the corners of the pentagon are marked on, where the pad
// offers the cadastre and where it does not. No test file, by its name. A test loads no script
// of the pad, so tools/sketch/swisstopo/cadastre.js's `CADASTRE` is stated a second time, in
// tests/__fixtures__/cadastre.json - its layer, the ending of its pictures, the level it shows
// from and its credit - and Blockplot's tree has a file in its place that says `null`, no
// cadastre (tools/release/public/). Which layer shows where is T-044.10's rule, `showing` of
// tools/sketch/map/view.js, stated a second time (docs/sketch/cadastre.md, "Without the
// cadastre").

/** The cadastre: the cadastral map's layer at the map service, the ending of its pictures, the level from which it shows, and its credit - or null, none. */
export type Cadastre = Record<'layer' | 'ending' | 'credit', string> & { from: number };
export const CADASTRE = JSON.parse(
  readFileSync(new URL('../__fixtures__/cadastre.json', import.meta.url), 'utf8'),
) as Cadastre | null;

/** A layer of the map, by the page's name for it, in the order in which the page says them. */
type Shows = 'national' | 'cadastral' | 'photo';
const IN_ORDER: Shows[] = ['national', 'cadastral', 'photo'];
const SWISSTOPO = '© swisstopo';
// The last level of the national map: the photo shows beyond it, where no cadastre does.
const NATIONAL_TO = 27;

/** The layer that shows at a level: the photo at the switch, the cadastral map from its level on, the national map to level 27, and the photo at 28. */
export const shownAt = (level: number, photo = false): Shows => {
  if (photo) return 'photo';
  if (CADASTRE !== null && level >= CADASTRE.from) return 'cadastral';
  return level <= NATIONAL_TO ? 'national' : 'photo';
};
/** The credits on the map while a layer shows: swisstopo's, and the cantons' beside it with the cadastral map. */
export const creditsOf = (layer: Shows): string[] =>
  layer === 'cadastral' && CADASTRE !== null ? [SWISSTOPO, CADASTRE.credit] : [SWISSTOPO];
/** What the body says the corners were marked on, `data-on`: each layer once, in the page's order, a blank between. */
export const onOf = (...layers: Shows[]): string =>
  IN_ORDER.filter((layer) => layers.includes(layer)).join(' ');

/** The credit of the pentagon's plot, its corners marked at level 28 with the switch off. */
export const NEAR_CREDIT =
  CADASTRE === null
    ? 'Outline: marked by hand on the aerial photo, no survey. Ground: swissALTI3D. © swisstopo'
    : `Outline: marked by hand on the cadastral map, no survey. Ground: swissALTI3D. ${SWISSTOPO}, ${CADASTRE.credit}`;
/** The golden file of that plot (tests/__fixtures__/new-plot/): marked on the cadastral map, or on the aerial photo where there is none. */
export const NEAR_GOLDEN = readFileSync(
  new URL(
    `../__fixtures__/new-plot/${CADASTRE === null ? 'trial-slope-photo' : 'trial-slope'}.json`,
    import.meta.url,
  ),
  'utf8',
);
/** The pad's files that the map's page asks for besides the rest, where there is a cadastre: the parcel taken, and its addresses. Its outline's rule, new-plot/ring.js, every pad loads, for a file's outline (ST-045). */
export const CADASTRE_FILES = ['map/take.js', 'new-plot/parcel.js', 'swisstopo/parcels.js'];
