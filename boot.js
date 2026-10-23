// The first script of every page of the pad (ST-040, T-040.2, T-040.4): which plot the page
// shows, and then the page's own scripts. They lie in the page's <template id="scripts">, in
// their order, and this script puts them in once SITE and PLOT are set - at once for the example,
// after the browser's store answered for a plot it holds. Which plot: the one this tab shows, its
// note in sessionStorage, else the one this browser showed last, in localStorage, else the
// example. A plot held is its file's text, read by `read` of plot-file.js; one that is not held,
// or no longer reads, is GONE, its notes are taken out, and the example shows. The example is the
// page's own: demo-site.js in the place of the template's site.js, which is no file - no server
// gives a page its plot. When the last script has loaded, <html data-shown> is the plot's id:
// what a browser test waits for. A plain script, so that it runs as the page is read: it imports
// nothing as it loads, and boot.check.js holds what it states a second time to say what
// store/rules.js says.
(() => {
  const { document, URL } = globalThis;
  // store/rules.js, stated a second time: the two notes, and the key of a plot's sketch - the
  // first key for `home`, one of its own for every other id, the example's too.
  const TAB = 'blockplot/plot/tab';
  const LAST = 'blockplot/plot/last';
  const [OWN, SPACE, EXAMPLE] = ['home', 'blockplot/sketch/space', 'example'];
  const keyOf = (id) => (id === OWN ? SPACE : `blockplot/sketch/plot/${id}/space`);
  /** A note as an id: one that is no text, or is empty, is none. */
  const noted = (note) => (typeof note === 'string' && note !== '' ? note : null);
  /** The id to show: the tab's note, else the browser's last, else null. `shownOf` of store/rules.js. */
  const shownOf = (tab, last) => noted(tab) ?? noted(last);
  // The plot's place among the template's scripts, and the made-up plot's script, put there.
  const [SITE_JS, DEMO_SITE_JS] = ['site.js', 'demo-site.js'];
  // Where this script lies, taken as it runs: the store and the reader lie beside it.
  const here = document.currentScript.src;

  /** What a store notes under a key - or null, where the store cannot be read. */
  const noteIn = (store, key) => {
    try {
      return globalThis[store].getItem(key);
    } catch {
      return null;
    }
  };
  /** A note written, where it says another or none; or taken out. A store that refuses changes nothing. */
  const note = (store, key, id) => {
    try {
      if (id === null) globalThis[store].removeItem(key);
      else if (globalThis[store].getItem(key) !== id) globalThis[store].setItem(key, id);
    } catch {
      // Nothing is noted: the page shows its plot all the same.
    }
  };
  /** Both notes, the tab's and the browser's last: an id, or null - taken out. */
  const notes = (id) => {
    note('sessionStorage', TAB, id);
    note('localStorage', LAST, id);
  };

  /**
   * The page's scripts put in, in their order - each a new <script> with the attributes of its
   * tag, `async` false, so that they run in that order - with `site` in the place of site.js: the
   * made-up one, or none. The last one loaded, the page is marked.
   */
  function putIn(site) {
    let last = null;
    for (const tag of document.getElementById('scripts').content.querySelectorAll('script')) {
      const isSite = tag.getAttribute('src') === SITE_JS;
      if (isSite && site === null) continue;
      const script = document.createElement('script');
      for (const { name, value } of tag.attributes) script.setAttribute(name, value);
      if (isSite) script.setAttribute('src', site);
      script.text = tag.text;
      script.async = false;
      document.body.append(script);
      last = script;
    }
    last?.addEventListener('load', () => {
      document.documentElement.dataset.shown = globalThis.PLOT.id;
    });
  }
  /** A plot shown from the store or the example: its PLOT, and - `noted` - both notes its id. */
  const shown = (id, way, noted = true) => {
    globalThis.PLOT = { id, key: keyOf(id), way };
    if (noted) notes(id);
  };
  /** The example, the page's own: its PLOT, and demo-site.js in the place of site.js. */
  const example = (noted) => {
    shown(EXAMPLE, EXAMPLE, noted);
    putIn(DEMO_SITE_JS);
  };

  /** A plot this browser holds, asked of its store: shown, or GONE - and the example - where it is not held, does not read, or the store fails. */
  async function held(id) {
    const at = (file) => new URL(file, here).href;
    let [record, site] = [null, null];
    try {
      record = await (await import(at('store/held.js'))).plot(id);
      if (record !== null) site = (await import(at('plot-file.js'))).read(record.text).site ?? null;
    } catch {
      site = null;
    }
    if (site === null) {
      // Notes, not design: nothing drawn is in them.
      globalThis.GONE = id;
      notes(null);
      example(false);
      return;
    }
    globalThis.SITE = site;
    shown(id, record.way);
    putIn(null);
  }

  // Nothing noted is the example, and notes nothing; the example noted is noted anew.
  const id = shownOf(noteIn('sessionStorage', TAB), noteIn('localStorage', LAST));
  if (id === null || id === EXAMPLE) example(id !== null);
  else held(id);
})();
