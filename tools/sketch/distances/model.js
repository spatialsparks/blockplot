// The boundary distances of a sketch (story ST-036; version 10 of the sketch file). A boundary
// distance - a Grenzabstand - is how far a building keeps from the boundary of its parcel. The
// owner reads three from the rules of their own zone and types them: a small one (kleiner
// Grenzabstand), a large one (grosser Grenzabstand), and one for annexes (An- und Nebenbauten).
// The pad holds no figure of any zone and has no default: a distance that is not typed is none,
// and draws nothing (directive 31: a limit is read from its source, never from memory).
//
// Here: the three, named once; what a sketch says of them; what a typed text is as one; how one
// is written into a sketch; and how a line is labelled with one. The sketch keeps them as it
// keeps its rates - `doc.distances`. Whether the lines show is the view's switch, and is never
// written here or into the sketch. The model is info/rates.js.
//
// A plain script that reads nothing as it loads - no paper, no sketch, no page: it knows no
// sketch but the one it is handed.
(() => {
  /** The three distances, in the order a sketch writes them: no figure stands here. */
  const LISTED = Object.freeze(
    [
      { name: 'smallM', words: 'small boundary distance' },
      { name: 'largeM', words: 'large boundary distance' },
      { name: 'annexM', words: 'boundary distance of annexes' },
    ].map((one) => Object.freeze(one)),
  );
  /** A distance is a number of metres from this to `TO_M`, both ends within: no zone's figure. */
  const FROM_M = 0.5;
  const TO_M = 30;
  // What a distance is typed as: digits, with one point or one comma among them or none.
  // Nothing else: no sign, no unit, no exponent, no blank within.
  const TYPED = /^(\d+[.,]?\d*|[.,]\d+)$/;
  // A typed distance is taken to the centimetre.
  const CM_PER_M = 100;
  // A label has one decimal, or two where the centimetres need them: 4.0 m, 3.25 m.
  const CM_PER_DECIMAL = 10;

  const NAMES = LISTED.map((one) => one.name);

  /** Whether a distance can be this: a number within the range. */
  const holds = (value) => Number.isFinite(value) && value >= FROM_M && value <= TO_M;

  /**
   * The distances that a sketch holds: `{ smallM?, largeM?, annexM? }`, in the order of `LISTED`.
   * What is no number within the range, and what stands under any other name, is not read. A
   * sketch that says nothing of them - every sketch drawn before there were any - has `{}`.
   */
  function of(doc) {
    const said = Object(doc?.distances);
    const held = NAMES.filter((name) => Object.hasOwn(said, name) && holds(said[name]));
    return Object.fromEntries(held.map((name) => [name, said[name]]));
  }

  /**
   * What a typed text is as a distance: `{ value }`, a number within the range, to the
   * centimetre - `{ value: null }` for a text of blanks alone, which takes the distance away -
   * or `{ refused }`, in one sentence that names the range. A comma is read as a point.
   */
  function typed(text) {
    const asked = String(text ?? '').trim();
    if (asked === '') return { value: null };
    const digits = asked.replace(',', '.');
    const value = TYPED.test(asked) ? Math.round(Number(digits) * CM_PER_M) / CM_PER_M : NaN;
    if (holds(value)) return { value };
    return {
      refused: `A boundary distance is a number from ${FROM_M} to ${TO_M} m: "${asked}" is none.`,
    };
  }

  /**
   * Writes one distance into a sketch, by its name of `LISTED`, or takes it away with null.
   * `doc.distances` then holds what `of` read of it, with that change, in the order of
   * `LISTED`; a `distances` that holds none is left out, so a sketch whose last distance is
   * taken away has the bytes of one that never held a distance. What is no distance - a name
   * not listed, a value that is no number within the range - is not written.
   */
  function set(doc, name, value) {
    if (!NAMES.includes(name)) return;
    if (value !== null && !holds(value)) return;
    const read = of(doc);
    if (value === null) delete read[name];
    else read[name] = value;
    const held = NAMES.filter((one) => Object.hasOwn(read, one));
    if (held.length > 0) doc.distances = Object.fromEntries(held.map((one) => [one, read[one]]));
    else delete doc.distances;
  }

  /** The figure as a line is labelled: `4.0 m`, `7.5 m`, `3.25 m`. */
  function label(value) {
    const cm = Math.round(value * CM_PER_M);
    const decimals = cm % CM_PER_DECIMAL === 0 ? 1 : 2;
    return `${(cm / CM_PER_M).toFixed(decimals)} m`;
  }

  globalThis.distances = { LISTED, FROM_M, TO_M, of, typed, set, label };
})();
