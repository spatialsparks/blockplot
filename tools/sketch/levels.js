// What is done to a whole level of the top view: making one by hand, lifting or lowering it
// with all that stands on it, taking it away.
(() => {
  const { paper, sketch, blocks } = globalThis;
  const { CELL_M, SPANS } = paper;
  // The rows of the side view's paper: a level stands on one of them.
  const ROWS_UP = (SPANS.side[1] - SPANS.side[0]) / CELL_M;

  /** A level made by hand, at a height in metres above sea level, for the top view to draw on. */
  function newLevel(metres) {
    const row = Math.round((SPANS.side[1] - metres) / CELL_M);
    if (!(row > 0 && row <= ROWS_UP)) return false;
    sketch.change((doc) => {
      if (!sketch.levels().includes(row)) doc.floors.push(row);
      doc.on.top = row;
    });
    return true;
  }

  /** All that stands on a level of the top view, or lies on its ground: the things, the notes. */
  const stood = (doc, floor) => ({
    things: doc.things.filter((t) => (sketch.isBox(t) ? t.z[1] : t.floor) === floor),
    notes: doc.notes.filter((note) => note.view === 'top' && note.at === floor),
  });

  /** Lifts or lowers a level with all that stands on it, by a number of rows, on the paper: a box with its slope. */
  function shiftLevel(floor, by) {
    if (!(floor + by > 0 && floor + by <= ROWS_UP)) return;
    sketch.change((doc) => {
      const { things, notes } = stood(doc, floor);
      for (const t of things) {
        if (sketch.isBox(t))
          Object.assign(t, blocks.carried(t, { ...t, z: [t.z[0] + by, t.z[1] + by] }));
        else t.floor += by;
      }
      for (const note of notes) note.at += by;
      doc.floors = doc.floors.map((row) => (row === floor ? row + by : row));
      if (doc.show.top[floor]) doc.show.top[floor + by] = doc.show.top[floor];
      delete doc.show.top[floor];
      if (doc.on.top === floor) doc.on.top = floor + by;
    });
  }

  /** Takes away a level, or clears the ground, with all that stands on it. */
  function removeLevel(floor) {
    sketch.change((doc) => {
      const { things, notes } = stood(doc, floor);
      doc.things = doc.things.filter((t) => !things.includes(t));
      doc.notes = doc.notes.filter((note) => !notes.includes(note));
      doc.floors = doc.floors.filter((row) => row !== floor);
    });
  }

  Object.assign(sketch, { newLevel, shiftLevel, removeLevel, stood });
})();
