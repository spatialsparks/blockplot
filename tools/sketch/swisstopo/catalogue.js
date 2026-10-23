// Which state of a tile is the newest (ST-031): what the catalogue of swisstopo's downloads says
// of swissALTI3D, read - with nothing asked in it. The catalogue lists the model as a collection
// of items, one for a square kilometre in the state of one year, and names an item after both:
// `swissalti3d_2025_2600-1200`. It is asked for items by their names - every year that the
// collection has, for every tile - so that no position leaves LV95 (directive 35). It is the
// parked product's packages/adapters/src/geodata/terrain/catalogue.ts, written anew as the pad's
// for version 1 of the catalogue, which says `gsd` where version 0.9 says `eo:gsd` - and with one
// thing the other way round: the address of a tile's file is built by hosts.js, never taken from
// an answer, and the link that an item lists is held against it (rule 1). catalogue.check.js
// holds it, on two answers of the real catalogue among others.
import { CELL_M, LV95_EPSG } from './grid.js';
import { HOSTS, collectionAddress, fileAddress, tileName } from './hosts.js';

/**
 * The most years that the collection's span of time may hold. The catalogue is asked for every
 * name that a tile could have in them, so the span makes the length of that request: four tiles
 * in a span from the year 1000 to 9999 are a request of nearly a million characters. The span
 * stated 8 years when it was read, 2019 to 2026, and grows by one a year; 50 let it grow until
 * 2068, and keep the request for nine tiles to 450 names. Why 50: ADR-0048.
 */
export const MAX_YEARS = 50;

// The first year that a tile can be named after: `tileName` of hosts.js takes four figures.
const FIRST_YEAR = 1000;
// The kind of file that is read: a GeoTIFF whose directory comes first, to be read in parts.
const CLOUD_OPTIMISED_GEOTIFF = 'image/tiff; application=geotiff; profile=cloud-optimized';
// How much of a word of an answer a refusal repeats.
const REPEATED_CHARACTERS = 60;

// Where the pad asks swisstopo for the terrain: put together here to read off it what hosts.js
// builds there - the name of the collection, and the path of a tile's file - and never asked.
const AT = `https://${HOSTS.terrain}`;
const COLLECTION = collectionAddress(AT).split('/').at(-1);
const pathOf = (name) => fileAddress(AT, name).slice(AT.length);

function refuse(reason) {
  throw new Error(reason);
}

/**
 * What was found, as a refusal says it: the beginning of a text is quoted, with every sign that
 * is no plain letter, figure or mark written out by its number - so none of it steers a terminal -
 * and anything else is named by its kind.
 */
function found(value) {
  if (typeof value === 'string') {
    return JSON.stringify(value.slice(0, REPEATED_CHARACTERS)).replace(
      /[^\x20-\x7e]/g,
      (sign) => `\\u${sign.charCodeAt(0).toString(16).padStart(4, '0')}`,
    );
  }
  if (value === undefined) return 'missing';
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return Array.isArray(value) ? 'a list' : 'an object';
}

function record(value, where) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    refuse(`${where} must be an object, and is ${found(value)}`);
  }
  return value;
}

function list(value, where) {
  if (!Array.isArray(value)) refuse(`${where} must be a list, and is ${found(value)}`);
  return value;
}

/** The year of a day as the catalogue writes one, "2019-01-01T00:00:00Z" - or that it is none. */
function yearOf(day) {
  const written = typeof day === 'string' ? /^(\d{4})-\d{2}-\d{2}T/.exec(day) : null;
  return written === null ? undefined : Number(written[1]);
}

/**
 * The years that the collection says its items are of - `{ first, last }`, both included: the
 * first and the last year of the one span of time that it states, `extent.temporal.interval`. A
 * span that is open at either end is refused, and so are another collection, a span of more than
 * `MAX_YEARS` years, and one that begins before the year 1000: a tile is named by four figures.
 */
export function readYears(collection) {
  const answer = record(collection, 'the collection');
  if (answer.id !== COLLECTION) refuse(`it is the collection ${found(answer.id)}`);
  const temporal = record(record(answer.extent, '"extent"').temporal, '"extent.temporal"');
  const spans = list(temporal.interval, '"extent.temporal.interval"');
  const [from, to, ...more] = list(spans[0], 'the span of time of the collection');
  const [first, last] = [yearOf(from), yearOf(to)];
  const isOne = spans.length === 1 && more.length === 0;
  if (!isOne || first === undefined || last === undefined || first > last) {
    refuse(
      `it has to state one span of time, from a day to a later day, and states ${spans.length}, the first from ${found(from)} to ${found(to)}`,
    );
  }
  if (last - first + 1 > MAX_YEARS) {
    refuse(
      `its span of time holds the ${last - first + 1} years from ${first} to ${last}, and ${MAX_YEARS} are read at most`,
    );
  }
  if (first < FIRST_YEAR) {
    refuse(
      `its span of time begins in the year ${first}, and a tile is named by a year of four figures`,
    );
  }
  return { first, last };
}

/** The names to ask for, each with its tile and its year: tile by tile, and the years upward. */
function candidates(tiles, years) {
  const names = new Map();
  for (const tile of tiles) {
    for (let year = years.first; year <= years.last; year += 1) {
      names.set(tileName(year, tile.eastKm, tile.northKm), { tile, year });
    }
  }
  return names;
}

/**
 * Every name that a tile of `tiles` could have in `years`, by `tileName` of hosts.js: tile by
 * tile, and the years upward. `tiles` are each `{ eastKm, northKm }`, `years` `{ first, last }`.
 */
export const namesOf = (tiles, years) => [...candidates(tiles, years).keys()];

/**
 * The newest state of each tile, out of the catalogue's answer to `namesOf(tiles, years)` - for
 * each tile, in their order, `{ tile, name, year }`: of the items that the answer lists for it,
 * the one of the latest year. That item has to have one file that is a cloud-optimised GeoTIFF of
 * 0.5 m cells in LV95, and its link has to end in the path that hosts.js builds for that name:
 * the file is asked for there, whatever the link says. Refused: an answer that was cut short, an
 * item that was not asked for or is listed twice, a tile without an item, a newest item without
 * that file or with two, and a file that does not lie where the pad asks for it.
 */
export function readNewest(answer, tiles, years) {
  const search = record(answer, 'the answer');
  const isNext = (link) => record(link, 'a link').rel === 'next';
  if (list(search.links, '"links"').some(isNext)) {
    refuse('it is only the first part of the items, with a link to the next');
  }

  const asked = candidates(tiles, years);
  const newest = new Map();
  const listed = new Set();
  for (const feature of list(search.features, '"features"')) {
    const item = record(feature, 'an item');
    const { id } = item;
    const its = asked.get(id);
    if (its === undefined || item.collection !== COLLECTION) {
      refuse(
        `it lists ${found(id)} of the collection ${found(item.collection)}, which was not asked for`,
      );
    }
    // Two items of one name are two answers to one question: neither is taken over the other.
    if (listed.has(id)) refuse(`it lists ${found(id)} twice`);
    listed.add(id);
    if (its.year > (newest.get(its.tile)?.year ?? -Infinity)) {
      newest.set(its.tile, { name: id, year: its.year, item });
    }
  }

  return tiles.map((tile) => {
    const latest = newest.get(tile);
    if (latest === undefined) {
      refuse(
        `swissALTI3D has no tile for the square kilometre at E ${tile.eastKm} km, N ${tile.northKm} km`,
      );
    }
    const { name, year, item } = latest;
    const files = Object.values(record(item.assets, `"assets" of ${name}`))
      .map((file) => record(file, `a file of ${name}`))
      .filter(
        (file) =>
          file.type === CLOUD_OPTIMISED_GEOTIFF &&
          file.gsd === CELL_M &&
          file['proj:epsg'] === LV95_EPSG,
      );
    if (files.length !== 1) {
      refuse(
        `${name} has to have one file of ${CELL_M} m cells in EPSG:${LV95_EPSG} that is a cloud-optimised GeoTIFF, and has ${files.length}`,
      );
    }
    // Held against the address that the pad builds, and never asked: a link that is another is a
    // refusal, not a request.
    const { href } = files[0];
    if (typeof href !== 'string' || !href.endsWith(pathOf(name))) {
      refuse(`the file of ${name} does not lie where the pad asks for it, but at ${found(href)}`);
    }
    return { tile, name, year };
  });
}
