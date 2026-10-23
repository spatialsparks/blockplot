// The rates of a rough cost (story ST-032; version 7 of the sketch file): what the owner typed
// for a unit of what is built, in francs. A rate is the owner's (the story's rule 3): the pad
// picks none, there is no default, and what has no rate has no cost. The sketch keeps them, as
// it keeps the figures of the house - `doc.rates`, in two parts: `as`, a rate for what a block
// counts as - a room, glass, open air - and `category`, a rate of its own for one category of
// the pad's list (categories.js), which goes before the rate of what that category counts as.
//
// Here: what a rate multiplies, said once; what a sketch says of its rates; what a typed text
// is as one; and how one is written into a sketch. The model is figures.js. Nothing here adds
// anything up: that is the Info page's own computation.
//
// A plain script that reads nothing as it loads - no paper, no sketch, no page: it asks
// `globalThis.categories` when it is asked, and knows no sketch but the one it is handed.
(() => {
  /**
   * What a rate multiplies, by what a block counts as - named here once: francs a cubic metre
   * of rooms and of what stands under glass, francs a square metre of open air. Ground and a
   * cut have no rate: they are no part of the house.
   */
  const PER = Object.freeze({ room: 'm³', glass: 'm³', open: 'm²' });
  /** A rate is a number from 0 to this, its two ends within it: no figure of the design. */
  const MOST = 1_000_000;
  // What a rate is typed as: digits, with one point or one comma among them or none. Nothing
  // else: no sign, no unit, no exponent, no blank within.
  const TYPED = /^(\d+[.,]?\d*|[.,]\d+)$/;
  // An apostrophe between two digits, as a thousand is written: 1'200. The straight one, and the
  // curled one, which is named by its number, 2019: the two look alike.
  const BETWEEN_DIGITS = /(\d)['\u{2019}](?=\d)/gu;
  // A typed rate is taken to the centime.
  const PER_FRANC = 100;

  /** Whether a rate can be this: a number within the range. */
  const holds = (value) => Number.isFinite(value) && value >= 0 && value <= MOST;

  /**
   * The names that a rate stands under, part by part and each in its order: under `as` the three
   * of `PER`, and under `category` the keys of the list's rows that count as one of the three.
   */
  const names = () => {
    const rated = globalThis.categories.LIST.filter((row) => Object.hasOwn(PER, row.as));
    return { as: Object.keys(PER), category: rated.map((row) => row.key) };
  };

  /**
   * The rates that a sketch holds: `{ as, category }`, each rate under its name, in the order of
   * `names`. What is no number within the range, and what stands under any other name, is not
   * read. A sketch that says nothing of its rates - every sketch drawn before there were any -
   * has two empty parts: no rate, and so no cost.
   */
  function of(doc) {
    const said = Object(doc?.rates);
    const read = ([part, keys]) => {
      const held = keys.filter((key) => holds(Object(said[part])[key]));
      // No zero below zero: a rate of -0 is a rate of 0.
      return [part, Object.fromEntries(held.map((key) => [key, said[part][key] + 0]))];
    };
    return Object.fromEntries(Object.entries(names()).map(read));
  }

  /**
   * What a typed text is as a rate: `{ value }`, a number within the range, to the centime -
   * `{ value: null }` for a text of blanks alone, which takes the rate away - or `{ refused }`,
   * in a sentence that names the range. A comma is read as a point, and an apostrophe between
   * two digits is passed over: 1'200 is 1200. One that stands anywhere else is no part of a rate.
   */
  function typed(text) {
    const asked = String(text ?? '').trim();
    if (asked === '') return { value: null };
    const digits = asked.replace(BETWEEN_DIGITS, '$1').replace(',', '.');
    const value = TYPED.test(digits) ? Math.round(Number(digits) * PER_FRANC) / PER_FRANC : NaN;
    if (holds(value)) return { value };
    return { refused: `A rate is a number from 0 to ${MOST}, in francs: "${asked}" is none.` };
  }

  /**
   * Writes one rate into a sketch, or takes it away with null: `which` is `{ as }`, one of the
   * three words of `PER`, or `{ category }`, a key of the list. `doc.rates` then holds what the
   * pad read of it and nothing else, in the order of `names`: `as` before `category`. A part
   * that holds none is left out, and so is a `rates` that holds none: a sketch whose last rate
   * is taken away has the bytes of one that never held a rate. What is no rate - a number
   * outside the range, a name that has none - is not written: the sketch stays as it is.
   */
  function set(doc, which, value) {
    const listed = names();
    const said = Object.entries(Object(which)).filter(([, name]) => name !== undefined);
    const [part, name] = said.length === 1 ? said[0] : [];
    if (!Object.hasOwn(listed, part ?? '') || !listed[part].includes(name)) return;
    if (value !== null && !holds(value)) return;
    const read = of(doc);
    if (value === null) delete read[part][name];
    else read[part][name] = value + 0;
    const parts = Object.entries(listed).flatMap(([one, keys]) => {
      const held = keys.filter((key) => Object.hasOwn(read[one], key));
      const inOrder = Object.fromEntries(held.map((key) => [key, read[one][key]]));
      return held.length > 0 ? [[one, inOrder]] : [];
    });
    if (parts.length > 0) doc.rates = Object.fromEntries(parts);
    else delete doc.rates;
  }

  globalThis.rates = { PER, MOST, of, typed, set };
})();
