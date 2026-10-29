// swisstopo's map laid under the top view (ST-046, T-046.2): the pad's one code that asks for the
// top view's map. While `under.on` says so, in the top view, on a plot with a place, it lays the
// pictures that `underOf` (place.js) says as <img>s in `#under-map`, under the canvas - one box turned
// and scaled by CSS, the pictures in it where `pictures` of map/view.js puts them - at
// `under.strength`, with their credits in a corner. None is drawn into the canvas, so the PNG and
// `pnpm sketch:look` never hold one. It keeps the pictures that still show, asks for new ones when
// the view rests, as New plot's map does (map/map.js), and takes everything away when the map is
// off, in a slice, or where the plot has no place. It asks the origin that the page's word `asks`
// names - a stand-in's, or swisstopo's where the pad offers New plot - and nobody where the pad
// offers neither (story, rule 2). The page's second policy is its own: pictures from the page's
// own address and that one origin, and from nowhere else. lay.check.js holds every decision.
//
// A LAYER NEARER THAN ITS LAST LEVEL. The national map has no level 28: where `underOf` takes a
// level beyond the layer's last, `to`, the pictures of `to` are shown larger. The window and its
// middle stay; a pixel of `to` is LEVELS[to] / LEVELS[level] = r pixels of `level`, so the scale
// grows r times, and the box, in pixels of `to`, shrinks r times - rounded up, so that it still
// covers the turned window: at 4 pixels a cell, 0.125 m a CSS pixel, level 28 has a scale of 0.8
// and a box of 640 for a window of 512; level 27 a scale of 2 and a box of 256.
//
// THE ARITHMETIC IS LOADED WHERE THE MAP IS OFFERED, and only there: place.js and map/view.js by
// `arithmetic()`. The made-up pad serves nothing of map/ but a 204 for its page (routes.js), so a
// page there that offers no map asks for none of it, and says nothing on its console.
import { CADASTRAL_FROM, LAYERS, LEVELS, asksOf, tileAddress } from '../swisstopo/hosts.js';

// `underOf` of place.js and `pictures` of map/view.js, once `arithmetic()` has loaded them.
let [underOf, pictures] = [null, null];
/** Loads the arithmetic of where the map lies and which pictures it has: once, where it is offered. */
export async function arithmetic() {
  [{ underOf }, { pictures }] = await Promise.all([import('./place.js'), import('../map/view.js')]);
}

// The story's two sentences where the credits stand.
export const NOT_COME = 'Some pictures of the map did not come.';
export const NEARER_IN = 'The cadastral map shows from nearer in.';
// How long the view rests before its pictures are asked for, in milliseconds - as on New plot.
export const REST_MS = 150;
// What the flag says when the page opens: off, the aerial photo, at half its strength.
export const FIRST = Object.freeze({ on: false, layer: 'photo', strength: 0.5 });
// swisstopo's map service, as `asksOf` names it for a page told nobody.
const SWISSTOPO = asksOf('').map;

/**
 * The origin whose pictures the top view lays, or null: no map. `query` is the page's
 * `location.search`, read as `asksOf` reads it; `newPlot` whether the pad offers New plot. A
 * stand-in, wherever the page was told one; swisstopo where it was told nobody and the pad
 * offers New plot; and nobody where it offers none, or where the word `asks` is refused.
 */
export function offeredOf(query, newPlot) {
  const told = asksOf(query);
  if (told.refused !== undefined) return null;
  if (told.map !== SWISSTOPO) return told.map;
  return newPlot === true ? told.map : null;
}

/**
 * The page's second policy: pictures from its own address and from the origin it asks, and from
 * nowhere else - and `data:`, the toolbar's drawings, written out in icons.css. It says nothing
 * of requests: the first policy's `connect-src 'self'` holds for them.
 */
export const policyOf = (origin) => `img-src 'self' data:${origin === null ? '' : ` ${origin}`}`;

/** How strongly the map shows, 0 to 1: a figure held to them, and anything else half. */
export const strengthOf = (value) =>
  Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : FIRST.strength;

/** `underOf`'s result held to a layer's last level, `to`: that level's pictures shown larger. */
function heldTo(under, to) {
  if (under.level <= to) return under;
  const ratio = LEVELS[to] / LEVELS[under.level];
  // Settled to a thousandth of a pixel before it is rounded up, as place.js settles the box.
  const across = (pixels) => Math.ceil(Math.round((pixels / ratio) * 1000) / 1000);
  const box = { wide: across(under.box.wide), high: across(under.box.high) };
  return {
    ...under,
    level: to,
    view: { ...under.view, level: to },
    box,
    scale: under.scale * ratio,
  };
}

/**
 * What the top view lays, of `layer`, a name of `LAYERS`, asked of `origin`, on `place` - the plot
 * as `SITE` has it - at `zoom`, `{ px, left, top }`, in a window of `size`, `{ wide, high }`:
 * `{ level, box, turnDeg, scale, centre, pictures, said }` - the box as `underOf` lays it, its
 * pictures each `{ key, address, left, top }`, and the words in the corner: the layer's credits,
 * and `NEARER_IN` where the cadastral map is asked of further out than it shows, with no picture.
 * Or `{ refused }`: no such layer, or `underOf`'s refusal, the plot has no place.
 */
export function laidOf(origin, layer, place, zoom, size) {
  if (!Object.hasOwn(LAYERS, layer)) return { refused: `The map has no layer ${String(layer)}.` };
  const its = LAYERS[layer];
  const under = underOf(place, zoom, size);
  if (under.refused !== undefined) return under;
  const { level, view, box, turnDeg, scale, centre } = heldTo(under, its.to);
  const laid = { level, box, turnDeg, scale, centre, said: [...its.credits] };
  if (layer === 'cadastral' && level < CADASTRAL_FROM)
    return { ...laid, pictures: [], said: [...laid.said, NEARER_IN] };
  const all = pictures(view, box).map(({ column, row, left, top }) => ({
    key: `${layer}/${level}/${column}/${row}`,
    address: tileAddress(origin, layer, level, column, row),
    left,
    top,
  }));
  return { ...laid, pictures: all.filter(({ address }) => address !== null) };
}

/**
 * Which pictures stay, go and are asked for, by their keys: of those `shown`, each one that the
 * view still has stays, every other goes; of those it `wants`, each one not shown is asked for -
 * and a picture that did not come is no longer shown, so it is asked for again.
 */
export function planOf(shown, wants) {
  const [had, now] = [new Set(shown), new Set(wants)];
  return {
    keep: [...had].filter((key) => now.has(key)),
    drop: [...had].filter((key) => !now.has(key)),
    ask: [...now].filter((key) => !had.has(key)),
  };
}

/** What a view is, as a text: a view that is the same asks for nothing, one that moved does. */
export const viewKeyOf = ({ level, box, turnDeg, scale, centre, pictures: all }) =>
  JSON.stringify([level, box, turnDeg, scale, centre, all[0]?.key, all[0]?.left, all[0]?.top]);

/** The page's part: `globalThis.under`, the second policy, the pictures and the corner's words. */
function openUnder() {
  const { document, location, paper, setTimeout, clearTimeout } = globalThis;
  const holder = document.getElementById('under-map');
  const box = holder.appendChild(document.createElement('div'));
  const said = holder.appendChild(document.createElement('p'));
  // The pictures shown - each by its key, its <img> and whether it came - and those that did not.
  const shown = new Map();
  const missed = new Set();
  let [origin, printing, resting, latest, viewKey] = [null, false, null, null, null];

  const showing = () =>
    under.on === true &&
    origin !== null &&
    Object.hasOwn(LAYERS, under.layer) &&
    paper.PLANE === 'top' &&
    underOf(globalThis.SITE, { px: 1, left: 0, top: 0 }, { wide: 1, high: 1 }).refused ===
      undefined;
  const at = (img, { left, top }) =>
    Object.assign(img.style, { left: `${left}px`, top: `${top}px` });

  /** The words in the corner: the credits, the cadastral map's sentence, and what did not come. */
  function tell() {
    const words = [...(latest?.said ?? []), ...(missed.size > 0 ? [NOT_COME] : [])];
    said.replaceChildren(
      ...words.map((text) => Object.assign(document.createElement('span'), { textContent: text })),
    );
    const came = [...shown.values()].filter((one) => one.came).length;
    Object.assign(holder.dataset, { level: latest?.level ?? '', pictures: shown.size, came });
  }

  /** Everything taken away, and nothing more asked. */
  function clear() {
    clearTimeout(resting);
    for (const { img } of shown.values()) img.remove();
    shown.clear();
    missed.clear();
    [latest, viewKey] = [null, null];
    holder.hidden = true;
  }

  /** One picture, asked for as New plot's map asks: with no cookie and no referrer. */
  function picture({ key, address, ...place }) {
    const img = document.createElement('img');
    const one = { img, came: false };
    Object.assign(img, { crossOrigin: 'anonymous', referrerPolicy: 'no-referrer', alt: '' });
    Object.assign(img, { draggable: false });
    img.style.opacity = String(strengthOf(under.strength));
    at(img, place);
    const heard = (came) => () => {
      if (shown.get(key) !== one) return;
      one.came = came;
      if (!came) {
        shown.delete(key);
        img.remove();
        missed.add(key);
      }
      tell();
    };
    img.addEventListener('load', heard(true));
    img.addEventListener('error', heard(false));
    box.append(img);
    shown.set(key, one);
    img.src = address;
  }

  /** The pictures of the view that rests, that it has not: those that show, and no other. */
  function ask() {
    const wants = new Map(latest.pictures.map((one) => [one.key, one]));
    for (const key of planOf(shown.keys(), wants.keys()).ask) {
      missed.delete(key);
      picture(wants.get(key));
    }
    tell();
  }

  /** After each draw (draw.js): the pictures follow the window, and a view that moved asks anew. */
  function lay() {
    if (!showing()) return clear();
    const { px, left, top } = globalThis.zoom;
    // Shown before it is measured: a hidden holder is 0 by 0, and its view would have no picture.
    holder.hidden = false;
    const size = { wide: holder.clientWidth, high: holder.clientHeight };
    latest = laidOf(origin, under.layer, globalThis.SITE, { px, left, top }, size);
    if (latest.refused !== undefined) return clear();
    const {
      box: { wide, high },
      centre,
      turnDeg,
      scale,
    } = latest;
    Object.assign(box.style, {
      left: `${centre[0] - wide / 2}px`,
      top: `${centre[1] - high / 2}px`,
      width: `${wide}px`,
      height: `${high}px`,
      transform: `rotate(${turnDeg}deg) scale(${scale})`,
    });
    const wants = new Map(latest.pictures.map((one) => [one.key, one]));
    const { keep, drop } = planOf(shown.keys(), wants.keys());
    for (const key of drop) shown.get(key).img.remove();
    for (const key of drop) shown.delete(key);
    for (const key of keep) at(shown.get(key).img, wants.get(key));
    for (const key of missed) if (!wants.has(key)) missed.delete(key);
    const opacity = String(strengthOf(under.strength));
    for (const { img } of shown.values()) img.style.opacity = opacity;
    tell();
    const now = viewKeyOf(latest);
    if (now === viewKey) return undefined;
    viewKey = now;
    clearTimeout(resting);
    resting = setTimeout(ask, REST_MS);
    return undefined;
  }

  const under = {
    ...FIRST,
    /** Whether the top view shows the map now: the canvas then paints no ground (draw.js). */
    shows: () => !printing && showing(),
    lay,
    /** Whether the page offers the map - once it knows whether the pad offers New plot. */
    offered: Promise.resolve(globalThis.openPlot?.asked).then(async (newPlot) => {
      const offered = offeredOf(location.search, newPlot);
      // Where the arithmetic does not load, no map: on the made-up pad, told a stand-in.
      origin =
        offered === null
          ? null
          : await arithmetic().then(
              () => offered,
              () => null,
            );
      const policy = document.createElement('meta');
      Object.assign(policy, { httpEquiv: 'Content-Security-Policy', content: policyOf(origin) });
      document.head.append(policy);
      if (under.on === true) globalThis.zoom.onChange();
      return origin !== null;
    }),
  };

  // Picture (PNG) is the paper as it always was: for the moment the picture is taken (files.js,
  // which takes the canvas as it stands), the canvas is drawn with its ground, and then anew.
  const redraw = () => globalThis.zoom.onChange();
  document.addEventListener(
    'click',
    (event) => {
      if (!event.target.closest?.('#picture') || !under.shows()) return;
      printing = true;
      redraw();
      setTimeout(() => {
        printing = false;
        redraw();
      });
    },
    true,
  );
  holder.hidden = true;
  return under;
}

if (globalThis.document?.getElementById('under-map')) globalThis.under = openUnder();
