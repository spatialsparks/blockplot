# tools/sketch/under

swisstopo's map under the top view (ST-046): the national map, the aerial photo or, where the pad
offers the cadastre, the cadastral map, laid under the paper true to the plot's place, at a
strength the owner sets, so that a house that stands on the parcel can be traced with boxes or
the Line tool. Nothing of it goes into the sketch or the plot. The folder holds the arithmetic,
`place.js` (T-046.1), the pictures with the page's second policy, `lay.js` and `under.css`
(T-046.2), and the control "Map" in the toolbar's View group — the switch, the choice and the
slider — `switch.js` (T-046.3), which sets the flag that `lay.js` reads.

## Public API

- `tools/sketch/under/place.js` — where the map lies under the top view. Pure arithmetic: no
  page, no address, no request, no clock. It imports `NEAREST` of `../map/view.js`, `CELL_M` and
  `isLV95` of `../new-plot/frame.js`, and `LEVELS` and `SHEET` of `../swisstopo/hosts.js`, and
  nothing else.
  - `underOf(place, zoom, size)` — `place` is the plot as `SITE` has it: `originLV95`,
    `bearingDeg`, and the top left corner of the top view's paper, `xFromM` and `yToM`, in metres
    of the plot's frame; `zoom` is `zoom.js`'s `{ px, left, top }`; `size` the window's
    `{ wide, high }`, in CSS pixels. It gives `{ level, view, box, turnDeg, scale, centre }`:
    - `level`, the map's level that fits the zoom: the coarsest whose metres a pixel are no more
      than the view's, `0.5 / px`, so that `scale` is 1 or less — or `NEAREST`, 28, a tenth of a
      metre a pixel, where the view is nearer than that, whose pictures are then shown larger;
    - `view`, `{ level, e, n }`, a north-up view of the map as `../map/view.js` has one, its
      middle the place of LV95 under the window's middle; and `box`, `{ wide, high }`, the
      pixels of the map that it shows, whole: the window turned, every corner of it covered.
      Its pictures are `pictures(view, box)` of `../map/view.js`, unchanged;
    - `turnDeg`, `scale`, `centre`: the box's middle lies on `centre`, `[x, y]` in CSS pixels
      from the window's top left corner — the window's middle — and the box is turned
      `turnDeg` degrees clockwise about it, `90 - bearingDeg`, from 0 to under 360, and grown
      `scale` CSS pixels to one of its own. As a page writes it: the box at
      `left: centre[0] - wide / 2`, `top: centre[1] - high / 2`, with
      `transform: rotate(<turnDeg>deg) scale(<scale>)` about its own middle.

    Or `{ refused: NO_PLACE }` — `This plot has no place on swisstopo's map.` — where the plot
    has no `originLV95`, one that is no place of LV95, or one off `SHEET`.
  - `NO_PLACE` — that sentence, the story's.
- `tools/sketch/under/lay.js` — **the pad's one code that asks for the top view's map**, a module
  that `index.html` loads among its scripts, right before `page.js`, with `under.css` and the
  element `#under-map`, under the canvas in `#scroller`. As it loads it imports `hosts.js` alone;
  `place.js` and `../map/view.js` it loads by `arithmetic()` only where the map is offered — the
  made-up pad serves nothing of `map/`. On the page it sets **`globalThis.under`**:
  - `on`, `layer`, `strength` — the flag, `FIRST`: off, `'photo'`, 0.5. T-046.3's switch, choice
    and slider set them, and then have the page drawn anew, `zoom.onChange()`. `layer` is a name
    of `LAYERS`; `strength` 0 to 1, each picture's opacity (`strengthOf`: anything else is half);
  - `offered` — a promise of whether the page offers the map at all: `offeredOf(location.search,
    <whether the pad offers New plot, openPlot.asked>)`, and the arithmetic loaded. Once it is
    settled the page's **second policy** stands in its head, `policyOf(origin)`;
  - `shows()` — whether the top view shows the map now: on, offered, a layer of `LAYERS`, the
    top view, a plot with a place, and no Picture (PNG) being taken. `draw.js` then paints no
    ground: neither `BEYOND` nor the paper's white;
  - `lay()` — called by `draw.js` after each draw: the pictures of `laidOf` follow the window,
    those that still show stay, the others go, those the view lacks are asked for when it rests
    (`REST_MS`, 150 ms, as on New plot), each at `strength`; and everything goes, with nothing
    more asked, where the map does not show. `#under-map` says `data-level`, `data-pictures` and
    `data-came`, and its `<p>` the credits and the story's two sentences.

  And, pure, for its check: `offeredOf(query, newPlot)` — the origin asked, or null: a stand-in
  wherever `asks` names one, swisstopo's map service where it names nobody and the pad offers
  New plot, else nobody; `policyOf(origin)` — `img-src 'self' data:` and the origin, nothing
  more; `laidOf(origin, layer, place, zoom, size)` — `underOf`'s box, held to the layer's last
  level `to` (the national map has no 28: its 27 shown larger), with its pictures, each `{ key,
  address, left, top }`, and the words in the corner, the layer's credits and, for the cadastral
  map further out than `CADASTRAL_FROM`, no picture and `NEARER_IN`; or `{ refused }`;
  `planOf(shown, wants)` — `{ keep, drop, ask }` by the pictures' keys; `viewKeyOf(laid)` — a
  view as a text, so that one that did not move asks nothing; `NOT_COME`, `Some pictures of the
  map did not come.`, and `NEARER_IN`, `The cadastral map shows from nearer in.`

- `tools/sketch/under/switch.js` — **the control "Map"**, `#under-control` in `#view-group` of
  `index.html`, after `#fit`: `#under-on`, a switch, off when a pad opens; the choice of map, a
  menu as File is (`views.menu`; `docs/sketch/pad-api.md`, "File is a menu") and no `<select>`,
  which the header never holds — `#under-layer`, its button, which says the chosen map's name,
  and `#under-layers`, its part, hidden until the button opens it, which the script fills with
  an entry a layer of `LAYERS` by their words, `NAMES` — "National map", "Cadastral map" where
  the tree has it, "Aerial photo", first chosen — each a `menuitemradio`, the chosen one
  `aria-checked` and in bold; a click on an entry chooses that map and shuts the menu;
  `#under-strength`, a slider of 0 to 100, 50 at first. A module that `index.html` loads right after `page.js`, which wires the zoom it
  redraws; it imports `hosts.js` and `lay.js` as it loads, and `place.js` only where the map is
  offered. Each change sets `globalThis.under` — `on`, `layer`, `strength`, the slider's figure
  a hundredth — keeps the three in the tab's `sessionStorage` under `KEY`,
  `blockplot/sketch/under`, and has the page drawn anew, `zoom.onChange()`. As the page
  opens it reads them back into the flag and the control. The control stays hidden in a slice
  and wherever `under.offered` says no map; on a plot that `underOf` refuses it shows, its three
  parts disabled, its title `NO_PLACE`.
  And, pure, for its check: `keptOf(flag)`, the three settings as the tab keeps them, a text;
  `readOf(text, layers)`, read back for a tree of `layers` — on only where it says `true`, a
  layer the tree lacks the photo, a strength held to 0 to 1, anything else `FIRST`;
  `choicesOf(layers)`; `percentOf(strength)` and `strengthOfPercent(value)`, the slider's
  whole per cent and back; `KEY`, `NAMES`, `TITLE`.

## Invariants

1. **True to its place, one computation** (story rule 4, directive 32): a place of LV95 lies
   under the map's picture of it exactly where the plot's frame (`new-plot/frame.js`) puts it on
   the top view's paper — x along the bearing, y to its left, the paper's corner at `xFromM`,
   `yToM`, a cell of half a metre, and the zoom's `px`, `left` and `top`. The head comment of
   `place.js` works it out both ways, by hand.
2. **A picture is never shown larger than it is**, but nearer than the nearest level: `scale`
   is at most 1 there, and never under 0.4 — two neighbouring levels of the map are at most 2.5
   apart.
3. **The pictures are bounded by the window**: at most `(ceil((2.5 D + 1) / 256) + 1)²`, D the
   window's diagonal in CSS pixels — 529 in a window of 1920 by 1080 — and never more than
   `matrixOf` has of the sheet.
4. **The top view alone**: `place.js` knows the top view's paper, never flipped, and no slice.
5. **No host, no address**: what is asked, and of whom, is `../swisstopo/hosts.js`'s.
6. **Nothing is asked unless the map shows** (story, rule 1): no picture while it is off, in a
   slice — whose page never shows it — on a plot with no place, or where the page offers no map:
   a pad without New plot, unless the page was told a stand-in (rule 2). Every picture is an
   address of `tileAddress`, of the one origin offered, with no cookie and no referrer.
7. **The pictures lie in the page, never in the canvas** (rule 5): `<img>`s in `#under-map`, so
   the canvas, `pnpm sketch:look` and the sketch hold none. While Picture (PNG) is taken the
   canvas is drawn for a moment with its ground, so the PNG is the paper as it always was.
8. **The page's two policies**: its first, in its markup, `connect-src 'self'`, unchanged; its
   second, which `lay.js` puts into its head once it knows whom it asks, `img-src 'self' data:`
   and that origin alone — `data:` for the toolbar's drawings of `icons.css`.
9. **The credits show whenever a picture does** (rule 6, ADR-0190), in the window's corner.
10. **The control is the tab's, never the design's** (rule 3): its three settings lie in the
    tab's `sessionStorage` under `KEY`, through a reload and a switch of view, and in no sketch,
    plot, kept sketch, PNG or store of plots. A new tab opens with the map off. The key is not
    the plot's `seen` of `views.js`: a plot opened while the map is on keeps it on, under its
    own place.

## Test

`tools/sketch/under/place.check.js`, by hand, with no browser and nothing of the real site: on the
made-up plot's paper and place, loading the pad's own `demo-site.js`, `paper.js` (`#top`) and
`grid.js`. In a window of 800 by 600, at three zooms — 32 pixels a cell, nearer than the nearest
level; 1, a pixel a pixel of the map; 0.008, far out — and at bearings of 0, 90, 232 and the one
whose sine is 3/5: the level and the scale, the turn, the box and the place under the window's
middle; both refusals, and the sheet's corner, which is on it; a corner of the plot, x = 36,
y = 23, in LV95 by hand and by `onMap` of `new-plot/frame.js`, through what `underOf` gives onto
the screen within a millionth of a CSS pixel of where `paper.cell` and the zoom's rule put it, at
the four bearings and the three zooms; the twenty pictures of a far view, by hand; and at every
rung of `grid.LADDER`, at seven bearings, in five windows and at three places, the level's rule,
the scale's bounds and the bound on the number of pictures.

`tools/sketch/under/lay.check.js`, by hand, with no page: whom the top view asks — a stand-in,
swisstopo with New plot, nobody without it or for an `asks` refused; the second policy, to the
letter, and that the first in `index.html` is `connect-src 'self'` alone; the strength; the
pictures of a view at a bearing of 90 — nine, the first by hand, its address and its place —
of the national map nearer than its last level, by hand, and of the cadastral map from its level
and further out, where this tree has it; the refusals; which pictures stay, go and are asked for
as the view moves by half a picture and by one; when a view moved; that `lay.js` imports
`hosts.js` alone as it loads; and where `index.html` names the script, its element and its
stylesheet. The page itself — the pictures under the paper, the PNG, the switch — is held in a
browser by the story's end-to-end test; the policy on the made-up pad by
`tests/e2e/sketch-kept.spec.ts`.

`tools/sketch/under/switch.check.js`, by hand, with no page: what the tab keeps of the control,
to the letter, and what it reads back, in a tree with a cadastral map and in one without,
Blockplot's — where a kept cadastral map is the photo; nothing kept, or what is no such text, the
first settings; a strength out of range held, one that is no figure half; the slider's figure
and back, at every whole per cent; the choices by their words; that the choice is a menu — its button, shut, and its part after the
switch in `index.html`, handed to `views.menu` — and that `switch.js` makes no list; that it imports
`hosts.js` and `lay.js` alone as it loads, and keeps nothing in `localStorage` or the store; and
where `index.html` has the control and its script.

`tests/e2e/sketch-under-map.spec.ts`, **the story's end-to-end test** (T-046.3), on a pad and a
stand-in of its own (`tests/e2e/sketch-own-pad.ts`), the page told the stand-in by `?asks=`:
the trial plot of the stand-in's world held in the browser, the control in the View group off,
the photo and 50 % first, nothing asked; switched on, the photo's pictures under the paper, all
come, their box turned `90 - bearingDeg`, at 0.5, the credits shown, the canvas without its
ground; no `<select>` in the header, and the choice of map a menu that opens with its entries,
the photo checked, and shuts at Escape; 20 % on the slider seen as their opacity, the canvas
unchanged; the national map chosen from the menu, its pictures; a slice, no control, no picture, no credits and nothing more asked, and the top
view with them again; 30 % kept through a reload, off in a new tab; Picture (PNG) byte for byte
the same with the map on as with it off; switched off, nothing more asked; the sketch saved, the
plot held and `localStorage` with nothing of the map; and every request of the stand-in a GET of
a picture of a layer of `LAYERS`. A second case: the made-up pad, told a stand-in, offers no map
and shows no control. It saves `menu.png`, the top view with the menu of maps open, `under.png`, the top view with
the map on at 50 %, and
`slice.png`, a slice, for a look.

## Gotchas

- **The box covers the window turned, so a turned map asks for pictures that lie in its corners
  beyond the window**: at a bearing that is no quarter, up to about twice the pictures that the
  window shows. `pictures` of `../map/view.js` counts what the box shows, not what the window does.
- **A cosine of a quarter turn is a hair over nought**: the box's sides are settled to a
  thousandth of a pixel before they are rounded up, as `pictures` settles a view's corner.
- **`place` is `SITE` itself**: the paper's corner, `xFromM` and `yToM`, is needed beside
  `originLV95` and `bearingDeg`, since the zoom's `left` and `top` count cells from that corner.
- **`#under-map`, not `#under`**: an element's id is a name of the window, and `globalThis.under`
  would be the element wherever the script had not loaded.
- **The holder is shown before it is measured**: hidden, `#under-map` is 0 by 0, and the first
  view of a map switched on had no picture until the view moved (found by T-046.3).
- **The choice of map is a menu, not a `<select>`**: the header holds no list —
  `gallery-text.check.js` refuses `<select` in the page, and `sketch-gallery.spec.ts` any
  `header select` (the gallery is no list of kinds). A `<select>` that `switch.js` made once the
  page had loaded passed the first and failed the second (found as sprint 49 was verified). The
  menu's button and part are written in `index.html`; its entries are made by the script, since
  the tree decides which layers there are.
- **`switch.js` loads after `page.js`, not before**: `lay.js` stands right before `page.js`
  (its check holds that), and the switch redraws by `zoom.onChange`, which `page.js` wires.
- **A turned box is in its own stack**, and `#under-map` is in none: its `<p>` of credits, at
  `z-index: 1`, rises over the canvas, and the pictures stay under it.
