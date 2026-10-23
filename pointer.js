// The pointer on the pad's paper (index.html): where it is, in cells, and what Select has there.
// Cut out of page.js, whole, for the right button's menu asks the same (right-menu.js, T-037.5):
// `pointer.at(event)`, `pointer.grab(at)` and `pointer.reach()`. Loaded by index.html after the
// sketch, its strokes and lines/model.js, and before lines/tool.js, right-menu.js and page.js.
(() => {
  const { document, paper, sketch, zoom } = globalThis;
  const { PLANE, shown } = paper;
  // How near an edge of a box, or the line of a slice, the pointer has it, in screen pixels.
  const GRAB_PX = 6;
  const canvas = document.getElementById('paper');

  /** How near the pointer has a thing, in cells of the paper as it is drawn now. */
  const reach = () => GRAB_PX / zoom.px;

  /**
   * What Select has at a place: a label; a line of the layer drawn on, the one drawn last, by its
   * place among the notes (lines/model.js, asked only of a note that is a line); a thing of that
   * layer - or, in the top view and where none is, the line of a slice.
   */
  function grab(at) {
    const [near, { lines }] = [reach(), globalThis];
    const label = sketch.labelAt(at);
    if (label >= 0) return { label, zone: 'move' };
    const on = (note) => note.line && lines.here(note, PLANE, sketch.on());
    const line = sketch.doc.notes.findLastIndex(
      (note) => on(note) && lines.near(note.line, at, near),
    );
    if (line >= 0) return { line, zone: 'move' };
    const thing = sketch.grab(at, near);
    if (thing || PLANE !== 'top') return thing;
    if (Math.abs(at[1] - sketch.on('side')) <= near) return { cut: 'side', zone: 'n' };
    return Math.abs(at[0] - sketch.on('end')) <= near ? { cut: 'end', zone: 'e' } : null;
  }

  /**
   * The pointer's place on the plane's paper, in cells, wherever it is: the paper has no edge
   * (ST-042). The window shows the place `zoom.left`, `zoom.top` at its top left corner, and in
   * a flipped view its columns count from the right (`paper.shown`).
   */
  function at(event) {
    const box = canvas.getBoundingClientRect();
    const column = zoom.left + (event.clientX - box.left) / zoom.px;
    return [shown(column), zoom.top + (event.clientY - box.top) / zoom.px];
  }

  globalThis.pointer = { grab, at, reach };
})();
