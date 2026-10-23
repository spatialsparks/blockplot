# tools/sketch/map

The page of a new plot (ST-031): swisstopo's map, brought nearer, taken further and moved; a
place found on it by its words; **the corners of a plot marked on it, the plot named, and made**
(T-031.7) — in the page itself, its ground asked by the page (ST-041, T-041.3) — or a parcel's
corners taken, by its number, its EGRID or a click (ST-043, T-043.5), or a GeoJSON file's
outline, chosen or pasted, read in the page alone (ST-045, T-045.5). It is the one
page of the pad that asks another machine. File's entry "New plot", on
the pad's own page, leads here (`tools/sketch/open-plot.js`), and "Back to the pad" leads back.

## Public API

- `tools/sketch/map/index.html` — the page, at `/map/index.html` of `pnpm sketch` and of any plain
  file server (`MAP`, `MAP_PAGE` of `tools/sketch/routes.js`; at that address alone since
  T-040.4, when the addresses of a plot went — under `/plots/<id>/` it is a 404). The made-up pad
  answers that address with 204 and nothing, and has nothing else of this folder (T-041.4):
  File asks for the page, from where it is, and has "New plot" where it comes, 200. **Whom it asks is one word of its
  own address, `asks`** (ST-041, T-041.2): none, swisstopo; `?asks=<a port>`, a stand-in at that
  port of this machine; anything else, nobody — `asksOf` of `tools/sketch/swisstopo/hosts.js`.
  File's "New plot" carries the pad page's word there. Its parts, by their ids:
  in the head `#back`, "Back to the pad", a link to `../`, and Find, the form `#find` with the
  field `#find-words`; in `#work`, left of the map `#found` with `#find-said` and `#places`, a
  button a place; `#map` with `#tiles`, the pictures, on them `#plain`, the word of plain
  ground (below), over both `#marks` — a drawing: `#sheet`, `#outline`, `#along` and `#dots`, a
  circle a corner — and on those `#said`, `#photo`, `#nearer`, `#further` and `#credits`; right
  of it `#plot`, the plot's side (below); and under them `#asks`, the line of what the page
  asks. `#find` and `#work` lie hidden until the page knows whom it asks
- **`#plain`, the word of plain ground** (T-031.8): a paragraph of the page, a constant and no
  word of a service — `Plain ground? The cadastral map has no picture here, or is not
  answering: the aerial photo shows the same ground.` It stands on the map **while the
  cadastral map shows, and at no other time**: not with the national map, and not with the
  photo. It lies under the switch, 6 pixels from its foot and with its left edge, 384 pixels
  wide — 32 of its own em — and never nearer to the two steps than 20 pixels; quiet words, the
  faint ink at 12 pixels, on the paper's ground. It is no word of a failure — `#said` stays
  what it was — and it claims nothing that the page does not know (invariant 11). Where the pad
  offers no cadastre (`docs/sketch/cadastre.md`) the cadastral map never shows, and so neither
  does the word: its paragraph stays in the page, hidden by the stylesheet (T-044.10)
- **`#plot`, the plot's side**: at its top `#parcel-part`, the parcel's part — the cadastre's,
  shown only where the pad offers it (`docs/sketch/cadastre.md`, T-044.10): hidden as the page
  comes, and `page.js` shows it; where it stays hidden the side begins at "From a file". In it the
  parcel (T-043.5) — `<h2>Parcel</h2>`, the form
  `#parcel` with the field `#parcel-words`, labelled `A municipality and a parcel number, or an
  EGRID`, its placeholder `Bern 1234, or CH…`, and the button "Find the parcel";
  `#take-parcel`, a checkbox, "Take the parcel under a click", off as the page comes;
  `#parcel-said`; and `#parcels`, a button a parcel listed, which look as `#places` does — then
  `#file-part`, **the file's part** (ST-045, T-045.5), shown in both trees: `<h2>From a
  file</h2>`, `#file-choose`, a file chooser taking `.geojson,.json,application/geo+json,application/json`,
  labelled `A GeoJSON file of the plot`; `#file-text`, a box for pasted GeoJSON, labelled
  `GeoJSON of the plot, pasted`, its placeholder `Or paste its GeoJSON here`, no spell check;
  `#file-take`, "Take the outline", off as the page comes; and `#file-said` — then
  `#corners-said`; `#no-survey`, hidden until the outline closes;
  `#undo-corner`, "Undo corner", and `#start-again`, "Start again"; `#paper-said`;
  `#side-before` and `#side-next`; `#around`, a field of figures, "m of ground around the plot";
  the form `#naming` with `#name`, `#folder` and `#make`, "Make the plot"; and `#make-said`.
  Every button of it but "Find the parcel" is off as the page comes, and the page writes no
  limit into a tag: its scripts put the buttons on, and set the limits — the parcel's field
  `SEARCH_MAX` of `tools/sketch/swisstopo/hosts.js`
- `tools/sketch/map/page.js` — the page's one script, a module that loads the others. `whom()` reads
  `location.search` through `asksOf` and asks nobody — no `GET /new-plot/` (T-041.2); `toldOf(told,
  cadastre = CADASTRE)` reads what `asksOf` gave, `{ asks, map, search, terrain, says }` — `asks`
  is `swisstopo`, `stand-in` or `nobody`, `terrain` the third origin, `says` the line: for
  nobody the refusal, then `It shows no map and makes no plot.`; for swisstopo, with a cadastre,
  the line that names the parcel, and without one (T-044.10) `This page asks swisstopo, the
  Federal Office of Topography, for the pictures of the map that it shows and for the places that
  you search for: the words that you typed are all that goes for it. When you make the plot, this
  page asks it for the heights of the ground under the plot. Nothing else goes out: no name, no
  sketch, nothing of your design, and nothing of a GeoJSON file that you give, which is read in
  this page alone.` — both lines end in that sentence since T-045.5 (ST-045, rule 1). The page
  puts its second policy into its head — `policyOf` of
  what it was told — then opens the map and Find on the two origins, the marking on that map,
  once, the file's part on the marking (`openFile`), and on the marking, where `CADASTRE` is not
  null, shows `#parcel-part` and opens the
  parcel on the search's origin — `take.js` loaded then by `await import('./take.js')`, and by no
  static import — and then the making; or none
- `tools/sketch/map/view.js` — the arithmetic of a view, `{ level, e, n }` in a place of `{ wide, high }` pixels,
  with nothing of a page in it: `placeAt`, `pixelOf`, `pictures`, `stepped`, `moved`, `held`,
  `first`, `showing`, `NEAREST`, `goesTo`, `SPARE_PX`. `showing(level, photo, from = CADASTRAL_FROM)` (T-044.10): the
  photo where the switch says so; the cadastral map from `from` on, where `from` is not null;
  else the national map to its last level, `LAYERS.national.to`, 27, and the photo at 28.
  `goesTo(corners, { wide, high })`, `{ e, n, level }`, where the map goes for an outline taken —
  a parcel found or picked, by `take.js`, or a file's: the middle of its box, at the nearest
  level from `FOUND_AT` of `hosts.js` outward at which the box shows whole with `SPARE_PX`, 20,
  to spare on each side — level 0 where none does. In `take.js` until T-045.2 moved it here, in
  Blockplot's tree
- `tools/sketch/map/map.js` — `openMap(origin)`, the map in `#map`. It gives `view()`, the view with the pixels
  of its place; `placeAt([x, y])`; `goTo({ e, n }, level)`; `shows()`, the layer by its name in
  `LAYERS`; and `say(words)`, a sentence of a script after it, in `#said` before the map's own
  — until that script says another, or none. **And `#map` says two words, as events**:
  `CHANGED`, `mapview`, with the view as its `detail`; and `CLICKED`, `mapclick`, with the place
  `{ e, n }` under a pointer whose first button went down and up within `CLICK_PX`, 4, pixels
  of one place. `REST_MS`, 150
- `tools/sketch/map/find.js` — in two halves: `search(origin, typed, ms)`, `{ places, said }` or null while one
  is asked, `placesOf(text)`, `wordsOf(text, most)`, `NAME_SHOWN`, 120, and `FIND_MS`, 20 000,
  the clock of a search, with nothing of the page in them; then `openFind(origin, map)`
- `tools/sketch/map/take.js` (ST-043, T-043.5) — the cadastre's, loaded only where the pad
  offers it (`docs/sketch/cadastre.md`), and left out of Blockplot's tree. In two halves, as
  `find.js`: `findParcel(origin,
  typed, ms)`, an EGRID by the find, words by the search and, where it lists one, the find by its
  EGRID; `pickParcel(origin, egrid, ms)`, the find; `parcelUnder(origin, place, level, ms)`, the
  identify, from `CADASTRAL_FROM` on — `{ far: true, said }` nearer, with nothing asked. Each
  gives `{ said }`, `{ parcels, said }` — several, each `{ name, egrid }`, its name the label by
  `wordsOf` — or `{ taken, said }`, what `boundaryOf` of `tools/sketch/new-plot/parcel.js` read,
  and null while a request is asked: one at a time, `PARCEL_MS`, 20 000, on all of an answer.
  Then `openTake(origin, map, marks)`: the form, the list and the switch; a parcel found or
  picked, the map goes to by `goesTo` of `view.js`
- `tools/sketch/map/file.js` (ST-045, T-045.5) — `openFile(map, marks)`, the file's part: the
  page's wiring, with no check of its own, as `map.js` and `marks.js` have none; the story's
  browser test presses it. It puts "Take the outline" on, and `#file-said` says first `Choose a
  GeoJSON file of your plot, or paste one: it is read in this page, and nothing of it is sent.`
  The one given last is taken: a file chosen empties the box, and a letter typed or pasted into
  the box lets the file chosen go. Pressed, a file larger than `FILE_MAX_BYTES` of
  `tools/sketch/new-plot/geojson.js` by its `size` is refused in `outlineOf`'s sentence of size
  and not read; else its `File.text()`, or the box's text, goes to `outlineOf` — a file that
  cannot be read says `The file could not be read in this browser.` What is taken goes to
  `marks.takeFile(corners, { wgs84 })`, and the map goes to it by `goesTo`, as to a parcel
  found; `#file-said` then says `outlineOf`'s `said`. What either refuses is said, and nothing
  changes. While one is read a press does nothing; pressed again, the same file or text is read
  and taken again. Nothing of the file is kept, held in the store or sent: it has no `fetch`,
  which `page.check.js` holds
- `tools/sketch/map/marking.js` — `marking()`, a plot while it is marked, with nothing of the
  page in it (cut out of `marks.js` by T-043.4): `add({ e, n }, level, shows)` — empty, or why no
  corner was set — `move(at, place, shows)`, `undo()`, `clear()`, `pick(by)`, `around(figure)` —
  empty, or the order's sentence — **`take(corners, parcel)`** (ST-043), a parcel's corners, each
  `[e, n]` in LV95, with `{ egrid, number, canton }`, in the place of every corner marked, as if
  each were set on the cadastral map, to the centimetre, the side the longest again and the ground
  around as it was, no level asked: empty, or why nothing was taken — `A parcel of fewer than three
  corners encloses nothing.`, or more than `CORNERS_MAX` in `An outline has 1000 corners at the
  most.` — and then nothing changes; a file's outline taken before is let go;
  **`takeFile(corners, { wgs84 })`** (ST-045, T-045.1), a GeoJSON file's corners, each `[e, n]`
  in LV95, in the place of every corner marked, to the centimetre, **marked on nothing** —
  `read().on` is `[]` until a corner is set or moved — the side the longest again, the ground
  around as it was, any parcel let go: empty, or why nothing was taken — `An outline of fewer
  than three corners encloses nothing.`, or more than `CORNERS_MAX` in the same sentence as a
  parcel's — and then nothing changes; `read()`, `{ corners, side, aroundM, on, paper, parcel,
  file, said }`, `parcel` null or `{ egrid, number, canton, asGiven }` — `asGiven` true as it is
  taken, false once a corner is added, moved or undone, and left as it was by a side picked and
  the ground around; `file` null or `{ wgs84, asGiven }`, the same; "Start again", and an undo
  that leaves no corner, let the parcel or the file go; a parcel and a file never stand together
  — and `order(name)`, with the parcel or the file as its sixth field where there is one and no
  such key where there is none. `read().on` lists what the corners were marked on in the order of `MARKED_ON`,
  `national`, `cadastral`, `photo` — the national map one since T-044.10. `said.survey`, whose
  the corners are: the hand's sentence, `Marked by hand on a map: good to a few decimetres, no
  survey, and of no legal effect.` (T-044.10, which names no map); as given, `Parcel <n>
  (<c>) of the official survey, as geo.admin.ch gives it: no extract of the land register, and of
  no legal effect.`; changed, `After parcel <n> (<c>) of the official survey, changed by hand: no
  survey, and of no legal effect.`; of a file, as given, `From a file you gave: no survey, and of
  no legal effect.`; changed, `After a file you gave, changed by hand: no survey, and of no legal
  effect.`; converted from WGS84, `From a file you gave, converted from WGS84 to about a metre: no
  survey, and of no legal effect.`; converted and changed, `After a file you gave, converted from
  WGS84 to about a metre, changed by hand: no survey, and of no legal effect.`
- `tools/sketch/map/marks.js` — `MARKED`, which `make.js` imports, and `openMarks(map)`, the
  marks and the plot's side: it gives `read` and `order`, `take(corners, parcel)` — empty, the
  corners shown and `MARKED` said, or the sentence of why not, nothing shown —
  `takeFile(corners, { wgs84 })`, a GeoJSON file's the same way (ST-045), which `file.js` calls — and
  `clicks(on)`, whether a click on the map sets a corner, true as the page opens: while it is
  false a click sets nothing and says nothing, and a corner's mark is still dragged. **`#plot`
  says one word, `MARKED`, `marked`**, with what `read()` gives as its `detail`; `#no-survey`
  says `said.survey`. `take.js` calls both (T-043.5): `take` for a parcel found, picked or
  clicked, and `clicks(false)` while "Take the parcel under a click" is on
- `tools/sketch/map/make.js` — in two halves (T-041.3). `lying(name)`, the sentence of the folder that a
  name will get, with no folder known to be taken (T-040.3: the page asks no list of the plots);
  `idOf(folder, heldIds, names)`, the id of a plot made, `freeOf` of its folder free of the ids
  that this browser holds and the names in the folder picked; `notMade(sentence)`, `The plot was
  not made: ` and the sentence, 400 characters of it at the most; `unwritten(error, id)`, a
  plot's folder that could not be made, in `SAID.disk`'s words of `tools/sketch/new-plot/request.js`; and `SAID`, its
  sentences — with nothing of the page in them. Then `openMake(marks, terrain)`, the name, the
  button and what they say, and the plot made: the folder picked, where the browser takes folders
  (`takesFolders`, `pickFolder` of `tools/sketch/store/ways.js`); `plotMadeOf` of
  `tools/sketch/new-plot/making.js`, its ground asked of `terrain`; the plot's folder made there (`makeIn`), else its file offered as
  `plot.json`; held, `hold` of `tools/sketch/store/held.js` with `recordOf` — `way: 'folder'` and its handle,
  or `way: 'file'` —, and both notes, `TAB` and `LAST` of `tools/sketch/store/rules.js` (T-040.2)
- `document.body.dataset`, for a test and a look: `asks`; `level`, `e`, `n` — the middle, to
  the centimetre — `shows`, the layer, `pictures`, how many the view has, and `came`; of the
  marking `corners`, how many, `marked`, each corner as `E,N` to the centimetre with a blank
  between two, `area`, to the thousandth of a square metre, or empty, `side`, the corner that
  the paper's side begins at, from 0, `around`, metres, and `on`, `national`, `cadastral`,
  `photo`, or a map and the photo with a blank between, `parcel`, the EGRID of a parcel taken, or empty, `file`, `lv95` or
  `wgs84` — a GeoJSON file's outline taken, as given or converted — or empty (ST-045), and `given`, `true`,
  `false` or empty — whether the corners of the parcel or the file are as given; and of the making `folder`, the sentence of `#folder`, and `making`,
  `true` from the press until the answer

## What the owner does there

- **A parcel is taken whole** (ST-043, T-043.5). It is the cadastre's, shown only where the pad
  offers it (`docs/sketch/cadastre.md`): where it does not, the side begins at "From a file", and the
  corners are marked by hand on the national map or the photo. "A municipality and a parcel number, or an
  EGRID" typed, and "Find the parcel" — or Enter: an EGRID is asked by the find; words by the
  search — none, `No parcel <words> was found.`; one, then the find by its EGRID at once;
  several, `<k> parcels. Pick one, and it is marked.` and a button a parcel, and a pick asks the
  find by its EGRID and is marked `aria-current`. An EGRID that the find has not: `No parcel
  <egrid> was found.` A parcel taken stands on the map as if its corners were clicked
  (`marks.take`), the map goes to it, whole, and `#parcel-said` says `Parcel <n> (<c>), <egrid>,
  is marked as geo.admin.ch gives it.`, and after it what was left out — a hole, a smaller part.
  With **"Take the parcel under a click"** on, a click sets no corner: from `CADASTRAL_FROM` on it
  asks the parcel under it, which is taken where the map stands — `No parcel lies under this
  place.` where none is — and nearer than that the map says `Come nearer to take the parcel
  under a click: from here the map shows no parcels.` What `marks.take` or `boundaryOf` refuses
  is said, and nothing is marked; what does not come — `The parcel did not come: swisstopo does
  not answer.`, `… answered <status>. It said: <words>`, `… answered what cannot be read.` — is
  said, and the corners stay as they were, to be marked by hand. While a request is asked, a
  Find, a pick or a click asks nothing and says nothing.
- **An outline is taken from a GeoJSON file** (ST-045, T-045.5), in both trees, under the
  parcel's part and above Corners: a file chosen, `.geojson` or `.json`, or GeoJSON pasted into
  the box — the one given last — and "Take the outline". It is read in the page alone, and
  nothing of it is sent, kept or held. Its corners stand on the map as a parcel's do, in the
  place of any marked, marked on nothing, and the map goes to them, whole; `#file-said` says
  `The file's outline is marked: <k> corners.`, and after it that the file gave longitude and
  latitude, converted to LV95 to about a metre, what was left out, and the features passed over
  — `outlineOf`'s line (`docs/sketch/new-plot.md`). What is refused is one sentence there, and
  nothing changes. Then it is New plot as it is: a corner dragged, the side picked, the ground
  around, a name, and "Make the plot", whose plot says that its outline came from a file you gave.
- **A corner is set by a click that was no drag**, where a pixel of the map is half a metre or
  less — `MARK_FROM`, level 26 — at the place under the pointer, to the centimetre. Further, a
  click sets none, and `#said` says `Come nearer to mark a corner: here a pixel of the map is
  more than half a metre.`; the 1001st is not set: `An outline has 1000 corners at the
  most.` Either sentence goes when the map changes, or the marking.
- **From the second corner a line joins them; from the third the outline closes**, its area
  shows — `5 corners, 520 m².`, to a whole square metre — with the line that it is no survey,
  and the paper shows around it as it will lie: its sheet as a broken line, and the side that
  it lies along drawn stronger. `#paper-said` says `The paper lies along side 1 of 5, 30 m
  long, and will be 40 m by 30 m.` — or the sentence that `paperOf` refuses the outline with,
  and then there is no area and no sheet. All of it stays on its ground wherever the map goes.
- **A corner's mark is dragged**, from as near as a corner is set, and the map stands still
  meanwhile: the corner goes as far as the pointer went, once that went further than a click
  may. **From afar the marks take no pointer**: a drag that begins on one moves the map.
- "Undo corner" takes the last corner away, "Start again" all. The side before and the next
  are picked round the outline: the paper lies along the longest until then, and along the
  longest again once a corner is added or taken away. The ground around is 5 m until another
  figure is set, 0 to 20 m in halves: what is no such figure is said in the order's own
  sentence, before the paper's — the paper stays, and the field has its figure again.
- **A name shows the folder that the plot will get**, at every letter and with nothing asked:
  `It will lie in the folder "Barenhohe Parzelle 12".` — the folder of the name, and with a
  figure after it where it is one of the pad's own two, `home-2`; where a plot that this browser
  holds, or a name in the folder picked, has that folder already, the plot gets the next figure
  at the press, `Terrace-2`: nothing is written over, and two plots of one name are two plots,
  as the pad's server made them (ADR-0128). **"Make the plot"** is off until there are three corners and a name. Pressed — or Enter
  in the field — what `paperOf` refuses is said in `#make-said`, and nothing is asked. Else the
  button is off, and a second press does nothing; **where the browser takes folders the folder
  that the plot is to lie in is picked first** (T-041.3), while the press still lets the page ask
  for one — shut, `No folder was picked: nothing was asked, and nothing made.`, and the button is
  on again. Then `#make-said` says that the ground is being fetched, and **the page asks the
  terrain for it itself**, through the pad's one door, one request after the other, and makes
  the plot as the pad's server made it (`plotMadeOf`). Made, it writes the plot's folder into the
  folder picked — `<id>/plot.json` and an empty `sketches/` (`makeIn`) — and holds the plot as a
  plot of the folder way, so Keep keeps into its `sketches/`; **in a browser that takes no folder**
  — Firefox, Safari — it offers the file `plot.json` to save, and holds the plot as a plot of the
  file way. Then it notes it as the tab's plot and the last, and goes to the pad's own page,
  `../` from where the map's page is, in its own place: a step back from the new plot is the
  page that led to the map. Made and not held — a store that fails — it says so, and where the
  plot is: `The plot was made, in the folder "<id>" of the folder that was picked, and this
  browser did not keep it: …`, or `…: its file is offered to save, as plot.json, …`. Not made,
  `The plot was not made: ` and the sentence that the pad's server said before T-041.4 — of the order, of the
  paper, of ground that does not come, offline among it, or of a folder that could not be
  written — and nothing is held, picked into or offered, and the button is on again. **Nothing
  goes to the pad's server.** A page that is left while the heights come keeps nothing; a
  folder written and left before it was held is a plot's folder like any, which File, "Open
  plot" opens.

## Invariants

1. **The page's policy is its own** (ST-041, T-041.2), for a plain file server sends no header:
   its head holds `<meta name="referrer" content="no-referrer" />` and a first policy that names
   no host — `script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; form-action
   'none'`, in force from the first byte — and `page.js`, before it asks a picture or a search,
   puts a second `<meta http-equiv="Content-Security-Policy">` beside it: `policyOf` of
   `tools/sketch/swisstopo/hosts.js`, of whom its address asks — `default-src 'none'`, pictures
   from the map's origin, requests to the search's and the terrain's, each origin once. Both
   hold, and a script's policy is never widened. **No `frame-ancestors`**: a `<meta>` cannot say
   it, and Chromium says so on the console; `X-Frame-Options: DENY`, which `serve.js` sends with
   every file, keeps the page out of a frame. The server sends the page no policy and no referrer
   header. So **no script, no style and no handler is written into a tag here**: a script is a
   module, a stylesheet a file — `tools/sketch/frame.css`, `tools/sketch/map/map.css`, and not
   `tools/sketch/icons.css`, whose drawings are pictures written out as data — and a script sets a style
   by a property of a part's `style`. How the marks look is `tools/sketch/map/map.css`'s, by their ids.
2. **The page asks three hosts and no fourth**, on the origins that its address names: the
   map service for the pictures of the view that shows, the search for the words that the owner
   sends — for a place, and for a parcel: its search, its find by an EGRID and its identify under
   a place clicked (T-043.5) — and the downloads for the ground under the plot when it is made (T-041.3), through the
   pad's one door, `tools/sketch/swisstopo/door.js`, by the addresses that `tools/sketch/swisstopo/ground.js` builds of `terrain`.
   An address is built by `tileAddress`, `searchAddress`, `parcelSearchAddress`, `parcelAddress`,
   `parcelAtAddress` or the readers of swissALTI3D and by nothing else, and no
   script, check or comment of this folder types a host (`tools/sketch/swisstopo/named.check.js`).
   **A page opened with no word asks swisstopo**, and **a link may tell it to ask a port of the
   visitor's own machine** — pictures, a search and the catalogue at the addresses `hosts.js`
   builds there, and the line says that a stand-in on this machine is asked; a browser's own
   guard of local addresses may ask the person first. What keeps a browser test from asking
   swisstopo is the gate of `tests/e2e/sketch-own-pad.ts`, which refuses every request to neither
   the pad nor its stand-in (T-041.2's proposed ADR).
3. **What goes out with a request**: its address, and the browser's own `Origin`, the pad's
   address with no path. A picture is an `<img>` with `crossorigin="anonymous"` and
   `referrerpolicy="no-referrer"`, a search a request with `credentials: 'omit'`: no cookie and
   no referrer — and a parcel's request the same, with the words typed, an EGRID typed or
   picked, or the place clicked, and nothing else of the person's (T-043.5); the door asks the ground the same way, with a `Range` where it asks a part, and
   nothing of the plot's name. Nothing of the map is drawn into a canvas, kept in a store or
   handed to the pad's server. **Nothing of a GeoJSON file given goes anywhere** (ST-045, rule
   1): it is read in the page; its corners alone go into the plot, and the ground under them is
   asked as for any plot.
4. **One layer at a time** (`showing`): the national map up to level 24, the cadastral map from
   `CADASTRAL_FROM` on, the aerial photo where `#photo` is pressed. Where the pad offers no
   cadastre (T-044.10) the national map up to its last level, 27, and at 28, which it has not,
   the photo whatever the switch says — the ladder stays 0 to 28, and the switch still shows its
   state; at 28 both states show the photo. Each with its credits in
   `#credits`, at the map's foot and over all else that lies on the map: the marks lie under
   them, and under every control of the map — and the word of plain ground under the marks.
5. **Pictures are asked for when the view rests**, `REST_MS` after its last change, and a drag
   asks at its end: those of the view that shows and no other. A picture of another level or
   layer, or beside the place, goes at once.
6. **A service's words are text, never markup**: `wordsOf` takes their tags out and cuts them
   to whole characters, and what it leaves may be a tag still — a part gets them by
   `textContent`. A place is a name and two numbers on `SHEET`, or is left out. **So is a
   parcel's label**, a button's text by `wordsOf`, and its number in the sentence of a parcel
   taken (T-043.5). **So are the
   words of a plot that was not made**: the sentence may hold any sign of a service's or of
   the browser's, and is set as text, cut to 400 characters. **And so is
   what the page's address told it** (T-041.2): the refusal quotes it as JSON, cut to 40
   characters, and the line is set by `textContent`.
7. **The made-up pad has nothing of this folder**, and no pad gives it under other letters: **a
   file of this folder has a name in small letters.**
8. **The page says what it will make, by the server's own rule** (T-031.7), and makes it so
   (T-041.3, `tools/sketch/new-plot/making.js`): the area
   and the paper are `paperOf` of `tools/sketch/new-plot/frame.js`, the folder `freeOf(folderOf(name), [])`
   of `tools/sketch/new-plot/request.js`, a figure that is none the sentence of `orderOf`, and the limits
   `CORNERS_MAX`, `NAME_MAX`, `AROUND_M` and `AROUND_MAX_M` — each loaded as a module, and none
   stated here a second time. Which way `x` will run the page cannot know: the ground says it,
   and the paper is the same sheet either way.
9. **What the server refuses of a paper, the page refuses first, in the same sentence, and asks
   nothing.** And **nothing of the plot is asked before "Make the plot"** — but a parcel that the
   owner asks for, by its words, its EGRID or a click with the switch on (T-043.5): the marking
   and the naming ask nobody. **The pad's own server is asked nothing by `make.js`** (T-041.3): no
   order, no list of the plots (T-040.3); the ground is asked of the page's `terrain` alone, by
   the door, and the order that the making reads holds corners, a name and figures: never an
   address.
10. **`on` is what showed while a corner was set or moved** — a map, the national map or the
    cadastral map, the aerial photo, or a map and the photo (the national map one since
    T-044.10: where the pad offers no cadastre corners are marked on it at 26 and 27, and on the
    photo at 28 or at the switch) — **of the corners that there are**: a corner that was undone takes what it
    was marked on with it. The plot's credit says it for good (`tools/sketch/new-plot/plot.js`).
    **The corners of a parcel taken are marked on the cadastral map**, whatever shows (T-043.4):
    its boundary is the cadastral map's; one moved on the photo then is marked on both.
11. **The word of plain ground is the stylesheet's, and no script's** (T-031.8): `tools/sketch/map/map.css`
    hides `#plain` and shows it where the body says `data-shows="cadastral"` — what `tools/sketch/map/map.js`
    says of the layer already — and no script names the part. **No script reads a picture to
    tell an empty one from a drawn one** (invariant 3), so the word says what plain ground may
    mean, and never that the map is empty. **It takes nothing from the map**: no pointer is its
    own — a click on it sets a corner under it, a drag that begins on it moves the map — and
    the marks of the plot are drawn over it. Its tag holds its id and nothing else: `hidden`
    there would be `display: none !important` (`tools/sketch/frame.css`), which no rule could lift.
    Where the pad offers no cadastre the body never says `cadastral`, and the word never shows.

## Test

`pnpm sketch:check` finds seven checks here: `tools/sketch/map/view.check.js`, every figure by hand,
`goesTo`'s among them since T-045.2 moved them from `take.check.js`, unchanged;
`tools/sketch/map/take.check.js` (T-043.5), the first half of a parcel taken, asking the stand-in
itself — `Musterlingen 1234` in two requests, its EGRID typed with blanks in one, `Musterlingen
77` listed by its labels and the second picked, none, a hole and a part left out, a building
right and a condominium refused, 120 corners, a click on 1234 and in the hole of 1235, nothing
from afar, no second request while one is asked, every request at the address that `hosts.js`
builds with no cookie and no referrer — then a server of its own: a failure with long words,
no JSON, no answer within 60 ms; `openTake` on a made-up page with a made-up
map and marks — the field's limit, the map at a parcel found or picked, a refusal of the marks
said, the switch handing `clicks(false)` and back, a click's parcel taken where the map stands
and none asked with the switch off; and of the script the text;
`tools/sketch/map/find.check.js`, the first half of Find, asking the stand-in itself — and a server of its own
that never answers, for the clock; `tools/sketch/map/marking.check.js` — `marks.check.js` until
T-043.4 cut the marking in two — the marking by hand, on the pentagon of
the first hand case of a plot: the sentences, the area, the paper's sheet as `paperOf` has it,
the order as `orderOf` takes it, a side picked, a corner moved and undone, a thousand corners — `CORNERS_MAX`, 50 until T-043.1 — and no
more, none from afar, what `paperOf` refuses, the ground around, and what the corners were
marked on; `tools/sketch/map/marking-parcel.check.js` (T-043.4), a parcel taken by hand — a
made-up ring of 35 corners to the decimetre at the origin of the Swiss grid, taken in the place
of the pentagon marked: every figure as it came, on the cadastral map, the side the longest, the
ground as it was, its area as `paperOf` says and by hand; `asGiven` false after a corner added,
moved or undone, still true after a side picked and the ground changed; "Start again", and an
undo to no corner, letting it go; two corners and 1001 refused, nothing changed; the two
sentences to the letter; and the order with its parcel, as given and changed, as `orderOf` reads
it, and with no `parcel` key where it was marked by hand; `tools/sketch/map/marking-geojson.check.js`
(T-045.1), a file's outline taken — the made-up pentagon, a hair beyond the centimetre, taken
over corners marked by hand on the photo and over a parcel taken: each corner to the centimetre,
marked on nothing, the side the longest, the ground as it was, the parcel let go; `asGiven`
false after a corner moved, added or undone, and what showed then is what `on` says; "Start
again", an undo to no corner and a parcel taken after it letting the file go; two corners and
1001 refused, nothing changed, and 1000 taken; the four sentences to the letter; the order with
its file, as given and changed, converted or not, as `orderOf` reads it back; and an outline of
991 m by 20 m taken all the same, its paper refused in `paperOf`'s sentence; `tools/sketch/map/make.check.js`, the first half of the making (T-041.3), which starts nothing
and asks nobody: the folder of a name, with no list of the plots asked; `idOf` of a name among
held ids and a folder's names, in other letters too, `home` and `example` never; each sentence to
the letter — a plot not made, cut to 400 whole characters, a folder that could not be written
and one of which something may be left, a folder not picked, a plot made and not held; and of
the script the text: no `fetch`, no order to the pad's server, the folder picked before the
plot is made and written or offered after, the two notes it writes and the one page, `../`, it
goes to — what is made of an order, and refused, is `tools/sketch/new-plot/making.check.js`'s; `tools/sketch/map/page.check.js`, the text of the page — the
word of plain ground among its parts, to the letter, with its id alone in its tag — the
page's two `<meta>` of its own policy to the letter, every file that it names, on the disk, and
whom the page asks by its address, with nothing asked to know it — and that `page.js` puts the
second policy in before it opens the map (T-041.2); and since T-044.10 the parcel's tags inside
`#parcel-part`, hidden, the files it loads without `take.js`, `new-plot/parcel.js` and
`swisstopo/parcels.js`, `import('./take.js')` once and where `CADASTRE` is not null, and the
swisstopo line typed in with a cadastre and without one, `toldOf(…, null)`, and its default
`CADASTRE`; and since T-045.5 the file's part to the letter, between the parcel's and Corners,
its button off, the two lines' last sentence of a GeoJSON file, `openFile` after the marking, no
`fetch` in `file.js`, and the files it loads with `map/file.js`, `new-plot/geojson.js`,
`new-plot/ring.js` and `kml/wgs84.js` — a module's name may hold a figure now, and nothing else
more. `view.check.js` holds which layer shows for `from` 25 and for `from` null, level by
level. With
`tools/sketch/swisstopo/served.check.js` and `named.check.js`. What the page does in a browser, by `pnpm
e2e:sketch sketch-map` and `pnpm e2e:sketch sketch-new-plot`, each case on a pad and a stand-in
of its own (`tests/e2e/sketch-own-pad.ts`), the page opened at the address that names that
stand-in, `pad.map`, `?asks=<its port>` (T-041.2): `tests/e2e/sketch-map.spec.ts` and
`sketch-map-find.spec.ts`, the map and Find; `sketch-map-layers.spec.ts`, which layer shows at
each level near, with its credits (T-044.12); `sketch-map-plain.spec.ts`, which `sketch-map`
runs with those three, the word of plain ground (T-031.8) — hidden with the national map and
with the photo, shown from level 25 on, where it lies and that it covers neither the switch,
the two steps nor the credits in windows of 1440, 1024 and 800 pixels, a click and a drag on
it, which are the map's, a corner's mark drawn over it — and **the cadastral map as empty
pictures, which states the gap** (Gotchas); `sketch-new-plot.spec.ts`, File's entry and the
marking; `sketch-new-plot-made.spec.ts`, the naming, the making — in a browser that takes no
folder (an init script takes `showDirectoryPicker` away): no order to the pad's server, the
ground asked by the page, the file offered as `plot.json` the golden file of the day and the
very text held, the pad open on the new plot, the stand-in's account: the eight GETs of the
terrain from the page, with its origin, one after the other — and what is refused, with nothing
held or offered (T-041.3); `sketch-new-plot-unseen.spec.ts`, a corner set where a picture did
not come, moved out of it; `sketch-new-plot-large.spec.ts`, a paper too large; and
`sketch-new-plot-folder.spec.ts`, **the story's end-to-end test of ST-041**, the folder way of
the making (T-041.5) — on a pad and a stand-in started by `startOwn` of `sketch-own-pad.ts`, in
`sketch-folder.ts`'s browser with its stand-in picker, its clock at noon of 2026-10-20: from the
pad's own page at `/?asks=<port>`, File, "New plot", the pentagon named `Trial slope` and made
into the folder `picked` — its `Trial slope/plot.json` the golden file byte for byte, beside an
empty `sketches/`, and the `note.txt` that lay there as it was; the pad open on the plot, held of
the folder way; and the stand-in's eight GETs of the ground, target and range, one after the
other, with the pad's origin, nothing of the person's and no other GET of the ground; no request
to anybody but the two; and `sketch-new-plot-parcel.spec.ts`, **the story's end-to-end test of
ST-043** (T-043.6), in a browser that takes no folder: `Musterlingen 1234` typed, "Find the
parcel", the map at the parcel's box, whole, and its seven corners marked as the stand-in gives
them, its area and both sentences to the letter; "Make the plot", and `plot.json` offered with
the parcel's credit and source as given, of the day, and its heights — no corner clicked — the
stand-in asked the search, the find and the terrain, in that order, and nothing else but
pictures; `Musterlingen 77`, three listed, the second picked, marked and `aria-current`; and
"Take the parcel under a click": off, a click sets a corner; on, a click marks parcel 1234 where
the map stands, with one identify asked, and a click where no parcel lies sets no corner; and
`sketch-new-plot-file.spec.ts`, **the story's end-to-end test of ST-045** (T-045.5), in a
browser that takes no folder, naming nothing of the cadastre, so that it passes in both trees:
the pentagon given as `trial-slope.geojson`, a `Feature` of LV95 with no `crs`, by
`setInputFiles` on `#file-choose`, and "Take the outline" — `The file's outline is marked: 5
corners.`, its corners to the centimetre, `file` `lv95`, `given` `true`, `on` empty, and the map
at the middle of their box, E 2 600 021, N 1 200 025.6; `file.png`; named `Trial slope` and
made, `plot.json` offered the golden `tests/__fixtures__/new-plot/trial-slope-file.json` of the
day; no request of the page with a body, and the stand-in asked the pictures of the map and the
eight GETs of the ground, and nothing else — no word of the file. **The four scripts and the
stylesheet of T-031.5 were tried broken one thing at a time**, 188 breaks: a check or a case
fails for each but two, which change nothing (ADR-0127). **So were the scripts, the
page and the stylesheet of T-031.7**, 279 breaks — 181 against the checks, on a copy outside
the repository, and 98 in place against the two browser tests of the marking: a check or a
case fails for each but two. One changes nothing that a check can tell: Find saying that the
search does not answer wherever its clock has ended. And one is held by nothing: `touch-action`
on a corner's mark, a finger's drag, which no case has (ADR-0129,
`docs/adr/ADR-0129-marking-naming-making.md`). **And the part and its rule of
T-031.8**, 32 breaks, each alone and in place: every one of the 10 of the page fails
`tools/sketch/map/page.check.js`, and every one of the 22 of the stylesheet a case of
`sketch-map-plain.spec.ts` — which alone holds the stylesheet's rule: **no fast gate does**
(ADR-0130).

## Gotchas

- **How the page is seen**: `look.js` refuses every request to another origin, the stand-in's
  too. The browser tests save nine pictures under `test-results/`: `first.png`, `near.png`,
  `found.png`; of the marking `marked.png` — the pentagon on the made-up map, with its
  paper — and `made.png`, the pad from above on the plot that was made of it; of the end-to-end
  test of ST-041 `made-folder.png`, the same plot made into a folder; of the end-to-end test of
  ST-043 `parcel.png` — the made-up parcel 1234 found, its seven corners marked and joined, its
  paper around it, the whole parcel in the map, and on the right the field, the parcel's
  sentence and `7 corners, 1201 m².`; and of the word
  of plain ground `plain.png` — the made-up map at level 26, the word under the switch — and
  `empty.png`, that page on a map of empty pictures: plain ground, the word, both credits. By
  hand: `node tools/sketch/swisstopo/stand-in.js`, then `pnpm sketch --demo` will not do — it
  has no map's page — so a pad on a port of its own, `PORT=<a free port> node
  tools/sketch/serve.js`, and the page opened at `map/index.html?asks=<the stand-in's port>`.
  Never without `asks`: that page asks swisstopo.
- **`../` from `/map/index.html` is the pad's own address**, and this page names no referrer:
  the pad shows the plot that the tab notes, else the one shown last (`tools/sketch/boot.js`).
  Under a plot's address `../` is that plot.
- **`goTo` has no caller with a place beside the sheet**: Find leaves such a place out. The
  marking is the first caller of `view()`, `placeAt` and `shows()`, and its browser test the
  first to hold them: a corner lies where it was clicked, and its mark where the view has it.
- **A key is the field's while a field has it**: `+` and `-` typed into the name, or into the
  ground around, move no map. A click on the map, or on one of its two buttons, takes the keys
  back.
- **A corner's mark reaches 6 pixels from its place, and takes the click there**: at half a
  metre a pixel no second corner is set within 3 m of one — nearer, at a tenth of a metre a
  pixel, within 60 cm. A corner that is to lie closer is set a level nearer, or set beside and
  dragged.
- **A corner dragged past the map's edge goes with the pointer**, which is the mark's until it
  is up: its place is then beside what shows. A corner off the sheet of the map is refused by
  the server, in its sentence, when the plot is made.
- **The folder that the page shows is of the list as the page opened**: another window may have
  made a plot of that name since, and a file — not a folder — of that name in the plots' folder
  is no plot, and not in the list. The answer's `id` is the plot's, and the page goes there.
- **What was said of a press goes when the plot or its name changes**: `#make-said` is of the
  last press. While a plot is being made, it stays.
- **A plot is made in its page, and goes with it** (T-041.3, T-041.4): the server makes none,
  and has no order to finish. A page that is left while the heights come keeps nothing; one
  loaded anew meanwhile has a button that is on, and a press there makes the plot anew.
- **Once a plot is made, its marks are gone**: the page goes on to the pad in its own place
  (`location.replace`), and nothing keeps a corner through a reload. A plot that was marked
  wrong is marked again, under another name; its folder is the owner's to delete by hand.
- **The plot's side is 240 pixels wide, and its words break where a font is wider** than this
  machine's: there "m of ground around the plot" stands on a line under its field.
- **The ground around is taken when the field lets a figure go** — Enter, the focus gone, a step
  of its arrows — and not at every letter: "21" is no "2" first.
- The map is plain ground for a moment between two levels; it does not turn or glide. Where the
  cadastral map has nothing, the owner has the photo — and the word under the switch says so.
- **The cadastral map can come as empty pictures, a picture each**, as it did on 2026-10-14
  between 00:10 and 00:20 UTC, by the orchestrator's look on the real services: status 200 and
  one empty picture of 334 bytes, at every level asked and in another canton too. **The page
  counts such a picture as come**: of a picture `tools/sketch/map/map.js` hears that it loaded or that it did
  not, and nothing else. So `came` counts it, it lies where it belongs with the map's own grey
  showing through, and `#said` says nothing — **what the owner has is the standing word**,
  `#plain`, and the switch that it names. **It is not asked for again while the view has it**:
  it came. It goes with its view — another level, the switch pressed, a move that leaves it —
  and is asked for anew when the view comes back; what a browser keeps of an address meanwhile
  is the browser's. **And a corner clicked on that plain ground, from level 26 on, is set, and
  is said to be marked on the cadastral map**: `on` is the layer that showed (invariant 10),
  whatever its pictures held, and the plot's credit says so for good. Whoever makes a plot on
  such a night presses the switch first, and marks on the photo. The second case of
  `tests/e2e/sketch-map-plain.spec.ts` is that night, made up — every picture of the cadastral
  map answered by the case with an empty PNG of its own making — and holds each of these as
  the page is today: **it states the gap**, and whoever closes it changes that case.
- **Closing that gap means reading a picture, which nothing here does** (invariant 3) — and one
  way that looks open is not. The page's policy names the map service for pictures alone: on a
  pad that asks swisstopo a script of the page cannot ask for a picture's bytes. On a stand-in
  it can, for there the map and the search are one origin: such a script would pass every
  browser test, and be refused on the real page. And plain ground is no failure by itself —
  the official survey is not digital everywhere — so the word says both things that it may
  mean: the page cannot tell them apart either.
- **The word stands also where the cadastral map is drawn and well**: the page does not know
  which. It covers 384 by some 46 pixels of the map under the switch — two lines in this
  machine's font, more in a wider one, and narrower and higher where the map is under 456
  pixels wide. What lies under it is reached all the same: a click sets a corner there, whose
  mark is drawn over the word, and a drag that begins there moves the map. It is under the
  switch, and not right of it, because the switch is as wide as its font makes it, and the
  stylesheet does not know that width (ADR-0130).
- **A browser draws a picture on whole pixels**: what shows lies within half a pixel of the
  arithmetic — a quarter of a metre at level 26. The map's place is the browser's own box, to
  the part of a pixel; the head and the line of `#asks` are whole pixels high. The marks are
  drawn where the arithmetic has them, to a hundredth of a pixel.
- A wheel's turn is one event, one level: a touchpad that sends many goes through them fast.
- **A search has twenty seconds** (`FIND_MS`): then the request itself is given up, Find says
  that the search does not answer, and takes the next. No second is asked while one is.
- An entity in a name, `&amp;`, shows as it is written: tags are taken out, and nothing is read.
- The server gives a file one folder deep and no deeper: the map's scripts lie in this folder.
- `tools/sketch/map/marks.js` stands at 172 lines and `tools/sketch/map/marking.js` at 196 (T-045.1; 169 since
  T-043.4 cut the marking in two), `tools/sketch/map/map.js` at 241, `tools/sketch/map/find.js` at 152, `tools/sketch/map/make.js` at 208,
  `tools/sketch/map/view.js` at 152 and `tools/sketch/map/take.js` at 189 (T-045.2), `tools/sketch/map/page.js` at 85 (T-044.10); the page at 143
  and `tools/sketch/map/map.css` at 277, counted by hand. **`tools/sketch/map/find.check.js` is full, at 299**, and
  `tools/sketch/map/take.check.js` at 275 (T-045.2); `tools/sketch/map/page.check.js`, which holds the word of plain
  ground and the parcel's parts, stands at 277.
  `tools/sketch/map/make.check.js` stands at 124 (T-041.3), `tools/sketch/map/marking.check.js` at 277,
  `tools/sketch/map/marking-parcel.check.js` at 152, `tools/sketch/map/marking-geojson.check.js` at 175 (T-045.1), `tools/sketch/map/view.check.js` at 279 (T-045.2). **The four
  browser tests of T-031.5 and T-031.7 are full**, at 297, 291, 300 and 286 (T-041.3, which moved a case of the last into `sketch-new-plot-unseen.spec.ts`), and their module
  is full too, at 300: what is tested next of this page wants a file of its own — as the word
  of plain ground has, `sketch-map-plain.spec.ts`, at 239 — and one thing more of that module
  a line made free first.
