// The check of what the tab shows, as rules: the ways of showing as they are listed, and the
// one that is shown where another is asked for; the cuts of a scene as they are listed, a step
// up and down the list, the level that a change of the sketch keeps or takes away, what is made
// of what a tab kept - or of something that is none of it - and of what it switched off, what of
// that a sketch read anew forgets, which groups of objects have a switch, how the stands are
// named and the sides the house opens along, and what the page's line of words says of all it
// is told. No browser, and nothing but made-up figures. Run by tools/sketch/check.js, as every
// *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { stations } from '../scene/stations.js';
import {
  ALL,
  WAYS,
  cutOf,
  cutsOf,
  keptOf,
  lineOf,
  offOf,
  opensOf,
  standsOf,
  stepped,
  switchable,
  wayOf,
} from './showing.js';

// The ways, as they are listed: the volumes first, then white, then the materials. Each has a
// name of its own for the page and one for the switch, and says in full what it shows. The
// volumes are the solids in their colours, lit as they always were; white is the parts of the
// house in one white, lit by the sun; the materials are the parts too, each in its own surface,
// under the same sun.
assert.deepEqual(
  WAYS.map(({ way, name, parts, white, sun }) => [way, name, parts, white, sun]),
  [
    ['volumes', 'Volumes', false, false, false],
    ['white', 'White', true, true, true],
    ['materials', 'Materials', true, false, true],
  ],
);
assert.equal(new Set(WAYS.map(({ way }) => way)).size, WAYS.length);
assert.equal(new Set(WAYS.map(({ name }) => name)).size, WAYS.length);
for (const { way, title, parts, white } of WAYS) {
  assert.match(way, /^[a-z]+$/, 'a way is named in small letters, as the page says it');
  assert.ok(title.length > 20, title);
  // What a view says of the sun is the sun's to say: no way names a day or an hour.
  assert.doesNotMatch(title, /\d/, title);
  // One white is said of the parts: a solid has the colour it was drawn in.
  assert.ok(parts || !white, `${way} is white, and shows no part`);
}
// The way that is shown where one is asked for: that one - its row, the same one each time - and
// the volumes for whatever is none of them: nothing, a way that this pad has not, a name that is
// written otherwise, something that is no name at all.
assert.equal(wayOf('materials'), WAYS[2]);
assert.equal(wayOf('white'), WAYS[1]);
assert.equal(wayOf('volumes'), WAYS[0]);
const NONE_OF_THEM = ['wireframe', 'White', ' white', 'Materials', 'material', ['materials']];
for (const none of [undefined, null, '', 1, true, {}, ['white'], ...NONE_OF_THEM]) {
  assert.equal(wayOf(none), WAYS[0], JSON.stringify(none));
}

// A made-up scene, as far as these rules read it: three levels, from the top down. And one with
// no block, and so no level.
const scene = { levels: [455, 451.5, 448] };
const empty = { levels: [] };

// The cuts as they are listed: all of it first, then the levels from the top down.
assert.equal(ALL, 'all');
assert.deepEqual(cutsOf(scene), ['all', 455, 451.5, 448]);
assert.deepEqual(cutsOf(empty), ['all']);

// A step down the list, as Page Down takes it, goes from all of it to the top level and on to
// the lowest, and stays there; a step up, as Page Up takes it, goes back to all, and stays.
assert.deepEqual(
  ['all', 455, 451.5, 448].map((cut) => stepped(scene, cut, 1)),
  [455, 451.5, 448, 448],
);
assert.deepEqual(
  ['all', 455, 451.5, 448].map((cut) => stepped(scene, cut, -1)),
  ['all', 'all', 455, 451.5],
);
assert.deepEqual([stepped(empty, 'all', 1), stepped(empty, 'all', -1)], ['all', 'all']);

// A scene is cut at the level asked for where it has that level - a change of the sketch that
// leaves it keeps it - and shown whole where it has not: the level went with its last block.
assert.deepEqual([cutOf(scene, 451.5), cutOf(scene, 'all')], [451.5, 'all']);
assert.deepEqual([cutOf({ levels: [455, 448] }, 451.5), cutOf(empty, 455)], ['all', 'all']);
// A level is a number: its name is none.
assert.equal(cutOf(scene, '455'), 'all');

// What a tab kept, as the page opens: the cut, the ground, the way, the shadows, and where the
// view was looking - two places of the plot. The first time nothing is kept: all levels, the
// ground on, the volumes, the shadows on - for a way that has them - and no place to look from:
// the view opens at the front.
const look = { eye: [60, 7.5, 470], target: [25, 7.5, 452] };
const NOTHING_OFF = { sections: [], levels: [], groups: [] };
const FIRST = {
  cut: 'all',
  ground: true,
  way: 'volumes',
  shadows: true,
  off: NOTHING_OFF,
  open: 'none',
  look: null,
};
assert.deepEqual(keptOf(undefined), FIRST);
assert.deepEqual(keptOf({ cut: 451.5, ground: false, ...look }), {
  ...FIRST,
  ...{ cut: 451.5, ground: false, look },
});
assert.deepEqual(keptOf({ cut: 'all', ground: true, ...look }), { ...FIRST, look });
// The way and the shadows are kept with them: white, with its shadows switched off - and white
// with them on, which is what a tab keeps that never switched them.
assert.deepEqual(keptOf({ cut: 448, ground: true, way: 'white', shadows: false, ...look }), {
  ...FIRST,
  ...{ cut: 448, way: 'white', shadows: false, look },
});
assert.deepEqual(keptOf({ way: 'white', shadows: true }), { ...FIRST, way: 'white' });
assert.deepEqual(keptOf({ way: 'white' }), { ...FIRST, way: 'white' });
// So are the materials, with what the tab kept beside them - and with nothing beside them.
assert.deepEqual(keptOf({ cut: 451.5, ground: false, way: 'materials', shadows: false, ...look }), {
  ...FIRST,
  ...{ cut: 451.5, ground: false, way: 'materials', shadows: false, look },
});
assert.deepEqual(keptOf({ way: 'materials' }), { ...FIRST, way: 'materials' });
// What is none of it is taken as nothing kept, part by part: a store holds what an older page
// wrote, or nothing a page wrote at all. The ground is off where it was switched off, and
// nowhere else; so are the shadows; and a way that is none of this pad's is the volumes.
const NONE = [null, 'kept', 7, [], {}, { cut: '455', ground: 'off' }, { cut: null }];
const NO_WAY = [{ way: 'wireframe', shadows: 'off' }, { way: 7, shadows: 0 }, { shadows: null }];
for (const none of [...NONE, ...NO_WAY]) {
  assert.deepEqual(keptOf(none), FIRST, JSON.stringify(none));
}
// To look, a view needs a place to look from and one to look at: three numbers each - what was
// no number comes back from a store as null - and not one and the same place.
for (const bad of [
  { eye: look.eye },
  { target: look.target },
  { ...look, eye: [60, 7.5] },
  { ...look, eye: [60, 7.5, null] },
  { ...look, target: [25, '7.5', 452] },
  { ...look, eye: 'downhill' },
  { ...look, target: look.eye },
]) {
  assert.equal(keptOf(bad).look, null, JSON.stringify(bad));
}
assert.deepEqual(keptOf({ ...look, cut: 448 }), { ...FIRST, cut: 448, look });

// What is switched off is kept with the rest (story ST-033): three lists, each of what is of its
// form - a section an integer, or 'none' for what is in none; a level a number; a group a text.
const off = { sections: [2, 'none'], levels: [451.5], groups: ['People and cars'] };
assert.deepEqual(keptOf({ way: 'white', off }), { ...FIRST, way: 'white', off });
// What is not of the form is dropped, item by item: a section by its name, or a number that is
// no integer; a level by its name, or none at all; a group that is no text. A list that is no
// list is an empty one, and so is what was never kept.
const amiss = {
  sections: [2, 'Yard', 1.5, null, 'none', '3'],
  levels: [451.5, '448', null, Infinity],
  groups: ['Garden', 7, null, ['Kitchen']],
};
assert.deepEqual(keptOf({ off: amiss }).off, {
  sections: [2, 'none'],
  levels: [451.5],
  groups: ['Garden'],
});
for (const none of [undefined, null, 'off', 7, [], { sections: 2, levels: '448', groups: {} }]) {
  assert.deepEqual(keptOf({ off: none }).off, NOTHING_OFF, JSON.stringify(none));
}
// So is the side the house is opened along (story ST-033): one of the four by its key, and the
// house whole, 'none', for whatever is none of them - an older page's store, a stand's name.
for (const side of ['side', 'far', 'front', 'back']) {
  assert.deepEqual(keptOf({ way: 'white', open: side }), { ...FIRST, way: 'white', open: side });
}
for (const none of [undefined, null, 'none', 'left', 'Front', 0, ['front'], { front: true }]) {
  assert.equal(keptOf({ open: none }).open, 'none', JSON.stringify(none));
}

// As the sketch is read, what it no longer has is forgotten: a section that its list no longer
// holds - section 3, taken out - and a level that the scene no longer has - 448 m, its storey
// taken off. 'none' stays where the sketch lists a section, and a group stays whatever is drawn.
const listed = [
  { id: 1, name: 'Home', hidden: false },
  { id: 2, name: 'Yard', hidden: true },
];
const kept = { sections: [3, 2, 'none'], levels: [451.5, 448], groups: ['Garden', 'Unicorns'] };
const lower = { levels: [455, 451.5] };
assert.deepEqual(offOf(kept, lower, listed), {
  sections: [2, 'none'],
  levels: [451.5],
  groups: ['Garden', 'Unicorns'],
});
assert.deepEqual(offOf(kept, scene, listed).levels, [451.5, 448]);
// A sketch with no section has no switch of 'No section': nothing of it can stay switched off.
assert.deepEqual(offOf(kept, scene, []).sections, []);
assert.deepEqual(offOf(kept, empty, listed).levels, []);
assert.deepEqual(offOf(NOTHING_OFF, scene, listed), NOTHING_OFF);

// Which groups of the gallery have a switch: each but one that holds a door, a window or a
// staircase of any kind - of the six of today, five. The groups as object-groups.js has them,
// typed in by hand; a made-up group that holds a spiral among its own has none either.
const GROUPS = [
  ['Doors, windows and stairs', 'door window stairs widestairs spiral'],
  ['Kitchen', 'island counter hob sink fridge'],
  ['Bathroom', 'toilet basin bath shower'],
  ['Furniture', 'bed sofa table chair desk wardrobe'],
  ['Garden', 'tree bush fountain'],
  ['People and cars', 'person car'],
].map(([name, kinds]) => ({ name, kinds: kinds.split(' ') }));
const FIVE = ['Kitchen', 'Bathroom', 'Furniture', 'Garden', 'People and cars'];
assert.deepEqual(switchable(GROUPS), FIVE);
for (const kind of ['door', 'window', 'stairs', 'widestairs', 'spiral']) {
  assert.deepEqual(switchable([{ name: 'Mixed', kinds: ['bed', kind] }]), [], kind);
}
assert.deepEqual(switchable([]), []);

// The stands, as they are listed: one for each station of a scene, under the stations' own
// names. The front, the back and above are named as they are; a side by the wind it is seen
// from, with a capital. Each standing one says in full which wind it looks from.
const winds = { front: 'south-east', back: 'north-west', left: 'south-west', right: 'north-east' };
const stands = standsOf(winds);
const anywhere = { box: { min: [0, 0, 0], max: [1, 1, 1] } };
assert.deepEqual(
  stands.map(({ stand }) => stand),
  Object.keys(stations(anywhere)),
);
assert.deepEqual(
  stands.map(({ name }) => name),
  ['Front', 'Back', 'South-west', 'North-east', 'Above'],
);
for (const { stand, title } of stands.slice(0, 4)) {
  assert.ok(title.startsWith(`From the ${winds[stand]}: `), title);
}
assert.match(stands[4].title, /^From straight above/);
// "Open along": the house whole first, then the four sides in the order of the stands, each
// named as its stand is - the side view's side by the wind of the left stand, the other's by the
// right's - and saying in full which slice it opens along, and what goes: what lies toward it.
const opens = opensOf(winds);
assert.deepEqual(
  opens.map(({ open, name }) => [open, name]),
  [
    ['none', 'None'],
    ['front', 'Front'],
    ['back', 'Back'],
    ['side', 'South-west'],
    ['far', 'North-east'],
  ],
);
assert.deepEqual(
  opens.slice(1).map(({ name }) => name),
  stands.slice(0, 4).map(({ name }) => name),
);
assert.equal(
  opens[1].title,
  'Along the slice of the front view: what lies between it and the front is taken away',
);
assert.equal(
  opens[3].title,
  'Along the slice of the side view: what lies between it and the south-west is taken away',
);
assert.match(opens[2].title, /^Along the slice of the back view: .* and the back is taken away$/);
assert.match(opens[4].title, /^Along the slice of the other side: .* the north-east is taken/);
assert.match(opens[0].title, /^The house whole/);

// The page's line of words, of what it is told of the sketch and of the file it saved: no words,
// no line; words, a quiet line; and the pad's red where one of them says that something went
// wrong, whichever. The sketch's words come first, and a blank lies between the two.
const quiet = (words) => ({ words, wrong: false });
const wrong = (words) => ({ words, wrong: true });
assert.deepEqual(lineOf(quiet(''), quiet('')), { words: '', line: '' });
assert.deepEqual(lineOf(), { words: '', line: '' });
assert.deepEqual(lineOf(quiet('Nothing yet.'), quiet('')), { words: 'Nothing yet.', line: 'line' });
assert.deepEqual(lineOf(quiet(''), quiet('Saved.')), { words: 'Saved.', line: 'line' });
assert.deepEqual(lineOf(quiet('Brought over.'), quiet('Saved.')), {
  words: 'Brought over. Saved.',
  line: 'line',
});
assert.deepEqual(lineOf(wrong('Unreadable.'), quiet('Saved.')), {
  words: 'Unreadable. Saved.',
  line: 'line trouble',
});
assert.deepEqual(lineOf(quiet(''), wrong('Not saved.')), {
  words: 'Not saved.',
  line: 'line trouble',
});
// What says nothing is not wrong either: its word of it colours no line.
assert.deepEqual(lineOf(wrong(''), quiet('Saved.')), { words: 'Saved.', line: 'line' });
assert.deepEqual(lineOf(wrong(''), quiet('')), { words: '', line: '' });

process.stdout.write(
  'tools/sketch/view3d: a way of the three is shown or the volumes are, a level is stepped to and kept where the sketch still has it, what is switched off is kept and forgotten where the sketch has it no more, five groups have a switch, a stand is named by where it looks from, the house opens along a side named as its stand and the tab keeps it, and the line says what there is to say\n',
);
