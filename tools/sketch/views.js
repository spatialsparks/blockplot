// The views of the sketch pad, as one switch: the links to them, the keys that go from one to
// another, and the page's title. Five of them are one page, told apart by the address's hash:
// another of those is this page, loaded again under its name. The sixth, 3D, and the seventh,
// Info, are pages of their own. What a tab shows is kept meanwhile - for the other view, or for
// this one again. And the rule for a key is said here, once for every page: typed into a field,
// it is the field's - and while a menu is open, the menu's. So a menu is made here too, of a
// button and of the part it opens: File, on every page, and whatever else a page has open one
// at a time - or of the part alone, which a script opens where it likes: the right button's.
(() => {
  const { document, location, sessionStorage, SITE, PLOT, paper } = globalThis;
  const { VIEWS, VIEW, PLANE } = paper;
  // Where a tab keeps what it shows, through a switch of view and a reload: one slot, as for its
  // steps to undo (sketch.js). What it showed is a plot's - the one whose sketch is kept under
  // the key that the plot's script says (PLOT, ST-030), and under the first key where it says
  // none. Of another key than the first it says whose it is, `of`: nothing to another plot's page.
  const SEEN_KEY = 'blockplot/sketch/seen';
  const SPACE = 'blockplot/sketch/space';
  const KEY = PLOT?.key ?? SPACE;
  // The pages: the five views that lie flat on a paper, then two of their own - the sixth, the
  // sketch as solids, and the seventh, what it adds up to. Such a page says which it is on its
  // switch, `data-view`: it has no hash and no paper. From it, a link to one of the five names
  // their page; among the five, the hash alone.
  const PAD = 'index.html';
  const AWAY = [
    { view: '3d', name: '3D', href: '3d.html' },
    { view: 'info', name: 'Info', href: 'info.html' },
  ];
  const $ = (id) => document.getElementById(id);
  const away = AWAY.find(({ view }) => view === $('views').dataset.view);
  const flat = (view) => ({ view, name: VIEWS[view].name, href: `${away ? PAD : ''}#${view}` });
  const entries = [...Object.keys(VIEWS).map(flat), ...AWAY];
  const here = away ?? entries.find(({ view }) => view === VIEW);

  /** What the tab showed last of this plot; nothing, the first time, and of another plot. */
  function seenLast() {
    try {
      const { of = SPACE, ...showed } = JSON.parse(sessionStorage.getItem(SEEN_KEY)) ?? {};
      return of === KEY ? showed : {};
    } catch {
      return {};
    }
  }
  const seen = seenLast();

  // Each part of the page that has the tab keep what it shows, in the order it asked.
  const showings = [];
  /**
   * Has the tab keep what it shows, as the page goes: `showing` says what that is by then. A
   * page may ask more than once - its paper, its distances: all is kept, the later over the earlier.
   */
  function keep(showing) {
    showings.push(showing);
    if (showings.length > 1) return;
    globalThis.addEventListener('pagehide', () => {
      try {
        const whose = KEY === SPACE ? {} : { of: KEY };
        const shows = Object.assign({}, ...showings.map((one) => one()));
        sessionStorage.setItem(SEEN_KEY, JSON.stringify({ ...seen, ...shows, ...whose }));
      } catch {
        // Not kept: the page opens as it does the first time.
      }
    });
  }

  // From above, in 3D and in Info the whole plot shows, by its name - and by its area, where it
  // states one: what a plot does not say is not shown. A slice says where it is seen from.
  const from = paper.wind(SITE.bearingDeg + (VIEWS[VIEW].from ?? 0));
  const area = SITE.officialAreaM2 === undefined ? '' : `, ${SITE.officialAreaM2} m²`;
  const title =
    away || PLANE === 'top'
      ? `${SITE.name}${area}`
      : `A slice ${PLANE === 'side' ? 'along' : 'across'} the plot, seen from the ${from}`;
  entries.forEach((entry, index) => {
    const link = Object.assign(document.createElement('a'), { href: entry.href });
    link.textContent = entry.name;
    link.title = `Key ${index + 1}; V goes to the next view`;
    if (entry === here) link.setAttribute('aria-current', 'page');
    $('views').append(link);
  });
  document.title = `${here.name} — sketch pad`;
  $('title').textContent = title;
  $('paper')?.setAttribute('aria-label', `${here.name}: ${title}, with what is sketched`);

  // The kinds of <input> that take neither text nor figures: a key pressed on one is the page's.
  // Every other kind is a field - text, a number, a date - and so is one a browser comes to know.
  const NO_TEXT = 'button checkbox color file hidden image radio range reset submit'.split(' ');

  // The menu that is open - its button and the part that the button opens, or the part alone -
  // or none. A page has one open at a time, however many it has: and while one is open, it has
  // the keys.
  let open = null;
  // An entry of a menu: a button in the part that opens, which is not off. And a pick: such an
  // entry that opens no list of its own (`aria-haspopup`), as some of the right button's do.
  const ENTRY = 'button:enabled';
  const PICK = 'button:enabled:not([aria-haspopup])';

  /** Has the two parts of a menu say that it is open, or that it is shut: a menu with no button, its part alone. */
  function say({ button, panel }, shown) {
    panel.hidden = !shown;
    button?.setAttribute('aria-expanded', String(shown));
  }

  /** Shuts the menu that is open, where one is. */
  function shut() {
    if (open) say(open, false);
    open = null;
  }

  /**
   * Makes a menu of a button and of the part it opens, which holds the menu's entries. Shut,
   * that part is hidden, and the button says so (`aria-expanded`). A click on the button opens
   * it, and the first entry that is not off takes the focus; a second click shuts it. It shuts
   * at a click on an entry too, once the entry has heard that click; at Escape, after which
   * the button has the focus again; where the pointer goes down outside its two parts; where
   * the focus goes to another control, or out of the window; and where another menu opens.
   * Open, it has every key (`typing`): no arrow walks it and no letter picks from it - Tab goes
   * from entry to entry. It hands its caller the way to shut it: a function that shuts this
   * menu, as a second click on its button does, where it is the one open, and does nothing where
   * it is shut or another is open. The focus stays where it is.
   */
  function menu(button, panel) {
    const one = { button, panel };
    say(one, false);
    button.addEventListener('click', () => {
      const was = open;
      shut();
      if (was === one) return;
      open = one;
      say(one, true);
      panel.querySelector(ENTRY)?.focus();
    });
    // The click comes up to the part from the entry, which has heard it by then.
    panel.addEventListener('click', ({ target }) => target.closest(ENTRY) && shut());
    return () => open === one && shut();
  }

  /**
   * Makes a menu of a part alone, with no button: one that a script opens where it likes - the
   * right button's (right-menu.js). Shut, the part is hidden. It returns `open`, which shuts the
   * menu that is open, shows the part, makes it the one open, and gives its first entry that is
   * not off the focus. It shuts as every menu does: at a pick - a click on an entry that opens
   * no list of its own, once the entry has heard it; at Escape, after which the focus is where
   * it was before the menu opened; where the pointer goes down, or the focus goes, outside the
   * part; at the window's blur; and where another menu opens. Open, it has every key (`typing`).
   */
  function popup(panel) {
    const one = { panel, before: null };
    say(one, false);
    panel.addEventListener('click', ({ target }) => target.closest(PICK) && shut());
    return () => {
      one.before = document.activeElement;
      shut();
      open = one;
      say(one, true);
      panel.querySelector(ENTRY)?.focus();
    };
  }

  // A menu shuts where the pointer goes down outside its two parts, and where the focus goes
  // there: heard on its way down the page, so that nothing in the page keeps it from this.
  for (const elsewhere of ['pointerdown', 'focusin']) {
    const hear = ({ target }) => {
      if (open && !open.button?.contains(target) && !open.panel.contains(target)) shut();
    };
    document.addEventListener(elsewhere, hear, true);
  }
  // And where the window loses the focus - Tab past its last control, a click in another window:
  // a page that has lost the focus keeps no menu open. Heard on the window, and not on its way
  // down: an element's blur does not come up to the window, and the part's focusout would come
  // at a click on a word of the menu too.
  globalThis.addEventListener('blur', shut);

  /**
   * Whether a key is typed into a field: an <input> that takes text or figures, a <textarea>, a
   * <select>, or what is contenteditable. Such a key is the field's own, with whatever is held
   * beside it - no view's and no tool's: whoever listens for keys on a page asks this first.
   * A checkbox, a radio button, a slider, a button and the page itself are no fields. And
   * while a menu is open every key is the menu's, as if it were typed into one - whatever it
   * was pressed on: so nobody who asks this needs to know of a menu.
   */
  function typing({ target }) {
    if (open) return true;
    if (target.tagName === 'INPUT') return !NO_TEXT.includes(target.type);
    return ['TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable === true;
  }

  globalThis.addEventListener('hashchange', () => location.reload());
  document.addEventListener('keydown', (event) => {
    // Escape shuts the menu that is open, gives its button the focus - a menu with none, the
    // focus where it was before it opened - and ends here: whoever hears a key after this would
    // find the menu shut, and take the Escape for its own - on the pad's page, to leave nothing
    // selected (page.js).
    if (open && event.key === 'Escape') {
      const { button, before } = open;
      shut();
      (button ?? before)?.focus();
      event.stopImmediatePropagation();
      return;
    }
    // A key typed into a field is the field's; with Ctrl or Alt it is the browser's.
    if (typing(event) || event.ctrlKey || event.metaKey || event.altKey) return;
    const next = entries[(entries.indexOf(here) + 1) % entries.length];
    const to = event.key.toLowerCase() === 'v' ? next : entries[Number(event.key) - 1];
    // A new hash loads this page again, by the listener above; another page is gone to.
    if (to && to !== here) location.assign(to.href);
  });

  // File is a menu on every page, which each have its two parts. A page that has neither - a
  // made-up one, of a check - has no menu.
  if ($('file-menu') && $('file-entries')) menu($('file-menu'), $('file-entries'));

  globalThis.views = { seen, keep, typing, menu, popup };
})();
