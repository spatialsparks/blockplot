// The sketch as the scene wants it, and what else the 3D view has of the pad. This is the one
// file of the 3D view that names the pad's globals - the site, the paper, the shapes, the
// blocks, the figures, the sketch and the switch of views, which the page's plain scripts set up
// before a module runs, and the list of the categories, which it asks for when a thing is read -
// and the one that reads the browser's store. Where a thing lies is the pad's to say, once:
// every box here comes from `sketch.rect`, so the top view, the slices and the 3D view cannot
// disagree (story ST-023, rule 2). What a block counts as, where its top lies where that slopes,
// what the figures of the house are, how a level and a side are named, and whether a key is a
// field's are the pad's to say too.
//
// And so is the ground (story ST-027, rule 2). The blocks of a sketch that count as ground shape
// it, by the pad's one rule, and the paper holds the answer: this file has the paper settle it,
// hands the scene the plot with that ground - the paper's own grid, or near and far (reach.js) -
// and hands on no box of a block of ground, which is the hill where it lies and no thing of the
// scene. Neither is a cut (story ST-028), a block that takes ground away: no box of it is handed
// on, so it is no solid, has no part of a house and gives no level, whatever names it so.
//
// And so is what a block is called where a category was picked for it (story ST-028). The scene
// reads two things off a block's name: what its floor is made of (scene/surfaces.js), and
// whether it is a flight's own room (scene/flights.js). So every box of a block with a picked
// category is handed on under the name of that category, as the pad's list shows it - "Garden",
// "Bathroom", "Staircase" - and the scene reads the pick where it read a name: no module of it
// knows of a category. The name that the owner gave such a block is not handed on. Every other
// box has its own name, or none: a category that a name gives is that name, read as ever.
//
// And it is the one file through which the 3D view writes the sketch: a figure of the house,
// typed in Settings or set back to its default, and nothing else of it (story ST-024, rule 1).
// A figure is written as the pad writes a stroke, by the pad's own way of changing the sketch:
// kept in the browser at once, and a step that the pad's Undo takes back. All else the tab keeps
// is what it shows, as the pad's own views keep it.
import { landOf } from './reach.js';

const { SITE, blocks, figures, localStorage, paper, sections, shapes, sketch, views } = globalThis;
const { squares, windows } = globalThis;

/**
 * The plot: the pad's own site, with its own ground - whatever a sketch makes of that. The plot
 * as a scene is to have it is `read`'s to give, as `land`.
 */
export const site = SITE;
/**
 * The figures of the house as the pad lists them, in its order, each by its name:
 * `{ words, unit, default, from, to }` - what it is, and the range it can be within, in metres.
 */
export const { FIGURES } = figures;
/** The gallery's groups (object-groups.js), each `{ name, kinds }`: none where the page loads none. */
export const groups = shapes.GROUPS ?? [];
// Where the browser keeps the sketch: the pad's own key.
const { KEY } = sketch;
// The pad's view of each standing station of the 3D view, which shows what that station shows:
// the front and the back view, the side view, and the other side.
const PAD_VIEW = { front: 'front', back: 'back', left: 'side', right: 'far' };
// Under this name the tab keeps what the 3D view shows, beside what the pad's views keep.
const KEPT = '3d';

/**
 * A level of the scene - a height in metres above sea level - named as the pad names a level of
 * its top view: "Level 455 m". The pad names one by its row of a standing paper.
 */
export const levelName = (level) =>
  sketch.nameOf('top', (paper.SPANS.side[1] - level) / paper.CELL_M);

/**
 * The wind each standing station is seen from, as the pad names it for the slice of that side:
 * `{ front, back, left, right }`, each a word like 'south-east'.
 */
export const winds = Object.fromEntries(
  Object.entries(PAD_VIEW).map(([station, view]) => [
    station,
    paper.wind(SITE.bearingDeg + paper.VIEWS[view].from),
  ]),
);

/** What the tab kept of the 3D view the last time, as `keep` was told it - nothing, the first time. */
export const seen = views.seen[KEPT];

/**
 * Has the tab keep what the 3D view shows, as the pad's views keep what they show: through a
 * reload and a switch of views, in this tab alone. `showing` says what that is as the page goes.
 */
export const keep = (showing) => views.keep(() => ({ [KEPT]: showing() }));

/**
 * Whether a key is typed into a field, and so is the field's - no view's, and no step of a
 * level: the pad's rule for a key, asked of the pad (`views.typing`).
 */
export const typing = (event) => views.typing(event);

// What the view says where the browser keeps something as the sketch, and the pad's own script
// makes no sketch of it. The pad itself has no words for that: it opens with an empty paper.
const UNREADABLE =
  'What this browser keeps as the sketch cannot be read, so nothing of it is drawn: ' +
  'the ground of the plot alone. Nothing was changed.';
// And what it says of the figures there. The pad sets such a text aside before it writes: its
// own page does, where the owner is told. This page writes nothing over it, and sets nothing aside.
const LOCKED =
  'No figure can be changed here: what this browser keeps as the sketch cannot be read, ' +
  'and this page writes nothing over it.';
// What it says of a figure that the browser's store did not take.
const NOT_KEPT = 'This browser did not keep the figure, so nothing was changed.';
// The two things a block counts as that are the ground's and none of the house, in the pad's
// words (`blocks.countsAs`): a block of ground, whose top is the ground where it lies (story
// ST-027), and a cut, under which the ground lies no higher than its floor (story ST-028).
const OF_THE_GROUND = ['ground', 'cut'];

/**
 * Whether a thing of the sketch is a box of a block of ground, or of a cut: a box whose block
 * counts as one of the two, as the pad reads it of all the boxes of that block
 * (`blocks.countsAs`) - by what one of them says, by the category that was picked for it, or by
 * the block's name. The box itself need say nothing.
 */
const isGround = (thing) =>
  sketch.isBox(thing) && OF_THE_GROUND.includes(blocks.countsAs(sketch.blockOf(thing)).as);

/**
 * A thing of the sketch as the scene wants it: its box in cells - `x` along the plot, `y` in rows
 * of the top view, `z` in rows of a standing view, from its top to its bottom. A block has its
 * colour as `{ name, hex }`, its group where the sketch has one, and `as`, what it counts as -
 * 'room', 'open' or 'glass' - as the pad reads it of the boxes of its block
 * (`blocks.countsAs`): every box of a block says the same. The pad reads two more words,
 * 'ground' (story ST-027) and 'cut' (story ST-028), and no thing that is handed on says either:
 * `read` hands on no box of a block of ground and none of a cut, and so asks this of none.
 *
 * A block's `name` is one of two (story ST-028). Where a category was picked for the block -
 * the pad's one reading of what a block is, `categories.of` of its boxes, says `by: 'picked'` -
 * it is the name of that category, as the list shows it, on every box of the block: whether a
 * box says a name of its own or none. Else it is the box's own name where it says one, and the
 * box has no `name` where it says none: a category that a block has by its name is that name,
 * and is handed on as no other. So a picked category reaches the scene as what it counts as and
 * as the name it is handed, and as nothing else: no thing says `category`.
 *
 * And where its top slopes (story ST-026) a block has `top: { axis, rows }`, as the pad reads
 * it of the box itself (`blocks.topOf`): the axis the top slopes along, 'x' or 'y', and the row
 * of a standing view it lies in at the box's first end along that axis and at its second -
 * whole or not, within the box's `z`. A block whose top is level has no `top`. An object has
 * its kind, its turn in quarters, its kind's fill, and as its `floor` the row it stands on: the
 * one the sketch gives it, and on the ground the row the ground lies in under its middle - the
 * bottom of its box, and its kind's lift under that - and a straight staircase that says a
 * length of its own, its `long` (ST-037). No object has a `top`. That ground is the
 * paper's, as it was settled last (`sketch.rect` asks `paper.groundRow`): the one that the
 * sketch shapes, once `read` had the paper settle it.
 */
function wanted(thing) {
  const [left, top, right, bottom] = sketch.rect(thing, 'top');
  const [, high, , low] = sketch.rect(thing, 'side');
  const box = { x: [left, right], y: [top, bottom], z: [high, low] };
  if (sketch.isBox(thing)) {
    const [name, hex] = paper.named(thing.colour);
    const block = sketch.blockOf(thing);
    // The list is the page's, asked for when a thing is read and not as this module loads: so
    // the pad's own scripts ask it (blocks.js), and none holds it from the moment it loaded.
    const { category, by } = globalThis.categories.of(block);
    const said = by === 'picked' ? { ...thing, name: category.name } : thing;
    const had = ['name', 'group'].filter((key) => said[key] !== undefined);
    const { as } = blocks.countsAs(block);
    const slopes = blocks.topOf(thing);
    return {
      ...box,
      colour: { name, hex },
      ...Object.fromEntries(had.map((key) => [key, said[key]])),
      as,
      ...(slopes === null ? {} : { top: slopes }),
    };
  }
  const { fill, lift = 0 } = shapes.KINDS[thing.kind];
  const floor = thing.floor === 'ground' ? low + lift / paper.CELL_M : thing.floor;
  const long = shapes.FLIGHTS.includes(thing.kind) ? thing.long : undefined;
  const object = { ...box, kind: thing.kind, turn: shapes.turnOf(thing), fill, floor };
  return long === undefined ? object : { ...object, long };
}

// A thing as `wanted`, and what a switch takes it away by (story ST-033), where it has one and the
// page loads the pad's reading: its section's id, `sections.of`; an object's group, as `gallery`.
function handedOn(thing) {
  const group = groups.find(({ kinds }) => kinds.includes(thing.kind));
  const section = sections?.of(thing)?.id;
  return { ...wanted(thing), ...(section && { section }), ...(group && { gallery: group.name }) };
}

/** Whether the browser keeps something as the sketch that is none: nothing kept is not that. */
function unreadable() {
  try {
    return localStorage.getItem(KEY) !== null && sketch.stored() === null;
  } catch {
    return false;
  }
}

/**
 * The sketch, read: `{ things, figures, trouble, locked, land, sections, on }` - `sections` its
 * list, `{ id, name, hidden }` in the owner's order, and `on` where its two slices run, `{ side,
 * end }`, a row and a column (story ST-033). `things` are its things as
 * the scene wants them, in their order - but for the boxes of its blocks of ground (story
 * ST-027) and of its cuts (story ST-028), of which none is handed on: a place in `things` is a
 * place of the scene, and none in the sketch. `figures` are the eight figures of the house, as
 * the pad reads them of the sketch (`figures.of`) - the defaults, where it says nothing of
 * them; `trouble` is what went wrong, in words, and empty where nothing did; `locked` says why
 * no figure can be written - the browser keeps something as the sketch that cannot be read -
 * and is empty where one can.
 *
 * `land` is the plot as the scene is to have it, with the ground as this sketch shapes it.
 * Before a thing is read, the paper is told to settle the ground by the things of the sketch
 * that was read (`paper.settle`) - by none, where no sketch could be read: the site's own
 * ground. Then `land` is reach.js's `landOf`: where nothing reaches past a paper worked out
 * whole, the pad's own site, or that site with `ground.heights`, the paper's own grid, itself;
 * else the near grids and far squares of that ground (ST-042). `site` is never changed.
 *
 * As the page opens, the sketch is the one the pad's own script read, with the pad's own words
 * for it: the sketch that the browser keeps, or - the first time - the sketches of before,
 * brought over. `again` is for later, when the sketch that the browser keeps was changed: what
 * it keeps now, and no thing at all where that is no sketch.
 *
 * On this page the sketch that the pad's scripts hold, `sketch.doc`, is the one that was read
 * last: read again, it is what the browser keeps now. The pad's scripts ask it for the boxes of
 * a block and for how high a door and a window are, so both are the sketch's that is drawn,
 * and not the one's that the page opened with. What cannot be read changes nothing of it: the
 * pad's scripts hold the sketch they held - and the ground is the site's own, as nothing is
 * drawn.
 */
export function read(again = false) {
  const doc = again ? sketch.stored() : sketch.doc;
  if (doc) sketch.doc = doc;
  const drawn = doc?.things ?? [];
  // The ground first: where an object stands on it, `wanted` asks of the paper.
  paper.settle(drawn);
  const rects = drawn.map((thing) => sketch.rect(thing, 'top'));
  const locked = unreadable() ? LOCKED : '';
  const troubles = [locked === '' ? '' : UNREADABLE, again ? '' : sketch.trouble];
  return {
    things: drawn.filter((thing) => !isGround(thing)).map(handedOn),
    figures: figures.of(doc),
    trouble: troubles.filter((words) => words !== '').join(' '),
    locked,
    land: landOf({ site: SITE, paper, squares, windows }, rects),
    sections: sections?.list(doc) ?? [],
    on: { side: sketch.on('side'), end: sketch.on('end') },
  };
}

// The page's, from `watch`: called when the sketch that the browser keeps is to be read again.
let told = () => {};

/**
 * Has `changed` called whenever the sketch that the browser keeps is another than the page read:
 * another window changed it, or a figure was written here. The pad keeps the sketch as soon as
 * it changes, and the browser tells every other window of this address: a `storage` event of
 * the pad's key - or of none, where the whole store was emptied. `page` is the window, which
 * hears it.
 */
export function watch(changed, page = globalThis) {
  told = changed;
  page.addEventListener('storage', (event) => {
    if (event.key === KEY || event.key === null) changed();
  });
}

/**
 * Writes a figure into the sketch, and says how it went: nothing where the sketch holds the
 * figure now, and else why it does not, in words.
 *
 * Where the browser keeps something as the sketch that cannot be read, nothing is written and
 * nothing is set aside. Else the page first holds what the browser keeps at this moment - the
 * sketch as another window left it, were this page never told of it - so that a figure is
 * written into the newest drawing, and never an older drawing over it. Then the pad's own way
 * of changing the sketch has the pad's `figures.set` write the one figure, and nothing else:
 * kept at once, and a step for the pad's Undo. A figure that the sketch has already writes
 * nothing, and is no step. Whenever the store was written to or refused, the page is told to
 * read again: it shows what the browser keeps, so a figure that the store did not take is not
 * held here either.
 */
function write(name, value) {
  let said = LOCKED;
  if (!unreadable()) {
    const now = sketch.stored();
    if (now) sketch.doc = now;
    if (figures.of(sketch.doc)[name] === value) return '';
    sketch.change((doc) => figures.set(doc, name, value));
    said = sketch.trouble === '' ? '' : NOT_KEPT;
  }
  told();
  return said;
}

/**
 * A text typed as a figure of the house, by its name: written into the sketch where the pad
 * takes it as that figure - a number within the figure's range, to the centimetre
 * (`figures.typed`) - and not written where it does not. It gives nothing where the sketch holds
 * the figure now, and else why it does not, in words: the pad's, which name the range, for a
 * text that is no such figure; and this view's, where the sketch could not be written.
 */
export function typed(name, text) {
  const { value, refused } = figures.typed(name, text);
  return refused ?? write(name, value);
}

/**
 * A figure of the house back at its default, by its name: the sketch is left without it. It
 * gives what `typed` gives.
 */
export const usual = (name) => write(name, FIGURES[name].default);
