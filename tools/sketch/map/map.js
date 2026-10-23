// The map on the page of a new plot (ST-031): swisstopo's map in LV95, at the levels of the map
// service's own ladder - brought nearer and taken further, a level at a time, and moved. One
// layer shows at a time (view.js): the national map from afar, the cadastral map from near, and
// the aerial photo at a switch, each with the credits that it asks for, on the map. A picture is
// an <img> at the address that tileAddress builds, and nothing else: none is drawn into a canvas,
// kept in a store or handed to the pad's server. It is asked for as another site's page asks -
// with this page's origin, and with no cookie and no referrer. Pictures are asked for when the
// view rests, and a drag asks at its end: those of the view that shows, and no other - none
// around it, and none of the next level (ST-031, rule 9). A browser test holds all of it:
// tests/e2e/sketch-map.spec.ts.
import { LAYERS, tileAddress } from '../swisstopo/hosts.js';
import { first, held, moved, pictures, placeAt, showing, stepped } from './view.js';

const { document, setTimeout, clearTimeout, ResizeObserver, CustomEvent } = globalThis;

// How long a view rests before its pictures are asked for, in milliseconds: the levels that a
// wheel turns through, and the views between two keys, are not asked for.
export const REST_MS = 150;
// How far the pointer may go between down and up and still have clicked, in pixels: further,
// and it dragged the map.
export const CLICK_PX = 4;
// The two words of the map, each an event of `#map`: the view changed, its `detail` the view
// with the pixels of its place; and the map was clicked and not dragged, its `detail` the place
// under the pointer.
export const CHANGED = 'mapview';
export const CLICKED = 'mapclick';
// What is said where a picture did not come.
const NOT_COME =
  "A picture of the map did not come: swisstopo's map service does not answer, or answered what is no picture. What shows, goes on showing.";

/**
 * Opens the map in `#map`, on the origin of the map service that the pad's server told the page.
 * It gives the scripts after it: `view()`, the view with the pixels of its place - `{ level, e,
 * n, wide, high }`; `placeAt([x, y])`, the place under a pixel of the map, `{ e, n }`; `goTo({ e,
 * n }, level)`; `shows()`, the layer that shows, a name of `LAYERS`; and `say(words)`, a sentence
 * of theirs on the map, in `#said` - before the map's own - until they say another, or none. And
 * `#map` says the two words, `CHANGED` and `CLICKED`, to whoever listens there.
 */
export function openMap(origin) {
  const $ = (id) => document.getElementById(id);
  const [map, tiles, credits, said, photo] = ['map', 'tiles', 'credits', 'said', 'photo'].map($);
  // The place of the map, as the browser lays it: to the part of a pixel, where it has one.
  const placeNow = () => {
    const { width, height } = tiles.getBoundingClientRect();
    return { wide: width, high: height };
  };
  let place = placeNow();
  let view = first(place);
  let aerial = false;
  // The pictures that were asked for and belong to the view - each by its layer, level, column
  // and row, with whether it came - and those of the view that did not come.
  const shown = new Map();
  const missed = new Set();
  // How many pictures the view has, whose credits stand on the map, and what a script after
  // this one has said on the map.
  let [has, credited, told] = [0, null, ''];
  // The rest that is waited for, and the pointer while it is down.
  let [resting, pointer] = [null, null];
  const layer = () => showing(view.level, aerial);
  const keyOf = (which, { column, row }) => `${which}/${view.level}/${column}/${row}`;
  const lay = (img, { left, top }) => {
    Object.assign(img.style, { left: `${left}px`, top: `${top}px` });
  };
  const say = (word, detail) => map.dispatchEvent(new CustomEvent(word, { detail }));

  /**
   * What the page says of the map: its credits, what was said on it - by a script after this one,
   * and of a picture that did not come - and the body's words.
   */
  function tell() {
    const which = layer();
    if (which !== credited) {
      const word = (text) => Object.assign(document.createElement('span'), { textContent: text });
      credits.replaceChildren(...LAYERS[which].credits.map(word));
      credited = which;
    }
    const saying = [told, missed.size > 0 ? NOT_COME : ''].filter(Boolean);
    said.textContent = saying.join(' ');
    said.hidden = saying.length === 0;
    const came = [...shown.values()].filter((one) => one.came).length;
    const [e, n] = [view.e.toFixed(2), view.n.toFixed(2)];
    Object.assign(document.body.dataset, { level: view.level, e, n, shows: which });
    Object.assign(document.body.dataset, { pictures: has, came });
  }

  /**
   * The pictures follow the view: one that belongs to it lies where it belongs, and every other
   * goes - of another level, of another layer, or beside the place. Nothing is asked for.
   */
  function show() {
    const which = layer();
    const now = new Map(pictures(view, place).map((one) => [keyOf(which, one), one]));
    for (const [key, { img }] of shown) {
      if (now.has(key)) lay(img, now.get(key));
      else {
        shown.delete(key);
        img.remove();
      }
    }
    for (const key of missed) if (!now.has(key)) missed.delete(key);
    has = now.size;
    tell();
  }

  /** One picture, asked for: with this page's origin, and with no cookie and no referrer. */
  function picture(key, address, at) {
    const img = document.createElement('img');
    const one = { img, came: false };
    // Before its address: a picture is asked for as it stands when its address is set.
    const how = { crossOrigin: 'anonymous', referrerPolicy: 'no-referrer', alt: '' };
    Object.assign(img, how, { draggable: false });
    lay(img, at);
    // A picture that went since - the view moved on - says nothing any more. One that did not
    // come goes too: it is asked for again when the view next rests, and until it comes, or
    // the view leaves it, the page says that a picture did not come.
    const heard = (came) => () => {
      if (shown.get(key) !== one) return;
      one.came = came;
      if (came) missed.delete(key);
      else {
        shown.delete(key);
        img.remove();
        missed.add(key);
      }
      tell();
    };
    img.addEventListener('load', heard(true));
    img.addEventListener('error', heard(false));
    tiles.append(img);
    img.src = address;
    return one;
  }

  /** Asks for the pictures of the view that it has not: those that show, and no other. */
  function ask() {
    const which = layer();
    for (const at of pictures(view, place)) {
      const key = keyOf(which, at);
      const address = tileAddress(origin, which, view.level, at.column, at.row);
      if (!shown.has(key) && address !== null) shown.set(key, picture(key, address, at));
    }
    tell();
  }

  /**
   * The view changed: the pictures follow, the rest begins anew - but in a drag, which asks at
   * its end - and whoever listens is told.
   */
  function changed() {
    show();
    clearTimeout(resting);
    if (pointer?.drags !== true) resting = setTimeout(ask, REST_MS);
    say(CHANGED, { ...view, ...place });
  }
  /** A level nearer or further, with the place under a pixel kept under it - where there is one. */
  function step(by, at) {
    const next = stepped(view, place, by, at);
    if (next === null) return;
    view = next;
    changed();
  }
  const middle = () => [place.wide / 2, place.high / 2];
  const pixelOf = (event) => {
    const box = tiles.getBoundingClientRect();
    return [event.clientX - box.left, event.clientY - box.top];
  };

  // The wheel: a level a notch, at the pointer. The page itself does not scroll under the map.
  const turned = (event) => {
    event.preventDefault();
    if (event.deltaY !== 0) step(-Math.sign(event.deltaY), pixelOf(event));
  };
  map.addEventListener('wheel', turned, { passive: false });
  // The two keys, where no field has them - and not with Ctrl, Alt or the command key, which
  // make them the browser's - and the two buttons: at the middle.
  document.addEventListener('keydown', (event) => {
    const by = Number(event.key === '+') - Number(event.key === '-');
    const withMore = event.ctrlKey || event.metaKey || event.altKey;
    if (by === 0 || withMore || event.target.closest?.('input, select, textarea')) return;
    step(by, middle());
  });
  $('nearer').addEventListener('click', () => step(1, middle()));
  $('further').addEventListener('click', () => step(-1, middle()));
  photo.addEventListener('click', () => {
    aerial = !aerial;
    photo.setAttribute('aria-pressed', String(aerial));
    changed();
  });

  // The pointer, its first button down: up again within CLICK_PX pixels of one place is a
  // click. Further is a drag: the map goes as far as the pointer went - beside the map too, for
  // the pointer is the map's until it is up - and its pictures are asked for at the drag's end.
  tiles.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    tiles.setPointerCapture(event.pointerId);
    const at = pixelOf(event);
    pointer = { id: event.pointerId, down: at, last: at, drags: false };
  });
  tiles.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointer?.id) return;
    const [x, y] = pixelOf(event);
    const { down, last, drags } = pointer;
    if (!drags && Math.hypot(x - down[0], y - down[1]) <= CLICK_PX) return;
    Object.assign(pointer, { drags: true, last: [x, y] });
    view = moved(view, place, [x - last[0], y - last[1]]);
    changed();
  });
  // Up - or taken away by the browser, which is no click.
  const lifted = (up) => (event) => {
    if (event.pointerId !== pointer?.id) return;
    const { down, drags } = pointer;
    pointer = null;
    if (drags) ask();
    else if (up) say(CLICKED, placeAt(view, place, down));
  };
  tiles.addEventListener('pointerup', lifted(true));
  tiles.addEventListener('pointercancel', lifted(false));

  // The place follows the window: the view keeps its middle, and its level where the place
  // still has that level. The browser says the place a first time as the map opens: there the
  // first view is said, and its rest begins.
  new ResizeObserver(() => {
    place = placeNow();
    view = held(view, place);
    changed();
  }).observe(tiles);

  return {
    view: () => ({ ...view, ...place }),
    placeAt: (pixel) => placeAt(view, place, pixel),
    goTo: ({ e, n }, level) => {
      view = held({ level, e, n }, place);
      changed();
    },
    shows: layer,
    say: (words) => {
      told = words;
      tell();
    },
  };
}
