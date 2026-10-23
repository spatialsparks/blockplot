// Sketches from before the two views shared one space. Each view had a sketch of its own, of
// sheets of blocks - or, older still, of coloured cells. What they hold is brought over as
// things and notes of the space; they themselves stay in the browser as they are.
(() => {
  const { localStorage, paper, blocks } = globalThis;
  const { CELL_M, SPANS, ACROSS } = paper;
  // How high a block of the top view becomes where the side view had none on its level.
  const STOREY_ROWS = 3 / CELL_M;
  // Where a block of the side view lies across the plot: about its middle, 6 m deep.
  const MIDDLE = Math.round(ACROSS / 2);
  const DEEP = [MIDDLE - 3 / CELL_M, MIDDLE + 3 / CELL_M];
  const keyOf = (view) => `blockplot/sketch/${view}`;
  const lists = (s) => [s?.blocks, s?.lines, s?.labels].every((list) => Array.isArray(list));

  /** An old sketch of a view, as parsed, with its sheets of cells turned into sheets of blocks. */
  function sheets(d) {
    if (!['top', 'side'].includes(d?.view) || !Array.isArray(d.sheets)) return null;
    for (const s of d.sheets) {
      if (Object(s?.cells) === s?.cells && !s.blocks && Array.isArray(s.lines)) {
        s.blocks = blocks.ofCells(s.cells, s.lines.filter(Array.isArray));
      }
    }
    return d.sheets.every(lists) ? d : null;
  }

  /**
   * What an old sketch holds, for the space. Of the side view, the sheet that was drawn on: its
   * blocks become boxes 6 m deep, about the middle of the plot. Of the top view, every sheet: a
   * level's blocks become boxes that stand on that level, a storey high; the blocks of a sheet
   * without a level have no height to stand at, and stay flat, on the ground. `left` says how
   * many sheets of the side view were not brought over.
   */
  function convert(d) {
    const things = [];
    const notes = [];
    const note = (s, at) => {
      for (const line of s.lines) notes.push({ view: d.view, at, line });
      for (const label of s.labels) notes.push({ view: d.view, at, label });
    };
    if (d.view === 'side') {
      const s = d.sheets[d.current] ?? d.sheets[0];
      for (const [left, top, right, bottom, colour] of s?.blocks ?? []) {
        things.push({ x: [left, right], y: [...DEEP], z: [top, bottom], colour });
      }
      if (s) note(s, MIDDLE);
      return { view: d.view, things, notes, left: Math.max(0, d.sheets.length - 1) };
    }
    for (const s of d.sheets) {
      const floor = Number.isFinite(s.level)
        ? Math.round((SPANS.side[1] - s.level) / CELL_M)
        : 'ground';
      for (const block of s.blocks) {
        const [left, top, right, bottom, colour] = block;
        const box = { x: [left, right], y: [top, bottom], z: [floor - STOREY_ROWS, floor], colour };
        if (floor === 'ground') notes.push({ view: 'top', at: floor, flat: block });
        else things.push(box);
      }
      note(s, floor);
    }
    return { view: d.view, things, notes, left: 0 };
  }

  /** The old sketches that this browser keeps, as things and notes; null where there are none. */
  function read() {
    const found = ['side', 'top'].flatMap((view) => {
      try {
        const d = sheets(JSON.parse(localStorage.getItem(keyOf(view))));
        return d?.view === view ? [convert(d)] : [];
      } catch {
        return [];
      }
    });
    if (found.length === 0) return null;
    // A box of the top view is as high as the side view's box on its level, where there is one.
    const standing = found.filter((part) => part.view === 'side').flatMap((part) => part.things);
    for (const t of found.filter((part) => part.view === 'top').flatMap((part) => part.things)) {
      const beside = standing.find((box) => box.z[1] === t.z[1]);
      if (beside) t.z = [t.z[1] - (beside.z[1] - beside.z[0]), t.z[1]];
    }
    const left = found.reduce((sum, part) => sum + part.left, 0);
    const all = (list) => found.flatMap((part) => part[list]);
    return { things: all('things'), notes: all('notes'), left };
  }

  /** A file of an old sketch, as what it holds for the space; null where it is none. */
  function file(d) {
    const old = sheets(d);
    return old ? convert(old) : null;
  }

  globalThis.legacy = { read, file };
})();
