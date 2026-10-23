// The two ways in of the window of the plots (ST-040, T-040.3): "A plot's folder…", where the
// browser takes folders (Chrome, Edge) - else a sentence that says why not - and "A plot's
// file…", in every browser, put after the list of open-plot.js. A folder is picked and read
// (store/ways.js), a file read as it is given, each by the one reader, `read` of plot-file.js:
// refused, the window says why and nothing is held; else the plot is held in the browser's store
// (store/held.js) and shown in this window (`openPlot.go`). A file of a plot this browser holds,
// by its very text, is that plot, and only shown: a folder's record is never made a file's. Where
// this is the first plot the browser holds, the browser is asked to keep what it holds, and its
// no is said once. Wiring over the browser, with no check of its own: the words are open-plot.js's,
// which open-plot.check.js holds, and tests/e2e/sketch-plots.spec.ts presses these buttons.
(() => {
  const { document, openPlot, Date, URL } = globalThis;
  const { says, say, go } = openPlot;
  // Where this script lies, taken as it runs: the store and the reader lie beside it.
  const here = document.currentScript.src;
  const load = (file) => import(new URL(file, here).href);
  const modules = () =>
    Promise.all(['store/ways.js', 'store/held.js', 'store/rules.js', 'plot-file.js'].map(load));

  const make = (tag, set, ...parts) => {
    const made = Object.assign(document.createElement(tag), set);
    made.append(...parts);
    return made;
  };
  const fileIt = make('button', {
    id: 'plot-file-pick',
    type: 'button',
    textContent: "A plot's file…",
  });
  const input = make('input', { id: 'plot-file', type: 'file', accept: '.json,application/json' });
  input.hidden = true;
  const ways = make('p', { id: 'plot-ways', style: 'margin: 10px 0 0' }, fileIt, input);
  document.getElementById('plot-list').after(ways);

  let working = false;
  /** One way at a time: a second click meanwhile does nothing. What fails is said. */
  async function once(work) {
    if (working) return;
    working = true;
    try {
      await work(await modules());
    } catch (error) {
      say(says.failed(error?.message ?? error));
    } finally {
      working = false;
    }
  }

  /** The held plots, each whole: what `fileId` compares a file's text with. */
  async function wholeHeld(store) {
    const listed = await store.held();
    return Promise.all(listed.map((one) => store.plot(one.id)));
  }
  /** A plot shown, held: where it is the first the browser holds, the browser asked to keep what it holds, and its no said. */
  async function shownHeld(store, id, first) {
    let kept = true;
    if (first) kept = await store.persist().catch(() => false);
    go(id, kept ? '' : says.persist);
  }

  /** A folder picked: read, held - the folder wins over what is held under its id - and shown. */
  const byFolder = () =>
    once(async ([folders, store, rules, { read }]) => {
      const handle = await folders.pickFolder();
      if (handle === null) return;
      const got = await folders.fromFolder(handle);
      const { site, refused } = got.refused === undefined ? read(got.text) : got;
      if (refused !== undefined) return say(says.refused(handle.name, refused));
      const first = (await store.held()).length === 0;
      const day = rules.dayOf(new Date());
      const way = rules.WAYS.folder;
      await store.hold(
        rules.recordOf({ id: got.id, site, text: got.text, way, folder: handle, day }),
      );
      await shownHeld(store, got.id, first);
    });

  /** A file given: read, and the held plot of its text shown - or held as a plot of the file way, and shown. */
  const byFile = (file) =>
    once(async ([, store, rules, { read }]) => {
      const text = await file.text();
      const { site, refused } = read(text);
      if (refused !== undefined) return say(says.refused(file.name, refused));
      const held = await wholeHeld(store);
      const id = rules.fileId(text, site.name, held);
      if (!held.some((one) => one.id === id)) {
        const day = rules.dayOf(new Date());
        await store.hold(rules.recordOf({ id, site, text, way: rules.WAYS.file, day }));
      }
      await shownHeld(store, id, held.length === 0);
    });

  fileIt.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const [file] = input.files;
    input.value = '';
    if (file !== undefined) void byFile(file);
  });
  // The folder's way, where the browser takes folders; else the sentence that says why not.
  // The modules are asked for as the page opens, so that a click finds them there.
  void modules().then(([{ takesFolders }]) => {
    if (!takesFolders()) {
      ways.before(make('p', { id: 'plot-no-folder', style: 'margin: 10px 0 0' }, says.noFolder));
      return;
    }
    const folderIt = make('button', {
      id: 'plot-folder',
      type: 'button',
      textContent: "A plot's folder…",
    });
    folderIt.addEventListener('click', () => void byFolder());
    fileIt.before(folderIt, ' ');
  });
})();
