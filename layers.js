// The layers beside the paper. From above: the levels of the space and the ground - one is drawn
// on, each of the others is faded, shown or hidden meanwhile, and a level can be lifted and
// lowered with all that stands on it. Standing up: the slice this view shows, to step through
// the plot with, from the side the view looks from to the far one.
(() => {
  const { document, prompt, confirm, paper, sketch } = globalThis;
  const { PLANE, FLIP, CELL_M, SPANS, COLS, ACROSS } = paper;
  const TOP = PLANE === 'top';
  // How far a slice can go, and which way it comes nearer to where this view looks from: the
  // rows of the top view count from the far side of the plot, its columns from uphill.
  const MOST = PLANE === 'side' ? ACROSS : COLS;
  const NEARER = (PLANE === 'side') !== FLIP ? 1 : -1;
  const $ = (id) => document.getElementById(id);
  const element = (tag, properties) => Object.assign(document.createElement(tag), properties);
  const next = (show) => sketch.SHOWS[(sketch.SHOWS.indexOf(show) + 1) % sketch.SHOWS.length];

  // The layers to draw, the one drawn on last, as they were last read.
  let drawn = [];

  // Which layer is drawn on, and how the others show, is kept with the sketch: no step to undo.
  function settle(act) {
    act(sketch.doc);
    sketch.keep();
    sketch.onChange();
  }

  /**
   * What lies on a layer, in words: what shows there, and after it what a hidden section holds
   * of it - every thing that lies there (`sketch.lies`) and is on no layer, for it does not show.
   */
  function count({ key, things, notes }) {
    const boxes = things.filter((entry) => sketch.isBox(entry.thing)).length;
    const lying = sketch.doc.things.filter((thing) => sketch.lies(thing, PLANE, key)).length;
    const parts = [
      [boxes, 'block', 'blocks'],
      [things.length - boxes, 'object', 'objects'],
      [notes.length, 'note', 'notes'],
      [lying - things.length, 'hidden', 'hidden'],
    ];
    const said = parts.filter(([n]) => n > 0).map(([n, one, more]) => `${n} ${n > 1 ? more : one}`);
    return said.join(', ') || 'nothing yet';
  }

  /** A level of the top view, or its ground, in the list. */
  function row(key, index) {
    const drawnOn = key === sketch.on();
    const pick = element('button', { type: 'button', title: 'Draw on this layer' });
    pick.textContent = sketch.nameOf(PLANE, key);
    pick.setAttribute('aria-pressed', String(drawnOn));
    pick.addEventListener('click', () => settle((doc) => (doc.on.top = key)));
    const eye = element('button', { type: 'button', disabled: drawnOn });
    eye.textContent = drawnOn ? 'drawn on' : sketch.showOf(key);
    eye.title = 'Faded, shown or hidden while another layer is drawn on';
    eye.addEventListener('click', () => {
      settle((doc) => (doc.show.top[key] = next(sketch.showOf(key))));
    });
    const item = element('li');
    item.append(pick, eye);
    // By these the list finds the button that was in use, once it has been written anew.
    const marked = [pick, eye];
    if (Number.isFinite(key)) {
      const lift = (by, text, title) => {
        const button = element('button', { type: 'button', textContent: text, title });
        // A sign is no name to read out: the arrow's name is what its title says, in words.
        button.setAttribute('aria-label', title);
        button.addEventListener('click', () => sketch.shiftLevel(key, by));
        return button;
      };
      // Up on the paper is a lower row.
      marked.push(lift(-1, '▲', 'Lift this level, with all that stands on it, by one cell'));
      marked.push(lift(1, '▼', 'Lower this level, with all that stands on it, by one cell'));
      item.append(...marked.slice(2));
    }
    marked.forEach((button, place) => (button.dataset.layer = `${place} ${index}`));
    item.append(element('small', { textContent: count(sketch.layer(PLANE, key)) }));
    return item;
  }

  /** Reads the layers of this view anew: for the paper, and for the panel. */
  function refresh() {
    const drawnOn = sketch.on();
    // What shows as drawn on stays the one, whatever levels come to stand beside it.
    sketch.doc.on[PLANE] = drawnOn;
    const on = { ...sketch.layer(PLANE, drawnOn), faded: false };
    if (TOP) {
      const showing = (key) => ({
        ...sketch.layer(PLANE, key),
        faded: sketch.showOf(key) === 'faded',
      });
      const keys = sketch.keys();
      const beside = keys.filter((key) => key !== drawnOn && sketch.showOf(key) !== 'hidden');
      // The lower levels lie under the higher ones, and over all of them the one drawn on.
      drawn = [...beside.reverse().map(showing), on];
      const inUse = document.activeElement?.dataset?.layer;
      $('layers').replaceChildren(...keys.map(row));
      if (inUse) $('layers').querySelector(`[data-layer="${inUse}"]`)?.focus();
    } else {
      // A slice shows what it runs through, and nothing else.
      drawn = [on];
      $('cut').value = NEARER > 0 ? MOST - drawnOn : drawnOn;
      $('cut-at').textContent = `${on.name}: ${count(on)}.`;
    }

    // In the footer: how much the blocks of each colour cover, on the layer drawn on - of a box
    // what the paper fills of it there, under its top where that slopes (blocks.covers).
    const cells = new Map();
    for (const { thing, rect } of on.things) {
      const area = globalThis.blocks.covers(thing, PLANE, rect);
      if (sketch.isBox(thing)) cells.set(thing.colour, (cells.get(thing.colour) ?? 0) + area);
    }
    const covered = ([colour, cellCount]) => {
      const item = element('span');
      const dot = element('i', { style: `background: ${paper.hex(colour)}` });
      item.append(dot, ` ${paper.exact(cellCount * CELL_M * CELL_M)} m²`);
      return item;
    };
    // The eleven by their number, then the owner's colours by their value (ST-039).
    const own = paper.isOwn;
    const order = ([a], [b]) => own(a) - own(b) || (own(a) ? (a < b ? -1 : 1) : a - b);
    $('areas').replaceChildren(...[...cells].sort(order).map(covered));
  }

  /**
   * The layers as the paper draws them: `drawn`, as they were last read - but while a section is
   * picked (sections/list.js) the layer drawn on stands there twice: first all that is not of the
   * section, faded, as a layer beside it is; then over it, in full, the section's blocks and the
   * objects that stand in them (`sections.of`). `drawn` stays what it is: the page finds there
   * what a click has. And while none is, from above the lines on every level that their own
   * switch does not hide (`lines.here`, ST-039) are drawn with the layer drawn on, after its own
   * notes, whatever any level's eye says: they are on no layer's count, and make no level.
   */
  function lit() {
    const id = globalThis.sectionList?.picked() ?? null;
    const on = drawn.at(-1);
    if (id === null) {
      const lies = (note) => note.at === 'every' && globalThis.lines.here(note, PLANE, on.key);
      const every = sketch.doc.notes.filter(lies);
      if (every.length === 0) return drawn;
      return [...drawn.slice(0, -1), { ...on, notes: [...on.notes, ...every] }];
    }
    const of = ({ thing }) => globalThis.sections.of(thing)?.id === id;
    const rest = { ...on, things: on.things.filter((entry) => !of(entry)), faded: true };
    return [...drawn.slice(0, -1), rest, { ...on, things: on.things.filter(of), notes: [] }];
  }

  /** Moves this view's slice by a number of cells, as far as the space goes. */
  function nudge(by) {
    const to = sketch.on() + by;
    if (to >= 0 && to <= MOST) settle((doc) => (doc.on[PLANE] = to));
  }

  /** From above: draws on the layer before or after the one drawn on. Standing up: moves the slice, nearer for a step on. */
  function step(by) {
    if (!TOP) return nudge(by * NEARER);
    const keys = sketch.keys();
    const to = keys[keys.indexOf(sketch.on()) + by];
    if (to !== undefined) settle((doc) => (doc.on.top = to));
    return undefined;
  }

  $('add').addEventListener('click', () => {
    const asked = prompt('Height of the new level, in metres above sea level', '');
    if (asked === null || asked.trim() === '') return;
    if (!sketch.newLevel(Number(asked.replace(',', '.')))) {
      sketch.trouble = `A level stands between ${SPANS.side[0]} and ${SPANS.side[1] - CELL_M} m above sea level: "${asked}" is none.`;
      sketch.onChange();
    }
  });
  $('remove').addEventListener('click', () => {
    const key = sketch.on();
    const { things, notes } = sketch.stood(sketch.doc, key);
    // It takes what is hidden too, and says how much of it there is (levels.js passes none over).
    const hidden = things.filter((thing) => !sketch.shows(thing)).length;
    const all = `${things.length + notes.length}${hidden > 0 ? `, ${hidden} of them hidden` : ''}`;
    const what = `${sketch.nameOf(PLANE, key)}, with all that stands on it (${all})`;
    if (confirm(`Delete ${what}? Undo brings it back while this tab stays open.`)) {
      sketch.removeLevel(key);
    }
  });
  // The slider runs from the side the view looks from to the far one.
  $('cut').max = MOST;
  $('cut').addEventListener('input', () => {
    const far = Number($('cut').value);
    settle((doc) => (doc.on[PLANE] = NEARER > 0 ? MOST - far : far));
  });
  $('nearer').addEventListener('click', () => nudge(NEARER));
  $('farther').addEventListener('click', () => nudge(-NEARER));

  $('layers-title').textContent = TOP ? 'Layers' : 'The slice';
  $('level-tools').hidden = !TOP;
  $('layers').hidden = !TOP;
  $('cut-tools').hidden = TOP;
  $('layers-hint').textContent = TOP
    ? 'Click a layer to draw on it; the button beside it fades, shows or hides it meanwhile. A level is a height that something stands at: a block drawn here stands on the level drawn on. The ground has the objects that stand on the ground. The two orange lines are the slices that the other views show: drag them with Select.'
    : 'This view shows what its slice runs through, on the ground as it lies there, and nothing else. Step the slice through the plot here, or drag its line in the top view. A block drawn here is 6 m deep about the slice, until another view makes it otherwise. A block that C sets to ground shapes the ground: its top is the ground there, and from it the ground runs out to the plot boundary. A block that is a cut takes ground away: where the ground stands higher than its floor, the ground is its floor. Pick "Ground cut" in the list beside the paper, or press C until the pad says a cut.';
  globalThis.layers = { drawn: () => drawn, lit, refresh, step };
})();
