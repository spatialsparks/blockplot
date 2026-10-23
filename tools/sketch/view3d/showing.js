// What the tab shows of the scene, as rules: the way it is shown in; the cut it is shown at -
// picked, stepped through, and kept where a change of the sketch leaves its level - what is
// switched off, and which groups of objects have a switch (story ST-033); what the tab kept the
// last time, how the stands are named and the sides the house opens along, and what the page's
// line of words says. No page and no three.js: it imports the scene's word for a thing in no
// section and its keys of the sides alone, and names no global.
import { NO_SECTION, OPENS } from '../scene/shows.js';

/**
 * The ways of showing the scene, in the order they are listed: a way is a row. `way` is what the
 * page calls it - on its switch, on its body, and in what the tab keeps - `name` and `title`
 * what the switch says of it, in short and in full. `parts` says that the house is shown as the
 * parts it is built of - floors, walls, roofs and whatever else a rule of the scene makes - in
 * the place of the solids; `white`, that every part is drawn in one white, where it would else
 * be drawn in its own surface; `sun`, that the light from one side is the sun, which casts
 * shadows where they are not switched off - and that the stage has the lights and the backdrop
 * that go with the sun (lights.js): a darker grey, which a white house stands clear of, or a
 * sky behind a house that stands in its surfaces.
 */
export const WAYS = [
  {
    way: 'volumes',
    name: 'Volumes',
    title: 'Every block in the colour it was drawn in',
    parts: false,
    white: false,
    sun: false,
  },
  {
    way: 'white',
    name: 'White',
    title: 'The house as it is built, floors and roofs and all, in white and in sunlight',
    parts: true,
    white: true,
    sun: true,
  },
  {
    way: 'materials',
    name: 'Materials',
    title: 'The house as it is built, every part in its surface: plaster, wood, stone, glass',
    parts: true,
    white: false,
    sun: true,
  },
];

/**
 * The way a scene is shown in where `asked` is asked for: its row of `WAYS` - or the first one's,
 * the volumes, for whatever is none of them: nothing a tab kept, or a way of another pad.
 */
export const wayOf = (asked) => WAYS.find(({ way }) => way === asked) ?? WAYS[0];

/** The cut that takes nothing off: every solid shows. */
export const ALL = 'all';

/** The cuts of a scene as they are listed: all of it, and its levels from the top down. */
export const cutsOf = (scene) => [ALL, ...scene.levels];

/**
 * The cut a scene is shown at where `asked` is asked for: that one where the scene has such a
 * level, and all of it where it has none - a level that a change of the sketch took away.
 */
export const cutOf = (scene, asked) => (scene.levels.includes(asked) ? asked : ALL);

/**
 * The cut so many entries further down the list: a step down takes the top storey off, a step up
 * brings one back. At either end of the list it is the cut it was.
 */
export function stepped(scene, cut, by) {
  const cuts = cutsOf(scene);
  return cuts[cuts.indexOf(cut) + by] ?? cut;
}

/**
 * The kinds that open a wall or make a flight. They belong to the house, and show with the block
 * they stand in: a group of the gallery that holds one has no switch.
 */
const OF_THE_HOUSE = ['door', 'window', 'stairs', 'widestairs', 'spiral'];

/**
 * The groups of objects that a switch takes away, by their names, in the gallery's order: of
 * `groups`, each `{ name, kinds }` (object-groups.js), every one but one that holds a kind of
 * the house - of the six of today Kitchen, Bathroom, Furniture, Garden, People and cars.
 */
export const switchable = (groups) =>
  groups
    .filter(({ kinds }) => !kinds.some((kind) => OF_THE_HOUSE.includes(kind)))
    .map(({ name }) => name);

/**
 * What is switched off, from what a tab kept: `{ sections, levels, groups }`, three lists, each
 * of what is of its form alone - a section an integer or `NO_SECTION`, a level a finite number,
 * a group a text. What is no list is an empty one: nothing is switched off the first time.
 */
function offKept(off) {
  const listed = (key, fits) => (Array.isArray(off?.[key]) ? off[key].filter(fits) : []);
  return {
    sections: listed('sections', (id) => Number.isInteger(id) || id === NO_SECTION),
    levels: listed('levels', Number.isFinite),
    groups: listed('groups', (name) => typeof name === 'string'),
  };
}

/**
 * What is switched off as the sketch is read now: `off` less a section that `sections`, the
 * sketch's list, no longer has - and less `NO_SECTION` where it lists none, for then no switch
 * says it - and less a level that the scene no longer has. A group stays: the gallery's groups
 * are the pad's, and one that no object is of takes nothing away.
 */
export const offOf = (off, scene, sections) => ({
  ...off,
  sections: off.sections.filter((id) =>
    id === NO_SECTION ? sections.length > 0 : sections.some((section) => section.id === id),
  ),
  levels: off.levels.filter((level) => scene.levels.includes(level)),
});

/** A place: three numbers. */
const isPlace = (place) =>
  Array.isArray(place) && place.length === 3 && place.every(Number.isFinite);

/** The house whole, opened along no slice: the first row of "Open along", as a tab keeps it. */
export const CLOSED = 'none';

/**
 * What the tab shows as the page opens, from what it kept the last time - `{ cut, ground, way,
 * shadows, off, open, eye, target }`, or nothing, or something that is none of it: `{ cut,
 * ground, way, shadows, off, open, look }`. The cut is a level or all of it; the ground is on
 * unless it was switched off, and so are the shadows; the way is one of `WAYS` by its name, and
 * the volumes where none was kept; `off` is what is switched off (`offKept`); `open` the side the
 * house is opened along, one of `OPENS`, and `CLOSED` where none was kept; `look` is where the
 * view was looking, `{ eye, target }`, two places of the plot - or null where no two were kept
 * that a view could look from and at: then it opens at the front.
 */
export function keptOf(kept) {
  const { cut, ground, way, shadows, off, open, eye, target } = kept ?? {};
  const apart = isPlace(eye) && isPlace(target) && eye.some((at, axis) => at !== target[axis]);
  return {
    cut: Number.isFinite(cut) ? cut : ALL,
    ground: ground !== false,
    way: wayOf(way).way,
    shadows: shadows !== false,
    off: offKept(off),
    open: OPENS.includes(open) ? open : CLOSED,
    look: apart ? { eye, target } : null,
  };
}

/**
 * What the page says in words on its line over the stage, of all it has to say there - each
 * `{ words, wrong }`, in the order they are said: of the sketch, and of the file of the house
 * that was saved last. It gives `{ words, line }`: the words there are, one after the other, and
 * what the line is to the page's stylesheet - `line`, a quiet one; `line trouble`, the pad's
 * red, where one of them says that something went wrong; and nothing, where there are no words:
 * no words, no line.
 */
export function lineOf(...told) {
  const said = told.filter(({ words }) => words !== '');
  const kind = said.some(({ wrong }) => wrong) ? 'line trouble' : 'line';
  return { words: said.map(({ words }) => words).join(' '), line: said.length > 0 ? kind : '' };
}

const capital = (word) => word[0].toUpperCase() + word.slice(1);

/**
 * The stands, in the order they are listed: the station each puts the view at (stations.js),
 * its name, and what it says of itself in full. `winds` is the wind each standing station is
 * seen from. The front, the back and above are named as they are; a side is named by its wind,
 * for which of two sides is the left depends on which way one faces.
 */
export const standsOf = (winds) => [
  {
    stand: 'front',
    name: 'Front',
    title: `From the ${winds.front}: from below the house, looking up the slope`,
  },
  {
    stand: 'back',
    name: 'Back',
    title: `From the ${winds.back}: from uphill, looking down the slope`,
  },
  {
    stand: 'left',
    name: capital(winds.left),
    title: `From the ${winds.left}: the side that the side view shows`,
  },
  {
    stand: 'right',
    name: capital(winds.right),
    title: `From the ${winds.right}: the side that the other side shows`,
  },
  { stand: 'above', name: 'Above', title: 'From straight above, as the top view lies' },
];

/**
 * The rows of "Open along", in the order they are listed: `open`, the side by its key of
 * `OPENS` - or `CLOSED`, first - its name, as the stand that looks from that side is named
 * (`standsOf`), and what it says of itself in full: which slice of the pad's it opens along, and
 * what is taken away - what lies between the slice and that side. In the order of the stands:
 * the front, the back, then the side the side view looks from, by its wind, and the other.
 */
export function opensOf(winds) {
  const along = (open, name, view, side) => ({
    open,
    name,
    title: `Along the slice of the ${view}: what lies between it and the ${side} is taken away`,
  });
  return [
    { open: CLOSED, name: 'None', title: 'The house whole: nothing is taken away' },
    along('front', 'Front', 'front view', 'front'),
    along('back', 'Back', 'back view', 'back'),
    along('side', capital(winds.left), 'side view', winds.left),
    along('far', capital(winds.right), 'other side', winds.right),
  ];
}
