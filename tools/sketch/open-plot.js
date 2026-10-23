// Open plot (ST-030, ST-040): an entry of the File menu, and the window of the plots. The window
// lists the plots this browser holds (store/held.js) - the one opened newest first - and the
// example last, each by its name, with its area, the day it was opened and where its sketches are
// kept, the one that shows marked; under them the two ways in, which open-plot-ways.js makes: a
// plot's folder, where the browser takes folders, and a plot's file. A pick notes the plot as the
// tab's and the last, and loads the page anew where it is: boot.js then shows that plot. Where
// boot.js says that the plot shown last is GONE, the window opens as the page does, and says so.
// First the words of the window, with nothing of the page in them - open-plot.check.js holds them
// by hand; then the entry and the window, which a browser test presses. The 3D page has neither.
// And New plot (ST-031): the entry after it, where the pad has the page of a new plot.
(() => {
  const { document, location, history, fetch, paper, PLOT, URL, URLSearchParams } = globalThis;
  const $ = (id) => document.getElementById(id);
  // store/rules.js, stated a second time - a plain script imports nothing as it loads: the two
  // notes, and the ways a plot came. The example's id, and its name, as demo-site.js says it.
  const [TAB, LAST] = ['blockplot/plot/tab', 'blockplot/plot/last'];
  const WAYS = { folder: 'folder', file: 'file', example: 'example' };
  const [EXAMPLE, EXAMPLE_NAME] = ['example', 'Made-up hillside plot'];
  // The page of a new plot, from where a page of the pad is: asked for, to know whether the pad
  // has it, and gone to.
  const NEW_PLOT = 'map/index.html';
  // Under what the window's sentence rides a reload: a word in the page's history entry.
  const SAID = 'plotSaid';

  // What the window says, each sentence written here once.
  const says = {
    noFolder:
      "This browser cannot be given a folder — Chrome and Edge can. A plot's file opens here, and what is kept on it stays in this browser.",
    persist:
      "This browser may clear what it holds when it is short of room: a plot's folder keeps its sketches; a sketch kept in the browser is safe once saved as a file.",
    gone: (id) =>
      `The plot "${id}" that this browser showed last is no longer held here: the browser may have cleared what it held. Open its folder or its file again.`,
    refused: (name, why) => `"${name}" cannot be opened: ${why}`,
    unlisted: (why) => `The plots this browser holds cannot be listed: ${why}`,
    failed: (why) => `Nothing was opened: ${why}`,
  };

  /**
   * The small words of an entry, `shows` being the id of the plot that shows: of a held plot its
   * area to a whole square metre, the day it was opened and where its sketches are kept - the
   * folder, by its name, or this browser - of the example that it is the example, and of either
   * that it shows now. What holds of these, with a comma between.
   */
  function said(record, shows) {
    const words = [];
    if (record.way === WAYS.example) words.push('the example');
    else {
      const kept =
        record.way === WAYS.folder
          ? `the folder ${record.folder?.name ?? record.id}`
          : 'this browser';
      words.push(`${Math.round(record.areaM2)} m²`, `opened ${record.opened}`, kept);
    }
    if (record.id === shows) words.push('shows now');
    return words.join(', ');
  }

  /** The entries of the list: the held plots, the one opened newest first and of one day by their id, then the example. */
  function order(records) {
    const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    const newest = (a, b) =>
      a.opened === b.opened ? byText(a.id, b.id) : byText(b.opened, a.opened);
    const example = { id: EXAMPLE, name: EXAMPLE_NAME, way: WAYS.example };
    return [...records.filter((one) => one.id !== EXAMPLE).toSorted(newest), example];
  }

  const make = (tag, set, ...parts) => {
    const made = Object.assign(document.createElement(tag), set);
    made.append(...parts);
    return made;
  };
  // The window that the entry opens: the plots to pick from, the two ways in (open-plot-ways.js
  // puts them after the list), and a sentence. Made as kept.js makes its own, and with its look.
  const heading = make('h2', {
    id: 'plot-title',
    textContent: 'Open a plot',
    style: 'margin: 0 0 10px; font-size: 14px',
  });
  const picks = make('div', { id: 'plot-list', style: 'max-height: 50vh; overflow: auto' });
  const words = make('output', {
    id: 'plot-said',
    style: 'display: block; margin: 10px 0; overflow-wrap: anywhere',
  });
  const close = make('button', { type: 'button', textContent: 'Close' });
  const shown = make(
    'dialog',
    {
      id: 'plot-window',
      style:
        'width: 36em; max-width: 90vw; padding: 14px 16px; border: 1px solid #9aa5b1; ' +
        'border-radius: 6px; color: inherit',
    },
    ...[heading, picks, words, close],
  );

  // The plot that shows: the page's PLOT, and the example where the page has none.
  const showing = PLOT?.id ?? EXAMPLE;
  // Where this script lies, taken as it runs: the store lies beside it.
  const here = document.currentScript?.src;

  /** Shuts the window, and takes the focus out of it. */
  function shut() {
    if (shown.open) shown.close();
    if (shown.contains(document.activeElement)) document.activeElement.blur();
  }

  /** Says a sentence under the list, in the place of what it said. */
  const say = (text) => void (words.textContent = text);

  /** A note written; a store that refuses changes nothing - the page then shows the last it can. */
  const note = (store, key, id) => {
    try {
      globalThis[store].setItem(key, id);
    } catch {
      // Not noted.
    }
  };
  /**
   * Shows a plot in this window: both notes its id, and the page loaded anew where it is, with
   * the view's hash - with `after` to say, once, as the page opens again.
   */
  function go(id, after = '') {
    note('sessionStorage', TAB, id);
    note('localStorage', LAST, id);
    const state = after === '' ? history.state : { ...history.state, [SAID]: after };
    history.replaceState(state, '');
    location.reload();
  }

  /**
   * An entry of the list: a button with the plot's name, and after it its small words. A click on
   * the plot that shows closes the window; on another, that plot shows in this window.
   */
  function entry(record) {
    const small = make('small', {
      textContent: ` ${said(record, showing)}`,
      style: `color: ${paper.FAINT}`,
    });
    const one = make('button', { type: 'button', textContent: record.name });
    if (record.id === showing) one.setAttribute('aria-current', 'true');
    one.addEventListener('click', () => (record.id === showing ? shut() : go(record.id)));
    return make('p', { style: 'margin: 4px 0' }, one, small);
  }

  /**
   * Opens the window, and lists the plots in it once the store has answered - with `before`
   * said under the list. Nothing opens it while it is open: it lies over all of the page.
   */
  async function open(before = '') {
    picks.replaceChildren();
    say(before);
    if (!shown.open) shown.showModal();
    let records = [];
    try {
      records = await (await import(new URL('store/held.js', here).href)).held();
    } catch (error) {
      say([before, says.unlisted(error?.message ?? error)].filter(Boolean).join(' '));
    }
    picks.replaceChildren(...order(records).map(entry));
  }

  const openIt = make('button', {
    id: 'open-plot',
    type: 'button',
    textContent: 'Open plot',
    title: "A plot this browser holds, or a plot's folder or file, in this window",
  });
  openIt.addEventListener('click', () => void open());
  close.addEventListener('click', () => shut());
  // A key pressed in the window is the window's, as in the window of Keep (kept.js): a button
  // is no field, and a 2 pressed on one would open the side view.
  shown.addEventListener('keydown', (event) => event.stopPropagation());
  // Shut, by a button or by Escape, it leaves no focus inside it: opened as the page opens, it has
  // none to give back, and a key pressed on its Close would stay the window's.
  shown.addEventListener('close', () => shut());
  shown.setAttribute('aria-labelledby', heading.id);
  // In the File menu it stands after its like: Open file, Open kept, Open plot.
  $('open-kept').after(openIt);
  document.body.append(shown);

  // And after it New plot, where the pad has the page of a new plot: that page is asked for once,
  // as the page opens, from where this page is - so a pad served under a path of its own asks
  // its own folder - and the entry is there where it answers 200, and on nothing else. The
  // made-up pad answers 204, with nothing - it has no New plot - and an answer that is no error
  // puts nothing on the console (T-040.4's ADR, T-041.4). A click goes to that page, with this
  // page's word `asks` - whom that page asks (T-041.2) - where it has one, and nothing else of its
  // address.
  const carried = () => {
    const words = new URLSearchParams(location.search).getAll('asks');
    const each = words.map((word) => `asks=${encodeURIComponent(word)}`);
    return each.length === 0 ? '' : `?${each.join('&')}`;
  };
  function newPlot() {
    const title = 'A plot of your own: its corners marked on a map, and the ground under it';
    const newIt = make('button', {
      id: 'new-plot',
      type: 'button',
      textContent: 'New plot',
      title,
    });
    newIt.addEventListener('click', () => location.assign(`${NEW_PLOT}${carried()}`));
    openIt.after(newIt);
  }
  const asked = fetch(NEW_PLOT).then(
    (answer) => answer.status === 200 && (newPlot(), true),
    () => false,
  );

  // What the window says as the page opens: that the plot shown last is GONE (boot.js), and what
  // a pick said before the page was loaded anew - taken out of the history entry, said once.
  const state = history.state;
  const after = typeof state?.[SAID] === 'string' ? state[SAID] : '';
  if (after !== '') {
    const rest = Object.fromEntries(Object.entries(state).filter(([key]) => key !== SAID));
    history.replaceState(Object.keys(rest).length > 0 ? rest : null, '');
  }
  const gone = typeof globalThis.GONE === 'string' ? says.gone(globalThis.GONE) : '';
  if (gone !== '' || after !== '') void open([gone, after].filter(Boolean).join(' '));

  globalThis.openPlot = { said, order, says, say, go, asked };
})();
