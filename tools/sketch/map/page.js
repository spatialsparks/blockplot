// The page of a new plot (ST-031), put together: it learns whom it asks from one word of its own
// address, `asks` (ST-041, T-041.2) - and asks nobody to learn it - puts its policy into its head,
// says whom it asks in a line, and opens the map and Find on the origins of that word. First what
// is read of the address and what is said of it, with nothing of the page in it - page.check.js
// reads it; then the page itself. Where the page asks nobody there is no map and no Find, and
// the line says why. The page's one script: the others are loaded from here - and with the map
// what is marked on it, marks.js, a GeoJSON file's outline taken onto it, file.js (ST-045), and
// what names the plot and makes it, make.js. A parcel taken
// onto those marks, take.js (ST-043), is the cadastre's: loaded, and its part of the side shown,
// only where the pad offers the cadastre (docs/sketch/cadastre.md).
import { CADASTRE } from '../swisstopo/cadastre.js';
import { HOSTS, asksOf, mayAsk, policyOf } from '../swisstopo/hosts.js';
import { openFile } from './file.js';
import { openFind } from './find.js';
import { openMake } from './make.js';
import { openMap } from './map.js';
import { openMarks } from './marks.js';

const { document, location } = globalThis;

// The three origins of a page that asks swisstopo, each put together of its host's name.
const SWISSTOPO = Object.freeze({
  map: `https://${HOSTS.map}`,
  search: `https://${HOSTS.search}`,
  terrain: `https://${HOSTS.terrain}`,
});
// The line that says what this page asks, by whom it asks: each sentence written here once - the
// line of swisstopo twice, with the cadastre and without it, where it names no parcel.
const SAID = {
  swisstopo:
    'This page asks swisstopo, the Federal Office of Topography, for the pictures of the map that it shows, for the places that you search for, and for the parcel whose number or EGRID you type, or that you click with "Take the parcel under a click" on: the words that you typed, or the place that you clicked, are all that goes for it. When you make the plot, this page asks it for the heights of the ground under the plot. Nothing else goes out: no name, no sketch, nothing of your design, and nothing of a GeoJSON file that you give, which is read in this page alone.',
  swisstopoAlone:
    'This page asks swisstopo, the Federal Office of Topography, for the pictures of the map that it shows and for the places that you search for: the words that you typed are all that goes for it. When you make the plot, this page asks it for the heights of the ground under the plot. Nothing else goes out: no name, no sketch, nothing of your design, and nothing of a GeoJSON file that you give, which is read in this page alone.',
  standIn: (at) =>
    `This page asks a stand-in on this machine, ${at}, in the place of swisstopo: its map, its places and its ground are made up.`,
  nobody: 'It shows no map and makes no plot.',
};

/**
 * Whom the page asks, of what `asksOf` read of its address - `{ asks, map, search, terrain,
 * says }`: `asks` is `swisstopo`, `stand-in` or `nobody`, `map`, `search` and `terrain` the three
 * origins, each null where it asks nobody, and `says` the line of the page. swisstopo is the
 * three origins of its services - its line names the parcel only where `cadastre` is not null; a
 * stand-in one origin of this machine for all three; and whatever else - a refusal, an origin
 * that may not be asked, one of three - is nobody, which says the refusal first where there is one.
 */
export function toldOf(told, cadastre = CADASTRE) {
  const { map, search, terrain, refused } = Object(told);
  if (map === SWISSTOPO.map && search === SWISSTOPO.search && terrain === SWISSTOPO.terrain) {
    const says = cadastre === null ? SAID.swisstopoAlone : SAID.swisstopo;
    return { asks: 'swisstopo', map, search, terrain, says };
  }
  if (mayAsk(map) && map === search && map === terrain && map.startsWith('http:')) {
    return { asks: 'stand-in', map, search, terrain, says: SAID.standIn(map) };
  }
  const why = typeof refused === 'string' ? `${refused} ` : '';
  return { asks: 'nobody', map: null, search: null, terrain: null, says: `${why}${SAID.nobody}` };
}

/** Whom the page asks, read of its own address - `location.search` - and asked of nobody. */
export const whom = () => toldOf(asksOf(location.search));

// The page: its policy first - a second one, beside the first of its markup, which names no host
// - before a picture or a request is asked; then its line, and - where it asks somebody - Find
// and the map, which lie hidden until then, with the marks on the map and the plot's side beside
// it; the marks are opened once, for the file, the parcel and the making alike, and the file's
// part on them in every pad that asks somebody. Where the pad offers the
// cadastre, the parcel's part at the top of the side is shown, and the parcel opened, before the
// making. What the body says of whom it asks comes last: by then the map stands.
const $ = (id) => document.getElementById(id);
const told = whom();
const policy = document.createElement('meta');
Object.assign(policy, { httpEquiv: 'Content-Security-Policy', content: policyOf(told) });
document.head.append(policy);
$('asks').textContent = told.says;
if (told.asks !== 'nobody') {
  for (const part of ['find', 'work']) $(part).hidden = false;
  const map = openMap(told.map);
  openFind(told.search, map);
  const marks = openMarks(map);
  openFile(map, marks);
  if (CADASTRE !== null) {
    $('parcel-part').hidden = false;
    const { openTake } = await import('./take.js');
    openTake(told.search, map, marks);
  }
  void openMake(marks, told.terrain);
}
document.body.dataset.asks = told.asks;
