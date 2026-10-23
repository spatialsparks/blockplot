// A block is a box of cells on the grid: its left, top, right and bottom edge, and its colour.
// Here: finding the block the pointer grabs and by which edge, and moving or resizing it cell by
// cell; cutting a box out of a box; the edge of boxes taken together. And the blocks of a
// sketch from before there were any: one for every box of cells. Then what a block of the sketch
// counts as - a room, open air, glass, ground or a cut - by what its boxes say, or else by its
// category, picked or read off its name (categories.js). And last, the top of a box that
// slopes, the one reading of `slope`: what the box says of it, where its top lies and how high
// it then is, its slope where it goes, what a plane shows of its top, and what the box then
// fills of that plane and covers of it: the picture, and the number.
(() => {
  /**
   * The topmost block at a place, and how the pointer has it there: by an edge or a corner -
   * 'n', 'e', 'sw' and so on, as on a compass with the top of the paper as north - or by its
   * middle, 'move'. `reach` is how near an edge counts as on it, in cells. Null where none is.
   */
  function grab(blocks, [x, y], reach) {
    for (let index = blocks.length - 1; index >= 0; index -= 1) {
      const [left, top, right, bottom] = blocks[index];
      const within =
        x >= left - reach && x <= right + reach && y >= top - reach && y <= bottom + reach;
      if (within) {
        const upright = y - top <= reach ? 'n' : bottom - y <= reach ? 's' : '';
        const level = x - left <= reach ? 'w' : right - x <= reach ? 'e' : '';
        return { index, zone: upright + level || 'move' };
      }
    }
    return null;
  }

  /**
   * A block moved by whole cells, or resized by the edges it is grabbed by - as far as it is
   * taken: the paper has no edge (ST-042). An edge stops a cell short of the one across from it.
   */
  function reshape([left, top, right, bottom, colour], zone, dx, dy) {
    if (zone === 'move') return [left + dx, top + dy, right + dx, bottom + dy, colour];
    return [
      zone.includes('w') ? Math.min(left + dx, right - 1) : left,
      zone.includes('n') ? Math.min(top + dy, bottom - 1) : top,
      zone.includes('e') ? Math.max(right + dx, left + 1) : right,
      zone.includes('s') ? Math.max(bottom + dy, top + 1) : bottom,
      colour,
    ];
  }

  /**
   * The blocks of a sheet that was coloured cell by cell, as sketches were before there were
   * blocks: every box of one colour, as long and as high as it runs, and cut where a line was
   * drawn across it. `cells` has a colour for each "x,y"; every cell ends up in one block.
   */
  function ofCells(cells, lines) {
    const rows = new Map();
    for (const [key, colour] of Object.entries(cells)) {
      const [x, y] = key.split(',').map(Number);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push([x, colour]);
    }
    const cut = (y, left, right) =>
      lines.some(
        ([x1, y1, x2, y2]) =>
          y1 === y && y2 === y && Math.min(x1, x2) < right && Math.max(x1, x2) > left,
      );
    const found = [];
    // The blocks that reach down to the row above, by where they run and in what colour.
    let above = new Map();
    for (const y of [...rows.keys()].sort((a, b) => a - b)) {
      // A row's runs: neighbours of one colour, from the left of the first to the right of the last.
      const runs = [];
      for (const [x, colour] of rows.get(y).sort(([a], [b]) => a - b)) {
        const last = runs.at(-1);
        if (last?.right === x && last.colour === colour) last.right = x + 1;
        else runs.push({ left: x, right: x + 1, colour });
      }
      const here = new Map();
      for (const { left, right, colour } of runs) {
        const key = `${left},${right},${colour}`;
        let block = above.get(key);
        // A run goes on with the block above it, unless a line parts them: then it starts one.
        if (block?.[3] !== y || cut(y, left, right)) {
          block = [left, y, right, y, colour];
          found.push(block);
        }
        block[3] = y + 1;
        here.set(key, block);
      }
      above = here;
    }
    return found.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  }

  /**
   * What is left of a rect once another is cut out of it: up to four rects - above the cut,
   * below it, and to its left and right between the two - or none, where it lay wholly in it.
   */
  function minus([left, top, right, bottom], [cutLeft, cutTop, cutRight, cutBottom]) {
    const apart = cutLeft >= right || cutRight <= left || cutTop >= bottom || cutBottom <= top;
    if (apart) return [[left, top, right, bottom]];
    const [upper, lower] = [Math.max(top, cutTop), Math.min(bottom, cutBottom)];
    return [
      [left, top, right, cutTop],
      [left, cutBottom, right, bottom],
      [left, upper, cutLeft, lower],
      [cutRight, upper, right, lower],
    ].filter(([l, t, r, b]) => l < r && t < b);
  }

  /**
   * The edge of rects taken together, in pieces a cell long: [x1, y1, x2, y2] each. Where two
   * of the rects meet there is no edge. The rects are of whole cells and do not overlap.
   */
  function outline(rects) {
    const edges = new Map();
    // An edge that two rects have is inside the shape: the second takes it away again.
    const flip = (...edge) => {
      if (!edges.delete(edge.join())) edges.set(edge.join(), edge);
    };
    for (const [left, top, right, bottom] of rects) {
      for (let x = left; x < right; x += 1) {
        flip(x, top, x + 1, top);
        flip(x, bottom, x + 1, bottom);
      }
      for (let y = top; y < bottom; y += 1) {
        flip(left, y, left, y + 1);
        flip(right, y, right, y + 1);
      }
    }
    return [...edges.values()];
  }

  /** How many cells rects cover together: where they lie in each other, a cell counts once. */
  function area(rects) {
    let covered = 0;
    rects.forEach((rect, index) => {
      // What the rects before it cover already is cut out of this one.
      let rest = [rect];
      for (const before of rects.slice(0, index))
        rest = rest.flatMap((part) => minus(part, before));
      for (const [left, top, right, bottom] of rest) covered += (right - left) * (bottom - top);
    });
    return covered;
  }

  // What a block can count as: a room, with a floor, walls and a ceiling; open air, a floor with
  // neither; glass, walls and roof (story ST-024); ground, of which the top counts (ST-027); or
  // a cut, of which the floor counts: it takes ground away, and is no part of a house (ST-028).
  const COUNTS_AS = ['room', 'open', 'glass', 'ground', 'cut'];

  /**
   * What a block counts as, of its boxes as `sketch.blockOf` gives them: `{ as, by }` - the one
   * answer, for whoever needs it. `as` is one of the five words. `by` is 'is' where a box says
   * so itself - `is`, one of the five: of several boxes the first that does counts, as with a
   * name. Where none does, or says anything else, the block's category says it (categories.js,
   * asked when this is asked, and not as this script loads): `by` is 'category' where one was
   * picked, and 'name' where the block's name gave it - or gave none: then it is a room.
   */
  function countsAs(boxes) {
    const said = boxes.find((box) => COUNTS_AS.includes(box.is))?.is;
    if (said) return { as: said, by: 'is' };
    const { category, by } = globalThis.categories.of(boxes);
    return { as: category?.as ?? 'room', by: by === 'picked' ? 'category' : 'name' };
  }

  // The top of a box may slope (story ST-026). The box says so under `slope`: a plane that falls
  // along one of the plot's two axes, said at two lines of the grid - columns under `x`, or rows
  // of the top view under `y`, in the counts of the paper, as the box's own extents are, and not
  // counted from the box - with, under `z`, the row of a standing view that the top lies in at
  // each of the two. Rows count downward: the larger lies lower.
  const SLOPE_AXES = ['x', 'y'];
  const wholePair = (pair) =>
    Array.isArray(pair) && pair.length === 2 && pair.every(Number.isInteger);

  /**
   * What a box says of a top that slopes: `{ axis, at, z }` - the axis the plane falls along,
   * 'x' or 'y', the two lines it is said at, and the row its top lies in at each - or null,
   * where it says nothing. What is no slope says nothing, as with `is`: no object under `slope`;
   * both axes, or neither; lines that are not two whole numbers with the first the smaller; rows
   * that are not two whole numbers, or do not differ. The box is level then, and the field stays
   * in the sketch as it was written: no reading refuses a sketch for it.
   */
  function slopeOf(box) {
    const said = box?.slope;
    if (Object(said) !== said) return null;
    const axes = SLOPE_AXES.filter((axis) => said[axis] !== undefined);
    const [at, z] = [said[axes[0]], said.z];
    if (axes.length !== 1 || !wholePair(at) || !wholePair(z)) return null;
    return at[0] < at[1] && z[0] !== z[1] ? { axis: axes[0], at: [...at], z: [...z] } : null;
  }

  /**
   * The top of a box that slopes: `{ axis, rows }` - the row of a standing view that its top
   * lies in at the box's own two ends along that axis, `box[axis][0]` and `box[axis][1]`. Each
   * is where the plane of `slopeOf` lies there, on the straight line through its two ends and
   * on past them - and no higher than the box's top, `z[0]`, nor lower than its floor, `z[1]`:
   * a slope takes away from the top of a box, and adds nothing to it (story ST-026, rule 2).
   * Between its two ends the top of a box is one straight line. Null where the two rows are
   * the same: the top is level, and the box a box - one that says no slope, and one that the
   * plane lies wholly over, or wholly under.
   *
   * So a box cut out of a sloping one lies on the same plane, with rows that need be no whole
   * numbers, and one made longer past an end of the slope has its own top or its own floor there.
   */
  function topOf(box) {
    const slope = slopeOf(box);
    if (slope === null) return null;
    const { axis, at, z } = slope;
    const [top, floor] = box.z;
    // Whole numbers are multiplied before they are divided: a row that is whole comes out whole.
    const planeAt = (line) => z[0] + ((line - at[0]) * (z[1] - z[0])) / (at[1] - at[0]);
    const rows = box[axis].map((line) => Math.min(Math.max(planeAt(line), top), floor));
    return rows[0] === rows[1] ? null : { axis, rows };
  }

  /**
   * Whether a slope leaves anything of a box: nothing where its plane lies in the row of the
   * box's floor, or lower, at both of the box's own ends along it. A cut lays no such piece.
   */
  function remains(box) {
    const { axis, at, z } = slopeOf(box) ?? {};
    const planeAt = (line) => z[0] + ((line - at[0]) * (z[1] - z[0])) / (at[1] - at[0]);
    return !axis || box[axis].some((line) => planeAt(line) < box.z[1]);
  }

  /**
   * How high a box is from end to end, in rows: from its floor up to its top - and under a top
   * that slopes up to the mean of its two ends, for between them the top is one straight line.
   * The floor of a box times this is what the box holds.
   */
  function highOf(box) {
    const top = topOf(box);
    return box.z[1] - (top ? (top.rows[0] + top.rows[1]) / 2 : box.z[0]);
  }

  /**
   * A box as it is to lie, `now`, with the slope of the box it `was` where the box went. Moved,
   * its plane is moved as far: along its axis the two lines, up or down the two rows - and the
   * rows go with its top edge, where that alone is moved. An end made longer or shorter, or its
   * floor moved, leaves the plane where it is: the box reaches as far along it as it reaches.
   * The slope is a new one: the pieces of a cut box share theirs, so none is changed in place.
   */
  function carried(was, now) {
    const slope = slopeOf(was);
    if (slope === null) return now;
    const { axis, at, z } = slope;
    const went = (extent, end) => now[extent][end] - was[extent][end];
    // Both ends went as far: the box was moved along its slope. One alone: it is longer or shorter.
    const [along, up] = [went(axis, 0) === went(axis, 1) ? went(axis, 0) : 0, went('z', 0)];
    if (along === 0 && up === 0) return now;
    const moved = (counts, by) => counts.map((count) => count + by);
    return { ...now, slope: { ...was.slope, [axis]: moved(at, along), z: moved(z, up) } };
  }

  // Of a box's two extents on the ground, the one that the paper of a standing plane runs along.
  const RUNS_ALONG = { side: 'x', end: 'y' };

  /**
   * What a box shows of its top on a plane, 'top', 'side' or 'end' - or null where its top is
   * level. On a standing plane `ends`, the row its top is drawn in at the left of its rect and
   * at the right: its own two ends where the paper runs along the slope - and where the view
   * looks along it its higher end at both, with `low`, the row of its lower end, for a line
   * across it. From above `falls`, the step on the paper that leads down it: [1, 0] down the plot.
   */
  function topOn(box, plane) {
    const top = topOf(box);
    if (top === null) return null;
    const { axis, rows } = top;
    // Rows count downward: the end in the larger row is the lower one.
    const way = rows[0] < rows[1] ? 1 : -1;
    if (plane === 'top') return { falls: axis === 'x' ? [way, 0] : [0, way] };
    if (RUNS_ALONG[plane] === axis) return { ends: rows };
    return { ends: [Math.min(...rows), Math.min(...rows)], low: Math.max(...rows) };
  }

  /**
   * What a box fills of a plane, as its rect there says it lies: the rect, and after it the rows
   * its top is drawn in at its left and at its right (`topOn`) - the rect's own top where the
   * top is level, and from above. One shape for the picture and for the number: draw.js fills
   * it, and `covers` says how large it is.
   */
  function fills(box, plane, rect) {
    return [...rect, ...(topOn(box, plane)?.ends ?? [rect[1], rect[1]])];
  }

  /**
   * How much of a plane a box covers, in cells: what the paper fills of it there. From above its
   * rect; standing, as far as it runs times how high it is under its top - the mean of two ends.
   */
  function covers(box, plane, rect) {
    const [left, , right, bottom, atLeft, atRight] = fills(box, plane, rect);
    return (right - left) * (bottom - (atLeft + atRight) / 2);
  }

  const tops = { slopeOf, topOf, highOf, remains, carried, topOn, fills, covers };
  globalThis.blocks = { grab, reshape, minus, outline, area, ofCells, countsAs, ...tops };
})();
