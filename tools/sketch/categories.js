// The categories a block can have (story ST-028): the pad's one list of them, written once, for
// both pages. A row is `{ key, name, as, words }`: the word that a box says under `category`,
// the name the pad shows, what a block of it counts as - 'room', 'open', 'glass', 'ground' or
// 'cut' (blocks.js) - and the words by which a name is read where nobody picked: anywhere in the
// name, in capitals or not. And the one reading of what a block is, `of(boxes)`: its category,
// and by what - picked from the list, or its name. What a block counts as follows from it
// (`blocks.countsAs`): whoever needs either asks one of the two, and reads no field and no name.
//
// A plain script that reads nothing as it loads - no paper, no sketch, no page - so it is loaded
// in any place before a block is read. The list is the owner's to grow: a row, or a word for a
// room - letters in small, and blanks, for a word is read as it stands. A key is what a kept
// sketch says, so none is ever renamed or taken away, as no kind is; a name is what the pad
// shows, and what the 3D view reads once a category was picked (view3d/read.js): rewording one
// turns view3d/picked.check.js red until someone says what its floor is. And no word is added
// by which a name is open air, glass, ground or a cut: every name counts as what it counted as
// (ST-028, rule 4).
(() => {
  const ROWS = [
    ['living-room', 'Living room', 'room', 'living', 'lounge'],
    ['kitchen', 'Kitchen', 'room', 'kitchen'],
    ['dining-room', 'Dining room', 'room', 'dining'],
    ['bedroom', 'Bedroom', 'room', 'bed'],
    ['bathroom', 'Bathroom', 'room', 'bath', 'ensuite', 'shower'],
    ['toilet', 'Toilet', 'room', 'toilet', 'wc'],
    ['office', 'Office', 'room', 'office', 'study'],
    ['corridor', 'Corridor', 'room', 'corridor', 'hall', 'passage'],
    ['entrance', 'Entrance', 'room', 'entrance', 'entry', 'airlock', 'lobby'],
    ['staircase', 'Staircase', 'room', 'stair'],
    ['lift', 'Lift', 'room', 'lift', 'elevator'],
    ['storage', 'Storage', 'room', 'storage', 'pantry', 'closet'],
    ['cellar', 'Cellar', 'room', 'cellar', 'basement'],
    ['laundry', 'Laundry', 'room', 'laundry', 'utility'],
    ['technical-room', 'Technical room', 'room', 'technical', 'boiler', 'heating'],
    ['shaft', 'Shaft', 'room', 'shaft', 'duct'],
    ['garage', 'Garage', 'room', 'garage', 'parking'],
    ['ramp', 'Ramp', 'room', 'ramp', 'driveway'],
    ['workshop', 'Workshop', 'room', 'workshop', 'atelier'],
    ['gym', 'Gym', 'room', 'gym', 'fitness'],
    ['sauna', 'Sauna', 'room', 'sauna', 'wellness'],
    ['leisure-room', 'Leisure room', 'room', 'cinema', 'fumoir', 'games', 'hobby', 'music'],
    ['balcony', 'Balcony', 'open', 'balcon'],
    ['terrace', 'Terrace', 'open', 'terrace', 'terrass'],
    ['garden', 'Garden', 'open', 'garden'],
    ['courtyard', 'Courtyard', 'open', 'courtyard'],
    ['roof', 'Roof', 'open', 'roof'],
    ['greenhouse', 'Greenhouse', 'glass', 'greenhouse'],
    ['ground-fill', 'Ground fill', 'ground', 'ground fill'],
    ['ground-cut', 'Ground cut', 'cut', 'ground cut'],
  ];
  // The list, in the order it is shown in. Nothing changes a row: it is handed out as it is.
  const LIST = Object.freeze(
    ROWS.map(([key, name, as, ...words]) =>
      Object.freeze({ key, name, as, words: Object.freeze(words) }),
    ),
  );
  const BY_KEY = new Map(LIST.map((row) => [row.key, row]));

  // The order a name is read in where it holds words of several rows: first by what the rows
  // count as, in the order a name was read in before there were categories - ground, then a
  // cut, then glass, then open air, then a room.
  const ORDER = ['ground', 'cut', 'glass', 'open', 'room'];
  // For each of the five, the words of its rows in the list's order: as one pattern, which
  // finds the word that stands first in a name - and of two that begin at one place, the one
  // that stands first in the pattern - and each with its row.
  const READ = ORDER.map((as) => {
    const rows = LIST.filter((row) => row.as === as);
    const words = rows.flatMap((row) => row.words.map((word) => [word, row]));
    return { pattern: new RegExp(words.map(([word]) => word).join('|')), rowOf: new Map(words) };
  });

  /**
   * The category that a name gives, the name in small letters: the row of which it holds a
   * word, anywhere in it - or null, where it holds none. Of several rows the one that comes
   * first in the order a name is read in (`ORDER`); among the rows of what the name then counts
   * as, the one whose word stands first in the name; and of two words that begin at one place,
   * the row that stands first in the list. So "ground fill, roof terrace" is Ground fill,
   * "kitchen garden" a Garden, "kitchen / dining" a Kitchen and "roof garden" a Roof.
   */
  function named(name) {
    for (const { pattern, rowOf } of READ) {
      const found = pattern.exec(name);
      if (found) return rowOf.get(found[0]);
    }
    return null;
  }

  /**
   * What a block is, of its boxes as `sketch.blockOf` gives them: `{ category, by }`.
   * `category` is a row of the list, or null where the block has none; `by` is 'picked' or
   * 'name'. Picked: of the boxes, in their order, the first that says under `category` a key of
   * the list counts, as with a name. Anything else there says nothing - a key in capitals, a
   * number, a word that no row has - and stays in the sketch as it was written. Where no box
   * says one, the block's name gives it (`named`): the name of its first box that has one, as
   * text. And a block with no name, or with a name that holds no word of the list, has none.
   */
  function of(boxes) {
    const picked = boxes.find((box) => BY_KEY.has(box.category))?.category;
    if (picked !== undefined) return { category: BY_KEY.get(picked), by: 'picked' };
    const name = String(boxes.find((box) => box.name)?.name ?? '').toLowerCase();
    return { category: named(name), by: 'name' };
  }

  globalThis.categories = { LIST, of };
})();
