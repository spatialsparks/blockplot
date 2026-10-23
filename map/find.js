// Find, on the page of a new plot (ST-031): a place found by its words, and the map goes there.
// The owner types an address or a place and presses Enter; the federal search is asked once, and
// the places that it found are listed by their names; a pick takes the map to the place, near
// enough to see the parcels. Nothing is asked while a word is typed, and no second search while
// one is asked - and one that gets no answer is given up after a while. A search is asked as
// another site's page asks - with this page's origin, and with no cookie and no referrer - at the
// address that searchAddress builds, and at no other. What the service says - the name of a
// place, the words of a failure - is shown as text and never as markup, without its tags, and cut
// to a length. First what is asked and what is said of the answer, with nothing of the page in it
// - find.check.js asks it; then the form and the list, which a browser test presses:
// tests/e2e/sketch-map-find.spec.ts.
import { FOUND_AT, PLACES_MOST, SEARCH_MAX, SHEET, searchAddress } from '../swisstopo/hosts.js';

const { document, fetch, AbortSignal } = globalThis;

// How much of a place's name shows, and of the words of a failure, in characters - whole ones: a
// character of two halves is one, and is shown whole or not at all.
export const NAME_SHOWN = 120;
const SAID_SHOWN = 200;
// How long a search is waited for, in milliseconds: twenty seconds, for all of its answer. Find
// takes no second search while one is asked, so a search that never ended would hold it until
// the page was loaded anew. The search answers in a second or not at all: by then the request is
// given up - itself, not the waiting alone - and Find says that the search does not answer.
export const FIND_MS = 20_000;
// A tag is what opens and closes with nothing opening in between: read in one pass, however
// long the words are and whatever opens in them and never closes (ADR-0043).
const TAG = /<[^<>]*>/g;
// What takes no room is left out; a blank is whatever a line shows as one, or does not show.
const [NO_ROOM, BLANKS] = [/\p{Cf}/gu, /[\s\p{Cc}]+/gu];
// How a search is asked: no cookie goes with it, and it does not say where it came from.
const HOW = Object.freeze({ credentials: 'omit', referrerPolicy: 'no-referrer' });
// What is said, each sentence written here once.
const NOT_COME = "The search did not come: swisstopo's search";
const SAID = {
  type: 'Type an address or a place, and press Enter.',
  long: `A search has ${SEARCH_MAX} characters at the most.`,
  found: (count) => `${count} place${count === 1 ? '' : 's'}. Pick one, and the map goes there.`,
  none: (words) => `Nothing was found for "${words}".`,
  silent: `${NOT_COME} does not answer.`,
  refused: (status, words) => `${NOT_COME} answered ${status}.${words && ` It said: ${words}`}`,
  unread: `${NOT_COME} answered what cannot be read.`,
};

/**
 * The words of a service, as the page shows them: every tag taken out, what takes no room left
 * out, blanks that follow each other made one and none left at either end, and cut to `most`
 * characters, whole ones, with `…` after them where they were cut.
 */
export function wordsOf(text, most) {
  const words = text.replace(TAG, '').replace(NO_ROOM, '').replace(BLANKS, ' ').trim();
  const whole = Array.from(words);
  return whole.length > most ? `${whole.slice(0, most).join('')}…` : words;
}

const between = (figure, least, most) =>
  Number.isFinite(figure) && figure >= least && figure <= most;
const onSheet = (e, n) =>
  between(e, SHEET.west, SHEET.east) && between(n, SHEET.south, SHEET.north);

/**
 * The places of an answer of the search - each `{ name, e, n }`, `PLACES_MOST` of them at the
 * most, in the answer's order - or null: the answer cannot be read. A place's name is its
 * `label` as `wordsOf` shows it. **Its `y` is the easting and its `x` the northing**, in LV95,
 * as the search has them; a place whose two figures are no numbers on the sheet of the map, or
 * that has no name, is left out.
 */
export function placesOf(text) {
  let results = null;
  try {
    ({ results } = Object(JSON.parse(text)));
  } catch {
    // No JSON: no list, as of an answer that holds none.
  }
  if (!Array.isArray(results)) return null;
  const places = [];
  for (const result of results) {
    const { label, x, y } = Object(Object(result).attrs);
    const name = typeof label === 'string' ? wordsOf(label, NAME_SHOWN) : '';
    if (name !== '' && onSheet(y, x)) places.push({ name, e: y, n: x });
    if (places.length === PLACES_MOST) break;
  }
  return places;
}

// Whether a search is asked and not yet answered.
let asking = false;

/**
 * One search - `{ places, said }`: the places that were found, and the sentence that stands
 * with them - or null, where a search is asked already: nothing is asked then, and nothing
 * said. `origin` is the search's, as the pad's server told the page; `typed` is what stands in
 * the field, and is asked for without the blanks at its ends. Words that are none, or too many,
 * are said and not asked. A search has `ms` milliseconds for all of its answer, `FIND_MS` unless
 * a check hands over fewer: then the request is given up, and the service does not answer.
 */
export async function search(origin, typed, ms = FIND_MS) {
  if (asking) return null;
  const words = typed.trim();
  const nothing = (said) => ({ places: [], said });
  if (words.length > SEARCH_MAX) return nothing(SAID.long);
  const address = searchAddress(origin, words);
  if (address === null) return nothing(SAID.type);
  asking = true;
  // The clock of this search: at its end the request is given up, wherever it then stands.
  const clock = AbortSignal.timeout(ms);
  try {
    const answer = await fetch(address, { ...HOW, signal: clock }).catch(() => null);
    if (answer === null) return nothing(SAID.silent);
    const text = await answer.text().catch(() => null);
    // An answer that the clock cut off is none, whatever it began with.
    if (text === null && clock.aborted) return nothing(SAID.silent);
    if (answer.status !== 200) {
      return nothing(SAID.refused(answer.status, wordsOf(text ?? '', SAID_SHOWN)));
    }
    const places = text === null ? null : placesOf(text);
    if (places === null) return nothing(SAID.unread);
    if (places.length === 0) return nothing(SAID.none(words));
    return { places, said: SAID.found(places.length) };
  } finally {
    asking = false;
  }
}

/**
 * Opens Find on the page: the form `#find` with its field `#find-words`, the list `#places` -
 * a button a place, its name set as text - and the sentence `#find-said`. `origin` is the
 * search's; `map` is what map.js gave: a pick goes to the place at `FOUND_AT`, and marks its
 * button.
 */
export function openFind(origin, map) {
  const $ = (id) => document.getElementById(id);
  const [form, field, list, said] = ['find', 'find-words', 'places', 'find-said'].map($);
  const entry = (place) => {
    const one = document.createElement('button');
    one.textContent = place.name;
    one.addEventListener('click', () => {
      map.goTo(place, FOUND_AT);
      for (const other of list.children) other.removeAttribute('aria-current');
      one.setAttribute('aria-current', 'true');
    });
    return one;
  };
  said.textContent = SAID.type;
  // The form is heard, and sent nowhere: the page's policy lets no form go anywhere either.
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const found = await search(origin, field.value);
    if (found === null) return;
    list.replaceChildren(...found.places.map(entry));
    said.textContent = found.said;
  });
}
