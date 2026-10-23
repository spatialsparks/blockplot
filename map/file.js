// New plot's part "From a file" (ST-045, T-045.5): a GeoJSON file of the plot's outline, chosen,
// or pasted into the box, read in this page and taken onto the marks as a parcel's is - its
// corners in the place of every corner marked, and the map gone to them. What the file is read
// into, or refused in, is new-plot/geojson.js's; whose the corners then are, marking.js's. The
// page's wiring, with no check of its own, as map.js and marks.js have none: the story's browser
// test presses it, tests/e2e/sketch-new-plot-file.spec.ts. Nothing of the file is kept, held in
// the browser's store or sent: this module asks nobody.
import { FILE_MAX_BYTES, SAID as READ, outlineOf } from '../new-plot/geojson.js';
import { goesTo } from './view.js';

const { document } = globalThis;

// What the part says of its own, each sentence written here once: the rest is the reader's.
const SAID = Object.freeze({
  first:
    'Choose a GeoJSON file of your plot, or paste one: it is read in this page, and nothing of it is sent.',
  unread: 'The file could not be read in this browser.',
});

/**
 * Opens the file's part of the plot's side: `#file-choose`, `#file-text`, `#file-take` - put on
 * here - and `#file-said`. `map` is what map.js gave, `marks` what marks.js gave. The one given
 * last is the one taken: a file chosen empties the box, and a letter typed or pasted into the
 * box lets the file chosen go. "Take the outline" reads it - while one is read, a press does
 * nothing - and what is refused is said, with nothing changed; what is taken goes onto the marks
 * by `marks.takeFile`, and the map goes to it. Pressed again, it is read and taken again.
 */
export function openFile(map, marks) {
  const $ = (id) => document.getElementById(id);
  const [choose, box, take, said] = ['file-choose', 'file-text', 'file-take', 'file-said'].map($);
  let reading = false;

  /** The text given: the file chosen, read - or why not, a file too large not read - or the box's. */
  async function given() {
    const [file] = choose.files ?? [];
    if (file === undefined) return { text: box.value };
    if (file.size > FILE_MAX_BYTES) return { refused: READ.large };
    try {
      return { text: await file.text() };
    } catch {
      return { refused: SAID.unread };
    }
  }
  /** The text given, read and taken onto the marks - or the sentence of why not, nothing changed. */
  async function taken() {
    const text = await given();
    const read = text.refused === undefined ? outlineOf(text.text) : text;
    if (read.refused !== undefined) return read.refused;
    const refused = marks.takeFile(read.corners, { wgs84: read.wgs84 });
    if (refused !== '') return refused;
    const { e, n, level } = goesTo(read.corners, map.view());
    map.goTo({ e, n }, level);
    return read.said;
  }

  choose.addEventListener('change', () => {
    if (choose.files?.length > 0) box.value = '';
  });
  box.addEventListener('input', () => {
    choose.value = '';
  });
  take.addEventListener('click', async () => {
    if (reading) return;
    reading = true;
    try {
      said.textContent = await taken();
    } finally {
      reading = false;
    }
  });
  said.textContent = SAID.first;
  take.disabled = false;
}
