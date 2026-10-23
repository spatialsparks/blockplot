// A top that slopes, pulled with the pointer (story ST-026): with Select, in a standing view and
// with Shift held, a top corner of a box is pulled by whole rows. That end of its top goes as
// many rows down or up as the pointer went, from where it lay - no higher than the box's top, no
// lower than its floor - and its other end lies at the box's top. The box then says its `slope`
// anew, from its own two ends along this view's paper and those two rows - or says none, where
// its top is level again. So the other corner makes it fall the other way, a top that fell
// across the paper falls along it, and a box of a block is pulled alone. Without Shift a corner
// makes the box larger, as ever; and Shift on an edge, on the middle of a box, on an object or
// in the top view changes nothing of what Select does. `apply` of strokes.js hands a stroke that
// pulls to `pull`, and page.js shows what `pulled` gives of it while the pointer is down.
(() => {
  const { paper, blocks, sketch } = globalThis;
  const { PLANE, INK } = paper;
  // Of a box's three extents, the one that runs along the paper of this plane.
  const [ALONG] = sketch.AXES[PLANE];
  // The top corners of a box, as `blocks.grab` names them, and which end of its top each has.
  const CORNERS = { nw: 0, ne: 1 };

  /** Whether a stroke pulls a top: Select has a top corner of a box, in a standing view, and is to `slope` it. */
  const pulls = ({ tool, grabbed }) =>
    tool === 'move' &&
    PLANE !== 'top' &&
    Boolean(grabbed?.slope) &&
    Object.hasOwn(CORNERS, grabbed.zone);

  /**
   * A top as a stroke has pulled it so far: the box, its rect on this paper, and the `rows` its
   * top lies in at the left of that rect and at the right - as it will lie, or, where the pull
   * leaves it `same`, as it lies: the pointer is in the row it went down in, or the end is at
   * the box's top or at its floor already, and cannot go further.
   */
  function reached({ from, to, grabbed }) {
    const { thing, rect } = sketch.layer(PLANE, sketch.on()).things[grabbed.at];
    const [top, floor] = thing.z;
    const lies = blocks.topOn(thing, PLANE)?.ends ?? [top, top];
    const end = CORNERS[grabbed.zone];
    const went = Math.round(to[1] - from[1]);
    const row = Math.min(Math.max(Math.round(lies[end] + went), top), floor);
    if (went === 0 || row === lies[end]) return { thing, rect, rows: lies, same: true };
    return { thing, rect, rows: end === 0 ? [row, top] : [top, row], same: false };
  }

  /**
   * What a stroke that pulls a top does to the sketch, inside one change of it - and whether the
   * stroke was one: of any other nothing is done, and Select moves or resizes. The box gets a
   * `slope` of its own, and never a changed one: the pieces of a box that was cut share theirs.
   * Pulled back to the box's top, it says none: the box has the fields it had.
   */
  function pull(stroke) {
    if (!pulls(stroke)) return false;
    const { thing, rows, same } = reached(stroke);
    if (same) return true;
    if (rows[0] === rows[1]) delete thing.slope;
    else thing.slope = { [ALONG]: [...thing[ALONG]], z: rows };
    return true;
  }

  /** What the paper shows of a stroke that pulls a top: the line of the top as it will be. Null of any other stroke. */
  function pulled(stroke) {
    if (!pulls(stroke)) return null;
    const { rect, rows } = reached(stroke);
    const line = [
      [rect[0], rows[0]],
      [rect[2], rows[1]],
    ];
    return { line, colour: INK };
  }

  Object.assign(sketch, { pull, pulled });
})();
