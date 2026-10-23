// The check of the categories (categories.js, story ST-028; version 6 of the sketch file): the
// one list, row for row as the story has it, typed in; the one reading of what a block is,
// `categories.of` - a picked category before a name, of several boxes the first that says a
// key, what says nothing, and a name in the order it is read in; every word of every row,
// alone, in capitals and in a longer name; that every name counts as what it counted as before
// there were categories, but one that holds "ground cut" (rule 4) - the reading of before is
// kept here, to hold against; what `blocks.countsAs` answers, each of the five by `is`, by a
// picked category and by a name; that a cut holds no ground back, and that a picked category
// reaches the ground; and the two pages, by their text. The pad's own scripts with no paper and
// no sketch, and the made-up plot for the ground: no browser, nothing of the real site. What
// the pad writes and says of a category is categories-pad.check.js's. Run by
// tools/sketch/check.js, or alone: pnpm exec node tools/sketch/categories.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import process from 'node:process';

for (const file of ['demo-site', 'categories', 'blocks', 'earth']) await import(`./${file}.js`);
const { SITE, earth } = globalThis;
const { LIST, of } = globalThis.categories;
const { countsAs } = globalThis.blocks;

// --- the list ----------------------------------------------------------------------------------------
// As the story has it ("The list"), typed in: what a box says, the name the pad shows, what a
// block of it counts as, and the words a name is read by. Thirty rows, in the order of the list.
const TABLE = `living-room | Living room | room | living, lounge
kitchen | Kitchen | room | kitchen
dining-room | Dining room | room | dining
bedroom | Bedroom | room | bed
bathroom | Bathroom | room | bath, ensuite, shower
toilet | Toilet | room | toilet, wc
office | Office | room | office, study
corridor | Corridor | room | corridor, hall, passage
entrance | Entrance | room | entrance, entry, airlock, lobby
staircase | Staircase | room | stair
lift | Lift | room | lift, elevator
storage | Storage | room | storage, pantry, closet
cellar | Cellar | room | cellar, basement
laundry | Laundry | room | laundry, utility
technical-room | Technical room | room | technical, boiler, heating
shaft | Shaft | room | shaft, duct
garage | Garage | room | garage, parking
ramp | Ramp | room | ramp, driveway
workshop | Workshop | room | workshop, atelier
gym | Gym | room | gym, fitness
sauna | Sauna | room | sauna, wellness
leisure-room | Leisure room | room | cinema, fumoir, games, hobby, music
balcony | Balcony | open | balcon
terrace | Terrace | open | terrace, terrass
garden | Garden | open | garden
courtyard | Courtyard | open | courtyard
roof | Roof | open | roof
greenhouse | Greenhouse | glass | greenhouse
ground-fill | Ground fill | ground | ground fill
ground-cut | Ground cut | cut | ground cut`;
const ROWS = TABLE.split('\n').map((line) => {
  const [key, name, as, words] = line.split(' | ');
  return { key, name, as, words: words.split(', ') };
});
assert.deepEqual([LIST, LIST.length], [ROWS, 30]);
// The word that a box says is the row's name in small letters, a hyphen where it has a blank.
for (const { key, name } of LIST) assert.equal(key, name.toLowerCase().replaceAll(' ', '-'));
// The words by which a name was open air, glass or ground before there were categories, to the
// letter (blocks.js, then) - and the reading of a name of then, kept here to hold against:
// ground where it holds "ground fill", else glass, else open air, else a room.
const OPEN_WORDS = ['balcon', 'terrace', 'terrass', 'garden', 'courtyard', 'roof'];
const WAS = { ground: ['ground fill'], glass: ['greenhouse'], open: OPEN_WORDS };
const was = (name) =>
  Object.keys(WAS).find((as) => WAS[as].some((word) => name.toLowerCase().includes(word))) ??
  'room';
// No word was added to those three, and "ground cut" alone is a cut's: 58 words in all, each of
// letters in small and blanks - and none of one row stands inside a word of another.
const wordsOf = (as) => LIST.filter((row) => row.as === as).flatMap((row) => row.words);
assert.deepEqual([wordsOf('ground'), wordsOf('glass'), wordsOf('open')], Object.values(WAS));
assert.deepEqual([wordsOf('cut'), wordsOf('room').length], [['ground cut'], 49]);
const WORDS = LIST.flatMap((row) => row.words.map((word) => [word, row]));
assert.equal(WORDS.length, 58);
for (const [word, its] of WORDS) {
  assert.match(word, /^\p{Ll}+(?: \p{Ll}+)*$/u, `"${word}" is no word in small letters`);
  const inside = WORDS.filter(([other, whose]) => whose !== its && other.includes(word));
  assert.deepEqual(inside, [], `"${word}" stands inside a word of another row`);
}

// --- what a block is: `categories.of` ---------------------------------------------------------------
const row = (key) => LIST.find((one) => one.key === key);
const picked = (key) => ({ category: row(key), by: 'picked' });
const named = (key) => ({ category: key === null ? null : row(key), by: 'name' });
// PICKED. A box that says a key of the list has that row - the very row - against every name:
// a block named "Balcony" that says `storage` is Storage. Each of the thirty keys.
assert.equal(of([{ category: 'bathroom' }]).category, LIST[4]);
assert.deepEqual(of([{ name: 'Balcony', category: 'storage' }]), picked('storage'));
for (const one of LIST) {
  assert.deepEqual(of([{ name: 'Ground fill', category: one.key }]), {
    category: one,
    by: 'picked',
  });
}
// Of several boxes the first that says a key counts, wherever the name stands.
assert.deepEqual(
  of([{ name: 'Kitchen' }, { category: 'gym' }, { category: 'sauna' }]),
  picked('gym'),
);
// Anything else under `category` says nothing: the name of a row, a key in capitals or with a
// blank, a word that no row has - one that every object has, too - a number. The block is read
// from its name, has no category without one, and a later box that says a key counts.
const NO_KEYS = ['Bathroom', 'BATHROOM', 'Living room', 'living room', ' kitchen', 'bath', 'pool'];
for (const category of [...NO_KEYS, 'constructor', '', 7, null, true, ['lift'], { key: 'lift' }]) {
  assert.deepEqual(of([{ name: 'Guest Bed', category }]), named('bedroom'));
  assert.deepEqual(of([{ category }]), named(null));
  assert.deepEqual(of([{ category }, { category: 'lift' }]), picked('lift'));
}

// BY ITS NAME, where no box says a key. Of several rows a name is read in the order of before
// first - ground, a cut, glass, open air, a room - and among the rows of what it then counts as
// by the word that stands first in it: each name of the card, by hand.
const BY_NAME = {
  'Ground fill, roof terrace': 'ground-fill',
  'Greenhouse on the roof': 'greenhouse',
  'Kitchen garden': 'garden',
  'Kitchen / Dining': 'kitchen',
  'Dining / Kitchen': 'dining-room',
  'Roof garden': 'roof',
  'Roof terrace': 'roof',
  'Guest Bed': 'bedroom',
  Ensuite: 'bathroom',
  Terrasse: 'terrace',
  'Car Ramp': 'ramp',
  Duct: 'shaft',
  'WC / Bath': 'toilet',
  'Stair hall': 'staircase',
  'Hall stairs': 'corridor',
  // And a word that a name holds by chance gives its category too, until the owner picks.
  Showcase: 'toilet',
  'Shallow end': 'corridor',
  'Hobby cellar': 'leisure-room',
};
for (const [name, key] of Object.entries(BY_NAME))
  assert.deepEqual(of([{ name }]), named(key), name);
// NONE: no name, or a name that holds no word of the list. The name of a block is the first
// box's that has one, as text: the second's is not read, and a number holds no word.
const NONE = ['Day rooms', 'Store', 'Studio', 'Glass porch', 'Lawn'];
for (const name of [...NONE, '', undefined]) assert.deepEqual(of([{ name }]), named(null), name);
assert.deepEqual([of([]), of([{}, { colour: 4 }])], [named(null), named(null)]);
assert.deepEqual(of([{}, { name: 'Kitchen' }, { name: 'Bath' }]), named('kitchen'));
assert.deepEqual(of([{ name: 404 }, { name: 'Kitchen' }]), named(null));

// EVERY WORD of every row gives its row: alone, in capitals, and in a longer name that holds
// no other word of the list.
for (const [word, its] of WORDS) {
  const longer = `Upper ${word} no. 2`;
  const others = WORDS.filter(([other]) => other !== word && longer.includes(other));
  assert.deepEqual(others, [], `"${longer}" holds another word of the list`);
  for (const name of [word, word.toUpperCase(), longer]) {
    assert.deepEqual(of([{ name }]), { category: its, by: 'name' }, name);
  }
}

// --- every name counts as what it counted as (rule 4) -----------------------------------------------
// The names of the checks and golden files of before - those that check-blocks.js and
// counts.check.js hold by name among them - and names made up to break it: a word of a room
// before a word that is none, a word by chance, what is no cut, and two that hold both words.
const NAMES =
  'greenhouse|Greenhouse|GREENHOUSE|The greenhouse on the roof terrace|balcon|terrace|garden|' +
  'courtyard|roof|BALCON|TERRACE|GARDEN|COURTYARD|ROOF|Balcony, south|Two balconies|Gardens|' +
  'Roof terrace|Kitchen garden|Courtyard / Filled|Green Roof|Green roof|Flat roofs 2|terrass|' +
  'TERRASS|Terrasse|Dachterrasse|Day rooms|Bath|Glass porch|Store|Green house|Balkon|Roo|' +
  'Court yard|ground fill|Ground Fill|GROUND FILL|Ground Fill, north|Playground filling|' +
  'The ground fill behind the house|Ground fill, roof terrace|Garden / Ground Fill|' +
  'Courtyard ground fill|Balcony, ground fill|Greenhouse ground fill|Background filler|' +
  'Ground fill under the greenhouse|Ground floor|Fill|Groundfill|Ground|Ground  fill|' +
  'Ground-fill|Ground\tfill|Ground, fill|Fill ground|Filled ground|ground_fill|Ground fil|' +
  'Underground filter|Auffüllung|Ground floor terrace|Garden, fill|Roof over the ground floor|' +
  'Greenhouse, ground floor|Greenhouse fill|Bank|Barn|Bath shed|Bay|Bedroom|Court|Crawl space|' +
  'Deck|Den|Duct|Garage|Glasshouse|Hall|Hut|Kitchen|Küche|Lantern|Lawn|Lean-to|Living room|Loft|' +
  'Niche|Night rooms|Nook|Orangery|Pit|Porch|Ramp|Ramp, cut|Room|Shed|Side room|Stair room|' +
  'Staircase|Stairs|Stairs up|Storage|Studio|Study|Sun deck|Tower|Upper hall|Wing|Workshop|' +
  'Workshop "L"|Yard|Zürich, 1. OG|Balcony|Garden|Planted roof|Roof garden|Terrace|' +
  'Winter garden|Greenhouse 2|Ground fill, east|Garden kitchen|Bedroom balcony|Balcony bedroom|' +
  'Garage roof|Roof garage|Stairs to the roof terrace|Lift courtyard|Terrasse / Sauna|' +
  'Office on the roof|Storage balcony|Bathroom terrace|Greenhouse kitchen|Hallway greenhouse|' +
  'Office in the greenhouse|Storage, ground fill|Ground fill under the stairs|Showcase|' +
  'Shallow end|Embedded|Bedding|Uplift|Gymnasium|Entryway|Stairwell|Hobby cellar|Cut|Groundcut|' +
  'Ground-cut|Ground  cut|Cut ground|Ground cut over ground fill|Ground fill under a ground cut';
// And what is a cut where it was something else: a name that holds "ground cut" and no "ground
// fill" - alone, in capitals, in a longer name, after a word of a room, of glass and before one
// of open air, and by chance. Nine, each with what it counted as before.
const CUTS = {
  'Ground cut': 'room',
  'GROUND CUT': 'room',
  'ground cut': 'room',
  'Ground Cut, north': 'room',
  'The ground cut beside the house': 'room',
  'Kitchen ground cut': 'room',
  'Greenhouse ground cut': 'glass',
  'Ground cut, roof terrace': 'open',
  'Playground cutting': 'room',
};
const ALL = [...NAMES.split('|'), ...Object.keys(BY_NAME), ...NONE];
assert.equal(new Set(ALL).size, 163, 'a name of this check was lost: with the nine, 172');
for (const name of ALL) assert.deepEqual(countsAs([{ name }]), { as: was(name), by: 'name' }, name);
for (const [name, before] of Object.entries(CUTS)) {
  assert.deepEqual([was(name), countsAs([{ name }])], [before, { as: 'cut', by: 'name' }], name);
}
// By hand, of the names made up to break it: a word of a room before a word of open air, of
// glass or of ground leaves the name what it was, and so does a word by chance.
const HELD = {
  open: 'Kitchen garden|Garden kitchen|Bedroom balcony|Garage roof|Lift courtyard|Bathroom terrace',
  glass: 'Greenhouse kitchen|Office in the greenhouse|Hallway greenhouse',
  ground: 'Storage, ground fill|Ground cut over ground fill|Ground fill under a ground cut',
  room: 'Showcase|Shallow end|Embedded|Uplift|Stairwell|Cut|Groundcut|Ground-cut|Ground  cut',
};
for (const [as, names] of Object.entries(HELD)) {
  for (const name of names.split('|')) assert.equal(countsAs([{ name }]).as, as, name);
}

// --- what a block counts as: `blocks.countsAs` ------------------------------------------------------
// Each of the five answers by `is`, by a picked category and by a name - and `is` before the
// category, the category before the name: against each of the five.
const FIVE = {
  room: ['kitchen', 'Kitchen'],
  open: ['balcony', 'Balcony'],
  glass: ['greenhouse', 'Greenhouse'],
  ground: ['ground-fill', 'Ground fill'],
  cut: ['ground-cut', 'Ground cut'],
};
for (const [as, [category, name]] of Object.entries(FIVE)) {
  assert.deepEqual(countsAs([{ is: as }]), { as, by: 'is' });
  assert.deepEqual(countsAs([{ category }]), { as, by: 'category' });
  assert.deepEqual(countsAs([{ name }]), { as, by: 'name' });
  for (const [against, itsName] of Object.values(FIVE)) {
    assert.deepEqual(countsAs([{ name: itsName, category: against, is: as }]), { as, by: 'is' });
    assert.deepEqual(countsAs([{ name: itsName, category }]), { as, by: 'category' });
  }
}
// A key of the list counts as its row says; and of several boxes `is` on a later one is read
// before a category on the first. With neither, and no word of the list, a room by its name.
for (const one of LIST) assert.deepEqual(countsAs([{ category: one.key }]).as, one.as, one.key);
assert.deepEqual(countsAs([{ category: 'balcony' }, { is: 'cut' }]), { as: 'cut', by: 'is' });
assert.deepEqual(countsAs([{ name: 'Day rooms', category: 'Balcony' }]), {
  as: 'room',
  by: 'name',
});

// --- the ground --------------------------------------------------------------------------------------
// A CUT HOLDS NO GROUND BACK. The strip of earth.check.js: two walls of the house along columns
// 44 to 84, and a block of ground across their uphill end, its top at 816 m. With the second
// wall a cut - its floor in row 12, 820 m: over the hill, which lies no higher than 815.12 m
// under it, and over all that the dam fills - the ground is the ground of the first wall and
// the dam alone, number for number, and in as many sweeps: by `is`, by its category and by its
// name. It is not the ground between the two walls. And that cut alone shapes nothing.
const wall = (x, y) => ({ x, y, z: [12, 24], colour: 10 });
const WALLS = [wall([44, 84], [16, 18]), wall([44, 84], [24, 26])];
const DAM = { x: [40, 44], y: [18, 24], z: [20, 24], colour: 9, is: 'ground' };
const DUG = { ...WALLS[1], z: [6, 12] };
const open = earth.shaped(SITE, [WALLS[0], DAM]);
assert.notDeepEqual(open.heights, earth.shaped(SITE, [...WALLS, DAM]).heights);
for (const said of [{ is: 'cut' }, { category: 'ground-cut' }, { name: 'Ground cut' }]) {
  assert.equal(countsAs([{ ...DUG, ...said }]).as, 'cut');
  assert.deepEqual(earth.shaped(SITE, [WALLS[0], { ...DUG, ...said }, DAM]), open);
  assert.equal(earth.shaped(SITE, [{ ...DUG, ...said }]), null);
}
assert.ok(Math.max(...open.heights.flat()) <= 820 && open.heights[21][44] === 816);
// A PICKED CATEGORY REACHES THE GROUND. The terrace of earth.check.js, 5 m by 5 m with its top
// at 818 m, says `ground-fill` in the place of its `is`: the grid of that terrace, number for
// number. Saying neither, it is a room, and shapes nothing.
const TERRACE = { x: [40, 50], y: [20, 30], z: [16, 20], colour: 9 };
const filled = earth.shaped(SITE, [{ ...TERRACE, category: 'ground-fill' }]);
assert.deepEqual(filled, earth.shaped(SITE, [{ ...TERRACE, is: 'ground' }]));
assert.deepEqual([filled.heights[25][45], earth.shaped(SITE, [TERRACE])], [818, null]);

// --- the two pages -----------------------------------------------------------------------------------
// By their text: each names categories.js once, in the line before blocks.js.
for (const page of ['index.html', '3d.html']) {
  const text = readFileSync(`${import.meta.dirname}/${page}`, 'utf8');
  const lines = text.split('\n').map((line) => line.trim());
  const at = lines.indexOf('<script src="blocks.js"></script>');
  assert.ok(at > 0, `${page} does not load blocks.js`);
  assert.equal(lines[at - 1], '<script src="categories.js"></script>', page);
  assert.equal(text.split('categories.js').length, 2, `${page} names categories.js twice`);
}

process.stdout.write(
  'tools/sketch: a block has the category that was picked for it or that its name gives, every name counts as what it counted as but "ground cut", and a cut holds no ground back\n',
);
