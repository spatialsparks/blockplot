// The switch of swisstopo's map under the top view (ST-046, T-046.3): the control "Map" in the
// toolbar's View group - a switch, off when a pad opens; a choice of the layers of `LAYERS`, the
// aerial photo first, which is a menu as File is - a button that says the chosen map and opens
// an entry a layer (views.menu), and no <select>, which the header never holds; and a slider of how strongly the map shows, 0 to 100 %, 50 at first. It
// sets the flag that lay.js reads, `globalThis.under` - `on`, `layer`, `strength` - and has the
// page drawn anew. It shows in the top view alone, and only where the page offers the map
// (`under.offered`): in a slice, on the made-up pad and in a page told no stand-in where the pad
// offers no New plot, it stays hidden. On a plot with no place on swisstopo's map it is there but
// cannot be turned on, and says why (`NO_PLACE` of place.js).
//
// KEPT FOR THE TAB, AND NOWHERE ELSE (story, rule 3). What the control says is kept in the tab's
// sessionStorage under a key of its own, `KEY`, as each change is made, and read back as the page
// opens: through a reload and a switch of view, never in a new tab. Not in the tab's `seen` of
// views.js, which is a plot's - a plot opened while the map is on keeps it on, under its own
// place. Nothing of it goes into the sketch, the plot, a kept sketch or the browser's store.
// What is read back is held to what the tree has: a layer that it lacks - the cadastral map in
// Blockplot's tree - is the photo, a strength that is no figure from 0 to 1 is held to them.
// switch.check.js holds every decision. A module, loaded right after lay.js: it imports lay.js,
// which the page has already, and hosts.js; place.js only where the map is offered, for the
// made-up pad serves nothing of map/.
import { LAYERS } from '../swisstopo/hosts.js';
import { FIRST, strengthOf } from './lay.js';

// Where the tab keeps the control's three settings.
export const KEY = 'blockplot/sketch/under';
// What the choice calls each layer; a layer of no name here is called by its own.
export const NAMES = Object.freeze({
  national: 'National map',
  cadastral: 'Cadastral map',
  photo: 'Aerial photo',
});
// What the control says where it can be turned on.
export const TITLE = "swisstopo's map under the paper, to trace what stands on the plot";

/** The choices of map, in the order of `layers`: each its name in `LAYERS` and its words. */
export const choicesOf = (layers) =>
  Object.keys(layers).map((id) => ({ id, name: Object.hasOwn(NAMES, id) ? NAMES[id] : id }));

/** The slider's figure, a whole per cent from 0 to 100, of a strength. */
export const percentOf = (strength) => Math.round(strengthOf(strength) * 100);

/** The strength of the slider's figure, a text as an <input> gives it: held to 0 to 1. */
export const strengthOfPercent = (value) =>
  strengthOf(typeof value === 'string' && value.trim() !== '' ? Number(value) / 100 : NaN);

/** What the tab keeps of the flag: its three settings, as a text, and nothing else. */
export const keptOf = ({ on, layer, strength }) =>
  JSON.stringify({ on: on === true, layer, strength: strengthOf(strength) });

/**
 * The three settings read back from what the tab kept, `text`, for a tree of `layers`: on only
 * where it says so; a layer of `layers`, else `FIRST`'s, the photo; a strength from 0 to
 * 1, else half. Nothing kept, or a text that is no such thing, is `FIRST`.
 */
export function readOf(text, layers) {
  let kept;
  try {
    kept = JSON.parse(text);
  } catch {
    return { ...FIRST };
  }
  if (kept === null || typeof kept !== 'object' || Array.isArray(kept)) return { ...FIRST };
  const { on, layer, strength } = kept;
  return {
    on: on === true,
    layer: typeof layer === 'string' && Object.hasOwn(layers, layer) ? layer : FIRST.layer,
    strength: strengthOf(strength),
  };
}

/** The page's part: the control set from what the tab kept, and the flag set from the control. */
function openSwitch() {
  const { document, sessionStorage, paper, under } = globalThis;
  const $ = (id) => document.getElementById(id);
  const control = $('under-control');
  const ids = ['under-on', 'under-layer', 'under-layers', 'under-strength'];
  const [on, layer, entries, strength] = ids.map($);
  let kept = null;
  try {
    kept = sessionStorage.getItem(KEY);
  } catch {
    // Nothing read: the control is as it is when a pad opens.
  }
  Object.assign(under, readOf(kept, LAYERS));
  // The choice of map is a menu, as File is (views.js), and no list: the header holds none
  // (gallery-text.check.js). Its button says the chosen map; its part has an entry a layer.
  const choices = choicesOf(LAYERS).map(({ id, name }) => {
    const one = Object.assign(document.createElement('button'), { type: 'button' });
    one.textContent = name;
    one.setAttribute('role', 'menuitemradio');
    return { id, name, one };
  });
  entries.replaceChildren(...choices.map(({ one }) => one));
  globalThis.views.menu(layer, entries);
  const show = () => {
    on.checked = under.on;
    for (const { id, name, one } of choices) {
      one.setAttribute('aria-checked', String(id === under.layer));
      if (id === under.layer) layer.textContent = name;
    }
    strength.value = String(percentOf(under.strength));
    strength.setAttribute('aria-valuetext', `${strength.value} %`);
    strength.title = `The map shows at ${strength.value} %`;
  };
  show();
  /** A change of the control: the flag set, kept for the tab, and the page drawn anew. */
  const changed = (what) => () => {
    Object.assign(under, what());
    try {
      sessionStorage.setItem(KEY, keptOf(under));
    } catch {
      // Not kept: the page opens with the map off.
    }
    show();
    globalThis.zoom.onChange();
  };
  on.addEventListener(
    'change',
    changed(() => ({ on: on.checked })),
  );
  for (const { id, one } of choices)
    one.addEventListener(
      'click',
      changed(() => ({ layer: id })),
    );
  strength.addEventListener(
    'input',
    changed(() => ({ strength: strengthOfPercent(strength.value) })),
  );
  if (paper.PLANE !== 'top') return;
  under.offered.then(async (offered) => {
    if (!offered) return;
    const { NO_PLACE, underOf } = await import('./place.js');
    const none = { px: 1, left: 0, top: 0 };
    const refused = underOf(globalThis.SITE, none, { wide: 1, high: 1 }).refused !== undefined;
    for (const one of [on, layer, strength]) one.disabled = refused;
    control.title = refused ? NO_PLACE : TITLE;
    control.hidden = false;
  });
}

if (globalThis.document?.getElementById('under-control') && globalThis.under) openSwitch();
