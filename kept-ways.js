// The kept sketches' first half (ST-025, ST-040 T-040.5): where Keep keeps and Open kept reads,
// and what is said of each answer - with nothing of the page in it, so that kept.check.js asks it
// by hand on made-up stores. A plot that came as its folder keeps its sketches in the folder's
// sketches/, where the browser lets the page write (store/ways.js); every other plot - its file,
// the example - and a folder that may not be written to, in the browser's store (store/held.js).
// Either way the bytes are those that "Save file" saves, and nothing is written over. Each
// function is handed `at`: the plot that the page shows, `{ id, way }`, the two modules of the
// store, `held` and `ways`, and for Open kept the page's `sketch` and `legacy`. kept.js makes the
// window, and loads the store. A plain script: it imports nothing, and states the rule of a name
// a second time - kept.check.js proves it says what `keptName` of store/rules.js says.
(() => {
  const NAME = /^[A-Za-z0-9_-]([A-Za-z0-9 ._-]*[A-Za-z0-9._-])?$/;
  const NAME_MAX = 80;
  const ENDING = '.json';
  // How a plot came, where its sketches go into its folder: `WAYS.folder` of store/rules.js.
  const FOLDER = 'folder';
  const RULE =
    `A name is letters of the English alphabet, figures, spaces, dots, - and _: ${NAME_MAX} at ` +
    'most, and no dot at its start.';
  const BROWSER = 'in this browser only — save a file to keep a copy';
  const PICK =
    'The newest first. The one you pick takes the place of the sketch that is open: Undo brings ' +
    'that one back.';
  // What is said, each sentence once.
  const says = {
    where: (folder) =>
      folder === null
        ? `Sketches of this plot are kept ${BROWSER}.`
        : `Sketches of this plot are kept in the folder ${folder}.`,
    inFolder: (folder, name) => `Kept in the folder ${folder}: sketches/${name}${ENDING}`,
    inBrowser: `Kept ${BROWSER}.`,
    refused: (folder) =>
      `The folder ${folder} may not be written to, so this sketch is kept ${BROWSER}.`,
    taken: (name) =>
      `"${name}" is taken: a sketch is kept under that name, and nothing was written. ` +
      'Give this one another name.',
    persist: 'This browser may clear it when it is short of room.',
    failed: (why) => `Nothing was kept: ${why}`,
    unread: (folder) =>
      `The folder ${folder} may not be read, so the sketches kept in this browser alone are listed.`,
    unlisted: (other) =>
      `Not listed: ${other} of the files there, under a name the pad does not take.`,
    none: 'Nothing is kept yet.',
    pick: PICK,
    unlistable: (why) => `The kept sketches could not be listed: ${why}`,
    notOpened: (name, why) => `"${name}" was not opened: ${why}`,
    gone: 'no sketch is kept under that name.',
    noSketch: (name) => `"${name}${ENDING}" is not a sketch: nothing was changed.`,
  };
  const why = (error) => error?.message ?? String(error);

  /** Why a name is none that a sketch can be kept under - or '', where it is one. */
  function refusal(name) {
    if (name === '') return 'Nothing was kept: give the sketch a name.';
    const named = NAME.test(name) && name.length <= NAME_MAX;
    return named ? '' : `Nothing was kept: "${name}" cannot be the name of a kept sketch. ${RULE}`;
  }

  /** The name that Keep offers: the day and the time, by this machine's clock. */
  function offered(now) {
    const two = (number) => String(number).padStart(2, '0');
    const day = [now.getFullYear(), two(now.getMonth() + 1), two(now.getDate())].join('-');
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(two).join('.');
    return `${day} ${time}`;
  }

  /** The folder a plot's sketches go into - its handle - or null: the browser keeps them. */
  async function folderOf({ plot, held }) {
    if (plot.way !== FOLDER) return null;
    return (await held.plot(plot.id))?.folder ?? null;
  }

  /** Where a plot's sketches are kept, in one sentence: what the window says before a name is given. */
  async function where(at) {
    return says.where((await folderOf(at))?.name ?? null);
  }

  /**
   * Keeps `text` under a name: `{ kept, words }` - whether it is kept now, and where, or why not.
   * Into the folder where the browser lets the page write - asked here, on Keep's click; else into
   * the browser, where the browser is asked to keep what it holds as the plot's first sketch is
   * kept there, and its no is said.
   */
  async function keep(name, text, at) {
    const refused = refusal(name);
    if (refused) return { kept: false, words: refused };
    const { plot, held, ways } = at;
    try {
      const folder = await folderOf(at);
      if (folder !== null && (await ways.mayWrite(folder))) {
        const done = await ways.keepIn(folder, name, text);
        const words = done.kept ? says.inFolder(folder.name, name) : says.taken(name);
        return { kept: done.kept === true, words };
      }
      if (!(await held.keep(plot.id, name, text)).kept)
        return { kept: false, words: says.taken(name) };
      const first = (await held.kept(plot.id)).length === 1;
      const lasts = first ? await held.persist().catch(() => false) : true;
      const words = [folder === null ? says.inBrowser : says.refused(folder.name)];
      if (!lasts) words.push(says.persist);
      return { kept: true, words: words.join(' ') };
    } catch (error) {
      return { kept: false, words: says.failed(why(error)) };
    }
  }

  /** A folder's kept sketches, read - and where the browser refuses, asked for leave and read again; or null, refused. */
  async function readIn(folder, ways) {
    try {
      return await ways.keptIn(folder);
    } catch (error) {
      if (error?.name !== 'NotAllowedError') throw error;
    }
    return (await ways.mayWrite(folder)) ? ways.keptIn(folder) : null;
  }

  /**
   * What is kept on the plot: `{ kept, folder, words }` - `kept` each `{ name, at, where }`, those
   * of the plot's folder first, the newest first, and after them those of this browser, the
   * newest first, `where` `folder` or `browser`; `folder` the folder's name, or null; and what to
   * say of it. `kept` is null where nothing could be listed.
   */
  async function list(at) {
    try {
      const folder = await folderOf(at);
      const read = folder === null ? { kept: [], other: 0 } : await readIn(folder, at.ways);
      const inFolder = (read?.kept ?? []).map((one) => ({ ...one, where: FOLDER }));
      const inBrowser = (await at.held.kept(at.plot.id)).map((one) => ({
        ...one,
        where: 'browser',
      }));
      const kept = [...inFolder, ...inBrowser];
      const other = read?.other ?? 0;
      const words = read === null ? [says.unread(folder.name)] : [];
      words.push(kept.length > 0 ? PICK : says.none);
      if (other > 0) words.push(says.unlisted(other), RULE);
      return { kept, folder: folder?.name ?? null, words: words.join(' ') };
    } catch (error) {
      return { kept: null, folder: null, words: says.unlistable(why(error)) };
    }
  }

  /**
   * Opens a kept sketch, `{ name, where }` of the list, as "Open file" opens a file (files.js): a
   * sketch takes the place of the one that is there, and a sketch of before - of one view - adds
   * what it holds. Either is one change, which Undo takes back. It gives '' - or why nothing was
   * opened.
   */
  async function open({ name, where: lies }, at) {
    let text;
    try {
      const folder = lies === FOLDER ? await folderOf(at) : null;
      text =
        folder === null
          ? await at.held.keptText(at.plot.id, name)
          : await at.ways.keptTextIn(folder, name);
    } catch (error) {
      return says.notOpened(name, why(error));
    }
    if (text === null) return says.notOpened(name, says.gone);
    const { sketch, legacy } = at;
    let [whole, old] = [null, null];
    try {
      const parsed = JSON.parse(text);
      whole = sketch.adopt(parsed);
      old = whole ? null : legacy.file(parsed);
    } catch {
      // Not JSON: no sketch, like every other text that is none.
    }
    if (whole) sketch.change(() => (sketch.doc = whole));
    else if (old)
      sketch.change((doc) => (doc.things.push(...old.things), doc.notes.push(...old.notes)));
    return whole || old ? '' : says.noSketch(name);
  }

  globalThis.keptWays = { says, RULE, refusal, offered, where, keep, list, open };
})();
