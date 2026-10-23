// The kept sketches of the pad (ST-025, ST-040 T-040.5): two entries of the File menu, and their
// window. Keep asks for a name, offering the day and the time, says first where the plot's
// sketches are kept, and keeps the sketch as it is, byte for byte what "Save file" saves: once,
// and never over a sketch that is kept - into the sketches/ of a plot that came as its folder,
// else into this browser. Open kept lists what is kept, the newest first, and opens the one
// picked as "Open file" opens a file, so that Undo brings back what was there. Both say what
// happened in a window of their own. Where to keep and what is said is kept-ways.js's, which
// kept.check.js asks; this is the window, which a browser test presses. The browser's store is
// loaded as a button asks for it. Opened from its file, the page cannot load it: they say so.
(() => {
  const { document, location, URL, paper, sketch, legacy, keptWays } = globalThis;
  const { refusal, offered } = keptWays;
  const $ = (id) => document.getElementById(id);
  // The plot that the page shows - every page has one since T-040.4 - and the example where not.
  const plot = globalThis.PLOT ?? { id: 'example', way: 'example' };
  // Where this script lies, taken as it runs: the store lies beside it.
  const here = document.currentScript?.src ?? location.href;
  /** What kept-ways.js is handed: the plot, the store's two modules, and the page's sketch. */
  async function store() {
    const load = (file) => import(new URL(file, here).href);
    const [held, ways] = await Promise.all(['store/held.js', 'store/ways.js'].map(load));
    return { plot, held, ways, sketch, legacy };
  }
  // What keeping needs and the page lacks: opened from its file, it cannot load the store.
  const NEEDS =
    location.protocol === 'file:'
      ? `keeping needs the pad's own address. Start the pad with "pnpm sketch" and open the ` +
        "address it names: opened from its file, the page cannot load the browser's store. " +
        '"Save file" and "Open file" work here as they did.'
      : '';
  const ONCE = 'A kept sketch is never written over: a name is used once.';

  /** Keeps the sketch as it is under a name: the file that "Save file" saves (files.js). */
  async function keep(name) {
    if (NEEDS) return { kept: false, words: `Nothing was kept: ${NEEDS}` };
    return keptWays.keep(name, JSON.stringify(sketch.doc), await store());
  }
  /** What is kept on the plot, and what to say of it. */
  async function list() {
    if (NEEDS) return { kept: null, folder: null, words: keptWays.says.unlistable(NEEDS) };
    return keptWays.list(await store());
  }
  /** Opens a kept sketch of the list: '' - or why it was not. */
  const open = async (entry) => keptWays.open(entry, await store());

  const make = (tag, set, ...parts) => {
    const made = Object.assign(document.createElement(tag), set);
    made.append(...parts);
    return made;
  };
  // The window that both buttons open: a name to keep under, and where it is kept, or the kept
  // sketches to pick from, and under either what happened, in words.
  const heading = make('h2', { id: 'kept-title', style: 'margin: 0 0 10px; font-size: 14px' });
  const field = make('input', {
    id: 'kept-name',
    size: 34,
    autocomplete: 'off',
    spellcheck: false,
    style: 'font: inherit; padding: 3px',
  });
  const submit = make('button', { textContent: 'Keep under this name' });
  const where = make('p', { id: 'kept-where', style: 'margin: 8px 0 0' });
  const form = make('form', {}, make('label', {}, 'Name ', field), ' ', submit, where);
  const picks = make('div', { id: 'kept-list', style: 'max-height: 50vh; overflow: auto' });
  const said = make('output', {
    id: 'kept-said',
    style: 'display: block; margin: 10px 0; overflow-wrap: anywhere',
  });
  const close = make('button', { type: 'button', textContent: 'Close' });
  const shown = make(
    'dialog',
    {
      id: 'kept-window',
      style:
        'width: 36em; max-width: 90vw; padding: 14px 16px; border: 1px solid #9aa5b1; ' +
        'border-radius: 6px; color: inherit',
    },
    ...[heading, form, picks, said, close],
  );

  /** Opens the window on the part asked for - the name, the list, or neither - and says a word. */
  function show(title, part, words) {
    heading.textContent = title;
    form.hidden = part !== form;
    picks.hidden = part !== picks;
    said.textContent = words;
    if (!shown.open) shown.showModal();
  }

  let asking = false;
  /**
   * Does one thing at a time - a second Enter is no second sketch to keep - and has the window
   * say nothing while it works, and then what `act` gives: what came of it.
   */
  async function once(act) {
    if (asking) return;
    asking = true;
    said.textContent = '';
    try {
      said.textContent = await act();
    } finally {
      asking = false;
    }
  }

  /** Keeps the sketch under the name in the field: kept, the field goes, and the words stay. */
  async function keepNamed() {
    const { kept, words } = await keep(field.value.trim());
    form.hidden = kept;
    if (kept) close.focus();
    return words;
  }

  /** Opens a kept sketch, and closes the window on it - or says why it did not. */
  async function openNamed(entry) {
    const why = await open(entry);
    if (!why) shown.close();
    return why;
  }

  /** Lists the kept sketches as buttons, each with when it was kept - and where, of a folder's plot: a click opens that one. */
  async function pick() {
    const { kept, folder, words } = await list();
    const entry = (one) => {
      const button = make('button', { type: 'button', textContent: one.name });
      button.addEventListener('click', () => once(() => openNamed(one)));
      const inBrowser = folder !== null && one.where !== 'folder' ? ' in this browser' : '';
      const when = ` kept ${new Date(one.at).toLocaleString()}${inBrowser}`;
      const time = make('small', { textContent: when, style: `color: ${paper.FAINT}` });
      return make('p', { style: 'margin: 4px 0' }, button, time);
    };
    picks.replaceChildren(...(kept ?? []).map(entry));
    return words;
  }

  /** Says under the field where the plot's sketches are kept: asked of the store, once a window. */
  async function whereKept() {
    where.textContent = '';
    try {
      where.textContent = await keptWays.where(await store());
    } catch {
      // The store cannot be asked: Keep says why, as it keeps.
    }
  }

  const keepIt = make('button', {
    id: 'keep',
    type: 'button',
    textContent: 'Keep',
    title:
      "The whole sketch under a name, in the plot's folder or in this browser: it is never written over",
  });
  const openIt = make('button', {
    id: 'open-kept',
    type: 'button',
    textContent: 'Open kept',
    title: 'A sketch that was kept, in the place of this one: Undo brings this one back',
  });
  keepIt.addEventListener('click', () => {
    // Where the page cannot load the store, the window has no field for a name: it says why.
    const words = NEEDS ? `Nothing can be kept here: ${NEEDS}` : ONCE;
    show('Keep the sketch', NEEDS ? null : form, words);
    field.value = offered(new Date());
    field.select();
    if (!NEEDS) void whereKept();
  });
  openIt.addEventListener('click', () => {
    picks.replaceChildren();
    show('Open a kept sketch', picks, '');
    void once(pick);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void once(keepNamed);
  });
  close.addEventListener('click', () => shown.close());
  // A key pressed in the window is the window's. A field has its keys anyway, by views.typing; a
  // button is no field, so this guard stays: a 2 pressed on one would open the side view.
  shown.addEventListener('keydown', (event) => event.stopPropagation());
  shown.setAttribute('aria-labelledby', heading.id);
  // In the File menu each stands after its like: Open file, Open kept, Save file, Keep.
  $('open').after(openIt);
  $('save').after(keepIt);
  document.body.append(shown);
  globalThis.kept = { needs: NEEDS, refusal, offered, keep, list, open };
})();
