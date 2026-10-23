// The gallery of the objects, right of the paper (story ST-029): every kind the pad has
// (shapes.js) in its group (object-groups.js), each a tile with the pad's own drawing of it, its
// name and its size - and a named starting size (a start, ST-035) a tile in the place of its kind,
// with its own name, drawn and said at its size. The script makes its parts itself and puts them into the right side, after
// what is selected: a heading a group, and under it a button a tile. While Object is the tool the
// gallery shows in the place of what is selected - which stays selected behind it - and the
// button of the Objects group, in the toolbar, shows the object that a click sets down.
//
// A picture is what the paper draws of that kind (`shapes.draw`, as draw.js asks it): from above,
// not turned, in the paper's ink. It is fitted into its square by the kind's size along the plot
// and across it, in proportion: a window is a thin bar, a tree a circle - and a chair shows as
// large as a tree. Nothing is drawn here that the paper does not draw, and no image is read.
//
// The page hands the script the tile that is picked - a kind's key or a start's - and whether Object is the tool, at every
// refresh (page.js): `gallery.show`. A click on a tile is a pick, and the page's to take:
// `gallery.onPick`, which the page sets. The script itself decides nothing.
(() => {
  const { document, paper, shapes } = globalThis;
  const { KINDS, GROUPS, STARTS } = shapes;
  // How large a picture is drawn, in CSS pixels: a tile's, which the stylesheet shows so large
  // (pad.css), and the one on the button of the Objects group, as high as a line of the toolbar's
  // text. And how much of either is left free round the drawing, so that no line of it is cut off.
  const [TILE_PX, BUTTON_PX, MARGIN_PX] = [44, 18, 2];
  // How wide a thin line is, in CSS pixels: the paper's (draw.js).
  const HAIR_PX = 1.25;

  const make = (tag, set, ...parts) => {
    const made = Object.assign(document.createElement(tag), set);
    made.append(...parts);
    return made;
  };

  // What a tile's key sets down - a kind, or a start's kind with its sizes - and the tile's name.
  const thingOf = (key) =>
    STARTS[key] ? { kind: STARTS[key].kind, ...STARTS[key].sizes } : { kind: key };
  const nameOf = (key) => (STARTS[key] ?? KINDS[key]).name;

  /**
   * How large a tile's object is, as the pad says a size: along the plot by across it, and how
   * high. It is read each time it is asked: a door and a window are as high as the sketch's
   * figures say, and a start is its kind at its sizes (`shapes.sizeOf`).
   */
  function sized(key) {
    const [long, wide, high] = shapes.sizeOf(thingOf(key));
    return `${long} by ${wide} m, ${high} m high`;
  }

  /**
   * Draws a tile's object into a canvas, `px` CSS pixels square: the paper's drawing of it from above, not
   * turned. The longer of its two sizes on the floor fills the square but for the margin, the
   * other is in proportion to it, and the drawing lies in the middle. A canvas whose size is set
   * is empty again: so the button's picture is drawn anew for every kind.
   */
  function picture(canvas, key, px) {
    canvas.width = canvas.height = Math.round(px * (globalThis.devicePixelRatio || 1));
    const ctx = canvas.getContext('2d');
    // A unit is a CSS pixel, however many of the screen's own the canvas has for one.
    ctx.setTransform(canvas.width / px, 0, 0, canvas.width / px, 0, 0);
    const thing = thingOf(key);
    const [long, wide] = shapes.sizeOf(thing);
    const per = (px - 2 * MARGIN_PX) / Math.max(long, wide);
    const [left, top] = [(px - long * per) / 2, (px - wide * per) / 2];
    const box = [left, top, left + long * per, top + wide * per];
    shapes.draw(ctx, thing, 'top', box, paper.INK, HAIR_PX);
  }

  // A tile a key: a button that says its key and holds the picture, the name and - under the
  // name - the size. Of each, the tile and the part that says the size: that one is written anew.
  const tiles = new Map();
  function tile(key) {
    const drawn = make('canvas', {});
    picture(drawn, key, TILE_PX);
    const size = make('small', { textContent: sized(key) });
    const name = make('span', { textContent: nameOf(key) });
    const one = make('button', { type: 'button' }, drawn, name, size);
    one.dataset.kind = key;
    one.addEventListener('click', () => globalThis.gallery.onPick(key));
    tiles.set(key, { one, size });
    return one;
  }
  // A group a part of its own, so that its heading stays over its tiles and no longer (pad.css).
  const groups = GROUPS.map(({ name, tiles: keys }) =>
    make('section', {}, make('h2', { textContent: name }), ...keys.map(tile)),
  );
  const shown = make('section', { id: 'gallery', hidden: true }, ...groups);
  shown.setAttribute('aria-label', 'Objects to set down');

  // What the page has for the script: what is selected, which the gallery is put after and
  // shown in the place of, and the two parts of the button of the Objects group.
  const selected = document.getElementById('selected');
  const [onButton, named] = ['object-picture', 'object-name'].map((id) =>
    document.getElementById(id),
  );

  /**
   * Shows the object that a click sets down, `kind` - a tile's key - and - `open`, while Object is the tool - the
   * gallery in the place of what is selected. The tile of the key is marked as picked, and no
   * other; the button of the Objects group has the tile's picture and its name, open or not; and
   * every tile says its size anew - a door's and a window's are the figures of the sketch at this
   * moment. Shut, what is selected shows again: it was selected all the while.
   */
  function show(kind, open) {
    for (const [key, { one, size }] of tiles) {
      one.setAttribute('aria-pressed', String(key === kind));
      const said = sized(key);
      if (size.textContent !== said) size.textContent = said;
    }
    picture(onButton, kind, BUTTON_PX);
    named.textContent = nameOf(kind);
    shown.hidden = !open;
    selected.hidden = open;
  }

  selected.after(shown);
  // `onPick` is the page's to set: until it does, a pick is nobody's.
  globalThis.gallery = { show, onPick() {} };
})();
