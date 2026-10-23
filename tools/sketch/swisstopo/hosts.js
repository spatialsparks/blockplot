// Whom the sketch pad asks, and how every address that it asks is built (ST-031). The pad's
// pages ask the address they were served from and nobody else - but one, New plot, which asks
// the Federal Office of Topography, swisstopo: its map service for the pictures of the map, its
// search for a place and for a parcel with its boundary (ST-043), and its downloads for the
// heights under a plot, out of swissALTI3D (ST-041). Here are the rules of that: who is asked, by
// which word of the page's address and under which policy, and every address - each built of an
// origin that may be asked, of figures that the pad works out, of words that go into one value
// of a query - and of nothing else; the addresses of a parcel, which add an EGRID that the pad
// checked, are parcels.js's, the cadastre's (cadastre.js). No network, no disk, and one import,
// cadastre.js, which imports nothing: a page and the checks both load this module. hosts.check.js
// and cadastre.check.js prove it, and named.check.js that no other file of the pad names a host.
import { CADASTRE } from './cadastre.js';

// The three hosts. Their names stand here, once more in hosts.check.js, and in no other file of
// the pad: whoever needs one takes it from here.
export const HOSTS = Object.freeze({
  map: 'wmts.geo.admin.ch',
  search: 'api3.geo.admin.ch',
  terrain: 'data.geo.admin.ch',
});
// The three as origins: whom a pad asks that asks swisstopo.
const SWISSTOPO = Object.freeze({
  map: `https://${HOSTS.map}`,
  search: `https://${HOSTS.search}`,
  terrain: `https://${HOSTS.terrain}`,
});
// A stand-in is a server of this machine: this address, and its port after it.
const STAND_IN = 'http://127.0.0.1:';
const LAST_PORT = 65_535;

/** The port that a text says - figures alone, 1 to 65535 - or null: none. */
function portOf(text) {
  const port = /^\d+$/.test(text) ? Number(text) : 0;
  return port >= 1 && port <= LAST_PORT ? port : null;
}
// A stand-in at a port of this machine, in the place of all three.
const standInOf = (port) => {
  const standIn = `${STAND_IN}${port}`;
  return { map: standIn, search: standIn, terrain: standIn };
};

// How much of what the map's page was told its line repeats, in characters.
const TOLD_SHOWN = 40;

/**
 * Whom the map's page asks, by one word of its own address (ST-041, T-041.2) - `query` is the
 * page's `location.search`, as a plain file server leaves it. No word `asks`: swisstopo, its
 * three origins. One word `asks` that is a port - figures alone, 1 to 65535, with no nought
 * before them - a stand-in at that port of this machine, in the place of all three. Anything else
 * - empty, a word, a host, two words `asks` - `{ refused }`, one sentence, with what the page was
 * told quoted, its words joined, cut to 40 characters. A port names this machine and no other:
 * no word of the address names a host.
 */
export function asksOf(query) {
  const told = new globalThis.URLSearchParams(String(query ?? '')).getAll('asks');
  if (told.length === 0) return SWISSTOPO;
  const port = told.length === 1 ? portOf(told[0]) : null;
  if (port !== null && String(port) === told[0]) return standInOf(port);
  const shown = JSON.stringify(Array.from(told.join(', ')).slice(0, TOLD_SHOWN).join(''));
  return {
    refused: `This page was told to ask ${shown}: a port of this machine, for a stand-in, or nothing, for swisstopo.`,
  };
}

/**
 * Whether an origin is one that the pad asks at all: `https://` and one of the three hosts, with
 * no port and nothing after it; or a stand-in's, this machine's address and a port, as `asksOf`
 * writes it. Every address below is built on such an origin or not at all, and the pad's door
 * lets nothing else through.
 */
export function mayAsk(origin) {
  if (typeof origin !== 'string') return false;
  if (Object.values(SWISSTOPO).includes(origin)) return true;
  // The port is asked first: written into a text, a port that is none is the word `null`, and an
  // origin that ends in that word would be the very text that it is held against.
  const port = portOf(origin.slice(STAND_IN.length));
  return port !== null && origin === `${STAND_IN}${port}`;
}

// One origin of whom a pad asks - or null: where it asks nobody, and for what may not be asked.
const originOf = (asks, which) => (mayAsk(asks?.[which]) ? asks[which] : null);

/**
 * The policy that the map's page puts into its own head, as a second <meta http-equiv=
 * "Content-Security-Policy"> - its first, in its markup, names no host (ST-041, T-041.2): a plain
 * file server sends no header. Nothing but what is named: scripts and stylesheets of the page's
 * own address, pictures from there and from the map service, requests to there, to the search
 * and to the terrain - each origin named once, so a stand-in's once in each place, and with
 * nobody neither. No style and no handler written into a tag, no form, no plugin, no base. And
 * no frame-ancestors: a <meta> cannot say it, and the browser says so on its console.
 */
export function policyOf(asks) {
  const beside = (...which) => {
    const named = which.map((one) => originOf(asks, one)).filter((origin) => origin !== null);
    return [...new Set(named)].map((origin) => ` ${origin}`).join('');
  };
  const parts = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    `img-src 'self'${beside('map')}`,
    `connect-src 'self'${beside('search', 'terrain')}`,
    "base-uri 'none'",
    "form-action 'none'",
  ];
  return parts.join('; ');
}

// The map, as the service's own list has it - read on 2026-10-13 at
// /EPSG/2056/1.0.0/WMTSCapabilities.xml of the map service, 1 823 427 bytes. One ladder of 29
// levels, 0 to 28, in LV95. A picture is 256 by 256 pixels. Every level begins at the sheet's top
// left corner, E 2 420 000, N 1 350 000, and covers the sheet: columns run east from there, and
// rows south.
export const TILE_PX = 256;
export const SHEET = Object.freeze({
  west: 2_420_000,
  east: 2_900_000,
  south: 1_030_000,
  north: 1_350_000,
});
// Metres a pixel, by level.
export const LEVELS = Object.freeze([
  4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250, 1000, 750, 650, 500, 250,
  100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25, 0.1,
]);

/**
 * How many pictures a level has across and down - `{ columns, rows }` - or null: no level. The
 * sheet's 480 000 m and 320 000 m over the 256 pixels of a picture at that level, rounded up:
 * which is what the service's list states for every level.
 */
export function matrixOf(level) {
  if (!Number.isInteger(level) || level < 0 || level >= LEVELS.length) return null;
  const count = (metres) => Math.ceil(metres / (TILE_PX * LEVELS[level]));
  return { columns: count(SHEET.east - SHEET.west), rows: count(SHEET.north - SHEET.south) };
}

// The layers that the page shows: each by its name at the service, with the ending of its
// pictures, the levels that it has, and the credits that it asks for wherever it shows -
// swisstopo's, by its terms for free geodata and geoservices, and for the cadastral map the
// cantons' beside it (cadastre.js says why).
const CREDIT = '© swisstopo';
const layer = (id, ending, to, ...beside) =>
  Object.freeze({ id, ending, from: 0, to, credits: Object.freeze([CREDIT, ...beside]) });

/**
 * The layers of a cadastre, as `CADASTRE` of cadastre.js has one, frozen: the national map and
 * the photo, and between them, where `cadastre` is not null, the cadastral map of its layer, its
 * ending and its last level, with both credits. Null: the two alone.
 */
export function layersOf(cadastre) {
  const national = layer('ch.swisstopo.pixelkarte-farbe', 'jpeg', 27);
  const photo = layer('ch.swisstopo.swissimage', 'jpeg', 28);
  if (cadastre === null) return Object.freeze({ national, photo });
  const { layer: id, ending, to, credit } = cadastre;
  return Object.freeze({ national, cadastral: layer(id, ending, to, credit), photo });
}
export const LAYERS = layersOf(CADASTRE);

// Three levels that the page goes by. From this one on the cadastral map shows in the place of
// the national map (cadastre.js says why) - null: at no level, where there is no cadastre.
export const CADASTRAL_FROM = CADASTRE === null ? null : CADASTRE.from;
// From this one on a click sets a corner: where a pixel is half a metre or less, a click is good
// to a quarter of a metre.
export const MARK_FROM = 26;
// And where the map goes for a place that was found: near enough to mark a corner at once.
export const FOUND_AT = 26;

// LV95, as the services name it: the frame of every picture, and of every place that is found.
export const LV95 = 2056;
const within = (figure, count) => Number.isInteger(figure) && figure >= 0 && figure < count;

/**
 * The address of one picture of the map - or null: no picture. `layer` is a name of `LAYERS`,
 * `level` a level that the layer has, `column` and `row` a picture within `matrixOf` of that
 * level, each a whole number: a text '26' is none.
 */
export function tileAddress(origin, layer, level, column, row) {
  const its = typeof layer === 'string' && Object.hasOwn(LAYERS, layer) ? LAYERS[layer] : null;
  const matrix = matrixOf(level);
  if (!mayAsk(origin) || its === null || matrix === null) return null;
  if (level < its.from || level > its.to) return null;
  if (!within(column, matrix.columns) || !within(row, matrix.rows)) return null;
  const picture = `${level}/${column}/${row}.${its.ending}`;
  return `${origin}/1.0.0/${its.id}/default/current/${LV95}/${picture}`;
}

// The words of a search: so many characters at the most, as a script counts them. And how many
// places an answer holds at the most.
export const SEARCH_MAX = 80;
export const PLACES_MOST = 10;

/**
 * The address of one search for a place - or null: no search. `words` are a text that is not
 * blank, of `SEARCH_MAX` characters at the most. They go into one value of the query, whatever
 * they hold: an `&`, a `#`, a second `sr=`. The places come back in LV95.
 */
export function searchAddress(origin, words) {
  const value = queryValueOf(words);
  if (!mayAsk(origin) || value === null) return null;
  const query = `searchText=${value}&type=locations&sr=${LV95}&limit=${PLACES_MOST}`;
  return `${origin}/rest/services/api/SearchServer?${query}`;
}

/** Words of a search as one value of a query - or null: blank, too long, or no text. */
export function queryValueOf(words) {
  if (typeof words !== 'string' || words.trim() === '' || words.length > SEARCH_MAX) return null;
  try {
    return encodeURIComponent(words);
  } catch {
    return null; // Half a sign of two halves: no text that an address can hold.
  }
}

// The name the three hosts share, as a plot's words say where a parcel came from (ST-043).
export const GEOPORTAL = 'geo.admin.ch';

// The terrain: swissALTI3D, a height every half metre, in tiles of a kilometre, each named by
// its year and by the kilometres of its south-west corner. Version 1 of the catalogue is asked,
// STAC 1.0.0 - not 0.9, which the parked product asks: both answered on 2026-10-13, and neither
// says that it is going. The address of a tile's file is built here and never taken from an
// answer: the catalogue says which year is the newest, and no more.
const MODEL = 'swissalti3d';
const COLLECTION = `ch.swisstopo.${MODEL}`;
const CATALOGUE = '/api/stac/v1';
const TILE_NAME = new RegExp(`^${MODEL}_[1-9]\\d{3}_[1-9]\\d{3}-[1-9]\\d{3}$`);
const isTileName = (name) => typeof name === 'string' && TILE_NAME.test(name);
const fourFigures = (figure) => Number.isInteger(figure) && figure >= 1000 && figure <= 9999;

/** The name of a tile - or null: `year`, `eastKm` and `northKm` are each four figures. */
export const tileName = (year, eastKm, northKm) =>
  [year, eastKm, northKm].every(fourFigures) ? `${MODEL}_${year}_${eastKm}-${northKm}` : null;

/** The address of the catalogue's entry for the model - or null: no origin to ask. */
export const collectionAddress = (origin) =>
  mayAsk(origin) ? `${origin}${CATALOGUE}/collections/${COLLECTION}` : null;

/**
 * The address that asks the catalogue for tiles by their names - or null: `names` is a list of
 * one name or more, each a name that `tileName` gives.
 */
export function itemsAddress(origin, names) {
  const all = Array.isArray(names) ? Array.from(names) : [];
  if (!mayAsk(origin) || all.length === 0 || !all.every(isTileName)) return null;
  return `${origin}${CATALOGUE}/search?collections=${COLLECTION}&ids=${all.join(',')}`;
}

/** The address of a tile's file, its heights at half a metre in LV95 and LN02 - or null. */
export const fileAddress = (origin, name) =>
  mayAsk(origin) && isTileName(name)
    ? `${origin}/${COLLECTION}/${name}/${name}_0.5_${LV95}_5728.tif`
    : null;
