// The parts of the blocks: the rules that make the house of the boxes that were drawn - floors
// and roofs, and after them walls, railings and glass. It imports its neighbours and names no
// global.
//
// HOW A RULE IS ADDED. A rule is a function in a module of its own beside this one, with a
// check of its own beside it, and one line in `RULES`. All it needs is said here.
//
// A rule is `(context, at)`: the parts of the one box at place `at` of `context.things`. It is
// called once for every box of every block, in the order of the things, before any object is
// asked. `context` is one for the whole scene, and holds:
// - `things`: the sketch's things, each a box in cells - `x`, `y`, `z: [top, bottom]` - a block
//   with its `name`, `group` and `as` where it has them, an object with `kind`, `turn` and
//   `floor`, the row it stands on (scene.js)
// - `figures`: the eight of the house, in metres - `outerWallM`, `innerWallM`, `floorSlabM`,
//   `roofSlabM`, `railingHighM`, `doorHighM`, `windowHighM`, `sillHighM`
// - `space`: `who(column, row, level)`, the place of the block that holds a cell, or -1;
//   `same(a, b)`, whether two boxes are one block; `asOf(at)`, what a block counts as - `ROOM`,
//   `OPEN` or `GLASS`, and null where none is; `nameOf(at)`, its name (space.js)
// - `xOf(column)`, `yOf(row)`, `hOf(level)`: where a line of the grid lies, in metres; and
//   `boxOf(cells)`: a box of cells - a thing, a piece of a face - as `{ min, max }` in metres.
//   A block and a piece of a face are the cells they are. An object - what has a `kind` - is
//   given its box fitted between the walls of its room: moved clear of them, and cut where
//   the room is too small for it (clear.js). A door and a window keep theirs
// - `groundAt(column, row)`: the ground in metres above sea level, at a place of the top
//   view's paper, between the lines of the grid too
// - `lift(at)`: how far the object at a place is lifted, for it stands on its floor's slab,
//   in metres - what an opening for a door begins at, above the door's `floor` (parts.js)
// - `take(at)`: has the object at that place give no part of its own - a door that is an
//   opening of a wall, whose parts are the wall's. A rule may take one twice, and two rules
//   the same one; `taken(at)` says whether one was
// Beside it, `pieces(box, face, tell)` of space.js cuts a face of the box into rectangles by
// what lies beyond it, and `floorUnder(context, cell)` and `roofOver(context, cell)` of
// slabs.js say how thick a slab lies under a cell and over one: build on it, and up to it.
// `floorWhole(context, cell)` stands beside `floorUnder`: the floor's thickness with no
// opening, where a staircase comes up through it - what lifts, and what raises a door. Which
// wall a room has on a face, and how thick, faces.js says, for the walls and the slabs alike;
// and `wallOn(context, cell, face)` of walls.js, how thick a wall stands on a face of a cell.
//
// A rule gives a list of parts, each plain data: `of`, `shape`, `min`, `max`, `surface`, and
// `over: true` on what closes the block from above (parts.js has the words). It says neither
// `thing` nor `floor`: both are given to it, and are the box's at `at`. And two things hold of
// every part it gives (holds.js): it lies within the box at `at` - thickness is taken from
// inside, so a wall between two rooms is two halves, each its room's - and it lies in no part
// of a block that is of another surface, though it may touch one.
//
// The check of a rule makes its own house up, in cells, and asks its rule alone - `sceneOf(site,
// things, figures, { blocks: [rule] })` - against parts worked out by hand: asked of the house's
// own list, it would break with the next rule. And it has `amiss` of holds.js find nothing in
// that house with every rule there is. house.check.js tries all rules together on one house.
import { glass } from './glass.js';
import { railings } from './open.js';
import { slabs } from './slabs.js';
import { walls } from './walls.js';

/** The rules of blocks. A box's parts come in the order of the list. */
export const RULES = [
  slabs, // floors and roofs
  walls, // walls, and the openings of doors and windows
  railings, // open air: a railing along every edge of a floor that has a drop beside it
  glass, // glass: panes in thin frames, on the faces and on the top
];
