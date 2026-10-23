// The Info page (story ST-032, T-032.5): what the sketch adds up to - a line for the whole house,
// and a table by section, by level and by category - and the rates of a rough cost, which the
// owner types here and the sketch keeps. The figures are `sums.of()`'s: this page adds up
// nothing, and shows them. Rounding happens here and nowhere before, in one function for each
// of the three units: square metres to two decimals at the most, cubic metres to three, francs
// to the whole franc. Which quantity a rate multiplies is `rates.PER`'s, and is stated nowhere
// here: the words of a field and the sentence under the fields are made of it.
//
// A rate is written as view3d/read.js writes a figure of the house: into the sketch that the
// browser keeps at that moment, by the pad's own `sketch.change` and `rates.set` - kept at once,
// and a step that the pad's Undo takes back - and never over a text that the pad cannot read:
// where the browser keeps one, the fields are off, no figure shows, and the page's line says so.
// And the page follows another window, by the browser's `storage` event of the sketch's own key.
//
// A plain script, the page's last: it asks `sketch`, `rates` and `sums` of `globalThis`, and
// leaves `globalThis.infoPage` - how a figure and a cost are shown - for whoever checks them.
(() => {
  const { document, localStorage, sketch, rates, sums } = globalThis;
  const $ = (id) => document.getElementById(id);

  // What the page's line says: of a sketch that it cannot read, and of a rate that the browser
  // did not keep. A text that is no rate is refused under its own field.
  const UNREADABLE =
    'What this browser keeps as the sketch cannot be read, so nothing of it is counted, and no ' +
    'rate is taken. Nothing was changed.';
  const NOT_KEPT = 'This browser did not keep the rate, so nothing was changed.';
  // What a unit of `rates.PER` is called, where a rate is for one of it, and what it measures.
  const UNITS = { 'm³': ['A cubic metre', 'volume'], 'm²': ['A square metre', 'area'] };
  // What a block counts as, as the page says it: in what a cost leaves out, and in a rate's words.
  const KINDS = {
    room: ['rooms', 'of rooms'],
    glass: ['glass', 'under glass'],
    open: ['open air', 'of open air'],
  };
  // The tables, each by its caption and the word over its names; and the columns after a name.
  const TABLES = {
    sections: ['info-sections', 'By section', 'Section'],
    levels: ['info-levels', 'By level', 'Level'],
    categories: ['info-categories', 'By category', 'Category'],
  };
  const COLUMNS = ['Floor', 'Open air', 'Volume', 'Rough cost'];
  const OWN_RATE = 'Its own rate';
  const DASH = '–';
  // What shows only where something is drawn, and what is said in a line of its own.
  const DRAWN = ['info-house', 'info-is', ...Object.values(TABLES).map(([id]) => id)];
  const SAID = ['info-twice', 'info-through', 'info-apart'];

  /** A number to so many decimals at the most, with no zero after its last figure. */
  const decimals = (value, most) => String(Number(value.toFixed(most)));
  /** Square metres, to two decimals at the most: "8.25 m²". Whole cells show exactly. */
  const area = (m2) => `${decimals(m2, 2)} m²`;
  /** Cubic metres, to three: "5.625 m³" - so the rows of a table add up to its total as they stand. */
  const volume = (m3) => `${decimals(m3, 3)} m³`;
  /** Francs, to the whole franc, in threes with an apostrophe between: "CHF 469'400". */
  const francs = (chf) => `CHF ${String(Math.round(chf)).replace(/\B(?=(\d{3})+$)/g, "'")}`;
  /** Words one after another, with commas and "and": "rooms, glass and open air". */
  const listed = (words) =>
    words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;

  /**
   * What a row costs, in words: its francs - and what that leaves out, by what a block counts as -
   * "no cost" where it has blocks and none of them has a rate, and a dash where it counts none.
   */
  function cost({ blocks, cost: chf, without }) {
    if (blocks === 0) return DASH;
    if (chf === null) return 'no cost';
    const left = listed(without.map((as) => KINDS[as][0]));
    return left === '' ? francs(chf) : `${francs(chf)} without ${left}`;
  }
  /** A row's floor, open air, volume and cost as they show: a dash in each where it counts no block. */
  const figures = (row) =>
    row.blocks === 0
      ? COLUMNS.map(() => DASH)
      : [area(row.floor), area(row.open), volume(row.volume), cost(row)];

  /** What a rate multiplies, in the sentence under the fields: kind by kind, as `rates.PER` says. */
  function costedBy() {
    const units = [...new Set(Object.values(rates.PER))];
    const told = units.map((unit, at) => {
      const of = Object.keys(rates.PER).filter((as) => rates.PER[as] === unit);
      const [are, their] = of.length > 1 ? ['are', 'their'] : ['is', 'its'];
      const how = `${at === 0 ? ` ${are} costed` : ''} by ${their} ${UNITS[unit][1]}`;
      return `${listed(of.map((as) => KINDS[as][0]))}${how}`;
    });
    const said = told.join(', ');
    const pick = 'The pad picks no rate: what has none has no cost.';
    const own = 'a category with a rate of its own is costed by that one.';
    return `${pick} ${said[0].toUpperCase()}${said.slice(1)}; ${own}`;
  }

  // The fields of the rates, each made the first time it is asked for and kept under its id,
  // with the sentence under it of a text that it refused: so a table made anew holds the very
  // field that was there, with the text and the focus that it had. And what the line says of the
  // last rate written, where the browser did not keep it.
  const fields = new Map();
  let notKept = '';

  /** Whether the browser keeps something as the sketch that the pad cannot read: nothing kept is not that. */
  function unreadable() {
    try {
      return localStorage.getItem(sketch.KEY) !== null && sketch.stored() === null;
    } catch {
      return false;
    }
  }

  /**
   * Writes a rate into the sketch that the browser keeps at this moment - as another window left
   * it, were this page never told of it - by the pad's own way of changing the sketch, and
   * nothing else: kept at once, and a step for the pad's Undo; a rate that the sketch holds
   * already is none. Then the page shows what the browser keeps: a rate that it did not keep is
   * not shown either. Where it keeps what cannot be read, nothing is written and nothing set aside.
   */
  function write(which, value) {
    if (!unreadable()) {
      const now = sketch.stored();
      if (now) sketch.doc = now;
      sketch.change((doc) => rates.set(doc, which, value));
      notKept = sketch.trouble === '' ? '' : NOT_KEPT;
      sketch.doc = sketch.stored() ?? sketch.doc;
    }
    show();
  }

  /** A text typed as a rate, as its field is left or at Enter: written, or refused in words under the field, where the text stays. */
  function take({ input, said }, which) {
    const { value, refused = '' } = rates.typed(input.value);
    Object.assign(said, { textContent: refused, hidden: refused === '' });
    if (refused !== '') return;
    input.dataset.shown = input.value;
    write(which, value);
  }

  /** The field of a rate - `which`, as `rates.set` takes it - with "CHF" before it and what `after` says after it, and the sentence under it. */
  function rateIn(id, which, after = '', named = '') {
    if (!fields.has(id)) {
      const input = Object.assign(document.createElement('input'), { id, type: 'text' });
      Object.assign(input, { inputMode: 'decimal', autocomplete: 'off' });
      if (named) input.setAttribute('aria-label', named);
      const said = Object.assign(document.createElement('small'), { className: 'refused' });
      said.hidden = true;
      fields.set(id, { input, said });
      input.addEventListener('change', () => take(fields.get(id), which));
    }
    const { input, said } = fields.get(id);
    const holder = Object.assign(document.createElement('span'), { className: 'rate' });
    holder.append('CHF ', input, ...(after === '' ? [] : [` ${after}`]));
    return [holder, said];
  }

  /** Has a field show a rate as the sketch holds it, or nothing - but a text of the owner's that was not taken, or was refused, it leaves. */
  function shown(id, held, off = false) {
    const { input } = fields.get(id);
    const text = held === undefined || held === null ? '' : String(held);
    if (input.value === (input.dataset.shown ?? '')) input.value = text;
    input.dataset.shown = text;
    input.disabled = off;
  }

  /** The cell of a category's own rate: a field, with the unit that the category is costed by - none in "No category", or in a total. */
  function ownRate({ name, key, as, rate }) {
    const cell = document.createElement('td');
    const unit = rates.PER[as];
    if (!key || unit === undefined) return cell;
    const id = `rate-${key}`;
    cell.append(...rateIn(id, { category: key }, `per ${unit}`, `${OWN_RATE}: ${name}`));
    shown(id, rate);
    return cell;
  }

  /** A row of a table: a cell for each text - the first the head of its row - and the cells `more` makes of it. */
  function line(texts, tag = 'td') {
    const row = document.createElement('tr');
    for (const [at, text] of texts.entries()) {
      row.append(
        Object.assign(document.createElement(at === 0 ? 'th' : tag), { textContent: text }),
      );
    }
    return row;
  }

  /** A table of `sums.of()`: its caption, its head, a line for each of its rows, and its total. */
  function table([id, caption, kind], { rows, total }, more) {
    const named = Object.assign(document.createElement('caption'), { textContent: caption });
    const head = line([kind, ...COLUMNS, ...(more ? [OWN_RATE] : [])], 'th');
    const body = [...rows, total].map((row) => {
      const one = line([row.name, ...figures(row)]);
      if (more) one.append(more(row));
      return one;
    });
    body.at(-1).className = 'total';
    $(id).replaceChildren(named, head, ...body);
  }

  /** Has a part say a text, and show where it says one. */
  function say(id, text) {
    Object.assign($(id), { textContent: text, hidden: text === '' });
  }

  /** The sentences of floor counted twice, of blocks through more than one level, and of what is not counted. */
  function sentences({ twice, through, apart }) {
    const lie = 'of floor are counted twice: blocks lie over each other there.';
    say('info-twice', twice.map(({ name, m2 }) => `On ${name}, ${area(m2)} ${lie}`).join(' '));
    const [reach, each] =
      through === 1 ? ['1 block reaches', 'it'] : [`${through} blocks reach`, 'each'];
    const room =
      'is counted as one room, by the floor that it covers seen from above, on its lowest level.';
    say('info-through', through > 0 ? `${reach} through more than one level: ${each} ${room}` : '');
    const kinds = [
      [apart.ground, 'block of ground', 'blocks of ground'],
      [apart.cut, 'cut', 'cuts'],
    ];
    const counted = kinds.filter(([count]) => count > 0);
    const words = counted.map(([count, one, more]) => `${count} ${count === 1 ? one : more}`);
    say('info-apart', words.length === 0 ? '' : `Not counted: ${words.join(' and ')}.`);
  }

  /**
   * Shows what the sketch adds up to, and its rates - or, where the browser keeps a sketch that
   * cannot be read, no figure: the fields are off, and the line says why. Every figure follows
   * the sketch at once. A field that had the focus has it again once its table is made anew.
   */
  function show() {
    const had = document.activeElement;
    const locked = unreadable();
    say('info-said', locked ? UNREADABLE : notKept);
    const held = rates.of(locked ? null : sketch.doc);
    for (const as of Object.keys(rates.PER)) shown(`rate-${as}`, held.as[as], locked);
    const all = locked ? null : sums.of();
    const drawn = all !== null && all.blocks > 0;
    $('info-none').hidden = locked || drawn;
    for (const id of [...DRAWN, ...SAID]) $(id).hidden = !drawn;
    if (!drawn) return;
    const { house } = all;
    const priced = house.blocks > 0 ? ` — ${cost(house)}` : '';
    const room = `${area(house.floor)} of floor, ${area(house.open)} of open air`;
    say('info-house', `The whole house: ${room}, ${volume(house.volume)}${priced}.`);
    for (const [part, named] of Object.entries(TABLES)) {
      table(named, all[part], part === 'categories' ? ownRate : undefined);
    }
    sentences(all);
    if (had?.isConnected && had !== document.activeElement) had.focus();
  }

  // The three rates of what a block counts as, in the order of `rates.PER`: each with its words,
  // which say what one of it is - "A cubic metre of rooms" - and under them what each multiplies.
  $('rates').replaceChildren(
    ...Object.entries(rates.PER).map(([as, unit]) => {
      const words = `${UNITS[unit][0]} ${KINDS[as][1]}`;
      const label = Object.assign(document.createElement('label'), { textContent: words });
      label.htmlFor = `rate-${as}`;
      const item = document.createElement('li');
      item.append(label, ...rateIn(`rate-${as}`, { as }));
      return item;
    }),
  );
  $('rates-are').textContent = costedBy();

  // Another window changed the sketch, or the whole store was emptied: the page shows what the
  // browser keeps now, with no reload - an empty paper, where it keeps nothing.
  globalThis.addEventListener('storage', ({ key }) => {
    if (key !== sketch.KEY && key !== null) return;
    sketch.doc = sketch.stored() ?? sketch.adopt(sketch.blank());
    notKept = '';
    show();
  });

  show();
  globalThis.infoPage = { area, volume, francs, cost };
})();
