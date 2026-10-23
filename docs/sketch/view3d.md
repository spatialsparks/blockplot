# tools/sketch/view3d

The scripts of the pad's 3D page, `3d.html`: the sketch on the ground of the plot, on a stage of
three.js — in the Volumes as coloured solids (ST-023), in White as the parts a house is built of,
white under a named sun that casts shadows, in Materials the same parts, each in its surface
(ST-024) — cut at a level, with the ground or without, from a stand or from wherever it was
turned to — with the levels left of it and, behind a button of the toolbar, Settings right of
it, where the figures the house is built with are changed (ST-029). And the house as it stands
there, saved as one 3D file for another program — and the stage as it shows, saved as a
picture. The pad's only code that imports three.js. It draws what `scene/` works out, and works
out nothing of a thing for itself.

## Public API

ES modules, loaded by `3d.html`. The head of a module is its contract; this is the map.

- `tools/sketch/view3d/main.js` — the page's entry: reads the sketch, shows its scene, says on the body what it shows; at File's Google Earth entry, `houseFile` of `tools/sketch/kml/house.js` of the scene as it stands, the site, the raise in the field and `showing.off`, what the tab has switched off (ST-038) — in every way, whole at every cut and opened along nothing — saved by `saveKml` and said as a file is said, with how many parts it holds; and the raise kept for the plot put into its field as the page opens, and kept again at each input (`keptRaise`, `keepRaise`); and what is switched off (ST-033), `showing.off`, made good by `offOf` at every reading, turned by a switch of a level, a section or a group — the scene shown anew, nothing written into the sketch, no step of Undo — and handed to the view, the panel and the switches; and the side the house is opened along (T-033.5), `showing.open`, a key of `OPENS` or `none`, picked under "Open along" — nothing written into the sketch, no step of Undo — made into `along` by `openAlong(site, on, showing.open)` of `tools/sketch/scene/shows.js` at every showing, `on` as `read` gave it last, so a slice moved in the pad moves the cut at the next reading (`watch`), and handed to the view; and full screen (T-033.6), `openFull` over the stage's place where there is a stage: `full(on)` sets `data-full`, and its picture is the panel's — one `pictured`, `stage.picture()` and `savePicture`, said on the line as File's is, which shows once the page is back
- `tools/sketch/view3d/read.js` — `read(again)`: `{ things, figures, trouble, locked, land }` — a block with its `top` where that slopes, as the pad reads it, and its `colour`, `{ name, hex }` as `paper.named` gives it — of the eleven their name and hex, of a colour of the owner's its value as both, `{ name: '#3a7bd5', hex: '#3a7bd5' }` (ST-039): a block is see-through in the Volumes where that name is `green` (`SEE_THROUGH`, `scene/scene.js`), so one in the owner's colour of green's value is solid, and with `as`, what it counts as, also where a category that was picked says so — and then under the name of that category, "Garden" or "Bathroom", on every box of the block, where every other box has its own name or none (T-028.6): no `category` is handed on; no box of a block of ground, and none of a cut (ST-028); `land`, the plot as the scene is to have it (ST-027), `landOf` of `tools/sketch/view3d/reach.js`: the pad's own site, or — where the sketch shapes the ground — that site with `ground.heights`, the paper's own grid; and where the sketch reaches past a paper worked out whole, or the paper is not (ST-042), that site with `ground: { near, far, beyond, at }`; and two more (ST-033): `sections`, the sketch's list as `sections.list` gives it, `{ id, name, hidden }` in the owner's order, and `on`, where its two slices run, `{ side, end }` by `sketch.on` — and on every thing that is handed on `section`, its section's id by `sections.of`, where it is in one, and on an object `gallery`, the name of its group of `shapes.GROUPS`: each where the page loads that reading (`sections/model.js`, `object-groups.js`, which `3d.html` loads), so a check that loads neither reads none; `groups`, the gallery's groups, `{ name, kinds }`; `watch`, `site`, `levelName`, `winds`, `seen`, `keep`, `typing`
- `tools/sketch/view3d/reach.js` (ST-042) — `reachOf({ site, paper, squares, windows }, rects)`: `{ near, far, beyond }` of the sketch's things from above, `rects` in cells — `near`, `{ rect, heights }` of each near rectangle: every footprint widened by `NEAR_M`, 20 m, those that overlap or touch made one (`windows.around`), not cut to the paper, and the paper itself where `paper.WHOLE`, `heights` its every grid point by `paper.groundAt`; `far`, `[c0, r0, c1, r1, h00, h10, h01, h11]` of each far square, corners in cells and heights by `paper.groundAt` — on a paper that is not whole the squares of its tree (`squares.walk`), beyond the paper squares of their own on the grid of powers of two, each drawn whole where it overlaps no near rectangle and its side is at most `FAR_SHARE`, a sixteenth, of its distance from the nearest, else cut into quarters, down to a cell; together they fill the rectangle that holds the paper and every near rectangle; `beyond`, how far that rectangle reaches past the paper, in whole metres, rounded up — and nothing near, nothing far and 0 where the paper is whole and every rect lies on it. `landOf(pad, rects)`, the land `read` hands on: the site as before where nothing is near or far, else with `ground: { near, far, beyond, at }`, `at` the paper's `groundAt`. It names no global: read.js hands it the pad's scripts
- `tools/sketch/view3d/read.js`, the one writer — `typed(name, text)`, `usual(name)`: a figure into the sketch, or why not, in words; `FIGURES`
- `tools/sketch/view3d/settings.js` — `openSettings(listed, asked)`: `shows({ figures, locked })`; `rowsOf(listed)`, what is said of each figure
- `tools/sketch/view3d/showing.js` — `WAYS`, a row a way: `parts`, `white`, `sun`; the cuts and a step, what a tab kept — `keptOf`, with `off`, what is switched off, three lists each of what is of its form: a section an integer or `'none'`, a level a number, a group a text — and `offOf(off, scene, sections)`, that less a section the sketch no longer lists, `'none'` where it lists none, and a level the scene no longer has; `switchable(groups)`, the groups that have a switch, every one but one that holds a door, a window or a staircase — five of the six; the stands; `keptOf`'s `open` (T-033.5), the side the house is opened along — one of `OPENS` of `tools/sketch/scene/shows.js`, and `CLOSED`, `'none'`, for whatever is none of them; `opensOf(winds)`, the rows of "Open along", `{ open, name, title }`: "None" first, then `front` "Front", `back` "Back", `side` named by the left stand's wind and `far` by the right's, as `standsOf` names the stands, each titled "Along the slice of the front view: what lies between it and the front is taken away" and so on; `lineOf(...told)`, what the page's line says: rules with no page
- `tools/sketch/view3d/view.js` — `openView(stage, look, sun)`: `show(scene, { cut, ground, way, shadows, off, along })` — what `shownBy` of `tools/sketch/scene/shows.js` gives stands there, the parts built anew where the cut or `off` changed since the last, the land whatever is off; and with `along` (T-033.5), what `openAlong` gave or null, all that stands cut by its plane (`tools/sketch/view3d/sliced.js`), and the stage handed that plane by `stage.cut(plane)` where it changed — so a made-up stage that never sees an `along` needs no `cut` — `stand`, `looking`
- `tools/sketch/view3d/switches.js` — `openSwitches(asked)` (ST-033): fills `#switches` and gives `shows({ sections, groups, off })` — a row a section in the list's order and "No section" last, or, with none, no row and the quiet line `#switch-sections-none`; a row a group; each a checkbox in a `label` whose `title` is its name, off where `off` says; a switch turned asks `asked.section(id, on)` — `'none'` for "No section" — or `asked.group(name, on)`, once. Its second argument, `opens`, the rows of `opensOf` (T-033.5): made once, under the objects, a heading `#switch-opens-title`, "Open along", and a list `#switch-opens`, a `button[data-open]` a row — its key, or `none` — saying its name and in full by its title; a click asks `asked.open(key)`, once, and `shows({ …, open })` presses that one, by `aria-pressed`, and no other
- `tools/sketch/view3d/full.js` (T-033.6) — `openFull(place, asked)`: full screen over `place`, the stage's element. It makes there `#full-corner`, a small panel with two buttons, `#full-picture`, "Picture", and `#full-back`, "Back", each with its title; hears `#full-screen` of the toolbar, Escape and the browser's `fullscreenchange`; and gives `{ on() }`, whether the stage is alone by now. A click on `#full-screen` asks `asked.full(true)` once and, in the turn of that click, the browser's full screen for the page's root (`requestFullscreen`), whose refusal it takes quietly: the stage stays alone in the window, and nothing is said. Back, Escape and the browser leaving its full screen each ask `asked.full(false)` once, and leave the browser's full screen where the page still has it; where the page is not alone none of them asks anything. "Picture" asks `asked.picture()`. It decides that alone, and nothing of how it looks
- `tools/sketch/view3d/sliced.js` (T-033.5) — the house opened along a slice: `planeOf(along, place)`, a three.js `Plane` from `{ axis, at, keeps }` through the frame, its normal into the half that is kept — or null; `opened(what, plane, land)`, every material of `what` cut by the plane, its shadows too (`clipShadows`), or by none where it is null; a mesh that hides what is behind it, and is drawn from its outside alone, gets a child `inside` — its own shape, its far faces in `POCHE`, cut by the same plane, casting no shadow — and of `land`, `{ ground, hill }` of `build.js`, the ground a child `earth cut`, `capOf(ground, plane, base)`: the line where the plane runs through the ground, straight across a pit, down to the hill's base, a millimetre into what is kept, in `POCHE` from either side, drawn after the earth and writing no depth; each taken away at the next call. `POCHE`, `#3b4148`, the dark of a cut, set by eye
- `tools/sketch/view3d/build.js` — `build(scene, place, way)`: the land, and in the Volumes a solid for each thing — a block whose top slopes as what lies under that top, from its foot up to it
- `tools/sketch/view3d/meshes.js` — `meshesOf(parts, place, { sun, white })`: the parts, a mesh a surface, each in the face of its surface — the house's own with its surface's pattern, where it has one — or all in one white; `stands(part)`
- `tools/sketch/view3d/patterns.js` (ST-033) — `PATTERNS`, a row a surface of `SURFACES`: `{ kind: 'joints', long, wide, joint, stagger, dark }` for wood, stone and concrete, `{ kind: 'spots', cell, spot, shade }` for grass, and `{ kind: 'none' }` for the ten others, in metres and shares; `coverOf(row)`, the share of a face that its joints or spots take; `patterned(surface)`, `null` for a plain surface, else `{ key, vertex, fragment }` — the key of its program, and two functions from three.js's own shaders of its standard material to the same with the pattern in. Text and figures: it imports nothing
- `tools/sketch/view3d/shapes.js` — `shapeOf(part)`, of every shape a part can say: a `slant`, what slopes, among them
- `tools/sketch/view3d/file.js` — `save(meshes, now, page)`: the meshes of the stage saved as `nameAt(now)`, `house-<day>.glb`, and a promise of `{ words, wrong }` for the page to say; `houseOf(meshes)`, what the file holds of them; `bytesOf(meshes)`, the binary glTF. And of a picture of the stage (T-029.5) — `savePicture(picture, now, page)`: what the stage gave, a PNG as a Blob, handed to the browser as it is under `pictureAt(now)`, `house-<day>.png`, by the link that a file is handed over by — and `{ words, wrong }` at once: saved, or, of null, that the browser gave none. And of the Google Earth file (T-016.4) — `saveKml(file, now, page)`: what `houseFile` gave, its text handed to the browser as a Blob of `application/vnd.google-earth.kml+xml` under `kmlAt(now)`, `house-<day>.kml`, by that link — and `{ words, wrong }` at once: `Saved as house-<day>.kml, where this browser saves its files. It holds <n> parts of the house.`, its `parts` — `1 part` where it is one (ST-038); of `{ text: null }` `No Google Earth file was saved: nothing of the house that is switched on stands above the ground.`, nothing wrong; of `{ unraised }` `No Google Earth file was saved: the raise is no number of metres.`, of `{ failed }` `The Google Earth file was not saved:` and its sentence, and of `{ refused }` its sentence — each wrong
- `tools/sketch/view3d/lights.js` — `openLights()`, which gives `{ lights, shine, backdrop, sky }`: `sky`, the dome of the sky, is among `lights` too, and `shine(sun)` says whether the sun casts its shadows; `lightOn`, `SUNLIT`, `TOLD_APART`: the light a white face gets; `SURFACED`, `IN_SHADE`: the softer pair for a house in its surfaces; `BACKDROP`, one for each of the three; `SKY`, `{ horizon, zenith }`, and `skyAt(up)`, the sky's colour where a point of the dome stands so high (ST-033)
- `tools/sketch/view3d/stage.js` — `SIGHT_M`, how near and how far the camera sees at the least; `sightOf(box)`, how far it sees where `box` holds all that is drawn — twice across it, and never less than `SIGHT_M` (ST-042); `openStage`: the stage, with `sight(box)` among what it gives — the camera's far set by `sightOf` — and `picture() — a promise of the stage as it shows, a PNG as a Blob with a pixel for each of the canvas's own, or of null where the browser gives none: it draws, and asks the canvas before that turn ends (Gotchas); where the sun casts its shadows a drawing has its corners shaded, over it. `UNDER`, the layer of what lies under the ground to close it — the skirts (`build.js`, ST-042): the stage's camera sees it, and the shade in corners does not (Gotchas). `CORNERS`, `{ reachM, strength }`, the shade in corners; `cornersOf(renderer, scene, camera)`, that shade made once — `shade()` — the scene drawn with the camera blind to `UNDER`, and the camera given it back —, `setSize(width, height)` in the canvas's pixels, `cut(plane)`, the plane on `GTAOPass`'s own `normalMaterial`, or none — exported for its check; the stage's `cut(plane)` is that one (T-033.5), and its renderer has `localClippingEnabled`; `tools/sketch/view3d/frame.js` — `frameOf`; `tools/sketch/view3d/fit.js` — `fitted`; `tools/sketch/view3d/panel.js` — `openPanel`: each level's row a checkbox after its button, named by the level's name, which asks `asked.level(level, on)` — "All" has none — and `shows({ …, off })` marks them by `off.levels` (ST-033); `shows.stood(stand)` (T-000.23) marks that stand by its `data-stand` with `aria-pressed="true"` and the four others `"false"`, `null` none — it decides nothing: `tools/sketch/view3d/main.js` says which

On `document.body.dataset`, for a test and for `pnpm sketch:look`: `three`; `solids`; `beyond`, how
far beyond the plot's paper the ground drawn reaches, in whole metres, `0` where it reaches none
(ST-042); `stage`,
`drawn` or `none`; and where there is a stage `way`, `shadows`, `level`, `ground`, `shown` — the
solids that show at the cut with the switches (`shownBy`) — and `parts`, the parts on the stage:
0 in the Volumes; and `open`, the side the house is opened along, a key of `OPENS`, or `none` (T-033.5); and `full`, `on` while the stage is shown alone, full screen, and else `off` (T-033.6) — not kept: a reload opens the page as it is, for a browser gives its full screen only at a click. In words: `#said`
— of the sketch, and after that of what was saved last, a file or a picture, or why none was.
Beside the stage, two sides (T-029.5): left of it `#side`, 200 pixels wide — `#levels-title`,
`#levels`, and under them `#switches` (ST-033): `#switch-sections-title`, "Sections",
`#switch-sections`, `#switch-sections-none`, "The pad's page makes sections.", shown where the
sketch has none, `#switch-objects-title`, "Objects", and `#switch-objects`, and after them `#switch-opens-title`, "Open along", and `#switch-opens`, `button[data-open]` a row, which `switches.js` makes (T-033.5) — whose look is
`tools/sketch/view3d/side.css`'s, which `3d.html` links after its own styles, and which holds
File's Google Earth rows too; right of it `#settings`, the figures, 260 pixels wide and hidden
until the button `#settings-open` opens it: a button of the toolbar itself, after `#with` and
before `#title`, in no group — and after it `#full-screen`, "Full screen", a square in no group
too, hidden until there is a stage, its drawing four corners (`icons.css`). Pressed, the page
shows the stage alone: `body[data-full='on']` hides the header, `#said`, `#side` and
`#settings`, and the stage is the whole window — or the screen, where the browser gives its
own — with `#full-corner` at its top right, a small panel as a menu floats, and in it
`#full-picture` and `#full-back`: its look, and the name of the plot's 4em at the least on
this page, are `side.css`'s, as are the figures' since T-033.6. Of Settings:
a row `#figures li[data-figure=<name>]`, its field `#figure-<name>`, what is refused
`.refused`; why nothing can be changed, `#settings-said`. The file is an entry of the File
menu (T-029.2): `#save`, "3D file (GLB)", in `#file-entries`, the part that the button
`#file-menu` of the toolbar's first group, `#file-group`, opens — the pad's own `views.menu`
makes that menu, as on the pad's page. The entry is off, `disabled`, where the way shows no
part of a house, and the line under it, `#save-why`, then shows and says why; in White and in
Materials it is on, and the line hidden. It is no longer marked `away`: the switch of the
shadows alone is, where the way has no use for it — and `#file-group`, by the page, until
there is a stage. And the picture is the entry before it (T-029.5): `#picture`, "Picture
(PNG)", on in every way of showing — the Volumes too — which no way turns off or marks.
After the 3D file and its line, the Google Earth file (T-016.4): `#earth`, "Google Earth file
(KML)", on in every way and at every cut — the file is the parts that White builds of the
house's blocks above the ground, less what is switched off, whole at every cut and opened along
nothing, whatever way the stage shows (ST-038) — titled so, and off where the plot says no place, `originLV95`, with the line under it,
`#earth-why`, as `#save-why` stands under its entry: "This plot does not say where it lies in
the national grid, so it makes no Google Earth file." Under them a row, `#earth-row`, a label:
"Raise in Google Earth", the field `#earth-raise` — text, `inputmode="decimal"`, five wide —
and "m — tuned by eye". A key typed there is the field's (`typing`). What is typed is kept by
the browser, where it is a number, for the plot (`tools/sketch/kml/house.js`), and is in the
field the next time the page opens on it; it is no design figure, and nothing writes it into
the sketch or the plot. `tools/sketch/view3d/panel.js` hears both — `asked.earth()`,
`asked.raise(text)` — and `shows` says `placed`, and `shows.raised(text)` puts a kept raise in
the field.
**The look is the pad's one look** (T-029.6, `docs/sketch/pad-api.md`), and no module here says any of
it: a way and a stand are squares with a small drawing over their word, `button[data-way]`
and `button[data-stand]`, each group of them a track; the way that shows has the ink, by its
`aria-pressed`, and so has the level that shows, and Settings and File while they are open,
by `aria-expanded`. **A stand has it while the view is at it** (T-000.23), by `shows.stood`, which
`tools/sketch/view3d/main.js` calls: the stand clicked; Front as the page opens with no look kept
for the tab, and none where it opens on a kept look, a place and not a stand; and none from the
moment a hand moves the view — a `change` of the stage's controls between their `start` and
their `end`, by a drag, a drag with the right button or the wheel. A stand is a place to look
from, which the next drag leaves, and the mark with it; a click on the stage that moves nothing,
and what moves no camera, leave it. A figure's field is a quiet band, and "Default" a
word that is faint where the figure is its default.

## Units and frame

Metres, y up: the plot's x, y and height are three.js's x, −z and y, counted from the lowest
point of the page's first scene (`tools/sketch/view3d/frame.js`, ADR-0068). The front, downhill, is the large x.
A file of the house has that frame, its zero and all: it is glTF's own — metres, y up.

## Invariants

1. The stage draws when something changed, once a frame, and never in a loop — and once more
   where a picture of it is asked for, at that click and not at a frame (Gotchas). A drawing
   is one picture: the canvas is emptied once for it. Where the sun casts its shadows — White
   and Materials, with "Shadows" on — the shade in corners is worked out in three.js's own
   pictures and laid over that drawing, which it darkens and never lightens, and the canvas is
   not emptied again (ST-033). Elsewhere a drawing is as it was, to the pixel.
2. Where nothing can be drawn the page says so in words, and has the switch of views and no
   other control: File is not seen there, and keeps its place — so the switch stands where it
   stands with a stage, and where the pad's own page has it — and the button of Settings, the
   levels' side and the figures' are hidden, as the groups of a stage are: no Settings, no
   levels, no entry (`sketch-3d-header.spec.ts`) — and no full screen: `#full-screen` is hidden
   with them (`PLACES`), and nothing hears it.
3. It holds no design data, and of the sketch it writes one thing: a figure of the house, typed
   in Settings or set back by "Default" — through `tools/sketch/view3d/read.js`, by the pad's own `sketch.change`
   and `figures.set`, into the sketch the browser keeps at that moment, and never over one that
   cannot be read. A figure the browser did not keep is not shown. What the tab shows it keeps
   through the pad's `views` — the switches of a section, a level and a group among it, and the side the house is opened along (ST-033):
   a switch writes nothing into the sketch, is no step of Undo, and another window has its own;
   a section or a level that the sketch no longer has is forgotten. Read again, the pad's `sketch.doc` is the sketch that was read.
4. `tools/sketch/view3d/read.js` alone names the pad's globals and the browser's stores, and so alone writes the
   sketch; this folder alone imports three.js. `tools/sketch/view3d/rules.check.js` holds all of it.
5. A change of the sketch moves no camera, and a page has one frame. Nor does a change of the
   stage's size move one — a window made larger, the page's line come, Settings opened or shut
   (T-029.5), full screen begun or ended (T-033.6): the stage is drawn again at its new size, at once, by the observer it has, and
   the view looks from where it looked — as high as it was, and taking in more or less at its
   sides.
6. A cut at a level shows a thing whole or not at all, and so does a switch (ST-033): what it holds goes
   whole — a block with what stands in it, a block that reaches through levels with the level of
   its floor — and the ground and its outline stay. In White and in Materials the thing is a
   part, none has a line, and what stands there is what `shownBy` gives: a few meshes, built
   anew for a cut or a switch. In White every part is white. **A cut along a slice cuts through**
   (T-033.5): the house opened along a side's slice is cut by a plane of three.js, on every
   material of what stands — a part, a solid, its lines, the hill and its outline, never the
   sky — in every way of showing and in every pass: the canvas, the shadow map, the shade in
   corners. What the plane opens of a mesh that hides shows its inside, dark, `POCHE`; the hill
   shows a flat dark face where it is cut. Nothing is built anew for it, and no camera moves.
7. In Materials a part has the face of its surface, made once: the colour and the roughness that
   `scene/surfaces.js` says, no metal, see-through by what the surface does not hide — and no
   image (ST-024, rule 6): no module here names a texture, a loader or an `Image`, or gives a
   face a map, and `tools/sketch/view3d/rules.check.js` refuses a line that does. **On the house's own parts** — a
   floor, a wall, a roof — a face of wood, stone, concrete or grass has a pattern too (ST-033):
   planks, tiles, panels, spots, worked out in the shader from where a point lies and the way
   its face looks, with no image, and taking less than a third of the face, so that the
   surface's colour stays the commonest colour of it (`tools/sketch/view3d/patterns.js`). What stands in the house — a
   piece of an object, a step — has a second face of its surface, a step behind in the depth
   and plain: where it lies in one plane with a wall or a floor, the house shows. **The sky** over
   Materials (ST-033) is colours worked out by code too: a dome around the camera, a colour a
   point by how high it stands — `SKY.horizon` at and under the horizon, `SKY.zenith` straight
   above, blended upward — lit by nothing, casting and taking no shadow, and no thing of the
   house: no part, not counted, not saved, not cut. White and the Volumes have no sky, and
   `BACKDROP.surfaced` lies behind the dome.
8. What is drawn is what is saved (ST-024, rule 7). A file of the house holds the meshes of
   the parts as they stand at the click — `tools/sketch/view3d/main.js` hands `tools/sketch/view3d/file.js` those, and nothing else of
   the stage; and whole, where the house is opened along a slice: the plane is the stage's, a
   dark inside is a child of a part's mesh and no part, and the file's faces are its own — each point where the stage has it: metres, y up, from the stage's own zero. A
   mesh a surface and a material a surface, under the surface's name; in White one `white`,
   and glass. No ground, no outline, no solid, no light, no camera, no image. `tools/sketch/view3d/file.js` makes
   a scene of its own for it and leaves the stage's meshes as they are; the page writes the
   file itself and asks nobody; and nothing reads one back. **A picture is the stage as it
   shows** (T-029.5), where a file is the parts alone: the canvas's own pixels at the click,
   one of the picture for each — the backdrop or the sky, the hill with its outline where the
   ground is on, the solids or the parts, their shadows and the shade in their corners, at the cut and from where the view looks, in
   whichever way — opened along a slice where it is. Nothing of the page is in it — no toolbar and no menu — and it is no
   picture of another size than the stage. The page asks nobody for it either: the canvas
   writes it into the page's memory, and the link that hands over a file hands it over.
   **The Google Earth file is the White model's parts**, not the stage (ST-016, ST-038): the
   parts that White builds of the blocks of the scene above its ground, less what the tab has
   switched off — a section, a level, a group — in every way, whole at every cut and opened
   along nothing, at the plot — what `tools/sketch/kml/house.js` writes of the scene, the site
   and `showing.off`, handed over by the same link, the line saying how many parts it holds.
9. The header is as high in every way of showing, and a line of it — and of `#said` under it —
   a whole number of pixels: 68 for a line of the header, 54 for the controls of a group and
   14 for the small word under them (`frame.css`, which this page shares with the pad's
   own, T-029.6), and 18
   for a line of `#said`. So the stage begins on a pixel of the screen, and a picture of its
   canvas is the canvas's. The header is five groups in this order, then one button that
   stands in no group, and the name of the plot after them (ST-029): File, `#file-group`,
   one button that opens its menu, and View,
   `#view-group`, with the switch — the first two, as on the pad's own page, and at the same
   pixels — then `#ways`, "Shown as"; `#stands`, "Seen from"; its tail, `#with`, "With":
   the switch of the ground and the switch of the shadows, the two switches and nothing else;
   and Settings, `#settings-open` (T-029.5), a direct child of the header: a square as a
   group's are, which stands on the line of the controls by its margins — 2 pixels over it
   and 16 under, where a group has its word: a line is 68 pixels with it too, and it shows
   in every way. Then Full screen, `#full-screen` (T-033.6), the same: two buttons in no
   group, Settings first.
   A group is named by its label, which the stylesheet writes under it — File by its button,
   with no word under it; it is as high whatever it holds; and the header breaks between its
   groups and never inside one. A control that a way has no use for keeps its place, unseen:
   the switch of the shadows, beside the switch of the ground, which always shows — so no
   line of the header is empty. The entry of the file keeps no place: it stands in File's
   menu, which takes no room of the header, open or shut, and is off where a way has no use
   for it (T-029.2). With holds nothing but controls of a stage: until there is one it is
   hidden, word and all (`PLACES` of `tools/sketch/view3d/panel.js`) — and so are the buttons of Settings and
   of Full screen, places of that list too. File is not seen until then, and keeps its
   place: `3d.html` marks `#file-group` as `away`, and `tools/sketch/view3d/panel.js` takes the mark off.
10. One ground (ST-027, rule 2). The hill, the outline on it, where an object on the ground
    stands and what a rule of the scene asks as the ground are the pad's one ground, as the
    blocks of ground of the sketch shape it and its cuts take it away: `read` has the paper
    settle it at every reading,
    before it reads a thing, and hands the scene the grid that the paper holds — itself, the
    one the slices are drawn by — where the paper is worked out whole and nothing reaches past
    it; elsewhere the near grids and the far squares of that same ground (`tools/sketch/view3d/reach.js`, ST-042), every
    height of them the paper's `groundAt`. Nothing here works out a height of the ground, and nothing
    writes into that grid. A block of ground is the hill where it lies and no thing of the
    scene: no solid, no part, no level, and no hole in the hill. Neither is a cut (ST-028), a
    block that takes ground away: `read` hands on no box of one, whether a box of it says so,
    its category or its name — so it is no solid, has no wall and no roof, and gives no level.
    It is the hill where it bites, and nothing at all where it does not: no module here, and
    none of `scene/`, changed a line for the ground under a cut.
    The pad's own site is never
    changed: `site` is the plot with its own ground, `land` the plot of a reading.

## Test

`pnpm sketch:check` runs every `*.check.js` here, in Node, on made-up things worked out by hand:
the head of each says what it holds. `tools/sketch/view3d/reach.check.js` holds the ground of a
large plot and beyond the paper (ST-042): on the made-up plot every golden sketch's land, scene
ground and meshes as they were; one box at columns 148 to 198 and rows 16 to 46, by hand — two
near rectangles, the box's of the ground at the paper's downhill edge at every grid point, none
under the box, `beyond` 73, flat far squares between, the far squares and the near rectangles
filling all that is drawn, earth lighter beyond the paper, the sight past the far squares, the
hill only the box's pit's 160 walls and the base, and on the stage the skirts the hill's child,
behind the ground and on `UNDER`, where the hill lies ahead; a
made-up plot of version 3 of 1 km, `squares.check.js`'s rough hillside, with a house of two boxes:
every far square at `paper.groundAt`, none on the near rectangle, none larger than a sixteenth of
its distance but a cell, under 600 000 triangles, built in Node in under a second; and blocks
1 km apart, two near rectangles. `tools/sketch/view3d/tops.check.js` holds a top that slopes all the way: read
with its block, said by its solid in metres, and built in the Volumes — what `tools/sketch/view3d/read.check.js` and
`tools/sketch/view3d/build.check.js` had no room for. `tools/sketch/view3d/read.check.js` holds, last, two blocks in
colours of the owner's, `#3a7bd5` and green's value, `#5a9e4b`: each handed on as
`{ name: value, hex: value }`, and each solid in the scene (ST-039). `tools/sketch/view3d/made-up.check.js` holds the made-up house of the browser
tests with every rule there is, and by hand: its file against its file of version 3, its
porch of sloping glass, its bath under a sloping roof, the door into the bath, its two
staircases — and its lawn, the one block of ground (ST-027), both views' work together on
the house every test sees: the page names `earth.js`; two things fewer are handed on than the
file has, and neither the lawn nor the cut is one; 35 solids on the levels at 817 m and
814 m; the plot
that is handed on says 814 m at the lawn's 195 grid points and the site's very number inside
every box of the house; ground is drawn in the lawn's 168 cells; the tree's floor is row 24;
the garden has a railing along a part of its downhill edge, and no longer along all of it;
and `amiss` finds nothing, at the file's figures and at changed ones.
`tools/sketch/view3d/made-up-cut.check.js` holds the cut of that house (ST-028), what `tools/sketch/view3d/made-up.check.js` had no
room for, loaded the same way and by hand: the file's text without its lawn, its cut, its
slopes and its wide staircase as its file of version 3 — the three lines that
`check-blocks.js` held, whole; the block as the pad reads it, a cut by the category that was
picked for it, with "Ground cut" for the paper, the fifth block on the level at 814 m; what
is handed on, two things fewer than the file has, 35 solids on the two levels, the tree's
floor in row 24; the plot that is handed on, the paper's very grid — 814 m at the cut's 252
grid points and at the lawn's 195, the site's very number on row 10 from column 30 to 50 and
at the 487 grid points inside the house, and **along the side of the day rooms, row 22, their
floor**, where the hill stood 2.56 m to 0.56 m up their wall; ground in the cut's 240 cells,
no solid with its box and no part in it; nothing amiss. Then read again: without the block,
the same 35 things but for where the car stands, on a ground that lies under the site's at
none of those 252 points; and with the block's category taken out, a room — the 36th thing
and solid, with a floor, walls and a roof, no ground in its cells, and the site's very number
between it and the day rooms.
`tools/sketch/view3d/earth.check.js` holds the shaped ground as the page reads it (ST-027), with the
pad's scripts read off `3d.html` and a sketch of its own, by hand: a room, a garden of open
air, a block of ground against the garden's downhill edge and a tree on it — every thing but
the block is handed on, with the plot and the paper's very grid; the tree stands on the
block's top; the block is no solid, has no part, gives no level and cuts no pit; the garden
has no railing along the edge that the ground was brought up to, and one along all of it
without the block; then the sketch read again — a metre lower, the block taken out, the block
off the plot, two boxes that are ground by their name, what is no sketch, the block set to a
room — and of `tools/sketch/view3d/main.js`, which no check loads, the text: it builds its scene of `land`.
`tools/sketch/view3d/earth-cut.check.js` holds a cut and a picked category as the page reads them (ST-028), with
the pad's scripts read off `3d.html` — `categories.js` in the line before `blocks.js` — and a
sketch of its own, by hand: a room, a cut against its side that says so itself, one by the
category that was picked for it, one of two boxes by its name, and a block with no name whose
category is `balcony`. The room and that block are handed on, the block as open air and under
the name of its category, "Balcony"; no box of a cut is: the scene has two solids and one
level, no part in the box of a cut, and ground in every cell of each. Read again with a cut
set to a room, and one set to open air against its category, those are handed on as that.
And the ground under a cut (T-028.4), read again on the room and the garden of
`tools/sketch/view3d/earth.check.js`: a cut against the room's side, down to the room's floor; one against the
garden's uphill edge, a metre under its floor; and a tree in the first. Three things are
handed on, and the plot with the paper's very grid — 814 m at the 77 grid points of the
first cut, 813 m at the 63 of the second. **The wall shows down to there**: along the room's
side the ground is the room's floor, where the hill stood 1.6 m to 2.6 m up it. The tree's
floor is row 24; the scene has three solids, one level, no part in the second cut's box and
the tree's alone in the first's, ground in every cell of both, and nothing amiss; and the
garden has one railing along its uphill edge, by hand — and none with the cuts taken out,
where the hill meets its floor and the plot is the pad's own site. With the first cut's floor
a metre up the ground is 815 m along the room, and with that cut set to a room it is a solid
with a floor, walls and a roof.
`tools/sketch/view3d/picked.check.js` holds what the scene reads off a picked category (T-028.6), with the pad's
scripts read off `3d.html` and sketches of its own, by hand: eight boxes read with their
picks and again with none — every thing that is handed on, whole, and the field of every
floor in the parts of both scenes; every row of the list typed in under what its floor is
made of, the ground's two under none; a flight whose sixteen steps stand on the slab where
its second room was picked a staircase, part for part as where it is named one, and
seventeen parts where it says neither; the made-up house under the names of its file; and
`tools/sketch/view3d/read.js` loaded while the page has no list. A row added, or a name reworded, turns it red.
`tools/sketch/view3d/file-bytes.check.js` has a roof that slopes and a pane that comes down to an edge
in its room: the corners of both by hand. `tools/sketch/view3d/rules.check.js` reads every script of `scene/` as well,
its checks with them, and refuses the text of an import of three.js there, in a comment too.
Of the patterns (ST-033, T-033.3): `tools/sketch/view3d/patterns.check.js` holds a row for every surface and no
other, wood, stone and concrete in joints and grass in spots and the ten others plain, what
makes planks, tiles and panels of them, every figure above nought, `coverOf` by hand for wood
and grass — and under a third for every row — a program a pattern, and what a pattern puts
into three.js's own shaders as installed: after `common`, `begin_vertex` and `color_fragment`,
every line of three.js kept in its order, `fwidth`, no word of an image and no sampler; and a
shader without those lines refused. `tools/sketch/view3d/meshes.check.js` that the house's own floor of wood has
its pattern, and what stands in the house, a pane and White none. **No check compiles the
shader or looks at a pattern**: that is a look's, and the browser's.
Of the switches (ST-033): `tools/sketch/view3d/read-sections.check.js` reads
`tests/__fixtures__/sketch/every-part.json` with every script `3d.html` names, by hand — the
studio's and the workshop's boxes and their six objects in section 1, the cellar, the person and
the bush in none; the sink a kitchen's, the bed furniture, the person among people and cars; the
two sections, "Yard" hidden; the slices at row 20 and column 30; the six groups, five with a
switch; and with section 1 off the cellar, the person and the bush alone. `tools/sketch/view3d/showing.check.js` holds
`keptOf`'s `off`, what is of the wrong form dropped, `offOf` and `switchable`;
`tools/sketch/view3d/switches.check.js` the two lists on a made-up page, "No section" only where
sections are, the quiet line where none are, and a turn that asks once;
`tools/sketch/view3d/panel.check.js` a level's switch, and `stood` (T-000.23): the stand it is told
marked and no other, `null` none, a second `stood` moving the mark; `tools/sketch/view3d/view.check.js` that what is
off is not shown, and that the parts are built anew for it; `tools/sketch/view3d/rules.check.js` that `read.js`
alone takes `sections`, and asks it `list` and `of` alone, and of the sketch `on` but no `shows`.
Of the house opened along a slice (T-033.5): `tools/sketch/view3d/sliced.check.js` holds by hand the plane of
`{ axis: 0, at: 12, keeps: -1 }` and of `{ axis: 1, at: 3, keeps: 1 }` through a made-up frame, a
point on either side of each; every material of a solid, a see-through solid and a line cut
and casting cut, a dark inside for the solid alone, each call's insides alone, none with no
plane; and the view — the plane on every material that stands, the stage handed it once until
it moves, the sky not cut, the file's meshes no inside, the earth closed by a face of 12 m²
worked out by hand, no camera moved, and none of it once closed. `showing.check.js` holds
`keptOf`'s `open` and `opensOf`; `switches.check.js` the list, one pressed at a time;
`stage.check.js` the plane on the shade's own material, and none. What it looks like is a
look's; `sketch-3d-show.spec.ts` opens it along the front, in the story's one end-to-end test.
Of full screen (T-033.6): `tools/sketch/view3d/full.check.js` holds, on a made-up page as
`panel.check.js` makes one, the corner's two buttons with their titles in the stage's place; a
click on `#full-screen` that asks `full(true)` once and the browser's full screen once, and a
second click nothing; Back, Escape and the browser leaving its full screen that each ask
`full(false)` once, the browser's full screen left only where the page still has it; a refused
full screen still alone, with nothing gone wrong, and a browser with none to give the same; and
Escape, Back and that leaving asking nothing where the page is not alone. `panel.check.js` that
the button shows once the controls open. `tests/e2e/sketch-3d-show.spec.ts` is ST-033's one
end-to-end test (`docs/sketch/pad-test.md`): Materials, "Atelier "Süd"" off — `data-shown` 12
to 3, by hand — open along the front, Full screen, its Picture as large as the canvas, Escape
back as it was, and nobody asked.
Of the soft light (ST-033): `tools/sketch/view3d/lights.check.js` holds the dome — shown where the house stands in
its surfaces, with or without the shadows, and nowhere else; lit by nothing, casting and
taking no shadow, drawn before all else and over by it — that `shine` says whether the sun
casts, and the shadow's soft edge, 3 points of its map. `tools/sketch/view3d/surfaced.check.js` holds `SKY` and
`skyAt` by hand, and plaster and a roof told from `BACKDROP.surfaced` and from every colour of
the dome by the step, at whatever angle the sun meets them; `tools/sketch/view3d/materials-view.check.js` that the
dome shows in Materials and is no part. `tools/sketch/view3d/stage.check.js` holds the shade in corners with no
browser: its addons under their names; that it draws the scene with the camera blind to
`UNDER`, and gives the camera it back; its reach, its strength — more than none, no more than
all — and the noise it smooths by, the same at every load; a blending that takes a colour
times the share and never lightens, and keeps how opaque a pixel is; and, by a made-up
renderer, that it draws into its own pictures and onto the canvas once, last, without
emptying it. In the browser, `-materials` holds the front view's top left corner to a colour
between `SKY.horizon` and `SKY.zenith`, in red, in green and in blue, and `-slopes` counts as
the backdrop in Materials every pixel between those two, as near as 2 of 255.
Of the picture (T-029.5), `tools/sketch/view3d/file.check.js` holds the saving on its made-up page — the name by
its day, the one link, clicked once, the very Blob that the stage gave, the words, the memory
given back; and of null, nothing saved and the words that say so — and `tools/sketch/view3d/panel.check.js` that
a click on the entry asks for a picture, once, that no key does and no way turns the entry
off, and that the button of Settings shows once the controls open — and of the Google Earth
file, that a click on its entry asks once, that it is off with its line where the plot says no
place, in whichever way, and that a text typed in the raise is handed on as typed
(`tools/sketch/kml/house.check.js` and `white.check.js` hold the file itself, the switches
among it; that the page hands its switches over, and the line's count of parts, are
`-kml`'s, below). **No check draws a
stage**: `stage.picture` itself is the browser's to hold.
The browser's are `tests/e2e/sketch-3d*.spec.ts` — the page, and `-scene`, `-controls`,
`-stands`, `-ways`, `-parts`, `-backdrop`, `-settings`, `-materials`, `-file`, `-header`,
`-slopes`, `-ground`, `-cut`, `-picture`, `-kml` — ST-038's main path, a level switched off
among it — and `-show`, each saying in its head what it holds — by `pnpm
e2e:sketch`,
which binds port 4765. Which place of this page holds which control — the five groups of the
header by their names, File and View first, Settings after them, the levels in the left side
and the figures in the right — is `tests/e2e/sketch-frame.spec.ts`'s, with the
pad's own page (ST-029). `-picture` is the picture that File saves (T-029.5), in the Volumes
as the page opens and in White: a PNG under the name of the day, which the page says on its
line; as wide and as high as the canvas has pixels; **and the stage as it shows — held
against the picture that the test takes of the canvas**, by the pixels of both: none of
670 680 was another, here, when the stage of the tests' window was 621 pixels high — it is
641 since the look of T-029.6, and 692 280 pixels; in White another picture than in the
Volumes; no request, no error, and the policy as it was. The look itself — the ribbon of
squares, the three tracks, the ink for what is chosen, the ring of the keyboard, the words
on their grounds — is `tests/e2e/sketch-look.spec.ts`'s, with the pad's own page
(T-029.6). `-header` holds the two entries of File, the picture on in
every way and with the focus when File opens; Settings on a line of the header at every
width; the levels wholly left of the stage and the figures, opened, wholly right of it, on a
stage 260 pixels narrower whose canvas has the pixels of its place — and shut, the picture
that the stage showed before, to the pixel; and that without WebGL the seven links of the
switch are all the page has to press. `-stands` holds, beside its pictures of each stand,
the stand marked as chosen, which no picture settles (T-000.23): Front as the page opens anew,
Back alone once clicked, in the ink of the way that shows, still after a click on the stage
that moves nothing, none after a drag, and Above once clicked. `-slopes` is the made-up house beside the same house made level, from one
stand and in each of the three ways, a wide staircase alone, and a file of the sloping house.
`-ground` is the made-up house beside the same house without its lawn (ST-027): in the pad's
side view a slice through the lawn and the tree on it, and here, from one stand, another
picture in each of the three ways — with the tree off both houses too — with 35 solids each,
and 36 where the lawn says no `is`. `-cut` is the made-up house beside the same house without
its cut (ST-028): in the pad, from above, the block's category in the list, in words and on
the paper, and in a slice through it the cut ground; and here, from the stand of the pad's
other side, another picture in each of the three ways — with the car off both houses too —
with 35 solids each, and 36 where the block says no category. Those that count the solids
of the made-up sketch count its things but two: its lawn and its cut are none. Look: `pnpm
sketch:look 3d.html tests/__fixtures__/sketch/made-up.json <picture> --demo
"click=button[data-way=materials]" "key=PageDown" "click=[data-stand=above]"` — and for a
figure, after it, `"click=text=Settings" "click=#figure-outerWallM" "key=Control+a" "key=0"
"key=." "key=2"`: a key at a step, with the figures right of the stage and the house in the
middle of what they leave. To go near: `"wheel=820,506,8"`, eight notches towards the
house, and `"rdrag=820,506,758,363"`, which moves what the view looks at;
`"drag=820,506,922,394"` turns it down from above — each a place of the stage as it lies
since T-029.6 (Gotchas). With `"click=button[data-way=materials]"` alone: the levels left of
the stage, Settings a square of the toolbar after the two switches, and the house on a stage
that reaches the window's right edge; with `"click=text=Settings"` after it the eight figures
right of the stage, Settings in the ink, and the house as large as it was and not turned,
cut at its sides. And
for the file, `"click=#file-menu"
"click=#save"` after a way that shows the parts — File first, which opens its menu: the line
under the header says the name it was saved under. For the picture, `"click=#file-menu"
"click=#picture"`, in whichever way: the line says "Saved as house-<day>.png, where this
browser saves its files." The file and the picture stay in the browser's own
folder of that look, and are gone with it. With `"click=#file-menu"` alone the menu shows:
under "Export" the entries "Picture (PNG)" and "3D file (GLB)" — the second off in the
Volumes, as the page opens, with the line under it that says why. Opened along a slice:
`"click=button[data-way=materials]" "click=[data-open=front]"` — the made-up house from the
front with its downhill half taken away, the day and the night rooms seen into, the walls,
slabs and hill cut dark — and `data-open=side`, `data-open=back` with
`"click=button[data-stand=back]"`, or in White. Full screen (T-033.6):
`"click=button[data-way=materials]" "click=#full-screen"` — the house alone in the window,
under its sky, with "Picture" and "Back" small at the top right and nothing else of the page —
whether the look's browser gave its full screen or not, its window is the picture. Without the last
click, the toolbar with Full screen after Settings, on one line of 68 pixels.

## Gotchas

- Every module but `tools/sketch/view3d/main.js` loads in Node; `tools/sketch/view3d/read.js` takes the pad's globals as it loads, so a
  check loads the pad's scripts first (`tools/sketch/view3d/read.check.js`, `tools/sketch/view3d/made-up.check.js`,
  `tools/sketch/view3d/made-up-cut.check.js`, `tools/sketch/view3d/written.check.js`,
  `tools/sketch/view3d/earth.check.js`, `tools/sketch/view3d/earth-cut.check.js`, `tools/sketch/view3d/picked.check.js`) — `categories.js` among them,
  before `blocks.js`: `read` asks what every block counts as, and that asks the list. And
  `read` asks the list itself, whether a category was picked for a block: the one global that
  `tools/sketch/view3d/read.js` reaches for where a thing is read, and not as it loads. `read` asks the paper to
  settle the ground, and the paper shapes nothing
  where no `earth.js` was loaded: `tools/sketch/view3d/read.check.js`, `tools/sketch/view3d/written.check.js` and `tools/sketch/view3d/tops.check.js` load
  none, and read on the site's own ground — `land` is the site there, whatever the sketch.
  What hears the page — `tools/sketch/view3d/settings.js`, the keys of `tools/sketch/view3d/panel.js` — is checked on a made-up page.
- Why the hill, the lines and the steps in the depth are as they are: ADR-0066, 0067, 0073. The
  sun, the shadows' map, White's lights and its backdrop: the ADRs of T-024.1 and of T-024.6.
- **A block of ground is the hill, and no thing of the scene** (ST-027, ADR-0103).
  So a place among the scene's things — a solid's, `part.thing` — is a place in what `read`
  handed on, and none in the sketch: whoever goes from a solid back to the sketch counts
  without the boxes of ground. A drop is read off the shaped ground now: an open floor loses
  its railing where a block of ground brings the ground up to within a step of its slab, and
  gains one where the ground is cut down beside it — by a cut too (ST-028) — also along an
  edge that no block of ground and no cut touches, for either moves the whole plot, a cut by
  more than a little. A block that is set
  to ground takes its level out of the list of levels: a level is a floor that a block of the
  scene stands on. And a sketch that holds blocks of ground alone has no solid: the page says
  "Nothing is drawn yet", over a hill that is shaped. A block of ground that shapes nothing —
  off the plot, or wholly inside a block of the house — shows nowhere in 3D: it is no thing
  of the scene all the same, though every view of the pad has it as a block in its colour.
- **A cut is the hill where it bites, and no thing of the scene** (ST-028): the hill is
  handed on cut, by the paper's one rule, and no box of the cut — so there is no red box, no
  solid, no wall and no roof where the owner drew one, while every view of the pad has the
  cut as a block in its colour. **A wall shows down to the ground beside it**: where a cut
  lies against a block of the house, the earth is gone from that wall down to the cut's
  floor — a wall is built from its floor up whatever the ground, and the hill hid it. And
  **a block whose floor lies over a cut hangs over it**: beside a cut that is deeper than
  its floor, the block's foot stands in the air, and the pit under the block is open to
  that side, dark under the wall — as under any block that stands over lower ground (below).
  So a cut beside a room is drawn down to that room's floor, and no deeper. A cut that bites
  nowhere shows nowhere in 3D.
  What holds of a block of ground holds of a cut: a place among the scene's
  things is counted without its boxes, and its floor gives no level. A block is a cut by
  what a box of it says, by the category that was picked for it or by a name that holds
  "ground cut" — so a block so named, in a sketch kept before, is gone from the 3D view the
  moment this page reads it, where it stood as a room, and the hill is cut under it. No
  module of `scene/` knows the word:
  `space.js` reads what is none of its three as a room, and is never handed it.
- To see a cut: the made-up house has one beside its day rooms, out to the edge of the plot,
  the last of its things (T-028.5) — `pnpm sketch:look 3d.html
  tests/__fixtures__/sketch/made-up.json <picture> --demo "click=button[data-way=materials]"
  "click=[data-stand=right]"`, the stand of the pad's other side, which looks at the side of
  the house that the cut lies on: the long side of the day rooms stands free down to its
  floor, its foot a level line; the earth is taken away beside it, level out to the edge of
  the plot; and no red box stands there. With `"wheel=820,640,8"` after it, near. A copy of
  that file outside the repository without the cut has the hill run up that wall, its foot
  askew; without the cut's `,"category":"ground-cut"`, a red room in the hill; and with the
  cut's `z` as `[18,26]`, a metre deeper than the day rooms' floor, the house hangs over the
  cut: a dark pit shows under the wall.
- A picked category reaches the scene as what it counts as and as a name (T-028.6): `read`
  hands every box of such a block on under the name of its category, as the list shows it,
  and no `category`. So the scene reads a pick where it read a name, by the lists it had: a
  picked Garden is grass and a picked Bathroom stone (`scene/surfaces.js`), a picked
  Staircase its flight's own room (`scene/flights.js`). **The pick is read, and the name no
  more**: a picked Roof on a block named "Green roof" is paved, where "green" gave grass,
  and a "Pool" that is picked a Terrace loses its water, which no name of the list gives —
  and the owner's name of a picked block is nowhere in 3D. A category that a name gives is
  handed on as that name: "Bath" stays "Bath". A name of the list is read by the scene's
  words — "Bathroom" by "bath", "Staircase" by "stair" — so rewording one in `categories.js`
  changes what 3D builds: `tools/sketch/view3d/picked.check.js` holds every row's floor, typed in.
- What shows of a terrace of ground. A stand has the house in view (`houseOf`, `tools/sketch/view3d/view.js`), and
  a block of ground is none of it: a terrace that reaches beyond the house lies at the edge of
  the picture, as a tree does, until the wheel goes back or a drag with the right button
  brings it in — and the wheel goes near what the view looks at, the house: near a terrace
  only after such a drag. The earth is one colour and casts no shadow in any way: in the
  Volumes a terrace reads by its shade alone, and in White and in Materials by the shadows
  that fall on it. Where the ground is cut down beside a block, the block's foot hangs over
  it: the pit under the block is open to that side, as under any block that stands over
  lower ground.
- To see a terrace: the made-up house has one, a lawn before its porch — `{"x":[58,72],
  "y":[24,36],"z":[24,28],"colour":9,"name":"Lawn","is":"ground"}`, the last of its things
  but one —
  `pnpm sketch:look 3d.html tests/__fixtures__/sketch/made-up.json <picture> --demo
  "click=button[data-way=materials]" "click=[data-stand=left]" "rdrag=1107,537,718,476"`: a
  level lawn before the porch, the tree on it and its shadow lying flat, banks down to the
  hill, and no brown box; with `"wheel=964,517,8"` after it, near. In a file of one's own,
  with `"z":[30,34]` the hill is cut down to a floor there; without `"is":"ground"` a room
  stands in a pit, with a level of its own.
- A picture of two houses is told apart by what stands on the ground before it is by the
  ground: on the made-up lawn the tree stands a metre and a half higher than on the hill, and
  of the 41 000 pixels that differ by a tenth between the two houses, from the left in the
  Volumes, all but 2 400 are the tree's. `sketch-3d-ground.spec.ts` therefore compares the
  two houses a second time with the tree off both, and counts a pixel as another from 4 of
  255 on: earth is one colour, and in the Volumes the hill alone differs by 20 000 pixels at
  that step. A hill that is not shaped leaves those two pictures one and the same. So with
  the made-up cut: the car stands 0.18 m lower beside it, and is 2 600 to 4 400 of the pixels
  that differ, from the right, where the hill alone is 137 000 of them in the Volumes,
  181 000 in Materials and 197 000 in White. `sketch-3d-cut.spec.ts` compares a second time
  with the car off both houses — and with the cut lifted over the hill, where it bites
  nowhere, its two pictures were one and the same to the pixel, in each way.
- A top that slopes shows in all three ways. In White and in Materials a room and a block of
  glass are the parts that `scene/` builds under their tops (T-026.5, T-026.6) — a roof, walls
  and glass that follow the slope, what slopes of them a `slant` — and open air under one is
  the floor and the railing it was. In the Volumes its solid is a shape of its own, made for
  its scene and given back by `dispose` — where every level block shares the one box — and
  its lines are three.js's `EdgesGeometry` of that shape: an edge is where two faces meet at
  more than a degree, and places are told apart to a tenth of a millimetre. Nothing here works
  out where a top lies: `scene.solids[at].top` says it, and a part says its own two planes.
- To see tops that slope: `pnpm sketch:look 3d.html tests/__fixtures__/sketch/made-up.json
  <picture> --demo "click=button[data-way=materials]" "click=[data-stand=left]"` — the porch
  is a lean-to of glass, its roof falling to the front, and the bath's roof falls to the side
  over walls that end under it; with `"click=#ground"` after it the house stands before the
  backdrop alone — in Materials the sky — as `sketch-3d-slopes.spec.ts` counts it. And with `"key=PageDown"
  "key=PageDown" "click=[data-stand=above]" "wheel=743,363,8"` in the stand's place: the two
  staircases side by side, sixteen steps each, the one half as wide again.
- `pnpm sketch:look` and the gates' browser tests draw in software: a hair shows there along the seam of two slabs
  side by side, and none on a graphics card. Judge the light on both. The tests' browser draws
  by the graphics card with no window where it is launched with `--use-angle=d3d11`; a look has
  no switch for it, and no gate runs so. There the cases that ask the pixel fail, some of the
  time — two of `sketch-3d-parts.spec.ts`, one of `sketch-3d-scene.spec.ts`: a picture after a
  change and back is some tens of pixels off, by 1 of 255.
- A strength, the sun's place or a backdrop changed fails `tools/sketch/view3d/lights.check.js`: the tones of a
  roof, two walls and the shade are held apart, and clear of the backdrop, by figures. White's
  backdrop has room for 4 of 255 and no more; Materials has a sky and strengths of its own.
- **`PCFSoftShadowMap` is gone** from three.js 0.186: asked for, it warns and draws
  `PCFShadowMap`. The soft edge is `PCFShadowMap` with the shadow's `radius` — 3 points of the
  map, some four centimetres where the sun sees 30 m — set in `lights.js`, the map's type in
  `stage.js`. Each place looks the map up at five points turned by a noise of its own place,
  so a wider edge is grainy: 4 points was, on the stairs. `VSMShadowMap` blurs it smooth, but
  draws the faces that look at the sun into its map, where a wall in the sun may get stripes
  of shade: not tried.
- **The shade in corners is laid over the drawing, not drawn through passes** (T-033.2). With
  three.js's `EffectComposer` the scene is drawn into a picture of its own, many samples a
  pixel, and those are averaged in light; the canvas averages its samples on the screen's
  curve. So an edge came out lighter there — the plot's ink outline, from above, 676 pixels
  lighter with the shadows on than off, which `sketch-3d-ways.spec.ts` refuses. So the canvas
  is drawn as it always was, and `GTAOPass`, told to put its result nowhere, works out the
  shade in pictures of its own; one quad then multiplies it onto the canvas, with no
  emptying. And the pass smooths its shade by a noise that it draws from `Math.random` as it
  is made: two loads of a page were two pictures, some 370 pixels apart, which the two cases
  of a reload refuse. It smooths by the noise it shades with, the same every time. A drawing
  with the shade costs three drawings more, each of the canvas's size: the scene's normals
  and depth, the shade, the smoothing.
- **A plane must reach every pass** (T-033.5). three.js cuts what a material says, in each
  drawing that material is drawn in: the canvas's, and the shadow map's, whose depth material
  takes the planes of the one it stands in for only where that one says `clipShadows` — else
  what was taken away still casts its shadow, and no sun falls into the opened rooms. The
  shade in corners draws the scene's depth and the way each face looks with a material of its
  own, `GTAOPass`'s `normalMaterial`, which stands in for every one: it gets the plane too
  (`stage.cut`), or the corners of what was taken away still shade what is left. The sky must
  not get it: its dome is no part of `what` (`opened`), and the shade's own material draws
  only its outer faces, which the camera inside never sees. A face that lies in the plane is
  cut there and not there, from one pixel to the next: the earth's cut face lies a millimetre
  into what is kept, or the shade in corners found holes in it, in stripes. And the earth is
  drawn from either side, and its base faces up into it: its inside cannot be told by the way a
  face looks, so it gets a face of its cut, and no `inside`. That face writes no depth and is
  drawn after the earth and before the rest: a room in a pit shows over it. Where a wall of a
  pit is seen edge-on, a hair of earth shows across it: the wall lies nearer than it is by its
  polygon offset (`build.js`).
- **A skirt lies behind the ground, and the shade in corners does not see it** (ST-042, the
  T-042.5 Look). A far square's skirt, and a near grid's wall along its own edge, has its top
  on the edge of the ground beside it, as near to the eye there as that ground. Drawn with the
  hill's walls, which lie nearer than they are (`AHEAD`), the top of every skirt came first,
  and the flat ground beyond the paper was ruled with dark lines, one an edge of a square, a
  half-metre apart near the sketch: in the Volumes, with no sun and no shade. With no offset
  at all the lines were fainter, and still there. So the skirts are a mesh of their own, the
  hill's child, that lies behind (`BEHIND`, as an object's faces do). The shade in corners
  draws the depth in its own material, which has no offset: there a skirt's top still came
  first at a pixel here and there, and White and Materials had a dark dot of a corner along
  the edges. So the skirts are on a layer of their own, `UNDER` of `stage.js`, which the camera
  sees and the shade's pass, by the same camera, does not — `cornersOf` takes it off the camera
  while it draws, and gives it back. The walls of a pit stay ahead, and seen by the shade: a
  pit's wall meets a block's, not the ground.
- **A pattern is no texture** (T-033.3). A picture laid on a face is an image, which ST-024's
  rule 6 refuses, and a box of the pad has no coordinates to lay one by (`shapes.js` writes
  none): so the pattern is worked out in the shader. The face's `onBeforeCompile` puts a few
  lines into three.js's own standard shader — the point's place and the way its face looks,
  kept after `begin_vertex`; the colour darkened or lightened after `color_fragment` — on the
  plane that the face's normal is nearest to across, as every part lies along the plot's axes.
  The points of a mesh are the stage's own (`meshes.js` puts them there), so the place is the
  stage's. A joint and a spot are drawn by `fwidth`: of a pixel, the share that the joint
  covers, so one thinner than a pixel fades to a faint tone and the floor seen from far off
  shows no stripes that crawl as the view turns. `customProgramCacheKey` gives each pattern a
  program of its own; without it three.js keys the program by the hook's text, which is the
  same for all four. A three.js that renames those chunks is refused at once — `patterned`
  throws, and `tools/sketch/view3d/patterns.check.js` reads three.js's shaders as installed — but no check
  compiles the lines: a mistake in them shows as a page with no house and an error in the
  console. **The 3D file keeps plain colours**: the exporter writes a face's colour and
  roughness and knows nothing of the hook, so `tools/sketch/view3d/file-bytes.check.js` holds the bytes as
  they were. The figures — a joint of 12 mm, wider than a house's — were set by eye from above
  a level down, where a plank is some eight pixels wide: why each, the head of `PATTERNS`.
- A surface's colour is `scene/surfaces.js`'s, set by eye and held nowhere — but against what
  it must not be: `tools/sketch/view3d/surfaced.check.js` fails where plaster or a roof comes within the step of
  the sky — `BACKDROP.surfaced`, or any colour of the dome — at whatever angle the sun meets a wall, or `joinery`, the furniture's wood, within
  the step of the floor's `wood`. A colour there is what a floor shows in the sun, from above.
  Why each is what it is, and what Materials costs: ADR-0089.
- Two walls in the shade are one tone, in White and in Materials: no line and no light tells
  the corner where they meet. A floor between them does.
- A figure is written at every key that makes one: on the way to 0.25 m, 0.2 m is drawn, kept,
  and a step of the pad's Undo. A key that is refused costs nothing; one that is taken builds
  the scene anew, some 50 ms for 180 blocks. Why: ADR-0086, of T-024.9. Why Settings stand
  where they do since ST-029 — a button of the toolbar, the figures a side of their own right
  of the stage, where that ADR had them in the levels' column: ADR-0114.
- **Opened, Settings take 260 pixels of the stage, and shut, the stage has them back**
  (T-029.5): 1240 pixels wide and 980 in a window of 1440, 1080 and 820 in the tests' 1280.
  No camera moves (invariant 5), and the camera's angle is the one from the foot of the
  picture to its top: so the house is as large as it was and not turned, in the middle of
  what is left, and **what a stand fitted to the stage is cut at its sides while Settings
  are open** — from the north-west, `[data-stand=left]`, the made-up car is cut at the left
  edge and the corner of the lawn at the right — until a stand is clicked again. A stand that
  is clicked while they are open is fitted to the narrower stage: the house is whole then,
  and stays that much smaller than the stage could show it once they are shut. The tab does
  not keep whether they are open. And Tab goes from the button through the levels before it
  reaches the first figure — tried: the figures stand after the stage in the page.
- Nothing of `3d.html` but the button says "Settings", in whatever case: a look clicks
  `text=Settings`, which fails where two things answer. `sketch-3d-settings.spec.ts` holds it.
- **A picture is taken in the turn of a drawing** (T-029.5). The stage keeps no drawing
  between two frames: once the browser has shown a frame, the canvas is empty to whoever asks
  it, though the screen still shows the picture. So `stage.picture` draws at the click, and
  asks the canvas (`toBlob`) before that turn ends; the PNG is then written in the browser's
  own time. **Seen to fail, twice**: with the canvas asked and nothing drawn in that turn,
  and with the drawing done and the canvas asked two frames later, `sketch-3d-picture.spec.ts`
  failed with every one of the picture's 670 680 pixels another than the stage's — an empty
  picture, 1080 by 621. A stage that kept its drawing would give a picture at any moment, at
  the price of a copy of every frame: ADR-0114 has why not.
- **A browser may refuse its full screen** (T-033.6): it gives one only in the turn of a click,
  and a frame, a setting or the tests' browser may say no — `requestFullscreen` then rejects.
  `full.js` takes that quietly: the page is alone all the same, the stage the whole window,
  and nothing is said, for a refusal is no fault. So `data-full` says whether the page is
  alone, and not whether the browser gave its full screen; a test holds the first, and the
  canvas's box the window's. Where the browser gave it, its own Escape leaves it before the
  page hears the key: `fullscreenchange` with no element is back, as Escape and Back are, and
  `full(false)` is asked once whichever comes first. A picture taken alone is the whole
  window's, or the screen's; what the page says of it shows on its line once it is back, for
  the line is hidden till then. Nothing is kept: a reload is the page as it is.
- A picture is as large as the stage is at the click, and **the first one of a page is 31
  pixels higher than the next**: the page's line comes with the first thing that is saved,
  and the stage gives it its height (ADR-0090) — 1240 by 821 and then 1240 by 790, in a
  window of 1440 by 900, since the header is one line there (T-029.6); 1080 by 641 and then
  1080 by 610 in the tests' window. With Settings open it is the narrower stage, 980 wide. On
  a screen that has two pixels for each of the page's it has four times as many: 2480 by
  1642, tried in the tests' browser, told so of its screen. In White and in Materials a
  click costs the drawing of a frame with its shadows
  and the writing of the PNG: 0.1 to 0.3 s until the browser has the file, drawn in
  software, and twice that on such a screen.
- When File opens, the entry of the picture has the focus, in every way: it is the first
  entry that is not off (`views.menu`). So Enter or the space bar, right after File, saves a
  picture — where, in the Volumes, File itself kept the focus before there was a picture.
- three.js's exporter puts a file together with the browser's own reader of files,
  `FileReader`, and Node has none: `tools/sketch/view3d/file.check.js` and `tools/sketch/view3d/file-bytes.check.js` make one up, of
  Node's Blob. What a browser writes is `sketch-3d-file.spec.ts`'s, which no fast gate runs.
- **No gate opens a file in another program.** The bytes are read as the glTF specification
  lays them out, and three.js's own reader was once tried on them by hand. That Blender shows
  the house upright, to scale and in its surfaces, only a person sees. ADR-0090.
- A file knows no step behind in the depth (invariant 7): where a piece lies in one plane with
  a wall or a floor, another program may show stripes of the two. And a mesh's index is of
  four bytes, as the stage has it — or of two, where two meshes were joined into one of under
  65535 points: both are glTF.
- A file holds triangles of no size, as the stage does: 24 around either pole of a ball, and
  four of the twelve of a slant that comes down to an edge — the wedge of wall over a door
  under a sloping head is one. They are glTF too, and another program may say so of them.
  `tools/sketch/view3d/file-bytes.check.js` counts them.
- The page says the name it asked of the browser, of a file and of a picture. A browser that
  has a file of that name there
  adds a number — `house-2026-10-10 (1).glb`, `house-2026-10-10 (1).png` — and one that asks
  where to save may be told no.
  The day is the world's clock's, as a saved sketch's: yesterday's, in the first hours here.
- The words of what was saved last — a file or a picture, in one place of the line — stay
  there until the next of either, or until the page is loaded
  anew: a change of the sketch writes the sketch's words before them, and leaves them.
- The made-up sketch has a tree of 8 m and a car beside its house, and both are parts: the box
  around all that a file of it holds is the tree's in height, at every level — the tree
  stands on the lawn, at 814 m, and ends at 822 m, 2 m over the roof. A case that
  wants the house's box takes the two off the sketch, as `sketch-3d-file.spec.ts` does: the
  lawn and the cut may stay, for neither is a part, and a file holds nothing of the ground.
- A line of the header is 68 pixels, by `frame.css` (T-029.6) — 54 for the controls of a
  group, by the group's own height, and 14 for the small word under them, by its margin: a
  square is 50 high whatever its word, a track 54, and a group 54 whatever it holds — and a
  line of `#said` 18, by `line-height` in
  `3d.html`. So the header is `74 * lines + 5` pixels high: 79, 153, 227 — 6 between two
  lines, 10 of padding and a line of 1. It was `46 * lines + 7`, a line 40 pixels, until the
  look.
  Left to the font, the stage began on a fraction of a pixel, and a picture of its canvas took
  in a row of what lies over it — once the fraction was over one half, as a button on the
  header's second line made it: `sketch-3d-controls.spec.ts` then counted 1080 pixels drawn on
  a stage that showed nothing.
- The header is one line in a window of 1440 pixels on the made-up plot, 79 pixels high,
  since its controls are squares (T-029.6): the five groups, Settings and Full screen, which
  end 1197 pixels across since Full screen came (T-033.6) — Settings 1132, since the switch
  has seven views (T-032.5) — and the name of the plot beside them. **Full screen took 65
  pixels of the line, and the name gave 52 back**: on this page it takes 4em at the least,
  52 pixels, where `frame.css` gives it 8em (`side.css`), so the header is one line from 1276
  pixels on — the tests' window of 1280 among them, which `sketch-info.spec.ts` holds; it was
  from 1263. From 1275 down the name is alone on a second line, from 1206 Full screen with it,
  from 1141 Settings, from 1076 the two switches, and from 648 the name alone on a third, the
  groups from 629 — measured in the tests' browser on the made-up plot (T-033.6). What follows
  is how it stood before. It was two lines there, 99 pixels,
  while Settings was a button with a box (T-029.5). It is one line from 1263 pixels on — so
  in the tests' window of 1280 too — and a plot with a longer name breaks it no earlier: the
  name takes what is left of the line, 8em at the least, 104 pixels, in as many as three
  lines of its own. From 1262 pixels down it is two lines, 153 pixels: the name alone on the
  second, Settings with it from 1141 down, and the two switches from 1076 down; the groups
  stand on three lines from 629 pixels down. Each measured in the tests' browser on the
  made-up plot, where with six views and 130 pixels for the name they were 1239, 1091, 1026
  and 579.
- **Where the stage lies, for a look that names a place of it in pixels** — a `wheel`, a
  `drag`, an `rdrag`, a click on a place. In a look's window, 1440 by 900 on the made-up
  plot, the stage reaches from 200 to 1440 across and from 79 to 900 down: 1240 wide, as wide
  as it was, and 821 high, with its middle at `820,490`. Before the look of T-029.6 the
  header was two lines there, and the stage reached from 99 to 900, 801 pixels high: **a
  place of the stage lies 2.5 % further from the middle than it did, and the middle 10
  pixels higher** — `820 + 1.025 * (x - 820)` across and `489.5 + 1.025 * (y - 499.5)` down
  — and every look of this file is written so, and was tried so, each held against its
  picture of before: each shows what it says. A `wheel` goes near what the view looks at,
  wherever on the stage it is turned; a drag counts by how far it goes, in pixels, and for
  how high the stage is: on a stage of 821 pixels the same drag turns the view by 2.4 % less
  than on one of 801.
  With the page's line under the header — once something was saved, or where the sketch has
  something to say — the stage begins 31 pixels lower still, at 110; and with Settings open
  it ends at 1180. Whoever changes how high the header is, or how wide the levels' side,
  changes this one note and the places of the looks with it.
- An open menu lies under File at the page's left edge, and no longer over the stage: a
  panel that floats, 4 pixels under File's square (T-029.6), 156
  pixels wide, and 138 high in the Volumes, with its line of why — 92 in White and in
  Materials — until the Google Earth file came (T-016.4): with its entry and the row of its
  raise, which wraps no word, it is some 330 pixels wide and 186 high in the Volumes, read off
  a picture of `pnpm sketch:look`. It lies over the head of the levels' side — its title and "All", and in the
  Volumes the two levels of the made-up house too —
  and, where the header has two lines, from 1262 pixels down, over the left of the second:
  the name of the plot. It takes no
  room: the header and the stage
  are as large with it open as with it shut. The pointer down on the stage shuts it, and is
  the stage's too: a drag that turns the view begins there.
- `3d.html` has 275 lines since T-038.2, which said White in the Google Earth entry's comment,
  and 274 since T-033.6, which moved the figures' style to `side.css`, at 126,
  and gave `#full-screen` ten; `icons.css` 171, `tools/sketch/view3d/main.js` 270 and
  `tools/sketch/view3d/file.js` 189 since T-038.2,
  `tools/sketch/view3d/panel.js` 155, `tools/sketch/view3d/panel.check.js` 217 since T-000.23,
  `tools/sketch/view3d/full.js` 73 and `tools/sketch/view3d/full.check.js` 148;
  `sketch-3d-header.spec.ts` is still full, at 300, `sketch-look.spec.ts` at 299, and
  `sketch-3d-show.spec.ts` has room, at 146. Before that: `3d.html` had 295 lines, since it holds the Google Earth file's entry, its line and its raise
  (T-016.4), and named the script of the plot shown last (T-030.4) — since T-040.2 its scripts
  lie in a template that `boot.js` puts in, and since T-040.4 its import map names three.js
  beside it, `./three/` — Settings is a button of its header and the figures a side of
  their own (T-029.5), and room still, since what it shares with the pad's own page of
  its look left it for `frame.css`, at 279 with the one look and Info, and its drawings are
  `icons.css`'s, at 166 (T-029.6, T-032.5): no gate counts any of the three, and each stays
  under 300 by hand. `tools/sketch/view3d/panel.js` has 126 lines, `tools/sketch/view3d/main.js` 183, `tools/sketch/view3d/stage.js` 222, `tools/sketch/view3d/file.js` 184,
  `tools/sketch/view3d/panel.check.js` 160 and `tools/sketch/view3d/file.check.js` 223. Nearly full, of 300 lines:
  `sketch-3d-ways.spec.ts`, `sketch-3d-materials.spec.ts` — full, at 300, since it holds the sky (T-033.2) —
  `tools/sketch/view3d/read.check.js` — full, at 300, since it holds a block in a colour of the owner's (T-039.1) — and full, at 300, since it says that the made-up lawn is no
  solid, and now its cut neither, `sketch-3d-parts.spec.ts`; `sketch-3d-settings.spec.ts`,
  which was full for the same, stands at 299 since it no longer holds that Settings take
  nothing of the stage, and `sketch-3d-header.spec.ts` at 300, since it holds what they
  take and the Google Earth file's place in File: the next line in either
  wants one made free first. So is `sketch-3d-file.spec.ts`,
  full at 300
  since it presses File and then the entry (T-029.2), through a helper of one line.
  `sketch-3d-picture.spec.ts` has room, at 151: what is tested next of a picture, or by the
  pixels of one, goes there. Since
  a top slopes `tools/sketch/view3d/build.js`, at 296 since it draws the ground beyond the paper lighter (ST-042), and `tools/sketch/view3d/shapes.js`, at 277: the next shape wants a module of
  its own. And `tools/sketch/view3d/made-up.check.js`, at 299, since it holds the made-up house by hand, its lawn
  too, and its cut as a text — made shorter line by line for that, with no assertion gone:
  what is checked next of that house goes to `tools/sketch/view3d/made-up-cut.check.js`, which holds its cut and
  has some room, at 280. `tools/sketch/view3d/earth.check.js` stands at 281: what is
  checked next of the ground in 3D wants one too. `tools/sketch/view3d/file-bytes.check.js` stands at 261,
  `sketch-3d-slopes.spec.ts` at 276, and `sketch-3d-ground.spec.ts` and
  `sketch-3d-cut.spec.ts` both at 299. `tools/sketch/view3d/read.js` has 300
  lines, full, since it hands on the land of `reach.js` (ST-042): what it reads next wants a line made free first.
  `tools/sketch/view3d/earth-cut.check.js` has 271, since it holds the ground under a cut: what is checked next
  of a cut in 3D wants a check of its own. `tools/sketch/view3d/picked.check.js` has 265 and `tools/sketch/view3d/rules.check.js` 211.
- `tools/sketch/view3d/read.check.js` holds all that `read` gives in one constant, `NOTHING`, and compares against
  it in two places: written out in both, each line is one character over the formatter's
  width with `land` in it, and laid out as the formatter then wants, the check is over 300.
