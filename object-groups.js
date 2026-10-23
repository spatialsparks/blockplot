// The groups of the objects (story ST-029): every kind the pad has (shapes.js), sorted by where
// one looks for it - the parts of a house that are no block, a kitchen's, a bathroom's,
// furniture, what stands in a garden, and what one judges size by. They are written here once,
// with the kinds, in the order the gallery shows them (gallery.js), a kind by its key in
// `shapes.KINDS`: its name and its size are that list's, and are said nowhere else. Whoever
// sorts the objects reads `shapes.GROUPS`, each `{ name, kinds, tiles }`: the gallery its tiles,
// and what 3D shows and hides (view3d/read.js) its kinds.
//
// A kind stands in one group and in no second, and a kind added to `KINDS` wants its place
// here - gallery.check.js fails until it has one, for the gallery shows no kind that stands in
// no group. The script reads nothing as it loads but `shapes`, and knows no page.
//
// A START is a named starting size (story ST-035): a key of `shapes.STARTS`, `{ name, kind,
// sizes, place }`. A tile of it sets down its `kind` with the fields of `sizes` - a single bed is
// a bed `{ deep: 1 }` - and stands in the place of the kind `place`. A start is no kind: its key
// is never a key of `KINDS`, and no file says it - an object set down is of its kind, and a start
// only gives the size it begins at. A group's `kinds` are the kinds, whatever stands in their
// place; its `tiles` are those kinds in order, each replaced by its starts where it has any.
(() => {
  const { shapes } = globalThis;
  // The story's table, row for row: a group's name, and its kinds in their order.
  const TABLE = [
    ['Doors, windows and stairs', 'door window stairs widestairs spiral'],
    ['Kitchen', 'island counter hob sink fridge'],
    ['Bathroom', 'toilet basin bath shower towelrail'],
    [
      'Furniture',
      'bed sofa table chair desk wardrobe cupboard sideboard shelf officechair armchair cornersofa ' +
        'floorlamp tablelamp pendant plant',
    ],
    ['Garden', 'tree bush fountain bench gardentable lounger parasol grill'],
    ['People and cars', 'person car'],
  ];
  // The story's four starts (ST-035), in the order their tiles show: a bed 1, 1.5 and 2 m wide -
  // the bed's own width - and a staircase 1.5 m wide, where the wide staircase was.
  const start = (name, kind, sizes, place = kind) => ({ name, kind, sizes, place });
  const STARTS = {
    singlebed: start('Single bed', 'bed', { deep: 1 }),
    doublebed: start('Double bed', 'bed', { deep: 1.5 }),
    kingbed: start('King-size bed', 'bed', {}),
    widestaircase: start('Wide staircase, one storey', 'stairs', { deep: 1.5 }, 'widestairs'),
  };
  /** The tiles of a kind: the starts that stand in its place, or, where none does, the kind. */
  const tilesOf = (kind) => {
    const starts = Object.keys(STARTS).filter((key) => STARTS[key].place === kind);
    return starts.length > 0 ? starts : [kind];
  };
  shapes.STARTS = STARTS;
  shapes.GROUPS = TABLE.map(([name, list]) => {
    const kinds = list.split(' ');
    return { name, kinds, tiles: kinds.flatMap(tilesOf) };
  });
})();
