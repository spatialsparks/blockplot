// The name of a new plot, and its making (ST-031; in the page since ST-041, T-041.3): the owner
// names the plot that is marked and presses "Make the plot". Where the browser takes folders the
// folder that the plot is to lie in is picked first, while the press still lets the page ask for
// one; then the page asks swisstopo - its `terrain` - for the ground under the plot, through the
// pad's one door, and makes the plot as the server made it (`plotMadeOf` of
// ../new-plot/making.js). The plot made is written as a folder of its own into the folder picked
// (`makeIn` of ../store/ways.js), else offered as its file, plot.json, to save; it is held in the
// browser's store, noted as the tab's plot and the last, and the pad's own page opens on it. The
// page says the folder that a name will get with nothing asked - `freeOf(folderOf(name), [])` of
// new-plot/request.js, at every letter - and what is refused of a paper first, in the same
// sentence, with nothing asked. It asks the pad's server nothing. First what is decided and said,
// with nothing of the page in it - make.check.js holds it; then the name, the button and what
// they say, which a browser test presses: tests/e2e/sketch-new-plot-made.spec.ts.
import { plotMadeOf } from '../new-plot/making.js';
import { NAME_MAX, SAID as MAKING, folderOf, freeOf } from '../new-plot/request.js';
import { read } from '../plot-file.js';
import { held, hold } from '../store/held.js';
import { dayOf, LAST, recordOf, TAB, WAYS } from '../store/rules.js';
import { makeIn, namesIn, pickFolder, takesFolders } from '../store/ways.js';
import { MARKED } from './marks.js';

const { document, location, Blob, URL } = globalThis;

// The pad's own page, from where the map's page is: so a pad served under a path of its own
// finds it too.
const PAD = '../';
// The file that a plot made is offered as, where it lies in no folder: a plot's folder holds it
// under this name, and File, "Open plot" opens it.
const OFFERED = 'plot.json';
// How much of a sentence of the making shows, in characters - whole ones: a character of two
// halves is one, and is shown whole or not at all.
const SAID_SHOWN = 400;
// What is said, each sentence written here once.
const NOT_MADE = 'The plot was not made: ';
export const SAID = Object.freeze({
  folder: (folder) => `It will lie in the folder "${folder}".`,
  fetching:
    'The ground is being fetched from swisstopo, and the plot is made of it: this takes a few seconds.',
  unpicked: 'No folder was picked: nothing was asked, and nothing made.',
  unheldIn: (id) =>
    `The plot was made, in the folder "${id}" of the folder that was picked, and this browser did not keep it: back in the pad, File, "Open plot", "A plot's folder" opens it.`,
  unheldFile: `The plot was made, and this browser did not keep it: its file is offered to save, as ${OFFERED}, which File, "Open plot" opens back in the pad.`,
  left: (why, id) =>
    `The plot could not be written: ${why} Something of it may be left in the folder "${id}".`,
});

/**
 * What the page says of a plot that was not made: `The plot was not made: ` and the sentence, of
 * which `SAID_SHOWN` characters show, with `…` after them where it was cut.
 */
export function notMade(sentence) {
  const words = Array.from(String(sentence).trim());
  const shown = words.length > SAID_SHOWN ? [...words.slice(0, SAID_SHOWN), '…'] : words;
  return `${NOT_MADE}${shown.join('')}`;
}

/** What the browser said, as a sentence: with a full stop after it, where it ends with none. */
const ended = (words) => (words.endsWith('.') ? words : `${words}.`);

/**
 * What the page says where the plot's folder could not be made: what the browser said, and that
 * nothing of it was left - or, where `makeIn` could not take away what it began (`left`), that
 * something may be.
 */
export function unwritten(error, id) {
  const why = ended(String(error?.message ?? error));
  return notMade(error?.left === true ? SAID.left(why, id) : MAKING.disk(why));
}

/**
 * The id that a plot made gets: `freeOf` of its folder, free of every id that this browser holds
 * and every name that lies in the folder picked - so it takes no name of either, and two plots of
 * one name are two plots, `Trial slope` and `Trial slope-2`. Never `home` or `example`.
 */
export const idOf = (folder, heldIds, names = []) => freeOf(folder, [...heldIds, ...names]);

/**
 * What the page says of the folder that a name will get - or nothing, of a name that is none.
 * The folder is the making's own rule's, with no folder known to be taken: the folder of the
 * name, and with a figure after it where it is one of the pad's own two. Where a held plot or
 * the folder picked has it, the plot gets the next figure at the press.
 */
export function lying(name) {
  const given = name.trim();
  return given === '' ? '' : SAID.folder(freeOf(folderOf(given), []));
}

/** A plot's file offered to save, by a link of a `Blob`'s address - as files.js offers a sketch. */
function offer(text) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  link.download = OFFERED;
  link.click();
  globalThis.setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
}

/** The ids that this browser holds - none, where its store cannot be read. */
const heldIds = () =>
  held().then(
    (all) => all.map((one) => one.id),
    () => [],
  );

/**
 * The plot made into the folder picked, under the first id that is free there: its folder's
 * handle - or `{ said }`, where the browser refused to make it. A name that turns out taken after
 * all gets the next figure.
 */
async function madeIn(picked, made, ids) {
  const names = await namesIn(picked);
  for (;;) {
    const id = idOf(made.folder, ids, names);
    const put = await makeIn(picked, id, made.text).catch((error) => ({ error }));
    if (put.error !== undefined) return { said: unwritten(put.error, id) };
    if (put.folder !== undefined) return { id, folder: put.folder };
    names.push(id);
  }
}

/**
 * The plot of an order, made: null, where it is made and held - or what the page says. `say`
 * shows a sentence meanwhile. In this order: the folder picked, where the browser takes folders
 * - shut, nothing is asked; the ground asked and the plot made (`plotMadeOf`), refused in its
 * sentence; the id, free of the held plots and of the folder's names; the plot's folder made in
 * the folder picked - else its file offered; then held, and noted for the tab and as the last.
 * Nothing is picked into, held or offered before the ground has come: a page that is left
 * meanwhile keeps nothing.
 */
async function madeOf(order, terrain, say) {
  const picked = takesFolders() ? await pickFolder() : undefined;
  if (picked === null) return SAID.unpicked;
  say(SAID.fetching);
  const day = dayOf(new Date());
  const made = await plotMadeOf(JSON.stringify(order), { origin: terrain, day });
  if (made.refused !== undefined) return notMade(made.refused);
  const { site } = read(made.text);
  if (site === undefined) return notMade('The plot made does not read.');
  const ids = await heldIds();
  const lies = picked === undefined ? { id: idOf(made.folder, ids), folder: null } : null;
  const { id, folder, said } = lies ?? (await madeIn(picked, made, ids));
  if (said !== undefined) return said;
  if (folder === null) offer(made.text);
  const way = folder === null ? WAYS.file : WAYS.folder;
  try {
    await hold(recordOf({ id, site, text: made.text, way, folder, day }));
    globalThis.sessionStorage.setItem(TAB, id);
    globalThis.localStorage.setItem(LAST, id);
  } catch {
    return folder === null ? SAID.unheldFile : SAID.unheldIn(id);
  }
  return null;
}

/**
 * Opens the naming and the making on the page, in `#plot`: the field `#name`, the sentence
 * `#folder`, the button `#make` in the form `#naming`, and `#make-said`. `marks` is what
 * marks.js gave: the plot that is marked, and its order; `terrain` whom the ground is asked of.
 * The button is off until there are three corners and a name, and while a plot is being made -
 * so a second press, and Enter in the field, do nothing meanwhile. Made and held, the page goes
 * to the pad's own page, in its own place.
 */
export function openMake(marks, terrain) {
  const $ = (id) => document.getElementById(id);
  const [form, name, folder, button] = ['naming', 'name', 'folder', 'make'].map($);
  const [said, side] = ['make-said', 'plot'].map($);
  let making = false;
  name.maxLength = NAME_MAX;

  /** The folder that the name will get, and whether the button can be pressed. */
  function show() {
    folder.textContent = lying(name.value);
    button.disabled = making || name.value.trim() === '' || marks.read().paper === null;
    Object.assign(document.body.dataset, { folder: folder.textContent, making });
  }
  /** The plot or its name changed: what was said of the last press holds no longer. */
  function changed() {
    if (!making) said.textContent = '';
    show();
  }
  name.addEventListener('input', changed);
  side.addEventListener(MARKED, changed);
  // The form is heard, and sent nowhere: the page's policy lets no form go anywhere either.
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    const { paper } = marks.read();
    if (paper.refused !== undefined) {
      said.textContent = paper.refused;
      return;
    }
    making = true;
    show();
    const say = (sentence) => (said.textContent = sentence);
    const sentence = await madeOf(marks.order(name.value.trim()), terrain, say).catch((error) =>
      notMade(String(error?.message ?? error)),
    );
    if (sentence === null) {
      // In this page's place: a step back from the plot is the page that led to the map, and
      // not a map whose marks are gone - or one that still says that the ground is fetched.
      location.replace(PAD);
      return;
    }
    making = false;
    said.textContent = sentence;
    show();
  });
  show();
}
