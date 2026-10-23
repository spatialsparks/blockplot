// The corners of a new plot, marked on the map (ST-031). The owner clicks the corners of a plot,
// one after the other, where the map is near enough: from the second a line joins them, from the
// third the outline closes, its area shows, and the paper shows around it as it will lie in the
// pad. A corner is dragged, the last is undone, all are taken away. What a plot is while it is
// marked is marking.js's, with nothing of the page in it; here the marks on the map and the
// plot's side, which a browser test presses: tests/e2e/sketch-new-plot.spec.ts.
import { AROUND_MAX_M } from '../new-plot/request.js';
import { MARK_FROM } from '../swisstopo/hosts.js';
import { CHANGED, CLICKED, CLICK_PX } from './map.js';
import { marking } from './marking.js';
import { pixelOf } from './view.js';

const { document, CustomEvent } = globalThis;

// The word of the marks, an event of `#plot`: what is marked changed - a corner, the side, the
// ground around. Its `detail` is the plot as `read` gives it.
export const MARKED = 'marked';

// A corner's mark, in pixels of the screen: how far it reaches from its place.
const CORNER_PX = 6;
// The steps of the field of the ground around: half a metre, as an order has it.
const AROUND_STEP_M = 0.5;

/**
 * Opens the marking on the page: the marks over the map's pictures, in `#marks`, and the plot's
 * side, `#plot`. `map` is what map.js gave. A click on the map that was no drag sets a corner,
 * where a pixel is half a metre or less; a corner's mark is dragged, from that near, and the map
 * stands still meanwhile; and all that is marked stays on its ground as the map is moved, at any
 * level. It gives `read` and `order` of the plot that is marked, and `#plot` says `MARKED`; and
 * `take(corners, parcel)`, a parcel's corners in the place of what was marked - empty, they show
 * and `MARKED` is said, or why not, and nothing shows - and `clicks(on)`, whether a click on the
 * map sets a corner: true as the page opens. While it is false a click sets nothing and says
 * nothing; a corner's mark is still dragged.
 */
export function openMarks(map) {
  const $ = (id) => document.getElementById(id);
  const plot = marking();
  let clicking = true;
  const [ground, marks, side, around] = ['map', 'marks', 'plot', 'around'].map($);
  const [sheet, outline, along, dots] = ['sheet', 'outline', 'along', 'dots'].map($);
  const set = (part, says) => {
    for (const [name, value] of Object.entries(says)) part.setAttribute(name, value);
  };
  // Places as a text: each its two figures to two decimals with a comma between, a blank a place.
  const figures = (place) => place.map((at) => at.toFixed(2)).join();
  const written = (places) => places.map(figures).join(' ');
  let now = plot.read();

  /**
   * Lays the marks where the map has their ground, each place at its pixel of the view: the
   * paper's sheet, the outline - of two corners a line - the side that the paper lies along,
   * from the third corner on, and a mark a corner.
   */
  function lay() {
    const view = map.view();
    const pixelAt = ([e, n]) => pixelOf(view, view, { e, n });
    const pixels = now.corners.map(pixelAt);
    set(sheet, { points: written((now.paper?.sheet ?? []).map(pixelAt)) });
    set(outline, { points: written(pixels) });
    const [x1, y1] = pixels[now.side] ?? [0, 0];
    const [x2, y2] = pixels[(now.side + 1) % (pixels.length || 1)] ?? [0, 0];
    set(along, { x1, y1, x2, y2 });
    along.toggleAttribute('hidden', now.paper === null);
    while (dots.childElementCount > pixels.length) dots.lastElementChild.remove();
    while (dots.childElementCount < pixels.length) {
      dots.append(document.createElementNS(marks.namespaceURI, 'circle'));
    }
    pixels.forEach(([cx, cy], at) => set(dots.children[at], { cx, cy, r: CORNER_PX }));
    // A corner's mark takes the pointer from as near as a corner is set, and no further.
    marks.classList.toggle('near', view.level >= MARK_FROM);
  }

  /** Shows the plot as it is marked: its sentences, its controls, its marks - and says so. */
  function show(before = '') {
    now = plot.read();
    const { corners, said, paper } = now;
    $('corners-said').textContent = said.corners;
    Object.assign($('no-survey'), { textContent: said.survey, hidden: said.survey === '' });
    $('paper-said').textContent = [before, said.paper].filter(Boolean).join(' ');
    for (const id of ['undo-corner', 'start-again']) $(id).disabled = corners.length === 0;
    for (const id of ['side-before', 'side-next']) $(id).disabled = paper === null;
    around.value = String(now.aroundM);
    // The body's words, for a test and a look: the corners, to the centimetre, and the rest.
    const says = { corners: corners.length, marked: written(corners), side: now.side };
    Object.assign(says, { area: paper?.areaM2?.toFixed(3) ?? '', around: now.aroundM });
    Object.assign(document.body.dataset, says, { on: now.on.join(' ') });
    // And whose they are: a parcel's EGRID and whether its corners are as given, or empty.
    const { parcel } = now;
    Object.assign(document.body.dataset, {
      parcel: parcel?.egrid ?? '',
      given: parcel?.asGiven ?? '',
    });
    lay();
    side.dispatchEvent(new CustomEvent(MARKED, { detail: now }));
  }
  /** What was done to the plot shows, and what the map said of a click before it is gone. */
  const done = () => {
    map.say('');
    show();
  };

  // A click on the map that was no drag: a corner, or why none was set, said on the map.
  ground.addEventListener(CLICKED, ({ detail }) => {
    if (!clicking) return;
    const refused = plot.add(detail, map.view().level, map.shows());
    map.say(refused);
    if (refused === '') show();
  });
  // The map moved, came nearer or went further: the marks stay on their ground.
  ground.addEventListener(CHANGED, () => {
    map.say('');
    lay();
  });

  // A corner's mark, its first button down, is dragged: the corner goes as far as the pointer
  // went - once it went further than a click may - and the map stands still, for the pointer is
  // the mark's until it is up.
  const pixelOfPointer = (event) => {
    const box = marks.getBoundingClientRect();
    return [event.clientX - box.left, event.clientY - box.top];
  };
  let held = null;
  dots.addEventListener('pointerdown', (event) => {
    const at = Array.from(dots.children).indexOf(event.target);
    if (event.button !== 0 || at < 0) return;
    event.target.setPointerCapture(event.pointerId);
    const [x, y] = pixelOfPointer(event);
    const [cx, cy] = ['cx', 'cy'].map((name) => Number(event.target.getAttribute(name)));
    held = { id: event.pointerId, at, down: [x, y], off: [cx - x, cy - y], drags: false };
  });
  dots.addEventListener('pointermove', (event) => {
    if (event.pointerId !== held?.id) return;
    const [x, y] = pixelOfPointer(event);
    const { at, down, off, drags } = held;
    if (!drags && Math.hypot(x - down[0], y - down[1]) <= CLICK_PX) return;
    held.drags = true;
    plot.move(at, map.placeAt([x + off[0], y + off[1]]), map.shows());
    done();
  });
  for (const lifted of ['pointerup', 'pointercancel']) {
    dots.addEventListener(lifted, (event) => {
      if (event.pointerId === held?.id) held = null;
    });
  }

  // The plot's side: the last corner gone, all gone, the side before and the next, and the
  // ground around - a figure that is none is said in the order's own sentence, before the
  // paper's, and the field has the figure of the paper again.
  const DOES = { 'undo-corner': plot.undo, 'start-again': plot.clear };
  Object.assign(DOES, { 'side-before': () => plot.pick(-1), 'side-next': () => plot.pick(1) });
  for (const [id, does] of Object.entries(DOES)) {
    $(id).addEventListener('click', () => {
      does();
      done();
    });
  }
  Object.assign(around, { min: 0, max: AROUND_MAX_M, step: AROUND_STEP_M });
  around.addEventListener('change', () => show(plot.around(around.valueAsNumber)));

  show();
  /** A parcel's corners, taken whole: shown, or why not, with nothing shown. */
  function take(corners, parcel) {
    const refused = plot.take(corners, parcel);
    if (refused === '') done();
    return refused;
  }
  /** Whether a click on the map sets a corner from now on. */
  function clicks(on) {
    clicking = on;
  }
  return { read: plot.read, order: plot.order, take, clicks };
}
