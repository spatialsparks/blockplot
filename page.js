// The page of the sketch pad: its tools, and the pointer and the keyboard on the paper. It
// brings the paper (paper.js, draw.js, zoom.js), the sketch (sketch.js, strokes.js), the layers
// (layers.js), what is said in words (footer.js) and the switch of view (views.js) together.
(() => {
  const { document, prompt, requestAnimationFrame, palette, lineTool } = globalThis;
  const { SITE, paper, sketch, shapes, layers, footer, files, views, zoom, pointer } = globalThis;
  const { PLANE, FLIP, COLS, ACROSS } = paper;
  // What the tab showed last: the tool, the object and how it is turned, how high a block is,
  // what is selected, and where the paper was moved to. The colour is the palette's.
  const { seen } = views;

  const KEYS = { b: 'block', s: 'move', m: 'move', g: 'merge', o: 'object', l: 'line' };
  Object.assign(KEYS, { t: 'text', e: 'erase' });
  // The pointer over a thing with Select, by where it has it: a flipped view shows the paper
  // from behind, and its corners lean the other way.
  const [FALLING, RISING] = FLIP ? ['nesw-resize', 'nwse-resize'] : ['nwse-resize', 'nesw-resize'];
  const CURSORS = { move: 'move', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' };
  Object.assign(CURSORS, { nw: FALLING, se: FALLING, ne: RISING, sw: RISING });
  const ERASER = '#b91c1c';

  const $ = (id) => document.getElementById(id);
  const canvas = $('paper');
  const scroller = $('scroller');
  const faults = paper.siteFaults();

  let tool = Object.values(KEYS).includes(seen.tool) ? seen.tool : 'move';
  let kind = shapes.GROUPS.some(({ tiles }) => tiles.includes(seen.kind)) ? seen.kind : 'person';
  // By how many quarters the next object is turned as it is set down.
  let turned = [1, 2, 3].includes(seen.turned) ? seen.turned : 0;
  // How high a block is that is drawn from above, in metres: a storey, until it is set.
  let high = seen.high > 0 ? seen.high : Number($('high').value);
  // What is selected: a thing of the sketch, or nothing - or, where there are more than one, the
  // things of `several`, which the panels right of the paper show as nothing (T-037.6).
  let picked = sketch.doc.things[seen.picked] ?? null;
  let several = [];
  // The stroke in progress, and where the pointer is on the paper while there is none.
  let drag = null;
  let over = null;
  let queued = false;

  /** What the stroke in progress will do, for the paper to show: a line, or a box. */
  function preview() {
    if (tool === 'line') return lineTool.preview(over); // The line in progress is the tool's.
    const stroke = drag ?? (tool === 'object' && over ? { tool, from: over, to: over } : null);
    if (!stroke || stroke.tool === 'text' || stroke.tool === 'cut') return null;
    const { label, from, to } = stroke;
    if (stroke.tool === 'label') return { label: sketch.labelMoved(label, from, to) };
    const { cells } = sketch.shape(stroke);
    if (stroke.tool === 'erase') return { box: cells, colour: ERASER };
    if (['merge', 'section'].includes(stroke.tool)) return { box: cells, colour: paper.INK };
    if (stroke.tool === 'block') return { box: cells, colour: paper.hex(palette.colour()) };
    if (stroke.tool === 'move')
      return sketch.pulled(stroke) ?? { box: sketch.moved(stroke), colour: paper.INK };
    // An object as it will stand, its middle at the pointer.
    const thing = sketch.placed(kind, stroke.to, turned);
    return { box: sketch.rect(thing, PLANE), colour: paper.INK, thing };
  }

  /** What is selected, for the paper to show: where it lies on the layer drawn on, and a word on it - of several, each. */
  function chosen() {
    if (lineTool.picked()) return { line: globalThis.lines.points(lineTool.picked().line) };
    const marks = several.map((one) => ({ rects: lying(one), label: '' }));
    if (several.length > 0) return marks.filter((mark) => mark.rects.length > 0);
    const rects = picked ? lying(picked) : [];
    if (rects.length === 0) return null;
    const word = sketch.named(picked) ?? sketch.worded(picked); // What stands on the block.
    const said = { label: footer.picked(picked).label, lower: Boolean(word) };
    return { rects, ...said };
  }
  /** Where a thing lies on the layer drawn on, whole: the rects of its block's boxes, or its own. */
  const lying = (thing) =>
    layers
      .drawn()
      .at(-1)
      .things.filter((entry) => sketch.blockOf(thing).includes(entry.thing))
      .map((entry) => entry.rect);

  function draw() {
    const cuts = { side: sketch.on('side'), end: sketch.on('end') };
    const showing = { layers: layers.lit(), cuts, picked: chosen(), preview: preview() };
    const { px, left, top } = zoom; // What the window shows (zoom.js).
    paper.draw(canvas, { px, left, top, ...showing });
  }

  function render() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      draw();
    });
  }

  /** What the footer says of the pointer's place. */
  function tell(at) {
    const held = !drag && tool === 'move' ? pointer.grab(at) : null;
    const thing = held?.at === undefined ? null : held;
    $('status').textContent = footer.measure(at, drag || tool === 'line' ? preview() : null, thing);
  }

  /** The toolbar, the layers and what is said in words follow the sketch; then the paper is drawn. */
  function refresh() {
    paper.settle(sketch.doc.things); // The ground first: the layers ask it where an object stands.
    layers.refresh();
    lineTool.state(tool, sketch.on()); // Another tool or layer ends a line in progress.
    const line = lineTool.words(); // A line selected is the one thing selected (lines/tool.js).
    if (line) [picked, several] = [null, []];
    // What is selected stays so while it is there and shows: an undo makes the sketch anew.
    const stays = (one) => sketch.doc.things.includes(one) && sketch.shows(one);
    if (!several.every(stays)) several = []; // Several, all of them or none.
    if (!sketch.doc.things.includes(picked) || !sketch.shows(picked)) picked = null;
    tool = globalThis.sectionList.show(picked, tool); // A section picked is the tool.
    $('picked').textContent = picked ? footer.picked(picked).words : footer.several(several);
    $('picked').hidden = !picked && several.length === 0;
    globalThis.categoryList.show(picked); // Under those words, the list of categories follows.
    globalThis.swatch.show(picked); // And under the list, the colour of a block that is selected.
    globalThis.gallery.show(kind, tool === 'object'); // In their place the objects, with Object.
    globalThis.objectHigh.show(picked); // Under the colour, the height of an object that takes one.
    globalThis.distancePanel.show(); // The boundary distances follow the sketch too.
    if (line) [$('picked').textContent, $('picked').hidden] = [line, false]; // Its words, alone.
    globalThis.linePanel.show(lineTool.picked()); // Under them its segments and its levels.
    globalThis.everyList.show(lineTool.picked()); // Left of the paper, the lines on every level.
    for (const button of document.querySelectorAll('[data-tool]')) {
      button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
    }
    palette.show(tool); // Block has no button: its colour shows pressed (palette.js).
    $('undo').disabled = sketch.past.length === 0;
    $('redo').disabled = sketch.future.length === 0;
    canvas.style.cursor = tool === 'move' ? 'default' : '';
    $('alarm').textContent = [
      ...faults.map((fault) => `The site data looks wrong: ${fault}. Do not trust this drawing.`),
      sketch.trouble,
    ].join(' ');
    // After the words, which were written anew: a sketch that a pad could not read, as a file.
    files.offer($('alarm'));
    render();
  }

  /** The Label tool: on a block it asks for the block's name; beside one, or with Shift, for a label that lies there. */
  function write(stroke, loose) {
    const box = loose ? null : sketch.boxAt(stroke.to);
    if (!box)
      return sketch.apply({ ...stroke, colour: palette.colour(), text: prompt('Label')?.trim() });
    const hint = 'Name of this block. Shift and a click write a loose label on it instead.';
    const asked = prompt(hint, sketch.named(box) ?? '');
    return asked === null ? null : sketch.name(box, asked.trim());
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || tool === 'line') return; // Right: right-menu.js. Line: lines/tool.js.
    const at = pointer.at(event);
    const used = tool;
    // Select needs something to have: a thing - with Ctrl a copy of it, with Shift its top to slope (slopes.js) - a label, or a slice's line.
    const grabbed = used === 'move' ? pointer.grab(at) : null;
    if (used === 'move' && !grabbed?.cut) {
      lineTool.pick(sketch.doc.notes[grabbed?.line] ?? null); // A line it has is not dragged.
      // The thing it has is selected; where it has none, nothing is.
      [picked, several] = [layers.drawn().at(-1).things[grabbed?.at]?.thing ?? null, []];
      refresh();
    }
    if (used === 'move' && (!grabbed || grabbed.line >= 0)) return;
    canvas.setPointerCapture(event.pointerId);
    const held = grabbed?.cut ? 'cut' : grabbed?.label >= 0 ? 'label' : used;
    drag = { tool: held, from: at, to: at, cut: grabbed?.cut, label: grabbed?.label };
    if (held === 'move') drag.grabbed = { ...grabbed, copy: event.ctrlKey, slope: event.shiftKey };
    render();
  });
  canvas.addEventListener('pointermove', (event) => {
    over = pointer.at(event);
    // An object is set down where the pointer lets go: its stroke has no length.
    if (drag) Object.assign(drag, { to: over }, drag.tool === 'object' && { from: over });
    else if (tool === 'move') canvas.style.cursor = CURSORS[pointer.grab(over)?.zone] ?? 'default';
    // A slice's line goes with the pointer, cell by cell; it is kept when the pointer lets go.
    if (drag?.tool === 'cut') {
      const [to, most] = drag.cut === 'side' ? [over[1], ACROSS] : [over[0], COLS];
      sketch.doc.on[drag.cut] = Math.min(most, Math.max(0, Math.round(to)));
    }
    tell(over);
    if (drag || tool === 'object' || tool === 'line') render();
  });
  canvas.addEventListener('pointerup', (event) => {
    const [stroke, colour] = [drag, palette.colour()]; // The colour to draw with (palette.js).
    drag = null;
    if (stroke?.tool === 'cut') {
      sketch.keep();
      refresh();
    } else if (stroke?.tool === 'label') sketch.moveLabel(stroke.label, stroke.from, stroke.to);
    else if (stroke?.tool === 'text') write(stroke, event.shiftKey);
    else if (stroke?.tool === 'section') globalThis.sectionList.fill(stroke);
    else if (stroke) sketch.apply({ ...stroke, colour, kind, turned, high });
    tell(pointer.at(event)); // Of the sketch as the stroke left it: the size just dragged.
    render();
  });
  canvas.addEventListener('pointercancel', () => {
    drag = null;
    render();
  });
  canvas.addEventListener('pointerleave', () => {
    over = null;
    render();
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  document.addEventListener('keydown', (event) => {
    // A key typed into a field is the field's, Ctrl+Z too; with Alt a letter is the browser's.
    if (views.typing(event)) return;
    const key = event.key.toLowerCase();
    if (event.ctrlKey || event.metaKey) {
      if (key !== 'z' && key !== 'y') return;
      event.preventDefault();
      if (key === 'z' && !event.shiftKey) sketch.step(sketch.past, sketch.future);
      else sketch.step(sketch.future, sketch.past);
    } else if (key === 'pageup' || key === 'pagedown') {
      // From above, a level up or down; standing up, the slice a cell further or nearer.
      event.preventDefault();
      layers.step(key === 'pageup' ? -1 : 1);
    } else if (key === 'escape') {
      [picked, tool] = [null, tool === 'section' ? 'move' : tool];
      several = [];
      refresh();
    } else if (!event.altKey && key === 'r') {
      // A quarter on: the object about to be set down, or else the one that is selected.
      if (tool === 'object') turned = (turned + 1) % 4;
      else if (picked?.kind) sketch.turn(picked);
      refresh();
    } else if (!event.altKey && key === 'c') {
      // A step on: what the selected block counts as, with any tool. An object counts as nothing.
      if (picked) sketch.countNext(picked);
    } else if (!event.altKey && KEYS[key]) {
      tool = KEYS[key];
      refresh();
    }
  });

  for (const button of document.querySelectorAll('[data-tool]')) {
    button.addEventListener('click', () => {
      tool = button.dataset.tool;
      refresh();
    });
  }
  // An object picked in the gallery (gallery.js) is what a click sets down, with the Object tool.
  globalThis.gallery.onPick = (key) => {
    [kind, tool] = [key, 'object'];
    refresh();
  };
  // The right button's menu acts on what is selected, and selects what it is pressed on.
  globalThis.rightMenu.selected = () => (picked ? [picked] : several);
  globalThis.rightMenu.select = (things) => {
    lineTool.pick(null);
    [picked, several] = things.length > 1 ? [null, things] : [things[0] ?? null, []];
    refresh();
  };
  // A colour picked: the tool the palette names - Block - and the page shown anew.
  palette.onPick = (next) => {
    tool = next;
    refresh();
  };
  $('undo').addEventListener('click', () => sketch.step(sketch.past, sketch.future));
  $('redo').addEventListener('click', () => sketch.step(sketch.future, sketch.past));
  $('high').value = high;
  $('high-row').hidden = PLANE !== 'top';
  $('high').addEventListener('input', () => {
    if (Number($('high').value) > 0) [high, tool] = [Number($('high').value), 'block'];
    refresh(); // A height that is one takes the Block tool too, as a colour does.
  });
  // A height set: the field gives the focus back, and a key is the page's again.
  $('high').addEventListener('change', () => $('high').blur());
  // Another window kept the sketch: show what it kept, instead of overwriting it.
  globalThis.addEventListener('storage', (event) => {
    if (event.key === sketch.KEY) sketch.doc = sketch.stored() ?? sketch.doc;
    refresh();
  });

  // What the window shows is kept for every view that shows the same way - along the plot or
  // across it, and from above or standing up - in cells, so that a thing lies in the same place
  // on the screen in each; a flipped view has it at the other end. The first time, the corner.
  const [LEFT, DOWN] = [PLANE === 'end' ? 'across' : 'left', PLANE === 'top' ? 'top' : 'side'];
  const mirrored = (left) => (FLIP ? paper.WIDE - left - scroller.clientWidth / zoom.px : left);
  views.keep(() => {
    const at = { [LEFT]: mirrored(zoom.left), [DOWN]: zoom.top };
    const set = { tool, kind, turned, high, px: zoom.px };
    return { ...set, picked: sketch.doc.things.indexOf(picked), ...at };
  });
  $('credit').textContent = SITE.credit;
  zoom.place(seen[LEFT] === undefined ? 0 : mirrored(seen[LEFT]), seen[DOWN] ?? 0);
  [sketch.onChange, zoom.onChange, lineTool.onChange] = [refresh, draw, render];
  refresh();
  draw(); // At once, and not at the next frame.
})();
