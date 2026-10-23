// The space of cells: the grid the sketch is drawn on, in its own three counts - a column along
// the plot, a row of the top view across it, and a row of a standing view, a level, counted
// from the top of the paper down. A cell is named by the first of each: a box of `x: [3, 5]`
// holds the columns 3 and 4, and one of `z: [6, 10]` the levels 6 to 9, the cell of level 9
// lying lowest. A cell is written `[column, row, level]`.
//
// Here a rule of parts asks which block holds a cell and what that block is, has a face of a
// box cut into pieces by what lies on either side of it, and turns a box of cells into metres.
// A block lies on whole cells; an object need not, and holds no cell. Of two blocks drawn into
// each other the later one holds the cell, and nothing more is promised of them. It imports
// nothing and names no global.

/** What a block counts as: a room, with a floor, walls and a ceiling; open air; or glass. */
export const ROOM = 'room';
export const OPEN = 'open';
export const GLASS = 'glass';

/** Whether a thing is a block - a box that was drawn - and no object: an object has a kind. */
export const isBlock = (thing) => thing.kind === undefined;

/**
 * A box of cells in metres, by a frame - `xOf(column)`, `yOf(row)`, `hOf(level)` - as
 * `{ min, max }`, each `[x, y, h]`. Rows count down both papers and metres count up, so the
 * second row is the lower figure: the one place where a box is turned over. The box is a thing
 * or a piece of a face, of whole cells or not.
 */
export const metres = ({ xOf, yOf, hOf }, { x, y, z }) => ({
  min: [xOf(x[0]), yOf(y[1]), hOf(z[1])],
  max: [xOf(x[1]), yOf(y[0]), hOf(z[0])],
});

/**
 * The space of a sketch's things, as the scene gets them (scene.js). A place is a place in
 * `things`, which is a solid's place too.
 * - `who(column, row, level)`: the place of the block whose box holds that cell, or -1 where
 *   none does. Of two boxes that hold one cell, the later.
 * - `same(a, b)`: whether the boxes at two places are one block - one thing, or two of one
 *   `group`. Never, where either is -1.
 * - `asOf(at)`: what the block of the box at a place counts as - ROOM, OPEN or GLASS. A box
 *   says so as `as`, and of a block's boxes the first that says one of the three speaks for
 *   all; a block that says nothing is a room. Null where no block is: at -1, or at an object.
 * - `nameOf(at)`: the name of that block - of its boxes, the first that has one - or ''.
 */
export function spaceOf(things) {
  // For each column of cells - a column and a row of the top view - the places of the boxes
  // that stand in it, in their order.
  const stacks = new Map();
  things.forEach((thing, at) => {
    if (!isBlock(thing)) return;
    for (let column = thing.x[0]; column < thing.x[1]; column += 1) {
      for (let row = thing.y[0]; row < thing.y[1]; row += 1) {
        const key = `${column} ${row}`;
        if (!stacks.has(key)) stacks.set(key, []);
        stacks.get(key).push(at);
      }
    }
  });
  const who = (column, row, level) => {
    const holds = (at) => things[at].z[0] <= level && level < things[at].z[1];
    return stacks.get(`${column} ${row}`)?.findLast(holds) ?? -1;
  };
  const same = (a, b) => {
    if (a < 0 || b < 0) return false;
    const { group } = things[a];
    return a === b || (group !== undefined && group === things[b].group);
  };
  // What a block says is what the first of its boxes says that says it at all: so the pad
  // reads a block's name, and what it counts as (blocks.js).
  const said = (at, key, counts) =>
    things.find((thing, other) => isBlock(thing) && same(at, other) && counts(thing[key]))?.[key];
  const counted = things.map((thing, at) =>
    isBlock(thing) ? (said(at, 'as', (word) => [ROOM, OPEN, GLASS].includes(word)) ?? ROOM) : null,
  );
  const names = things.map((thing, at) =>
    isBlock(thing) ? (said(at, 'name', Boolean) ?? '') : '',
  );
  return { who, same, asOf: (at) => counted[at] ?? null, nameOf: (at) => names[at] ?? '' };
}

// The faces of a box: the extent each lies across, and at which of that extent's two figures.
const FACES = {
  x0: ['x', 0],
  x1: ['x', 1],
  y0: ['y', 0],
  y1: ['y', 1],
  z0: ['z', 0],
  z1: ['z', 1],
};
// The squares of a face lie in rows: the extent a row runs along, and the extent the rows follow
// each other in. On a standing face a row is a level; on a lying one, a row of the top view.
const ROWS = { x: ['y', 'z'], y: ['x', 'z'], z: ['x', 'y'] };

/**
 * A face of a box, cut into rectangles of whole cells by what `tell` says of each of its cell
 * squares. `box` is a box in cells, as a block is one. `face` is `x0`, `x1`, `y0`, `y1`, `z0`
 * or `z1`: the face at the first or the second figure of that extent - `z0` is the top of a
 * box and `z1` its bottom, `y0` its side up the top view's paper.
 *
 * `tell(within, beyond)` gets, for one square, the cell inside the box at that square and the
 * cell beyond the face, each `[column, row, level]`, and gives a word - or null, for no piece
 * there. A run of one word along a row is one rectangle, and equal runs in rows next to each
 * other are one: so a wall comes as a whole wall, and not a cell at a time.
 *
 * It gives the pieces in the order they begin, row by row and along a row, each
 * `{ word, x, y, z }`: a box in cells as a thing is one, and flat - across the face, both
 * figures are the face's own. `metres` turns it into the rectangle it is.
 */
export function pieces(box, face, tell) {
  const [across, side] = FACES[face];
  const [along, down] = ROWS[across];
  const plane = box[across][side];
  const [within, beyond] = side === 0 ? [plane, plane - 1] : [plane - 1, plane];
  const cell = (run, row, depth) => {
    const at = { [across]: depth, [along]: run, [down]: row };
    return [at.x, at.y, at.z];
  };
  const found = [];
  // The runs of the row before, each with the piece it belongs to.
  let above = new Map();
  for (let row = box[down][0]; row < box[down][1]; row += 1) {
    const here = new Map();
    let open = null;
    // One step past the row's end closes the run that reaches it.
    for (let run = box[along][0]; run <= box[along][1]; run += 1) {
      const inRow = run < box[along][1];
      const word = inRow ? (tell(cell(run, row, within), cell(run, row, beyond)) ?? null) : null;
      if (open !== null && open.word !== word) {
        const key = `${open.from} ${run} ${open.word}`;
        const piece = above.get(key) ?? {
          word: open.word,
          [across]: [plane, plane],
          [along]: [open.from, run],
          [down]: [row, row],
        };
        if (!above.has(key)) found.push(piece);
        piece[down] = [piece[down][0], row + 1];
        here.set(key, piece);
        open = null;
      }
      if (open === null && word !== null) open = { word, from: run };
    }
    above = here;
  }
  return found.map(({ word, x, y, z }) => ({ word, x, y, z }));
}
