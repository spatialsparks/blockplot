## Test

`pnpm sketch:check` — `tools/sketch/check.js`: one space on every plane, strokes, blocks cut and merged,
levels, undo and storage, with no browser and nothing of the site. It runs `tools/sketch/check-blocks.js` and
`tools/sketch/check-shapes.js` first — what a block counts as, of a room, open air and glass: ground is
`tools/sketch/counts.check.js`'s — and a top that slopes by hand: what a box
says of it, each thing that is no slope, its rows along the plot and across it, in a box that
was cut, made longer or moved, the tops of the boxes of each golden file — the text of the
made-up house against its file of version 3, which stood here, is
`tools/sketch/view3d/made-up-cut.check.js`'s since that house has its cut — a slope where its box went
(`carried`), what each plane shows of a top (`topOn`) and how much of each plane a box covers
under it (`covers`); every kind of object has a
shape on every plane, and the wide staircase the staircase's — and `tools/sketch/check-slices.js` last: how
large and how high a block is, under a slope too, a sketch with every kind of what is no slope
read and written back, names and labels, what a block is set to count as, the six steps of
its key and what the pad says of a room, of open air and of glass — of `tools/sketch/page.js` the text of
its key — the slice across the plot, an object turned. The
last step of `pnpm verify:fast`, run on this PC: nothing runs on GitHub. Every check that holds a golden file of the
sketch file, or the version that the pad writes, takes it from `tools/sketch/check-golden.js` —
`VERSION`, `BEFORE`, `golden` and `asNow`, read from `tests/__fixtures__/sketch/` alone — and
states that version by no figure (T-000.20; `tests/__fixtures__/CLAUDE.md`).

**All of it runs behind a gate** (ST-031, rule 3): the first thing of the pad that `tools/sketch/check.js`
imports is `tools/sketch/offline.js`, which puts a refusal in the place of `net.Socket.prototype.connect`.
A connection to a loopback address, written as an address — `127.0.0.0/8` or `::1` — goes
through; every other throws before a name is looked up or a byte is sent, and says where it
was to go: "The pad's checks ask this machine alone (ST-031, rule 3), so nothing was sent:
<host>:<port>" — a name too, `localhost` among them, and a pipe. The guard adds itself to
`NODE_OPTIONS`, once, so every check that the gate starts, and every pad and stand-in that a
check starts, loads it before its own first line. `tools/sketch/offline.check.js` is its proof, with
nothing sent: the rule alone, `beyond`, on every kind of call; a process started with the
guard that asks an official host by its name, on a socket whose own lookup answers nothing,
and is refused before that lookup is asked; the same process **without** the guard, which asks
the lookup — so the proof can fail; a process that the guarded one starts in turn, refused,
with the order once in its `NODE_OPTIONS`; 127.0.0.1, which goes through; and of `tools/sketch/check.js`
the text — the guard is the first thing of the pad that it imports. **Where the gate lies, for
whoever asks**: for the checks, in `tools/sketch/offline.js`; a pad that a check or a test starts is
told its port alone, and asks nobody (T-041.4); for the map's page, in the word `asks` of its
address, a stand-in's port; and for the browser tests of the map,
`tests/e2e/sketch-map.spec.ts`, `sketch-map-layers.spec.ts` (T-044.12), `sketch-map-find.spec.ts`
and `sketch-map-plain.spec.ts`, and
of the marking, `sketch-new-plot.spec.ts`, `sketch-new-plot-made.spec.ts` (T-031.7),
`sketch-new-plot-unseen.spec.ts`, `sketch-new-plot-large.spec.ts` and
`sketch-new-plot-parcel.spec.ts`, in the module that the nine share, each taking its `test`
from there, `tests/e2e/sketch-own-pad.ts` (T-031.5): each case on a pad and a stand-in of
its own (`docs/sketch/map.md`) — and in `sketch-new-plot-folder.spec.ts`, whose pad and stand-in
`startOwn` of that module starts, and which has a gate of its own browser (T-041.5). **What it does not reach**: a check that
is run by hand, `pnpm exec node tools/sketch/<name>.check.js`, has no guard of its socket, and
is kept on this machine by the setting alone; and UDP, a lookup made on its own, a worker
thread and a process that is not Node go round `connect`.

Then `tools/sketch/check.js` runs every `*.check.js` under this folder, outside `node_modules`, in the order
of their names, each as a Node process of its own — by its runner, `tools/sketch/check-each.js`, which
`tools/sketch/check.js`, at 289 lines, loads last. Such a check is found by its name alone: it sets up all
it needs, leaves nothing running, and wants no line in either. **Each runs on a clock**,
`CLOCK_S`, of 120 seconds — the slowest takes under two (T-000.21): one that runs out of it is ended,
fails the gate and is named, `tools/sketch/<name> ran out of its 120 seconds, and was ended`, and a
server that it started may run still; a script that never ends, on a clock of a second, is
the proof, with one that fails and the list of what is found. They are the checks of
`tools/sketch/scene/` and of `tools/sketch/view3d/`,
one of `tools/sketch/example/` — `own.check.js`, which holds that this folder has no plot but the made-up
one (`docs/sketch/example.md`, T-030.5) — those of `tools/sketch/swisstopo/`, `tools/sketch/new-plot/` and
`tools/sketch/map/`, whose notes count them (ST-031): among them the two of a plot made in the
page, `tools/sketch/new-plot/making.check.js` — the golden file `tests/__fixtures__/new-plot/trial-slope.json`, which
the server's `made` gave and `plotMadeOf` gives, and `trial-slope-photo.json`, the same pentagon
marked on the aerial photo, with the national map's credit and source typed in (T-044.10) — and
`making-refused.check.js` (T-041.3), and
`made-large.check.js` (T-042.4), each of which starts the stand-in alone; the three of an order
that the server made, `made.check.js`, `made-refused.check.js` and `made-disk.check.js`, went
with its `made.js` (T-041.4);
`tools/sketch/map/make.check.js` starts nothing since then — six of `tools/sketch/sections/`, the list's
`list.check.js` among them (T-032.4), and three of
`tools/sketch/info/` — the page's `page.check.js` among them (T-032.5) — which those folders' notes say
(ST-032), six of `tools/sketch/kml/` — `own.check.js` among them, which holds that WGS84 lies
there alone (T-016.1), and `white.check.js`, the White model's parts and the switches (ST-038) —
which its note says (`docs/sketch/kml.md`), one of `tools/sketch/store/` — `rules.check.js`, the
browser's store's names, keys and rules by hand, that no module of the store asks a machine or
takes a record away, that `tools/sketch/plot-file.js` and what it loads import nothing of Node,
and that `write`'s equality of its own holds what Node's held (T-040.1) — which its note says
(`tools/sketch/store/CLAUDE.md`, "Test"), and the pad's own,
`tools/sketch/offline.check.js` among them.
`tools/sketch/categories.check.js`, the categories (ST-028), with the pad's scripts that need no paper and
no sketch, and the made-up plot for the ground: the list against the story's table, typed in
row for row — thirty rows, 58 words, each of letters in small and blanks, none of one row
inside a word of another, and the words of ground, of glass and of open air those of before,
to the letter; `categories.of` — a picked key against every name, each of the thirty, of
several boxes the first that says one, and all that says nothing; a name in the order it is
read in, on the names of the card by hand; every word of every row alone, in capitals and in
a longer name; rule 4 — the reading of a name of before there were categories is kept in
the check, and over 163 names `countsAs` answers what that reading answers, and a cut over
the nine that hold "ground cut" and no "ground fill"; `countsAs`, each of the five by `is`,
by a picked category and by a name, `is` before the category and the category before the
name; that a cut holds no ground back — the strip of `tools/sketch/earth.check.js` with its second wall a
cut in the air is the ground of the first wall and the dam alone, number for number and in
as many sweeps, and the cut alone shapes nothing — and that a picked category reaches the
ground; and of the two pages the text: each names `tools/sketch/categories.js` once, in the line before
`tools/sketch/blocks.js`.
`tools/sketch/categories-pad.check.js`, a category and a cut in the pad, on a made-up store and the
made-up plot, as `tools/sketch/counts.check.js` loads the scripts: the one writer, `sketch.categorise`, on
a block of two boxes — the key on both, `is` gone from both, one step that is kept, Undo to
the byte, another key where the first stood, C after it against the category, no key back to
the bytes of before the pick and with `is` left as it is; an object, and a word that no row
has, change nothing and make no step; `sketch.worded`; the key's six steps round from a
picked category, back to the bytes of before; a sketch with what is no key under
`category`, and no word under `is`, read and written back byte for byte; what the pad says,
word for word, in
the side view and from above, of the twelve blocks of the card — what each counts as, by its
category where one was picked, of a cut its floor and no more, and the category in its own
sentence, empty of an object; and the golden file of version 6 that holds every field: its
cut as the pad's own four strokes draw, name, categorise and set it on the file of `v5/` —
the file of `v6/`, byte for byte but for its version, since the file of now has more
— the last of its things, level, on the cellar's level, touching nothing and over the hill,
the one box that says a category, and each of the five words once; and the made-up house as
its file of version 5 as the pad reads it but for its cut, the last of its things, whose
text is typed in — and so not that file.
`tools/sketch/category-list.check.js`, the list beside the paper (ST-028), with the pad's scripts and
`tools/sketch/category-list.js` on a made-up store, the made-up plot and a made-up page that keeps what
is made: the parts — a row right after the pad's words, hidden at first, with the list and
under it the sentence — and the list as it is built: "by its name" first, then five groups
of 22, 5, 1, 1 and 1 entries, each a row of `categories.LIST` by its key and its name, in
that list's order; what it shows of nothing and of an object, hidden, and of a block — a
Kitchen by its name, a name that holds no word of the list, no name; a pick of Bathroom on
a block of two boxes — both say it and nothing else is another, the list stands there, the
sentence says picked, the focus was given back, one step, and Undo to the byte — a pick
against what C had set, which leaves `is` on no box; of the very category that the name
gives; against the name; of the first entry, back to the bytes of before; and of a word
that no row has, after which the list stands where the block is; a name given and a step
of C, which the list follows as the page hands it over; the key K by made-up keys — with a
block shown the list takes the focus and is asked to open, and the key ends there, with
Shift too; typed into a field or into the list, with Ctrl, Alt or the command key, with an
object or nothing selected, nothing; where no script may open a list, the focus alone —
and Escape in the list, heard as the key goes down and as it comes up, with no other key
giving the focus back; the word that `tools/sketch/draw.js` writes on a block without a name, in the
middle of its boxes, and its name on a block that has one, on a canvas that keeps what is
written; and of `tools/sketch/page.js` and `tools/sketch/index.html` the text: `refresh` hands the list what is
selected in the line after it shows the pad's words, `chosen` asks which word stands on the
block, and the script is named once, after all it asks as it loads and before `tools/sketch/page.js`.
`tools/sketch/swatch.check.js`, the colour of the selected block beside the paper (T-029.3), with the
pad's scripts and `tools/sketch/swatch.js` on a made-up store, the made-up plot and a made-up page that
keeps what is made, with a made-up `views.menu` that keeps what it was handed, shows and
hides its part at a click on its button and returns a `shut` that hides it: the parts — a row before the line that says that
nothing is selected, hidden at first, with the swatch, the name and the colours, the swatch
and the colours handed to `views.menu` once, and no listener told to the document — and the
eleven colours, typed in, each by its place, its name and its colour, none marked and none
pressed; what the swatch shows of nothing and of an object, hidden; of a red block, red
beside "red", by whichever box it is selected; of a block whose boxes differ, the colour of
the box that is selected; of a box whose colour the pad has not — a place the list does not
have, none, a word, a place between two — ink, with nothing written; a pick of green on a
block of two boxes — both say it and nothing else is another, one step, the page told once,
Undo to the byte — of the colour it has, no step and the page not told; with nothing shown,
nothing; by the blue box of a block whose other box is red, both blue; on a page that hands
nothing back, the swatch in the colour that was picked all the same; and of ink for a
colour the pad has not, the place of ink in the sketch; the menu shut once nothing is shown,
or an object, by that `shut` and by no click on its button, and left shut where it was shut; the
owner's colours (T-039.3), two listed: after the eleven, in the list's order, each with its value
for `data-colour` and read out by its name, none marked; a pick of one on a block of two boxes,
both in its value, one step, the swatch beside its name and it marked; then, taken off the list,
the value beside the swatch, marked nowhere, and one button of the owner's left; and of `tools/sketch/page.js`,
`tools/sketch/palette.js` and `tools/sketch/index.html` the text: `refresh` hands the swatch what is selected in the line after the
list's, and names it nowhere else; the page takes the tool a pick of the palette names; a
height takes Block; `paint` is named nowhere in `tools/sketch/page.js` nor in `tools/sketch/palette.js` — what a
pick there leaves on is `tools/sketch/palette.check.js`'s to hold, by what the palette does
(T-039.3); no `[data-tool="block"]` is left; and the script is
named once, after `tools/sketch/category-list.js` and all it asks as it loads, and before `tools/sketch/page.js`.
`tools/sketch/object-high.check.js`, the height typed beside the paper (T-035.8), with the pad's scripts
and `tools/sketch/object-high.js` on a made-up store, the made-up plot and a made-up page that keeps what
is made: the parts — a row, a label of a row of controls, before the line that says that
nothing is selected, hidden at first, with a field for figures in steps of 0.05 and the words
"m high"; the row hidden for nothing, a block, a chair and a bed; shown for a counter, 0.9 of
0.85 to 1.1, and for a staircase, 3 of 2 to 4.5, with nothing written; 0.95 typed on the
counter — `high` 0.95 and nothing else another, one step, the page told once, the focus given
back, Undo to the byte; the same value again, no step; 1.3 held at 1.1, 0.2 at 0.85, 0.93
rounded to 0.95 and 1.04 to 1.05; 0.9, the kind's own, removes `high`, the sketch as it was
before any height; `abc`, 0, -1 and nothing typed change nothing and the field shows 0.9; a
staircase at 2.5, `high` 2.5 and `sizeOf` 4 m long, and 9 held at 4.5, 7 m long; nothing
selected, a height typed is none; and of `tools/sketch/page.js` and `tools/sketch/index.html` the text: `refresh`
hands the row what is selected in the line after the gallery's, and names it nowhere else;
the script is named once, after `tools/sketch/shapes.js`, `tools/sketch/sketch.js` and `tools/sketch/swatch.js`, and before
`tools/sketch/page.js`.
`tools/sketch/gallery.check.js`, the gallery of the objects (T-029.4), with the pad's scripts,
`tools/sketch/object-groups.js` and `tools/sketch/gallery.js` on a made-up store, the made-up plot and a made-up page
that keeps what is made — with a canvas that keeps what it is asked to draw, and is empty
again once its width is set: the tiles of `shapes.GROUPS` against the story's table, typed in
row for row with each tile's key, name and size — a kind's, or a named starting size's
(ST-035) by its own name and its kind's size at its sizes, the beds `2 by 1 m`, `2 by 1.5 m`
and `2 by 2 m`, the wide staircase `4.5 by 1.5 m` — six groups in their order, every key of
`KINDS` in one group and in no second, 41 kinds and 43 tiles, each group's kinds its tiles
with a start taken as the kind in whose place it stands; the gallery as it is built — one part right
after what is selected, hidden at first, a heading a group and under it its tiles in the
table's order, each a button with a canvas, the name and the size, a door `1 by 1 m, 2.1 m
high` and a window `1.5 by 0.3 m, 1.5 m high` while the sketch says no figure — and of what
the script made, no image; every tile's picture — drawn on, all of it inside a canvas of 44
pixels square with two pixels to spare, in the paper's ink with its thin line, a canvas
asked nothing that `shapes.draw` does not ask of one — and by hand where ten of them
reach: a tree and a bush from margin to margin, a window a bar of 40 pixels by 8, the wide
staircase's tile the staircase in a wider box, the three beds each drawn at its width, 20, 30
and 40 pixels, a bush one oval, a door not turned; `show('car',
true)` — the gallery shows, what is selected does not, the car's tile is picked and no
other, the button says "Car" beside the car's picture — and `show('car', false)`, the other
way round with "Car" still; another kind, whose picture stands on the button alone; a start,
the single bed, whose name and picture at its width the button has; a screen with more pixels, where a canvas has more of them and the drawing reaches as far; a
door of 2.4 m and a window of 1.2 m in the sketch's figures, which the two tiles say at the
next `show`, shown or not, with nothing written; and a click on a tile, which calls
`onPick` once with the tile's key and changes nothing by itself.
`tools/sketch/gallery-starts.check.js`, the named starting sizes (ST-035, T-035.6), cut out of
`tools/sketch/gallery.check.js` for room, on a made-up paper and store as `tools/sketch/stretch.check.js` makes them:
`shapes.STARTS` against the story's four, typed in — each no key of `KINDS`, of a kind that
takes its sizes (`shapes.known`), in the place of a kind of its own kind's group — and the bed's
name, "Bed"; a pick of each start, of the bed and of `widestairs` set down through
`sketch.apply`, from above and turned a quarter: one step, the kind with the start's sizes — a
single bed a `bed` with `deep: 1`, the wide staircase a `stairs` with `deep: 1.5` — and a kind's
key the kind, each undone to the byte; with no `shapes.STARTS`, a key set down as it is; and the
line of `tools/sketch/page.js` that keeps the picked key, read and asked alone: a tile's key is kept, and
the bed, `widestairs`, a key of nothing and none become the person.
`tools/sketch/gallery-text.check.js`, the gallery's other half, cut out of `tools/sketch/gallery.check.js` whole to
make room for kinds (T-034.1): it loads no script, and reads of `tools/sketch/page.js` and `tools/sketch/index.html`,
which want a whole page, the text: `refresh` hands the gallery the kind and whether Object is the tool in the line
after the swatch's, and nowhere else; a pick takes the kind and the Object tool, and that
is all of it; `tools/sketch/page.js` asks the page for no `$('kind')`; the groups' script is named in
the line after `tools/sketch/furniture.js`, the gallery's after the sketch and before `tools/sketch/page.js`, each
once; the page has no part with the id `kind`, no list and no rule of its own; the one
button of the Objects group is `#object`, the Object tool; and `tools/sketch/pad.css` is named in the
line after `tools/sketch/frame.css`.
`tools/sketch/long.check.js`, a length (ST-034, ST-035, ST-037; versions 8, 9 and 11 of the sketch file), on a made-up store
and the made-up plot, with the scripts that read the paper: that the kinds with a `long` in
`shapes.TAKES`, typed in, in its order — the two staircases first, a length of their own, the
island, the counter, the bathtub, the shower, the sofa, the corner sofa, the table, the desk,
the three kinds of storage, from 0.5 to 6 m, and the thirteen kinds of version 11, from the
wardrobe to the tree — and no other, take a length; `shapes.known` of every kind with none, of each with its kind's own
length, known of those alone, and of what is none — a chair with a length, a cupboard of 0.4, 6.5 and 1.2 m, of
`"2"`, of `null`, of 0, of less, of `Infinity`, and a kind the pad does not have — and of a
cupboard of 0.5, 2.5 and 6 m, and of its kind's own, 1 m; `shapes.sizeOf` with a length and a
quarter on, and a cupboard of 3 m turned, from above, lying across about its middle;
`sketch.adopt` reading every length as it is said, and refusing whole a sketch with one object
of a length that is none; and the cupboard of 2.5 m that the golden file of every part gained
with version 8, made again on its file of `v7/`: set down by the Object tool from above on its
level and given its length in one change — the file of `v8/` as the pad reads it, by that
version's number, byte for byte, kept so, on columns 20 to
25 — and one step of Undo, after which it stands as it was set down.
`tools/sketch/sizes.check.js`, an object's sizes (ST-035, ST-037; versions 9 and 11 of the sketch file), on a
made-up store and the made-up plot, with the scripts that read the paper: `shapes.TAKES` against
the stories' table of sizes, typed in, with the rows of version 11, and each of its ranges holding its kind's own size;
`shapes.known` of each of `long`, `deep` and `high`, of every kind that takes it, absent and at
each end of its range, and refused a step below and above, as a text and as `null` — and
refused of a bed with a `deep` of 1.2, a counter with a `high` of 0.93, a table with a `long` of
2.25, a chair with a `deep`, a bed with a `high`, a staircase with a `long` of 8.5, a spiral one with a
`deep` and a person with a `high`; `shapes.sizeOf` with a depth and a height, turned and not,
and the desk of the file of every part on the paper from above and from the side; a
length of a staircase that says none at 2, 2.5, 3, 3.5 and 4.5 m — 3.5, 4, 4.5, 5.5 and 7 m, worked out by hand —
the wide one's too, turned, and `shapes.RISE_M` equal to `RISE_M` of `tools/sketch/scene/steps.js`;
`sketch.adopt` reading the sizes as they are said, and refusing whole a sketch with one object
of a size that is none; and the desk that the golden file of every part gained with version 9,
made again on its file of `v8/`: one change gives it its depth and then its height — that file
of version 9, by that version's number, byte for byte, kept so — and one step of Undo.
`tools/sketch/distances/model.check.js`, the boundary distances (ST-036; version 10 of the sketch
file), on a made-up store and the made-up plot: `LISTED`, `FROM_M` and `TO_M`, typed in, with no
figure in the list and `{}` of a blank sketch; `of` at both ends of the range and of what is none;
`typed`, taken to the centimetre or refused in its one sentence; `set` in its order, taken away
without a trace, and writing nothing that is none; `label`; and the three distances that the
golden file of every part gained with version 10, made again on its file of `v9/` in three
changes — that file, by that version's number, byte for byte, kept so — and three of Undo.
`tools/sketch/stairs-long.check.js`, a staircase's own length and the kinds that took a size with it
(ST-037; version 11 of the sketch file), on a made-up store and the made-up plot, with the
scripts that read the paper and `tools/sketch/strokes.js` and `tools/sketch/stretch.js`:
`shapes.sizeOf` of a staircase and a wide one that say a `long` of 2, 4.5 and 8 m, at 2.5 and
4.5 m high, turned and not — that long whatever the height — and of one that says none, as
long as its flight at 2, 2.5, 3, 3.5 and 4.5 m, by hand, as before; `shapes.known` of a
staircase's length at 2 and 8 m, refused at 1.5, 8.5, 2.25 and `"4"`; each range that version
11 added to `TAKES`, typed in from the story's table, read at both its ends; `sketch.adopt`
reading a sketch with a wardrobe of 6 m and a staircase of 8 m, and refusing one with a
fridge of 1.5 m; the wide staircase that the golden file of every part gained with version
11, made again on its file of `v10/` in one change that gives it `long` 5.5 — that file, by
that version's number, byte for byte, kept so, on columns 33 to 44 — and one step of Undo;
and from above a staircase 3 m high dragged at its east end four cells out, 6.5 m, its west
end where it was, and four back, 4.5 m with its `long` still written, then at its south side a
row out and back, its `deep` taken away — each drag one step.
`tools/sketch/own-colours.check.js`, the owner's colours and the lines of version 12 of the
sketch file (ST-039), on a made-up store and the made-up plot, with the scripts that read the
paper, `tools/sketch/strokes.js` and `tools/sketch/own-colours.js`: `paper.isOwn`, `named` and
`hex` of 0, 10, 11, `"1"`, `"#3a7bd5"`, `"#3A7BD5"`, `"#3a7bd"` and `null` — the eleven by
their number, a value in small letters by itself, all else ink; `ownColours.of` of a list with
a good entry, one of 31 characters, one of blanks, one alike in another case, one of a value
listed, one with no value, one in capitals, one that is no object and one of 30 characters,
and of no list; `called` of the eleven, of a listed value, of one the list does not name and
of 12; each refusal of `add`, with nothing written, and one written, trimmed, at the end;
`sketch.adopt` of a sketch whose every entry is wrong, the same sketch back and nothing listed;
the gain of version 12 made again — the file of every part of `v11/` as the pad reads it, two
colours added, the cellar painted, a line of four corners on every level and a hidden one
pushed: that file, by that version's number, byte for byte, kept so, read again the same — and
that the two lines make no level and lie on no layer of any plane; `using` of the workshop,
two boxes, painted, beside a line; `remove` of a colour in use — the list one shorter, every
box and line as it was, the value called by itself — and of the last, which takes `colours`
away; and every step undone to the file of `v11/`.
`tools/sketch/palette.check.js`, the toolbar's colours (T-039.3), with the pad's scripts and
`tools/sketch/palette.js` on a made-up store, the made-up plot and a made-up page that keeps what is
made, a made-up `views` that keeps the menu and what the tab is to keep, and a made-up `prompt`
and `confirm` that answer as told; palette.js is loaded anew for each colour that the tab
kept: 3, `"#3a7bd5"` listed — read out as "Sky" — and `"#c0ffee"` not, read out by its value,
each read back and kept again; 11, `"red"` and none, each red; the button's title and colour.
The parts in their order — `#colour`, `#colours-open`, `▾` read out as "Colours", handed with
`#colours` to `views.menu` once; the eleven by their names and colours; `#own-colours`, a row
each of the sketch's two colours, name, value and "Take <name> off the list"; and the label
round `#colour-chooser`, "Add a colour". With Select a pick of green: Block, green, marked,
`#colour` pressed; with Line a pick of Moss and of brown: Line, the colour to draw with that
colour, Moss marked and `#colour` in it and named by it; a click on `#colour` with Line: Block;
with Label a pick of Sky: Block; no pick changes the sketch. A colour chosen with Line: asked
"Name of the new colour: up to 30 characters", added trimmed at the foot in one step, picked,
Line left on; a name alike one listed — the alarm says "There is a colour "Sea" already.",
nothing written, nothing picked; no name — nothing, and nobody told. Sky, in use, taken off:
asked "2 blocks and 1 line are in "Sky". They keep its colour, with no name. Take "Sky" off
the list?" — on no nothing, on yes one step, every box and line as it was, the colour to draw
with Sky's value still, `#colour` read out by it; "1 line is in "Moss"…" for one line alone;
Sea, in use nowhere, taken off unasked in one step; after an Undo the list as the sketch has
it, and every Undo back to the sketch of before; a sketch that lists none, no row and the list
hidden. Each of seven changes to palette.js — a pick held to Block, a question asked where
nothing is in use, no name taken for one, the list not written anew, a kept value of the
owner's not read, "are" for one line, a pick of the owner's not made — failed it.
`tools/sketch/lines/every.check.js` (T-039.4), the lines on every level: `tools/sketch/layers.js`
and `tools/sketch/lines/list.js` on a made-up page that keeps what it is handed, with two levels
each hidden while the other is drawn on, a line on every level, one its own switch hides and
one on level 18 — what `layers.lit()` draws on 18, on 26 and on the ground, and while a section
is picked; level 18's count; the list's buttons, marked, clicked, and hidden with none.
`tools/sketch/lines/recolour.check.js` (T-039.4), a selected line recoloured by
`tools/sketch/swatch.js`, with a made-up Line tool: the row in the line's colour and name, a pick
of the eleven and of the owner's one step each and nothing else changed, Undo, a block as
before, and hidden with neither — `swatch.check.js` unchanged beside it. Both, and the rules of
`tools/sketch/lines/model.js` in `lines/model.check.js`, are told case by case in
`tools/sketch/lines/CLAUDE.md`, "Test".
`tools/sketch/distances/lines.check.js`, the lines at a boundary distance (ST-036, rules 1 and 2),
on made-up outlines alone: a proof of the two rules that shares nothing with `lines.js` but the
distance to a side — each piece walked every centimetre, inside the outline by a ray along its
row and at the distance within 2 cm; every crossing of the distance on a grid of probes every
5 cm, found by bisection, within 2 cm of a piece; every piece closed — on each hand case: the
made-up plot at 4 m and 7.5 m, one piece through its six corners worked out by hand, within 1 mm,
and turned round the same; none at 10.5 m and 30 m; an L with a notch 2 m wide at 4 m, its seven
sharp corners, a place over the notch and on two arcs within 2 mm, and nothing in the notch; a
plot with a waist, two pieces at 4 m reaching `20 - √7` and `26 + √7`, one at 2.9 m; and the
made-up outline with a corner that does not turn and one given twice, the same six corners at
4 m and one closed piece on the sliver 2 cm wide at 9.99 m.
`tools/sketch/counts.check.js`, ground, the fourth thing a block counts as (ST-027), on a made-up store
and the made-up plot, with the scripts that read the paper loaded anew for each view: what
`countsAs` answers of the fourth word — by `is`, against every kind of name, of several boxes
the first that says one of the four, and what says nothing; by a name that holds "ground
fill", alone, in capitals, in a longer name, before a word of open air and of glass in the
same name, and by chance; and what is none, "Ground floor", "Fill" and "Groundfill" among it —
the golden file of version 5 that holds every field: its block of ground as the pad's own
strokes draw, name and set it on the file of `v4/`, that file byte for byte but for its
version, the last of its things, level, on the cellar's level,
touching nothing, and each of the four words once; the made-up house as its file of version 4
but for the version and for its lawn and its cut, the last two of its things, whose texts are
typed in; the
key's round on a block of two boxes, a phrase of the pad for each of
its six steps — the fifth a cut — the bytes of before after the sixth, and Undo the same way
back; a block that
is ground by its name stepped to a room and round again; and what the pad says of ground,
word for word, in two standing views and from above — by its name, set by hand, without a
name, of two boxes whose tops and floors differ, under a top that slopes along the plot and
across it, of a piece cut out of a ramp — beside a room and a room under the same slope, as
they were; and a ramp of ground, a step on, a cut with no word of its top.
`tools/sketch/earth.check.js`, the rule that shapes the ground (ST-027), on the made-up plot and against
figures worked out by hand, a height that a sweep made held to a tenth of a millimetre and
every other to the last figure: what shapes nothing — no things, the eight boxes of the
made-up house, typed in, a block
of ground off the plot and one wholly inside a block of the house; a terrace alone, its 121
grid points at its top, every free point over the hill by less than its downhill corner and
as far as the mean of its four neighbours — and the same ground from a block that is ground
by its name, by another box of its block, and from a box that ends between two lines of the
grid; the edge, a step one cell wide — and an outline
with corners off the grid, one of them pointing inward, on a plot made up for it; a strip
between two walls of the house, where the mean of a column runs out in a straight line, and
under a top that falls as the hill does every point of it; a place of two cells that the
house closes in, its two free points by hand, nothing outside it changed and nothing outside
it felt — and the way that two walls leave where they touch at a corner; tops — of two
blocks the higher, a slope along the plot and across it and held at its floor, a cut, a cut
and a fill in one; those eight boxes with a block of ground before the porch — the lawn that
the made-up sketch has, typed in — every grid point inside the house the site's; and the same ground from the
things in another order. Each ground it works out is held, at every grid point that is not
the plot's ground, to the site's very number — which grid points those are, it says by the
outline's own sides.
`tools/sketch/earth-paper.check.js`, the one ground in the paper, and what `tools/sketch/earth.check.js` had no room
for: before any `settle`, with no `tools/sketch/earth.js` loaded and with no block of ground, `groundAt`
is `realAt` on the grid, between its lines and off the paper; settled, 818 m over a terrace
with the hill beside it under `realAt`; told the same things again — with an object more, in
another colour, under another name, a box of the house higher, in another order — the paper
says no and asks the rule nothing, and told a box of the house moved, a top edge moved, a
top sloped, a block set to a room, it says yes each time; the text of `earth.shapedBy`, by
hand; along the outline the one ground is the site's own under a block of ground that
reaches over every edge; what the rule costs in sweeps — the made-up plot under 400, a plane
of 10 125 grid points under 500 — and on that plane a box that reaches off the paper, read
as far as the paper goes; and each page naming `tools/sketch/earth.js` in the line after `tools/sketch/blocks.js`.
`tools/sketch/earth-shown.check.js`, the shaped ground as the pad shows it (ST-027), in the side view, by
hand, with the ground settled as the page settles it — after every change, with the sketch's
things: a block drawn with the Block tool on the slice along row 30, and set to ground with
the step of the key C. What `land.site` asks of a pen that keeps it, and has no canvas: with
nothing drawn, with the block a room and with it a room again, what a slice asked before the
ground could be shaped — but for where the house of today stands, which no view writes any
more (ST-029) — typed in for four slices: two through the plot's sides along the
grid, ten calls each where they were eleven, one through its two sides askew and one beside
the plot; shaped,
first the thin line, the hill's rows in the faint ink, then the line of the ground — level
along the block's top, the hill's own to the last figure up to the plot boundary and from it
on, and between the two off the hill and nearer to it with every column — and the second
line of words, with all else as ever: so on the slice askew, and beside the plot, where the
two lines are one to the last figure; the tint up to the line of the ground, for a fill and
for a cut, the top edge moved under the hill with Select. A person set down with the Object
tool stands on the ground, its foot at the block's top in both slices, and at the new top
with nothing of its own changed; the pad's words of a place over the ground and under it; how
often the ground was worked out, by what `settle` answered; after each change Undo and redo,
by the grid and by the foot; and of `tools/sketch/page.js` the text: `refresh` begins with the ground,
reads the layers after, and nothing else settles it. And of `tools/sketch/land.js`, the one script that
wrote where the house of today stands, the text: it names neither the words "house today"
nor the site's point for them — and the made-up site has no such point.
`tools/sketch/earth-cut.check.js`, the rule of the cut (ST-028), with `tools/sketch/earth.js` and what it asks alone,
on the made-up plot and against figures by hand — its cases are the capitals of its comments:
nothing shaped; a cut alone, of which only the floor counts; a cut that the hill runs
through; a cut that bites into a fill and its run-out; the second working out, from the
start, with `sweeps` both together, and none where nothing bites; a cut and a block of ground
over one place, and two cuts: the lower; a strip between two walls; a place closed in; the
outline; against the made-up house, and the same things in another order; beside a deeper
pit of ground; two cuts side by side; the text of `shapedBy`; and what it costs, in sweeps.
Every ground it works out is held to the rule at every grid point: the site's very number
where the point is not the plot's ground, the floor where the ground without the cuts lay
over it, the mean of its neighbours where it is free, and nowhere higher than without the
cuts.
`tools/sketch/earth-cut-shown.check.js`, a cut as the pad shows it (ST-028), in the side view, by hand, as
`tools/sketch/earth-shown.check.js` loads the scripts and settles the ground: a block drawn with the Block
tool over the earth on the slice along row 30, and made a cut twice over — by
`sketch.categorise`, and by five steps of the key C — for one ground, 813 m at the 143 grid
points that it reaches. What each of the five things a block counts as offers an object that
is set down on the slice (`standOn`): a room, open air and glass their floor and their top, a
block of ground its floor, as it did, and a cut neither — nor a box that says nothing itself,
of a block that Merge made and that counts as a cut. What `land.site` asks of a pen that
keeps it: the thin line, the hill's rows, first; the line of the ground — level at the cut's
floor, the hill's own to the last figure from a plot boundary on, and under the hill between
the two, nearer to it with every column — the second line of words; and the tint up to the
line of the ground, with paper over it. The pad's words of a place: 3.0 m over the cut ground,
where the hill gave 1.1 m. Two people set down in the cut, near its floor and near the top of
its box, each on `'ground'` with its foot at the floor, in the slice along the plot and in the
one across it — and at the new floor once Select moves it up two rows, to 814 m, with nothing
of their own changed. With the floor at 815 m the hill runs through the cut, and 57 of its
points are its floor; at 816 m, over the hill everywhere, the paper holds no grid, and each
of the four slices of `tools/sketch/earth-shown.check.js` asks its pen what it asks with nothing shaped —
ten things where it runs through the plot, as that check has it. The cut stepped
on with C: a room, on the site's own ground. Undo and redo after every change, by the grid
and by the feet. And the hint of the standing views, with `tools/sketch/layers.js` on a made-up page, for
that alone: its sentence on ground, to the letter, and after it the one on a cut.
`tools/sketch/slopes.check.js`, a top that slopes in the pad, by hand, on a made-up paper and store with the
scripts that read the plane loaded once for each view: the pull in the plane `side` and in
the plane `end` — down by rows, to the floor and no lower, back to the top and to the bytes
of before, the other corner, a pull that goes nowhere, one of a top that ends between two
rows, across a slope that ran the other way, a box of a block, the corner two boxes share —
with Undo and redo of each; what Select does with Shift on an edge, on the middle of a box,
on an object and from above, the same as without; a sloping box moved in each plane, copied,
lifted with its level, made longer and shorter, its top edge and its floor moved, cut from
the side and from above, moved as a block of pieces that share one slope, merged; what the pad
says of a slope, in a standing view and from above, and of a level block from above, word for
word; and what is drawn — the fill under a top, the edge of a block that was cut, the line
across a top looked at along its slope, the arrow from above, the same from behind — on a
canvas that keeps it. It draws no selected block: that the heavier edge stays round the box is
the browser test's.
`tools/sketch/slopes-cut.check.js`, a cut through a box whose top slopes, by hand, on such a paper and
store: the rule alone, `blocks.remains`, of each kind of box, along the plot and across it;
what the eraser and Merge lay of the notch that was seen on the made-up plot, every piece by
its extents, in each standing plane and from above — none wholly over its plane, and less
paper filled than before; a box and a block gone where no piece is left; a level box, a box
under its plane and one that its plane lay wholly under, cut as they were; Undo after each, to
the byte; and the pieces of a cut on one slope, which a pull of one of them leaves to the others.
`tools/sketch/stretch.check.js`, objects dragged to their size (ST-034, ST-035, ST-037), by hand, on such a paper and
store with `tools/sketch/strokes.js` and `tools/sketch/stretch.js` loaded for the top view and the side view:
`sketch.endOf` of a cupboard at each of its four turns and each zone — an end along its length,
a corner counted as the end it lies at, and its sides and middle 'move' — of a chair, and in a
slice; the zone `sketch.grab` gives by the pointer; a cupboard dragged at its east end three
cells further — `long` 2.5, its west end where it was, its middle half way — and back, the
sketch it was to the byte, with no `long`; at its west end, the east end staying; dragged past
6 m either way and to nothing, held at 6 and at 0.5 with its other end where it was, and at
the plot paper's edge on past it, held at 6 m all the same (ST-042); turned a quarter and dragged at its south end and its north; a
copy that keeps its length; a cupboard that says a `long` of its own 1 m, moved by its middle
and still saying it; a shelf grabbed at its side and a chair at its edge, moved and no
longer; and in the side view a cupboard grabbed at its end, moved, and `sketch.stretch` laying
nothing there, nor at a table's corner. Then both sides (ST-035): `sketch.endOf` of a bed (a depth), a
staircase and a table (both), a counter (a length) and a chair (neither) at each of four
turns and each zone, a corner of a desk one cell deep counted as its end and of one a cell
long as its side; a bed dragged at its south
side a row in — 1.5 m, its north side where it was — and back, the sketch it was to the byte
with no `deep`, and a row out, held at 2 m with no step; at its north side past its range, held
at 1 m; a table dragged at its south-east corner a cell out each way, 2.5 m by 1.5 m, and far
past both ranges, held at 4 m and 1.5 m; a desk one cell deep grabbed at that corner and only
lengthened; a staircase widened at its side to 2 m and lengthened at its end three cells, 6 m long, saying
`long` 6, its west end where it was; a
bed turned a quarter, dragged at its east side; a bed that says a `deep` of its own 2 m, moved
and still saying it; and a table copied with both its sizes. Each drag one step, which Undo
takes back to the byte and redo makes again.
`tools/sketch/figures.check.js`: the figures by hand, what is typed and refused, a figure set and set back in
each golden file, the files of versions 2, 3, 4, 5 and 6 read and kept — the same text but for
the version, the tops that slope as they did, one block of each file from version 5 on ground
and none before, one of each file of version 6 a cut, with the one box that says a category,
and none before, and in none a section or a rate — the kinds of before in their
order, a door and a window at changed figures.
`tools/sketch/routes.check.js`: the server's rule on every kind of path it gives and refuses, the mode and
the port, and then the server itself — `tools/sketch/serve.js` as a process on the made-up plot, on a port
the operating system picked, asked over 127.0.0.1 what it gives and what it refuses, and
stopped. Among what it gives are the three stylesheets, `/frame.css`, `/pad.css` and
`/icons.css` (T-029.6), each as `text/css; charset=utf-8`, on both kinds of pad;
and no stylesheet two folders deep, under `/three/`, under a name that begins
with a dot, or under an ending in capitals, `.scss` or `.css.map`. **`/site.js` gets no file**
(T-030.3), however its name is written, on either pad — a name like any other since T-040.4,
which no file has: the server answers 404 — and the pad without `--demo` gives what the made-up pad
gives, on every path of the check, as it is written, in capitals and in small letters: plain
names from this folder on, and none of them `site.js`.
It starts no server but the made-up pad, and reads no plot. **Under `/kept/` it has nothing**
since T-040.5: `/kept/`, `/kept/index.html`, `/kept/plan.json`, `/plots/terrace/kept/` get 404.

`tools/sketch/published.check.js` (ST-044, T-044.2): the pad as the files a plain web host is
given, `published.js`, written into a folder of the system's temporary files, taken away however
the check ends. The pages, `map/index.html`, `three/build/three.module.js`, `three/LICENSE` and
`.nojekyll` are there; no path holds `node_modules`, none lies two folders deep but under
`three/`, and no `example/plot.json`, which `route` does not give; what lies there is what it
says it wrote, and what `route` gives, found anew — each file of the pad and of three.js asked for
by the path a page asks it under — so a file it refuses written, or one it gives left out, fails;
each file's bytes are the pad's or three.js's, `.nojekyll` empty; a second run into the folder
refuses, nothing written. Then on a pad folder of its own making — a file of a kind `route` does
not give, a file two deep, a `node_modules` of the pad's, three.js's `src/`, `.cjs` and `.json` —
those are left out, to the list; a folder that is a file refused, and a pad without three.js
refused into a folder that is not there and into an empty one, nothing written.

Keep and Open kept are `tools/sketch/kept.check.js`'s (ST-025, T-040.5), with no browser and
no server. First the rule of a name, `keptName` of `tools/sketch/store/rules.js`, on every kind
it takes and every kind it refuses — a slash, a backslash, two dots, an encoded one, a dot at
its start, an empty one, one of 81 letters, another letter, another sign — and the rule that
`tools/sketch/kept-ways.js` states a second time for the page says the same of every name.
Then `kept-ways.js` on made-up stores — `held` and `ways` over maps, counting what each is
asked — each sentence to the letter: where a plot's sketches are kept, of a folder and of the
browser; a folder that lets the page write, the bytes there as handed and the browser asked
nothing; a name taken there, the file as it was; a folder that may not be written to, asked
and refused, the sketch kept in the browser and said so, the browser's no to keeping what it
holds said with the plot's first sketch there and not again; every other plot — the example,
`home`, one with a blank — kept in the browser by its id; `persist()` answering yes, and not
answering; a name that is none refused with nothing asked; a store that fails, said. The list:
the folder's first, the newest first and of one moment the later name, then the browser's; a
file under a name the rule does not take counted, not listed; a folder that the browser will
not let the page read asked for leave, and refused, the browser's alone listed and that said.
And a kept sketch opened from the folder and from the browser as "Open file" opens a file —
the golden files of every version the pad wrote, each read as the pad of now writes it, an old
one of one view adding its box, and what is none refused in words — and Undo brings back what
was there; a name not kept, refused in words. Of the text: neither script says `fetch`, and
Keep keeps what "Save file" saves. `tools/sketch/kept.js` makes its buttons and its window,
which the browser tests press.

A plot's file is `tools/sketch/plot-file.check.js`'s (ST-030), with `tools/sketch/plot-file.js` and `tools/sketch/demo-site.js`
alone, nothing running, and no plot read but made-up ones. The three golden files — the
example, `tools/sketch/example/plot.json`, and of `tests/__fixtures__/plots/` the orchard plot, `home`,
and the terrace plot — are each read as their site, figure for figure and in its order of
fields, and that site written is the file, byte for byte: the example's site is the one that
`tools/sketch/demo-site.js` gives, so the script and the file are held to be one plot, and the two others
are typed in. By hand of each: its paper in cells — 92 by 62 and 40 up, 48 by 36 and 24 up, 60
by 40 and 32 up — a height at every grid point of it, the area that its outline encloses,
644 m², 300 m² and 336 m², which is the area that `areaOf` gives, and two heights; of the
example its name, its bearing, its six corners, its two notes and its ground, `1400 − 10 c −
2 r` cm over 806 m at each of its 63 by 93 grid points; of the orchard plot the order of the
format's table, with its point of a house and its two sources, which the terrace plot has
not. The canonical form by hand: the example's 26 914 bytes besides its format's name, which the
release renames, on 127 lines, with one line end
at its end and no other kind, no byte-order mark, a corner on four lines and a row of the
ground on one. The five other folders are refused, each in its sentence — and each is, byte
for byte, the smallest plot as the writer writes it with one thing of that text changed.
Then the format's list, typed in to the letter: each of its sentences on files that the
check makes up — a field left out, of another type, at the edge of what it may be — alone,
and, **the first of the list that holds, on a file that is also wrong in every way the list
names after it**; before them what is no JSON, what is no object and what is no text; the
version as the file writes it, and of a file that writes none; the first field that no plot
has, in the file's order, one of `ground` under that name; rows of the ground by their
count, the made-up plot's own `63 rows of 93 heights` among them; and a number too large to
be finite. What is read all the same: a file on one line, with other line ends, behind a
byte-order mark, with its fields the other way round — as its own object, and written again
in the canonical form — and a plot that says what the page then says in red. The writer:
the fields in the table's order whatever order they came in, with nothing of what it was
given changed; in the reader's words a field that no plot has, another cell, a ground a row
short; and `It does not read back as it was written.` for `NaN`, a zero with a minus, a
hole in a list, a field that is undefined, a ring, a file's own object, and what is no
site. And `areaOf`: the stated area not rounded, and the outline's, either way round. The
smallest plot and what is refused of it are of version 1; a version that is none is said as
`It is a plot of version 4, and this pad reads versions 1 to 3.` — of the folder `of-version-4`,
which was `of-version-3` until version 3 was read (T-042.1). Of the ground the order of two
refusals is `tools/sketch/plot-file-ground.check.js`'s, which reads the text of `ground-short`
with its rows changed: the count of rows is told before the count of heights in a row, and
that before a row that holds what is no number — by hand, two texts of two faults each, and
each fault alone in its own sentence; the list above cannot hold it, for every fault of the
ground sits in the one field `ground`, and a later file writes over an earlier.

Where a plot lies is `tools/sketch/plot-place.check.js`'s (ST-016, T-016.2), with the same two
scripts, nothing running: `originLV95`, the field of version 2. A site that says it is written
as version 2, its place after its bearing on four lines, and read back as the very site, in
its order of fields; one that does not as version 1, the same text without those four lines;
a file of version 2 without it is read, and written as version 1; a file of version 1 with it
is refused, `It holds "originLV95", which no plot of version 1 has.`, and a field too many in
a file of version 2 is said in version 2. Each place that is none — LV03's figures, one
figure, three, a text, `null`, an object, an east of 3 000 000, a north of 2 000 000, a figure
a centimetre under the least — is refused by the reader in its sentence, and by the writer in
the reader's words; `NaN`, `Infinity` and a hole, which JSON does not hold, do not read back
as they were written; the least of each figure and the most to the centimetre are places. The
order: a bearing that is none before a place that is none, a place before a paper, and a
version or a field too many before them all. And the made-up plot's place by hand,
`[2600000, 1200000]`, in the script and in its file, after its bearing, in a file of version 2.

The ground as squares is `tools/sketch/squares.check.js`'s (ST-042, T-042.1), with
`tools/sketch/squares.js` and `tools/sketch/demo-site.js` alone, by hand: a paper of 4 by 4 cells
flat at 100 cm, one square; its middle at 110 cm, `+oooo` — each quarter misses the middles of
its edges by exactly 5 cm — and at 111 cm every grid point a corner; a paper of 5 by 3 cells,
the root of 8, `++oo+oo..+oo..++o.o..+o......`; on a bumped plane, the tree and `cmAt` at a
corner, in the middle of a square, on the line between two squares (the right one's, 21 where
the left's would be 23), on the right and the bottom edge, and beyond each edge; every sentence
of `fault`, each on a ground also wrong in every way after it; the made-up plot's ground, 109
squares of ground and 172 corners, within a hundred-millionth of a centimetre at every grid
point; `walk`; and **Rule 3 at the largest size**: a made-up rough hillside of 1000 m by 1000 m
by the check's own rule — a slope of 0.45 m a metre, six octaves of value noise from 64 m to 2 m,
a bank every 30 m, a ravine every 260 m, 3 cm of relief, whole centimetres — made, read and held
within 5 cm at each of its 4 004 001 grid points, in some 864 000 squares; it takes about two
seconds. A plot's file of version 3 is `tools/sketch/plot-squares.check.js`'s: the two golden files
of `tests/__fixtures__/squares/`, made again at every run by `write` of a site whose ground
`squares.make` made, byte for byte, read back as that site and written back byte for byte;
every sentence of version 3 in its order, each on a file also wrong in every way after it; a
file of version 3 with `ground.rowsCm` and one of version 2 with `ground.squares`; and the
version the writer writes of each kind of site.

The ground in windows is `tools/sketch/windows.check.js`'s (ST-042, T-042.1), on made-up papers:
`around` of two blocks 100 m apart (two windows), 60 m apart (one), touching (one), at an edge
(cut to the paper), off the paper (none), in the order of their corners; `shapers` — the boxes
of ground and of cuts, a group as one block, no house and no object; `shifted`, a slope with
the box. Then the pad's paper on a made-up plot of 200 m by 200 m, not `WHOLE`: a block of
ground of 10 m makes one window of 90 m, its heights `earth.shaped` of that window's land,
number for number, and the ground outside it the site's own, to the last figure; a second block
100 m away makes a second window. On the made-up plot, `WHOLE`, no window and the grid it was.
And the made-up plot as a plot of version 3: `realAt` and `grid()` the plane at every grid point
to a millionth of a metre, the terrace settled to the same grid to a tenth of a millimetre, no
fault — and one with a paper that does not show its ground. Last, the three pages' text:
`squares.js` before `paper.js`, and `windows.js` between them on the two that settle the ground.

The grid that follows the zoom is `tools/sketch/grid.check.js`'s (ST-042, T-042.2), with the
pad's `paper.js` and `grid.js` on the made-up plot, once a view: `stepAt` at every rung of the
ladder, the table of the card typed in to the step and the pixels between two lines — 0.5 m from
32 down to 8, exactly at the threshold, 1 m at 6 and 4, … 500 m at 0.015 to 0.008 — and none at
0.006; `rung` of 13, 40, 0.007 and 0.001 (12, 32, 0.006, 0.006); `next` held at both ends; and
`floor` and `round` at 0.5 m on every whole cell and at 5 m on the lines worked out by hand —
from above columns 8, 18 … and rows 6, 16 … (`floor(150.3, 0)` 148, `floor(39.7, 1)` 36,
`round(12.9, 0)` 8), in the front view, flipped, columns 6, 16 …, in the side view rows 2, 12 …
up it — and never −0. And `tools/sketch/snap.check.js`, drawing that snaps to the grid shown
(Rule 2), with the pad's scripts from above and the Line tool on a made-up canvas: at 5 m a box
drawn from (150.3, 20.4) to (189.6, 39.7) and the Eraser's box are `x: [148, 198]`, `y: [16,
46]`, its reach the stroke's — wholly past the made-up paper's 92 columns; on the same box 120
columns nearer an east edge dragged by 7.2 cells ends on the line
88, a corner on (88, 6), the block moved by 13 cells goes by 10 and by −16 by −20; a chair goes
by the cell; a line's point at (12.9, 20.4) is (8, 16), with Alt (12.9, 20.4) and the
centimetre; at 0.5 m each as before, the cell under the pointer; and across the paper's edge
(ST-042, T-042.3) a box drawn from 88.4 to 100.2 keeps columns 88 to 101, its east edge dragged
30.6 on lands on 132, its west edge 130.2 back on −42, and moved by 300 columns and −90.4 rows,
dragged and kept, it lies on 388 to 401 and −70 to −50; every box on whole cells.

And `tools/sketch/plot-routes.check.js`, the rules of a plot in `tools/sketch/routes.js` and
`tools/sketch/store/rules.js` (ST-030, ST-040), with nothing running: the six constants, typed in, and the example
where `EXAMPLE_FILE` says — read there, by the one reader. `plotName` against `keptName` on
every kind of name that `tools/sketch/kept.check.js` tries, typed in again, the pad's own two among those
it takes; and the made-up plots of the tests as a folder of plots, each under a name that a
plot can have, `home` among them, with its file and no kept sketch. And of `route` the map's
page, on both kinds of pad (T-041.4, moved here from `tools/sketch/swisstopo/hosts.check.js`):
the page and what lies beside it on `pnpm sketch`; on the made-up pad `NO_PAGE`, `{ status: 204 }`,
for the page alone, by whatever query, and nothing else of its folder; under other letters than
its own nothing on either; and `/new-plot/` nothing on both. `plotsIn` and its cases went with
T-041.4, `plotOf` and `noPlot`, and theirs, with T-040.5. It reads the example and the names
of the made-up plots' folders, and of `design/` nothing. **Both checks were tried with the two modules broken a line at a
time** (T-030.1), each of 113 breaks alone — a comparison turned, a guard left out, two fields
swapped, a sentence reworded: a check failed each time. `sentOn`, `keyOf` and `scriptOf`, and
their cases here, went with T-040.4.

The server is two checks' that start it (T-030.3, T-040.4, T-040.5, T-041.4), each told its port
alone — no copy of plots any more: the server reads none, and makes none — and holding what the
pad says as it starts, its one line. `tools/sketch/plots.check.js`, and `tools/sketch/plots.js`,
went with T-040.5: the server reads no plot, and keeps no sketch.
`tools/sketch/plots-served.check.js`: the server told its port alone, started in a folder of its
own in the system's temporary files, which it leaves empty. **It is a plain file server** (T-040.4): every
page, script and stylesheet that the three pages name — read off the pages, so that a script
that is added is asked for too — and three.js under `/three/`, each the file on the disk;
**and no plot**: `/site.js` under every spelling, `/plots/`, every page, script and stylesheet
under `/plots/terrace/`, `/plots/example/` and a plot there is not, an address without its
slash, a plot's own file and a kept sketch by its place on the disk — each a 404, with no
`location`: nothing is sent on. A query is never read: `/?no-plot=terrace` is the pad's page, as
`/` is. **No kept sketch** (T-040.5): under `/kept/` and `/plots/<id>/kept/`, by GET, PUT, POST,
DELETE, HEAD, OPTIONS and PATCH — 404 by GET and 403 by every other method for the pad's own
page, an address typed in, a request with no word of the browser's and another site's page that
opens the pad; 403 by every method for another site's page that asks, and under another host
name — and no folder of kept sketches made in the system's temporary files; and
**no request at a plot's address writes a plot**, makes one or takes one away — by PUT, POST,
PATCH or DELETE, with the example's file for its body — and **no plot made** (T-041.4):
`/new-plot/`, under four spellings, 404 by GET and 403 by every other method, as any path is;
and the map's page, the file. Then **the made-up pad**: it gives the same files and the same
nothing, and answers `GET /map/index.html` with 204, no body and no type. Each pad says its one
line and nothing more: `The sketch pad: <origin> - Ctrl+C stops it.`, and on the made-up pad
`The sketch pad, on the made-up plot: …`. Nothing is written where the pad was started, and of
this checkout **nothing under this folder is another file than before, and nothing of `design/`
changed** — each by the names, the sizes and the times of all it holds, asked and never
printed. And of `tools/sketch/serve.js` the text: of the pad it imports `routes.js` alone, and it
names no `design`, no `PLOTS`, no `ASKS` and no `new-plot`.
`tools/sketch/plot-keys.check.js`: the pad's scripts on made-up stores and a made-up page, loaded anew
as a page of a plot loads them — with the plot and its key, `PLOT`, set before them, as
`tools/sketch/boot.js` sets it — and with no `PLOT`, by hand. The whole store after a change: with no `PLOT`, and on `home`,
the first key alone is written, and what a plot keeps is untouched; on another plot the
page opens on what the plot's own key holds — nothing of the first key's, no sketch of
before — and a change writes that key alone, with the first key, what is set aside under it
and the sketches of before as they were, to the byte; a text that the pad cannot read is
set aside under its own plot's key. The sketches of before, brought over on the first key
and on no other. The tab's steps and what it showed: what each writes as the page goes, to
the letter — with `of` on a plot's key, and on the first key the text that the pad wrote
before — and what a page takes up, over nine pairs of what the tab kept and the plot that
the page shows; that taking up writes nothing; that a page of another plot writes its own
into the slot, so that the first one's are gone on the way back; and that they stay
through another view of one plot. The kept sketches go by the page's plot too: since
T-040.5 `tools/sketch/kept.check.js` holds it, and Keep asks no server. A plot that states no area shows its name alone in the toolbar, from
above and in 3D, and has no alarm; one that states an area is held to it to a square
metre, in the words that were. And **a page whose first script did not come says so**: the
page's last tag is `boot.js`'s (T-040.2), with an `onerror`, run here on a made-up page and
writing its sentence into `#alarm`, to the letter; the tag of `site.js`, the first script of the
template of `tools/sketch/index.html`, is the plot's place, `<script src="site.js"></script>`, with no
`onerror` since T-040.4 — `boot.js` puts `demo-site.js` there, or nothing. Of `tools/sketch/page.js`
and `tools/sketch/view3d/read.js`, which gained no line, it holds the text: each hears another window
by the key of the page's own sketch.
**The three were tried with the scripts broken a line at a time** (T-030.3), each of 99
breaks alone — in `tools/sketch/routes.js`, `tools/sketch/plots.js`, `tools/sketch/serve.js`, `tools/sketch/sketch.js`, `tools/sketch/views.js`, `tools/sketch/paper.js`,
`tools/sketch/kept.js` and the page: a guard left out, a key swapped, a plot taken for another, a
sentence reworded — and a check failed each time: one of the three, or `tools/sketch/kept.check.js` or
`tools/sketch/routes.check.js` beside them. No break was one that would have a server hand out a file
named `site.js`: while the owner's plot lay in this folder under that name, no check and
no try of this task had a server that could read it.

Open plot is a check's (T-030.4), and the plot shown last another's (T-040.2), each with a browser
test (below). `tools/sketch/boot.check.js`: `tools/sketch/boot.js` on made-up pages, loaded anew for each case
— the tab's note and the browser's last, what the browser's store holds — with each
page's own template, read off the page, and a made-up `store/held.js` handed in the store's place:
`boot.js` imports from where it lies, and there it lies in a folder of the system's temporary
files, beside that store and a `plot-file.js` that is the pad's own. By hand: of each page with
nothing noted the example, at once (T-040.4): every script of its template in its order and
with its attributes, `demo-site.js` in `site.js`'s place, each `async` false, its `PLOT` under
its own key set before them, nothing noted and the store of plots not asked; the 3D page's
module with its type and its `onerror`; the mark only on the last one's load, the id of the
page's `PLOT`; the sixteen pairs of notes — none, empty, `example`, a held plot — showing what
`shownOf` of `tools/sketch/store/rules.js` says, and the example where it says none, both notes
written where they said another or none, and none by the example of nothing noted; the example
noted, as with nothing noted, and noted in both; a held plot read by the one reader, its `PLOT`
set before its scripts, which have no `site.js`, `home` under the first key; `GONE` and both
notes out where the plot is not held, does not read, or the store fails, and the example; a
store that will not be read, asked or written changing nothing and throwing nothing. And of the text:
`TAB`, `LAST` and the example's key are those of `tools/sketch/store/rules.js`, and `boot.js` names no
machine. Tried broken twenty ways, a line at a time — a key, the order, a note, `async`, the mark,
`PLOT` after the made-up script — the check failed for every one.
`tools/sketch/open-plot.check.js` (T-040.3): the first half of `tools/sketch/open-plot.js`, the words of the
window of the plots, loaded on a page that keeps what is made, by hand — and nothing is asked of
any server. The small words of each kind of entry: the made-up terrace plot's file read and made a
record by `recordOf` of `tools/sketch/store/rules.js`, of the file way, `336 m², opened 2026-10-20, this
browser`, and of the folder way, `…, the folder terrace`; `shows now` of the plot of that id and of
no other; the example, `the example` and `the example, shows now`, its name that of
`tools/sketch/demo-site.js`; an area to a whole square metre. The order, the newest opened first,
of one day by the id, the example last — as `heldOrder` has the held plots — with what it is
handed left as it was. Every sentence of the window, to the letter. The two notes that the
script states a second time, those of `tools/sketch/store/rules.js`. **File's entries as the script
makes them**: whatever plot shows (T-040.4), `GET map/index.html` asked once, from where the
page is (T-041.4) — at `/`, `/3d.html`, and under a path of its own, `/blockplot/`, its own
folder's — and its 200 puts "New plot" after "Open plot", seven in their order; the made-up
pad's 204, a 404, 403, 500 or no answer, six. A click on "New plot" goes to `MAP_PAGE`, by the server's own rule (`route`)
the page of a new plot, from the pad's own address. A pick, as `go`
makes it: both notes the id, the page loaded anew where it is with the view's hash, what is to be
said riding `history.state`, and the address not touched — none names a plot. As the page opens: GONE's sentence and what rode the history entry said, in that order —
taken out of the entry, what else it held left — the window open, and a store that cannot be
listed said; with neither, no window. And of the two pages the text: each has the plot's
place, `site.js`, first in its template, and `tools/sketch/boot.js` once, last; the pad's page names
`tools/sketch/open-plot.js` once, in the line after `tools/sketch/kept.js`, and `tools/sketch/open-plot-ways.js` once, in
the line after it; `tools/sketch/3d.html` names neither; `tools/sketch/open-plot.js` asks in one place,
`fetch(NEW_PLOT)`, `NEW_PLOT` being `map/index.html`, and names `/plots/` and `/new-plot/` nowhere, and the ways ask nowhere, and neither takes a note
away. Tried broken thirteen ways, a
line at a time — a word, the order both ways, the rounding, the guard of the server's `PLOT`, the
status, the reload, the address of a server's plot, the history's word, a note — the check failed
for every one (T-040.3; the guard and the address went with T-040.4). The window and its two ways are `sketch-plots.spec.ts`'s.
**The three scripts were tried broken a line at a time** (T-030.4), each of 104 breaks alone
— 25 in the script of the plot shown last of then (gone since T-040.2), 72 in `tools/sketch/open-plot.js` and 7 in the one line of `tools/sketch/kept.js`: a guard
left out, a key or a word changed, a comparison turned, a part of an address dropped,
`assign` for `replace` and the other way round. A check failed for 61 of them — every one
in that script, in the first half of `tools/sketch/open-plot.js` and in `tools/sketch/kept.js`:
its check of then, `tools/sketch/open-plot.check.js`, `tools/sketch/plot-keys.check.js` — and a browser test of
the plots for each of the other 43, all in the window's half of `tools/sketch/open-plot.js`, which no
check loads on a page that keeps what is made: the window, its order, its marks, what a
pick does and what it says of a plot that is not there are held in a browser alone, and so
by `pnpm e2e:sketch` and no fast gate. Listing the breaks showed five things that the
browser tests did not hold as they were first written — a pick by `replace`, a window that
is not a window of its own, a "Close" that closes nothing, a list left standing while the
window asks, and all that stands after `?` dropped with the word: they gained a case for
each, before the breaks were run.

And `tools/sketch/unread.check.js`, invariant 9 on a made-up store, paper and page: a text that the pad cannot
read — cut short, of another `space`, with a kind it does not know — is under a key of its own,
byte for byte, after a stroke, a file opened, an undo or a slice moved, with the new sketch
under the pad's; two such texts are both kept, and one is not set aside twice; a store that
takes no more is not written to, and the pad says so; a sketch that the pad can read sets
nothing aside, and is written once for each change; a page that loads the pad's scripts and
changes nothing — as the 3D page does until a figure is typed there — writes nothing and sets
nothing aside, and neither does an Undo to a step that the pad cannot read, which is dropped;
an Undo to a step that the tab kept from a pad of the version before is kept as a sketch of
this one; and `files.offer` says what the alarm is to say, with a button for each text
that saves its bytes.
Of `tools/sketch/page.js`, which wants a whole page to load, it holds the text alone: that the offer is
called once the alarm's words are written. It loads the pad's scripts with no `PLOT`, so
all of it is of the first key, and it was not changed for the plots (T-030.3): that a
plot's text is set aside under the plot's own key is `tools/sketch/plot-keys.check.js`'s.

And `tools/sketch/views.check.js`, the rule for a key, on a made-up page and made-up keys: `views.typing`
says yes of every kind of field and no of a checkbox, a radio button, a slider, a button, a
link and the page; the switch's own listener, on both pages, goes to no view for a 2 or a V
typed into a field, and to its view for the same key on the page. And a menu (T-029.2), of
two made-up parts that keep what they are told and who listens to them: the script makes the
File menu of a page that has its two parts, shut; a click on the button opens it, says so on
the button and gives the first entry that is not off the focus, and a second click shuts it;
open, `typing` says yes of a key pressed on each of the thirty-two things, with whatever is
held, and the switch goes to no view for a 2 or a V; Escape shuts it, gives the button the
focus and ends at the switch's listener — and shut, an Escape goes on; a click on an entry
shuts it, heard by the part and by no entry, and a click on a word or on an entry that is
off does not; the pointer down elsewhere shuts it, and so does the focus gone elsewhere, and
neither does on the button or in the part; a second menu shuts the first as it opens, and
the first the second; shut, every answer is that of a page with no menu; and the document
is told of one listener for keys, as it was, one for the pointer and one for the focus. Of
`tools/sketch/page.js` it holds the
text alone: its listener asks the rule first, and its one field, the height of a block,
gives the focus back — the list of kinds, which was the second, went for the gallery
(T-029.4). `tools/sketch/views-menu.check.js` holds the rest of a menu (T-000.24), on such a page
whose window keeps the listeners it is told: `views.menu` returns a function that shuts its
own menu where that is open, with the focus where it was, and leaves a shut one shut and
another that is open open; the window is told of its `blur` once, and the document of the
same three listeners; the window's blur shuts the menu that is open, whichever it is, and with
none open does nothing; and once either has shut a menu, `typing` says no, and the next click
on its button opens it.

The right button's menu and the keys that erase (T-037.5) have three checks, and several
selected, Copy and Paste (T-037.6) a fourth.
`tools/sketch/selected.check.js`, by hand on a made-up paper and store as
`tools/sketch/stretch.check.js` makes them: `sketch.remove` of a box of a block of two — both
go — of an object, of two of a block and an object at once, and of nothing and of a thing
not in the sketch, which change nothing; `sketch.toLevel` of an object to another level, to
the ground and from it, and of a block of two boxes, one of whose tops slopes, up six rows and
down twelve — every box by as many, the slope with it, the box beside it where it was — and
to the level it stands on, which changes nothing; refused, with why and nothing changed, for
the block to the ground alone; to a level that puts its top above the paper, row 15 — the
slope's top in row −1 — and its floor below it, row 73, it goes as to any (ST-042). Each change is one step that Undo takes back
to the byte. `tools/sketch/check-right-menu.js` is no check, by its name: the made-up page of
the other three — from above, or in the side view where `SKETCH_VIEW=side` asks it — the pad's scripts on the made-up plot and store, a page whose parts keep what
is made, said and listened for, and answer the few questions the scripts ask, every part 200
by 300 pixels, in a window of 1280 by 800 — and a made-up sketch on it: a block of two boxes,
a box alone and a person on row 40, a box on row 30 and a chair on the ground.
`tools/sketch/right-menu.check.js` holds the entries: of a box where the sketch has no
sections — Delete, Copy, Duplicate, Section ▸ off with why, Category ▸, Move to level ▸ — its two
levels, its own marked and off, and no ground; its categories, "By its name" marked, then the
words of the groups of the list beside the paper over the rows of `categories.LIST`, in its
order; of a person — Delete, Copy, Duplicate, Turn, Move to level ▸ — with the ground; of a tall box
the level that takes it off the plot's paper on, and picked, taking it there (ST-042); each pick one step that Undo takes
back — Delete of a box, its whole block, after which nothing is selected, and of the person,
Turn, the person to the ground, the block up ten rows, a category picked and marked and "By
its name" back, Garage of two sections, the one marked before "In no section"; Duplicate of the
person and of the block, one cell right, the block in a group of its own, the copy selected;
and `rightMenu.placed` at the four corners of the window, in its middle, on both sides of the
edge, for a menu taller than the window, and in a window narrower than place and menu.
`tools/sketch/right-menu-keys.check.js` holds the rest: a right press on the box alone selects it,
opens the menu where it was pressed, gives Delete the focus and keeps the press from giving it
anywhere else; open, `views.typing` says yes, and Delete erases nothing; Escape shuts it, the
focus where it was; a right press on the empty paper opens its menu and selects nothing, and a
left press opens nothing. Delete and
Backspace erase what is selected, whole, as one step, and nothing is selected after; with
nothing selected, with Ctrl held, or typed into a field, nothing changes. And the menu with no
button: a pointer down inside it leaves it open, one outside shuts it; Escape gives the focus
back to the control that had it; near the window's right edge it opens left of the place, and
an entry that opens a list shuts nothing, its list left of the menu with its first entry
focused, and right of it at the window's left; a pick in the list is one step and shuts it;
and the File menu, opening, shuts it.
`tools/sketch/selected-several.check.js` holds several selected, Copy and Paste (T-037.6). From
above: Ctrl+C from a text field copies nothing, and the empty paper's menu then offers "Select
all on this level" alone; Select all takes the block of two once, by its first box, the box
alone and the person — not the box of the level above nor the chair on the ground — and not
the box alone once a hidden section holds it. The menu of a block and an object has every
entry, of two blocks no Turn, of two objects neither Section nor Category; a right press on the
second box of a block whose first is among several opens the menu of all of them, which stay
selected, and on a thing among none selects it alone. Each pick of several is one step that
Undo takes back to the byte: Delete, by the menu and by the key — the block whole, the box and
the person; Duplicate, each one cell right, the block in a group of its own, the copies
selected; Turn, each object and no box; Garage for two blocks, "In no section" marked before
and Garage after; a category on every box of both, marked after; Move to level by the rows of
the thing pressed — the box alone and the box above, ten rows up each — the level of the
thing pressed marked, and the level that takes a tall box off the plot's paper on, which takes
it there with the box alone (ST-042). Copy, no step, of a
block of two and the person, pasted on the level of row 30 at [70.4, 50.7]: the middle of them
all on that cell, 50 columns and 30 rows on and ten rows up, the block in group 2 and the person
on row 30, both selected; pasted again, group 3; far past the plot's paper, at [370.4, 320.7],
300 columns and 270 rows further, group 4; on the ground off with "A block stands on a
level, not on the ground" and nothing pasted, and the person alone pasted there on the ground;
a block's section kept where the sketch has it, and dropped where it was taken away. Ctrl+C on
the person and Ctrl+V with the pointer on the paper paste it there, one step; Ctrl+V from a
field and once the pointer has left the paper change nothing. `footer.several` of three, and of
one or none. Then, in a process of its own on the side view: Select all in this slice, and the
block pasted 50 columns along, its heights and its place across kept, in a group of its own —
and on column 340.6, 320 columns along, far past the paper's end (ST-042).

`pnpm e2e:sketch` — `tests/e2e/sketch*.spec.ts`, in two of Playwright's projects against
`pnpm sketch --demo`: `sketch`, every file but the 3D page's, on Playwright's default of workers, and
beside it `sketch-3d`, `sketch-3d*.spec.ts`, no more than three files at once, for each of their
browsers draws WebGL on the CPU (T-000.29) — and, in the tests of the map and of the marking, against a pad that each case
starts for itself, on made-up plots (below): it builds nothing and binds port 4765, one run at a
time. No gate
runs it: `pnpm verify` has the same tests in `pnpm e2e`, beside the web app's (`tests/CLAUDE.md`).

- `sketch.spec.ts` — each view opens on the made-up plot with no alarm, no error and no request
  to another origin, the top view lists the levels of the made-up sketch — three, the cut the
  fifth block on the one at 814 m and the lawn alone on the lowest, and the ground — that
  sketch opened
  and saved again is the same file, and no file is named `site.js`, under whatever case — 404
  — while the page loads `tools/sketch/demo-site.js` in its place, byte for byte, and never asks for
  `site.js` (T-040.4); and the canvas is the window, as large as it shows, at a whole number
  of pixels a cell (T-042.3)
- `sketch-frame.spec.ts` — the frame of the two pages (ST-029), with the made-up sketch: which
  place holds which control. In each of the pad's five views the toolbar's five groups by
  their names, in their order, each read out by its name and with that name written under it
  — but File, which is one button with no word under it, named by that button, shut, with its
  entries in the part it opens — then Distances, which stands in no group, with its drawing
  where a group has its word (T-036.3), and the title; every control in its place and in
  its order — File's entries read Open file, Open kept, Open plot, Save file, Keep, Picture
  (PNG); the Block group holds two things, the field of a height and the colours — `#palette`,
  with `#colour`, `#colours-open` and `#colours` in it (T-039.3) — and no
  `[data-tool="block"]` is left (T-029.3); the Objects group holds one, the button
  `#object`, which is the Object tool, with its picture and its name in it, and no `#kind`
  is left (T-029.4); `#distances` stands first in `#right`, before `#selected`; the row of the
  swatch stands in `#selected`,
  after the row of the list and before the last line, with its three parts in it, and after it
  a selected line's panel, `#line-row`, with `#line-levels`, `#line-every`, `#line-shown` and
  `#segments` (T-039.4); the lines on every level, `#every-lines`, stand in `#left` after
  `#layers`; the
  gallery stands in `#right`, after `#selected`, and does not show; the
  left side wholly left of the paper's place and the right side wholly right of it; from
  above the levels and a field for
  a block's height, standing up the slice and no such field; and −, +, ◀, ▶, ▲ and ▼ each
  answering to a name in words, and `#fit`, after `#larger` in the View group, to "Zoom to fit"
  (T-042.3). From above and in the side view: with nothing selected
  "Nothing is selected." and no words of the pad, no list and no swatch, with a block
  selected the other way round —
  and the paper where it lay, to the pixel — its corner, and the canvas's left, right and top,
  for the canvas's foot moves with the line under it — the right side where it was and as wide. On the 3D
  page the five groups by their names, File and View first, after them the one button that
  stands in no group, Settings — which has its drawing where a group has its word, `""` and
  no `none` (T-029.6) — and every control in its place: File's entries read Picture
  (PNG), 3D file (GLB); the levels alone in the left side, the figures in the right
  (T-029.5) — that the one lies wholly left of the stage and the other, opened, wholly right
  of it is `sketch-3d-header.spec.ts`'s.
  It clicks one block and presses nothing else: what a control does is every other test's
- `sketch-look.spec.ts` — the one look of both pages (T-029.6), with the made-up sketch, in a
  window of 1440 by 900, by what the browser works out of a part (`getComputedStyle`) and by
  no picture. The pad, from above and in the side view: its five groups show with nothing
  clicked, all on one line; File, the seven views, the five tools and Distances are squares — each 50
  pixels high and as wide to a few pixels, its `::before` a drawing 20 pixels each way with
  a picture written out as text, its word written at 11 pixels — and Undo, Redo, the two
  that zoom and Zoom to fit (T-042.3) are 24 pixels each way, with a drawing and no word to see, answering to their
  names; the button of the Objects group is as high and wider, with its picture and its
  name. No control of the toolbar has a border, and **what has the ink for its ground and
  white words is exactly what is chosen**: the top view and Select as the pad opens; File
  too while its menu is open, and no entry of it; Line in Select's place, and still Line once
  blue is picked in the colour menu (T-039.3); no tool at all once `#colour` is clicked; the
  button of the Objects group after O. The switch of views has a ground of its own, neither
  none nor the toolbar's; the colour to draw with has no ring with Select; in the menu its
  arrow opens the eleven are round and as wide as high, red, drawn in, alone with a ring in the
  ink; teal picked, `#colour` alone has a ring in the ink, round and as wide as high; an open menu leaves the toolbar as high and the paper where it lay, lies out of
  the flow and above it, reaches under the toolbar's foot, and has a shadow. Tab goes
  through the twenty-one controls of the toolbar — the colour and its arrow where the eleven stood that are not off, in the order of the
  page, the button of the Objects group and Distances last, and each has a ring of 2 pixels in the ink while it has the focus. And words on
  their ground are told apart by 4.5 to 1 at the least, worked out in the page from the two
  colours: every control of the toolbar, a chosen one, the name of a group, the words after
  the height, the plot's name, a menu's entries and its small word, a level's name, how it
  shows, what stands on it, and every heading, line and button of a side — **and Undo, which
  is off, by less than that: the case can fail**. On the 3D page, with a stage: the same
  ribbon of eighteen squares on one line, three tracks, Tab through its nineteen controls,
  the switch of the ground among them; 3D, the way that shows and Front, the stand
  the page opened at, in the ink, Settings too while they are open and File while its menu is; and its words on their grounds. Tried
  with sixteen rules of the stylesheets broken one at a time — a border, no track, two
  lines, a drawing gone, a wide square, a second thing in the ink, no ring, fainter words, a
  menu in the flow, a square colour: the test failed each time
- `sketch-menu.spec.ts` — File is a menu (T-029.2), with the made-up sketch. On the pad's
  page: shut, no entry answers to its name; a click on File shows the six entries in their
  order, "Open plot" the third (T-030.4), one under the other and under the button, "Export"
  before the last, the first with
  the focus — and the toolbar is as high and the paper where it lay; a second click shuts it.
  With a block selected and stepped with C: open, B and O take no tool, 2 and V go to no view,
  K gives the list no focus, C steps nothing, Page Down goes to no level and Ctrl+Z undoes
  nothing; Escape shuts the menu, gives File the focus and leaves the block selected; then
  Ctrl+Z takes the step back, B takes Block — one colour shows pressed, for Block has no
  button — and an Escape leaves nothing selected. A click on
  the word "Export" shuts nothing; a click on the paper shuts the menu and selects the block
  there; a click on another tool shuts it and takes the tool; Shift+Tab from the first entry
  goes to File, and Tab from the last out of the menu, which shuts. "Open file" opens the
  golden file of every part by the file chooser, over the made-up sketch, and Undo brings
  that one back; "Picture (PNG)" saves `sketch-top-Level 817 m.png`, a PNG as large as the
  paper, and after that pick B takes Block: the keys are the page's again. And **the switch
  of views stands where the pad has it**: File and the seven links lie
  at the same pixels in the pad's top view, in its side view and on the 3D page — left, top,
  width and height of each — in a window of 1440 by 900 and of 1280 by 720, with a stage and
  in a browser that gives no WebGL, where File is not seen. "Save file" through the menu is
  `sketch.spec.ts`'s, Keep and Open kept `sketch-kept.spec.ts`'s, and the 3D page's entries
  `sketch-3d-header.spec.ts`'s
- `sketch-file.spec.ts` — a file of version 2, one of version 3, one of version 4, one of
  version 5 and one of version 6 each open as they did — the last two with their lawn alone on
  a third level, the last with its cut a fifth block of the lower one — and are
  saved as files of version 7; a figure, a wide staircase, two tops that slope, a block of
  ground and a cut with the category that was picked for it are what the pad reads of a
  sketch and what it saves; the wide staircase and the five kinds of furniture are picked in
  the gallery — O, and a click on the tile — and set down. What a tile says, its name and
  its size, is read as the list of kinds said it, in one line: a window of 1.2 m by the
  sketch's figure, with the gallery shown and Select taken again after; the five kinds of
  furniture one after the other, from the sofa on; the wide staircase after the staircase —
  a named starting size (ST-035), `widestaircase`, which sets down a `stairs` with `"deep":1.5`
  on nine cells by three, and turned on three by nine.
  What the pad says of ground and of a cut at each step of C, word for word, is
  `tools/sketch/counts.check.js`'s, and of a category `tools/sketch/categories-pad.check.js`'s: `sketch-ground.spec.ts`
  presses the key, and `sketch-category.spec.ts` picks a category from the list
- `sketch-slope.spec.ts` — with the made-up sketch, in the side view a top corner of the night
  rooms is pulled with Shift: the sketch that the browser keeps says the slope of that box,
  the pad says which way its top falls and how a top is sloped, the paper is the paper's
  colour over the line of the top and the block's under it, the area beside the paper is what
  is filled of that colour — 15 m² before, 10 m² after: no check asks `tools/sketch/layers.js` for an area
  — and the
  heavier edge of what is selected stays round the box; Undo has the file again, byte for
  byte; "Save file" saves the
  slope, and a reload shows it; the top view has the arrow, its head at the lower end; in the
  front view a top is pulled across the plot and back up to nothing, the file again; and
  without Shift the corner makes the box larger. It finds its box in the file by where it
  lies, and asks of that box alone whether it says `slope`
- `sketch-ground.spec.ts` — the shaped ground (ST-027), with a sketch of its own, nothing
  drawn, so that it holds whatever the made-up house gains: in the side view a block is drawn
  with the Block tool — taken by its key, B, for it has no button — selected, and stepped
  with C until the pad says "ground, set by hand"
  and where its top lies. The sketch that the browser keeps says `"is":"ground"` of it; the
  paper beside its downhill end takes the tint of the ground, where it was paper; and the pad
  says of a place over it 1.0 m above the ground, where it said 4.1 m — a figure held to a
  decimetre, for a pointer is a pixel off. Its top edge pulled under the hill with Select
  leaves paper where earth was, and 6.0 m; Undo and a reload show the ground as it was; a
  slice eight rows on says a height between; from above the block is a block in its colour;
  and the hint beside the paper says how a block shapes the ground: that sentence, in a
  browser — `tools/sketch/earth-cut-shown.check.js` holds it on a made-up page, with the one on a cut after
  it, which `sketch-3d-cut.spec.ts` reads in a browser
- `sketch-category.spec.ts` — the list beside the paper (ST-028), from above, with a sketch
  of its own on one level, so that it holds whatever the made-up house gains: a block
  without a name, one named "Kitchen / Dining", one named "Day rooms", and a car. With
  nothing selected there is no list, and K changes nothing; of the kitchen the list stands
  at its first entry, "By its name: Kitchen", over "Category: Kitchen, by its name." — and
  has that entry and thirty more in five groups; of the day rooms "By its name: no
  category"; of the car, no list. Bathroom picked for the block without a name: the sketch
  that the browser keeps says so of that box and is otherwise the text it was, the pad says
  "a room, by its category" and "picked from the list", the focus is the page's — a B takes
  the Block tool, so that one colour shows pressed where none did, and picks no Bedroom —
  and with nothing selected the paper has ink in the
  middle of the block where it had none; Undo has the text of before. Balcony, C, Storage
  and the first entry: open air; a room set by hand, with both in the box; a room by its
  category, with no `is`; and the text of before, with no word on the paper. K gives the
  list the focus and picks nothing, Escape gives it back with the block still selected, and
  the next key is a tool's; and a Garden that was picked is there after a reload, in the
  list, in the words and on the paper. A pick is made as `selectOption` makes one, with the
  list given the focus first: no test walks the open list with keys (Gotchas)
- `sketch-colour.spec.ts` — a colour is the Block tool, and a block's colour beside the paper
  (T-029.3), from above, with a sketch of its own on one level: a red block of two boxes,
  and a car. Blue picked in the toolbar — its arrow, `#colours-open`, then blue in `#colours`
  (T-039.3) — with the block selected: `#colour`, read out as blue, shows pressed and nothing
  else of the toolbar, the sketch that the browser keeps is the text it was,
  with no step to undo, and a drag draws a block that says the place of blue; S, and no
  colour shows pressed; a line drawn with L is blue, and B takes Block in blue; 4.5 typed
  into the height takes Block, and after Enter the next block is nine rows high. The block
  selected: its swatch under the list of categories, in red beside "red"; a click opens the
  eleven colours, by their places and their names, the first with the focus and red marked
  and none pressed, under the swatch and inside the right side, with the paper where it
  lay; green picked — both boxes say the place of green and nothing else of the text is
  another, the colours are shut, the swatch is green, B takes Block in blue still, and two
  Undos have the text of before. Open, B, O, 2, K, C and Ctrl+Z are nobody's; Escape shuts
  the colours, gives the swatch the focus and leaves the block selected, and Ctrl+Z is the
  page's again; a click on the paper beside the block shuts them with nothing painted; of
  the car and of nothing there is no swatch. And with every tool in turn — by its key, by
  its button, by each of the eleven colours of the menu — one thing of the toolbar shows pressed, there
  is no Block button, and a reload shows the tool and the colour that the tab kept: the
  Object tool's button is the one of the Objects group, which is read out by its object, a
  person (T-029.4)
- `sketch-gallery.spec.ts` — the gallery of the objects (T-029.4), from above, with an empty
  sketch of its own. The pad opens with Select, "Nothing is selected." right of the paper,
  no gallery, the button of the Objects group a person, and neither a `#kind` nor a button
  named "Object". O: that button shows pressed and nothing else of the toolbar, and the
  gallery stands right of the paper, where the line stood — six headings in their order,
  forty-three tiles, a kind's or a named starting size's — Furniture eighteen, with its three
  beds — each group's under its heading, the person's picked — with the paper
  where it lay. A click on the Sofa: its tile is picked and no other, the button says
  "Sofa" and answers to that name; a click on the paper, and **the sketch that the browser
  keeps is, to the letter, the text that the pad of before kept** of a sofa picked in its
  list and set down at that place — written down from that pad, before its list went — and
  so of a second one, turned by a quarter with R. S: the gallery is gone and the line back
  where it stood; the button takes the tool as O does; and loaded anew, the gallery shows as
  the page opens, the sofa picked, and the next click sets down a sofa turned by a quarter.
  With a door of 2.4 m in the sketch's figures the door's tile says so, a window's what a
  sketch says that says nothing; every picture of a tile, and the button's, has ink on it, a
  tile's is 44 pixels square with the words right of it, and to look writes nothing; a
  figure set while the gallery shows is on the tile at once, and Undo has the tile say what
  it said. And the gallery scrolls inside the right side, and the page does not: with the
  fridge 40 pixels under the top of the side, the kitchen's first tile is scrolled out and
  its heading is in sight at the top, over the fridge — **the case that fails without
  `position: sticky`**, tried; at its foot the last heading and the last tile are in sight;
  and the wheel over the gallery scrolls the side, and neither the page nor the paper
- `sketch-objects.spec.ts` — the one end-to-end test of ST-034, its first row of Behaviour
  (T-034.6), from above, with an empty sketch of its own. O, and an office chair, a floor lamp,
  a cupboard and a grill picked in the gallery, each set down by a click on the paper: four
  objects, kept in that order, none with a length. S, and the cupboard dragged at its east end
  three cells further: over it the line under the paper says "a cupboard of 2.5 m by 0.5 m", and
  the sketch that the browser keeps is of the version the pad writes, the four kinds in their
  order and the cupboard with `"long":2.5`, its west end where it was. The 3D page opened in a
  second tab on it, in White, says more parts than the sketch has things; Undo on the pad takes
  the drag back as one step, the sketch says no length, and the 3D page draws at once **three
  parts fewer** — two doors of five; every count the page's own (`data-parts`). Neither page
  has an error or asks another machine. Without WebGL the case stops at the 3D page, skipped
- `sketch-sizes.spec.ts` — the one end-to-end test of ST-035, its first row of Behaviour
  (T-035.8), from above, with an empty sketch of its own. O, and "Single bed" and "Kitchen
  counter" picked by their tiles, each set down by a click on the paper: two objects, the bed
  with `"deep":1`. S, and the bed's south side dragged one cell further and the counter's east
  end two: the bed clicked, the panel says "Bed: 2 m by 1.5 m, 1 m high" and shows no height to
  type; the counter clicked, it says 0.9 m high and its field 0.9; 0.95 typed with Enter, the
  panel says "Kitchen counter: 3.5 m by 0.5 m, 0.95 m high" and the field has given the focus
  back. The sketch that the browser keeps is of the version the pad writes, the bed with
  `"deep":1.5` and the counter with `"long":3.5,"high":0.95`. The 3D page opened in a second
  tab on it, in White; the same sketch with the bed at `"deep":1` and the counter with no
  length and no height, kept by the pad's tab, and the 3D page draws **three parts fewer** — a
  pillow and two fronts; every count the page's own (`data-parts`). Neither page has an error
  or asks another machine. Without WebGL the case stops at the 3D page, skipped
- `sketch-own-sizes.spec.ts` — the one end-to-end test of ST-037, its first row of Behaviour
  (T-037.6), from above, with an empty sketch of its own. O, and "Wardrobe" and "Staircase,
  one storey" picked by their tiles, each set down by a click on the paper: neither has a length
  of its own. S, and the wardrobe's east end dragged two cells further and the staircase's
  four: the sketch that the browser keeps is of the version the pad writes, the wardrobe with
  `long` 2.5 and the staircase with 6.5; the pointer on the staircase, the line under the paper
  says "20 steps, each 15 cm by 32.5 cm". The 3D page opened in a second tab on it, in White;
  the same sketch with no length of their own, kept by the pad's tab, and the 3D page draws
  **five parts fewer** — four steps and a door of three; every count the page's own
  (`data-parts`). Back on the pad, the wardrobe clicked and Delete pressed: it is gone; Undo:
  it is back, 2.5 m long; the right button on it opens the menu and erases nothing, and Delete
  in its menu: gone again, the menu shut. Neither page has an error or asks another machine. Without WebGL the case stops at the
  3D page, skipped
- `sketch-distances.spec.ts` — the one end-to-end test of ST-036 (T-036.3), from above, on the
  made-up sketch, which holds no distance. The panel is shut; Distances opens it, first in
  `#right`, its three fields empty, "Show the lines" ticked and nothing drawn
  (`distancePanel.drawn()`). "abc" under Small, with Enter: the sentence of `distances.typed`
  beside the field, the text left in it, the sketch the browser keeps as it was. 4 under Small
  and 7.5 under Large: the sketch ends `,"distances":{"smallM":4,"largeM":7.5}}`, and two lines
  are drawn, "4.0 m" and "7.5 m", one piece of six corners each, closed; reloaded, the same
  sketch, the same lines, the fields 4 and 7.5. "Show the lines" unticked: nothing drawn and the
  sketch as it was, and so through a reload, the box still unticked; ticked, both again. 10.5
  under Annexes: kept, no line for it, and beside the field "No place of the plot is 10.5 m from
  its outline: there is no line." Small emptied: the sketch's `distances` is
  `{"largeM":7.5,"annexM":10.5}`, the 7.5 m line alone drawn. In a second window from the front
  nothing is drawn and the sketch is unchanged; the 3D page has no `#distances-open`, no
  `#distances` and no `distancePanel`. No page has an error or asks another machine
- `sketch-lines.spec.ts` — the one end-to-end test of ST-039 (T-039.4), from above, on a sketch
  of its own: two empty levels, drawn on the first. A colour of the owner's added — the arrow
  `#colours-open`, `#colour-chooser` filled with `#c0392b`, asked "Name of the new colour: up to
  30 characters" and answered "Boundary": the sketch's `colours` is that one — and picked from
  `#own-colours`; L, four corners clicked on the empty paper with Alt held at the second, and
  Enter: the sketch's last note is `{ view: 'top', at: 22, line }`, three points whole cells and
  the second the pointer's place to the centimetre, worked out from the pixels clicked. Select,
  a click on the third segment: its words, three rows of segments; "On every level" ticked: the
  note says `at: "every"`, "Shown" ticked. Escape, and a pixel of `#c0392b` on that segment;
  Page Down to the next level, and again. Kept with Keep under a name of the case's, three Undos
  to the empty paper, opened with Open kept: the note and `colours` as they were. No alarm, no
  error, no request to another origin. The switch, the list and the recolouring are the checks'
- `sketch-sections.spec.ts` — the sections beside the paper (T-032.4), on the made-up house:
  in each of the five views "Sections" stands under the levels or the slice and over their
  hint, with "New section" and no row — `#left`'s parts in their order, `#every-lines` after
  `#layers` in every view, hidden in a slice (T-039.4). A section made and named — a name that is taken, one
  of nothing and one of 61 characters refused in the model's words in the alarm — is picked,
  its row pressed and nothing of the toolbar; a click on the night rooms puts both their
  boxes in, a second takes
  them out, a box over the upper floor puts its three blocks in, its `id` on the four boxes;
  meanwhile the roof terrace, not of it, is paler on the paper than with no section picked,
  and the night rooms are as they were; each step undone and done again. Escape, another
  tool, a colour — picked in the toolbar's menu, `#colours-open` then blue (T-039.3) — and O
  each end the pick, and a click is then that tool's — **the case that
  fails with Escape's line of `tools/sketch/page.js` as it was**, and the one before with the rest of the
  layer drawn on not faded: tried
- `sketch-sections-steps.spec.ts` — a section's row (T-032.4), with two sections of the
  test's own: renamed, "Rename" offering the name it has; moved down and up; hidden — the row
  says so, the paper has no ink where the bed in the night rooms stood, and the sketch says
  `"hidden":true` — and shown; removed with no question, its four boxes in no section and
  otherwise the text they were: after each, Undo has the kept sketch of before and Redo the
  one after. The night rooms selected: right of the paper, after the swatch, the list stands
  at their section, with "No section" and both sections; a pick puts them into another, the
  focus the page's — E takes Erase — and "No section" out of every one; of the bed and of
  nothing, no list. Loaded anew, the list is as it was left, with no section picked, and
  "Save file" saves the sketch that the browser keeps
- `sketch-kept.spec.ts` — Keep and Open kept in the browser (T-040.5), each pressed through
  the File menu, File first, on the made-up pad of the project, each case in a browser of its
  own: on the example, Keep offers the day and the time, says under its field "Sketches of this
  plot are kept in this browser only — save a file to keep a copy.", and keeps the made-up
  sketch under the name that is typed — a figure in it no key of a view, a letter no key of a
  tool — saying "Kept in this browser only — save a file to keep a copy. This browser may clear
  it when it is short of room."; the store holds, byte for byte, what "Save file" saves, and no
  request under `kept/` is made; Open kept lists it on an empty paper of another page, with the
  time it was kept, and opens it as the same sketch, and Undo brings back the empty paper; a
  taken name writes nothing, and the window takes another; a name that is sent twice before
  the first answer is kept once; a name that is none is refused in words, and nothing is kept;
  a sketch kept in the browser by hand — a sketch, an old sketch of one view, a note that is
  none — is opened by Open kept as "Open file" opens that file: the same sketch in the browser's
  store, the same step to undo, and the same words where it is refused; a plot given as its file
  keeps in the browser, by its id, and says so; and the page's policy lets it ask its own server
  and nobody else — which answers `/kept/` with 404
- `sketch-kept-folder.spec.ts` — Keep and Open kept on a plot that came as its folder (T-040.5),
  in `sketch-folder.ts`'s browser, on the terrace plot's folder: Keep writes
  `sketches/<name>.json` there, byte for byte what "Save file" saves (its download, read back),
  says so, and a taken name writes nothing; a sketch of the oldest version of the golden files
  lying in `sketches/` before, beside a file under a name the pad does not take, listed — the
  other counted — and opened as the pad of now writes it, nothing written; the leave withdrawn:
  Keep asks, is refused, keeps in the browser and says so, with the browser's no; Open kept then
  lists the folder's sketch and after it the browser's, said "in this browser"
- `sketch-plot-folder.spec.ts` — **the story's one end-to-end test of ST-040** (Behaviour row 1),
  in `sketch-folder.ts`'s browser: the terrace plot's folder picked through File, Open plot, "A
  plot's folder…"; the plot shows with its ground; a level made and a block drawn from above;
  Keep under a name: `sketches/<name>.json` lies in the folder, byte for byte what "Save file"
  saves; a new page of the browser opens on the terrace plot, and Open kept lists the sketch
- `sketch-published.spec.ts` — **the story's one end-to-end test of ST-044** (Behaviour rows 3
  and 4, rule 3; T-044.2): the pad written by `tools/sketch/published.js`, run with Node behind
  the gate `offline.js`, into a folder of the system's temporary files, and served by a plain file
  server of `node:http` of the case's own, on 127.0.0.1 and a port the system picks, **under
  `/blockplot/`** as GitHub Pages serves a project's page — `/blockplot` a 301 to `/blockplot/`,
  a folder its `index.html`, a file by its path with its type by its ending, else 404, which the
  case asks before the browser is given it; both taken away as the case ends. One case, in
  `sketch-folder.ts`'s browser on that address, every address relative: `./#top` opens on the
  example and File has "New plot" — `GET map/index.html` answers 200 from where the page is —
  `./3d.html` says `data-three` with three.js from `/blockplot/three/`; the terrace plot's folder
  opened through File, Open plot, a block drawn, kept under a name into `sketches/`, byte for byte
  what "Save file" saves, and listed by Open kept; and every request of the browser went to that
  server under `/blockplot/` — refused before it leaves where not, and none at the origin's root.
  The map's page is not opened (`tests/CLAUDE.md`, invariant 7)
- `sketch-plots.spec.ts` — Open plot in the browser (T-040.3), **on the made-up pad of the
  project**, each case in a browser of its own that holds nothing as it begins; a case asks yes or
  no which plot a page shows, by `SITE.name` and `PLOT`, once `html[data-shown]` says it; after
  every case no page has said an error or asked another origin. A first visit: File's six
  entries, and the window — a window of its own, over the page — lists the example alone, `the
  example, shows now`, with "A plot's folder…" and "A plot's file…" under it, and the hidden
  field `#plot-file`; a 2 pressed in it goes to no view, "Close" closes it, a pick of the example
  closes it on the page as it was, and nothing is noted. **The terrace plot's file given**
  (`setInputFiles` on `#plot-file`): held under `Made-up terrace by the lake north` and shown in
  this window at the address it was given at, the window saying, once, that the browser may
  clear what it holds (`persist()` answers no in a test's browser); listed first, `336 m², opened
  <today>, this browser, shows now`, then the example; in the four other views by their keys and
  in 3D, on a reload too; a pick of the example shows the example, and the window then lists the
  terrace plot without `shows now`. `no-outline/plot.json` refused with the reader's sentence,
  nothing held, the page as it was. The same file given twice: one plot, and nothing said the
  second time. A browser with no `showDirectoryPicker`: the sentence in the place of the folder's
  button. A note of a plot not held: the window open as the page opens, with GONE's sentence.
  **A plot's folder**, in `sketch-folder.ts`'s browser: the terrace plot's folder put into the
  origin's private file system and picked — held as `the folder terrace`, shown, and its folder
  holding its `plot.json` alone, byte for byte; its own file given afterwards is that one plot,
  still the folder's; a folder named `example` refused with its sentence, nothing held; and the
  permission withdrawn, `mayWrite` of the held folder answers no
- `sketch-plots-last.spec.ts` — the plot a page shows, from the browser (T-040.2), **on the
  made-up pad of the project**, each case in a browser of its own that holds nothing as it
  begins: plots are held by the case — a page imports `/store/held.js`, `/store/rules.js` and
  `/plot-file.js` and holds the made-up fixtures `tests/__fixtures__/plots/terrace` and `home`, read
  by the test, as plots of the file way, so no folder's handle is put. A fresh browser opens on
  the made-up plot at once — `SITE` and the example's `PLOT` right after `goto` — and notes nothing; the tab noted
  `terrace` shows the terrace plot (`html[data-shown="terrace"]`, its `SITE` and `PLOT`), notes
  it for the tab and as the last, keeps a block under its own key alone, and shows it in the
  four other views by their keys, in 3D — one solid — and in Info; `home` noted then shows the
  orchard plot under the first key, with nothing of the terrace's. A new page of the browser
  opens on the last; **two windows on two plots** each keep theirs through a reload and 3D, and
  a third page opens on the one shown last. `example` noted shows the example under its own key;
  a note of a plot not held opens the example, sets `GONE` and takes both notes out. Its
  case of the made-up pad's File went to `sketch-plots.spec.ts` (T-040.3). After every case no
  page has said an error or asked another origin
- `sketch-new-plot.spec.ts`, `sketch-new-plot-made.spec.ts` — a plot marked on the map, named
  and made (T-031.7; in the page, T-041.3) — and `sketch-new-plot-unseen.spec.ts`, the case of a
  corner set where a picture did not come, which the second had no room for — each case on a pad and a stand-in of its own, as the two tests of the
  map are (`docs/sketch/map.md` says what each holds, case by case). Of the pad's own page the
  first holds File: on the example, at `/#side`, where `GET map/index.html` answers 200
  (T-040.3, T-041.4), seven entries — "New plot" the fourth, after "Open plot" — a click on it
  at the map's page, `/map/index.html`, and "Back to the pad" at the pad's own page on the
  example again (T-040.4); the 3D page's File with its three entries, and neither "Open plot" nor
  "New plot"; and, **on the made-up pad of the project**, whose `GET /map/index.html` answers
  204, the six entries that it had, and no error on the console. The first case of the second holds the map's page asking nothing of
  the pad's server but its files — nothing to learn whom it asks (T-041.2) — and no list of the plots, and a name's folder with none known taken. **Every case of the second runs in a browser that
  takes no folder** (T-041.3): an init script takes `showDirectoryPicker` away. Its second case
  ends on the pad's own page: after "Make the plot" — no order to the pad's server, the ground
  asked by the page, the file offered as `plot.json`, the golden file of the day — the pad is at
  its own address on the new plot, held in the browser's store (T-040.2) —
  `html[data-shown]` its id, and the store's text the very file offered — from above, with the plot's name in the
  toolbar, an empty paper and no alarm; each of the five other views, by its key, is that
  plot, and 3D drew it; and "Open plot" — the browser's list — lists it with the area that its outline
  encloses, the day and `this browser`; and the pad's own page on it has no "New plot": its
  `PLOT` is the browser's
- `sketch-new-plot-large.spec.ts` — a paper too large for the pad (ST-042, T-042.4), on a pad and
  a stand-in of its own, as the two above: at level 26, half a metre a pixel, a rectangle of
  991 m by 20 m marked across the map dragged 991 pixels west twice and back — its corners in
  LV95 as the page holds them, `4 corners.` and no area; its paper said, `Its paper would be
  1001 m by 30 m, and the pad takes 1000 m each way: …`, and Make refused in the same sentence;
  no order, nothing asked of the terrain, and the folder of plots as it was. The map is 976
  pixels wide in a window of 1440: a drag of 991 begins 10 pixels inside its far edge and ends
  beside it, the pointer the map's until it is up
- `sketch-new-plot-folder.spec.ts` — **the story's one end-to-end test of ST-041** (T-041.5): a
  plot made from the map into a folder, with the server's very file. One case, on a pad and a
  stand-in of its own, started by `startOwn` of `sketch-own-pad.ts` behind the gate of
  `offline.js`, in `sketch-folder.ts`'s browser — a profile of its own, on the pad's address by
  the `baseURL` the test gives it, the stand-in's origin let through as `alsoAsks` — with the
  stand-in picker, and its own gate: what goes to neither the pad nor the stand-in is refused,
  and fails the case. Its clock is fixed at noon of 2026-10-20, the golden file's day, and the
  picker hands over `picked`, which holds somebody's `note.txt`. The pad's own page at
  `/?asks=<port>`; File, "New plot"; Find `lane`, its first place, level 28; the pentagon by
  `clickAt`, `5 corners, 520 m².`; the name `Trial slope`; "Make the plot"; and the pad's own
  page on the plot made, `PLOT.way` `folder`. It holds: `picked/Trial slope/plot.json` is
  `tests/__fixtures__/new-plot/trial-slope.json`, byte for byte; `picked` holds `Trial slope` and
  `note.txt`, as it was; `Trial slope` holds `plot.json` and an empty `sketches/`; the store holds
  the plot of the folder way, its folder's handle and that very text; the stand-in heard the eight
  GETs of the ground that `sketch-new-plot-made.spec.ts` states, target and range as
  `making.check.js` has them, one after the other, none beside another, with the pad's origin,
  and no other — an `OPTIONS` for one of them alone — and of nothing it heard a referrer, the
  cookie the case set, or a word of the name. Its picture, `made-folder.png`, is the pad from
  above on the plot made
- `sketch-new-plot-parcel.spec.ts` — **the story's one end-to-end test of ST-043** (T-043.6): a
  plot made from its parcel number, with no corner marked by hand. Three cases, each on a pad and
  a stand-in of its own, as the tests of the marking are, in a browser that takes no folder. The
  main path: the map's page; `Musterlingen 1234` typed into `#parcel-words`, "Find the parcel";
  the map at the middle of the parcel's box at level 26, the parcel whole in it; the body's
  `marked` the seven corners of the stand-in's parcel 1234, stated a second time, to the
  centimetre, its `parcel` `CH000000001234` and `given` `true`; `7 corners, 1201 m².`,
  `#no-survey` and `#parcel-said` to the letter; the name `Parcel 1234`, "Make the plot"; the file
  offered as `plot.json` — seven corners, the parcel's credit and source as given, of the
  machine's day, and its heights — and the pad's own page on the plot; and the stand-in asked the
  search for `Musterlingen 1234`, the find of `CH000000001234` and the terrain's GETs, in that
  order, and nothing else but pictures, each with the pad's origin, no referrer and no cookie. Its
  picture, `parcel.png`, is the map with the parcel marked and its paper around it. A pick of a
  list: `Musterlingen 77`, three buttons by their labels, the second picked — its corners marked,
  it `aria-current`, its find asked. The parcel under a click: at level 26 by `openNear`, a click
  with "Take the parcel under a click" off sets one corner; "Start again"; on, a click at the
  map's middle marks parcel 1234, the map where it was, with one identify at that place asked and
  no search; and a click on, where no parcel lies, sets no corner: the parcel's seven stand
- `sketch-edgeless.spec.ts` — **the story's one end-to-end test of ST-042** (T-042.3), from
  above on the made-up plot, a sketch of one level and no thing: the grid 0.5 m at 8 px a cell,
  then 1, 1, 2, 2 and 5 m at five clicks of `#smaller`; a block drawn by Block from (150.3,
  20.4) to (189.6, 39.7) kept with `x: [148, 198]`, `y: [16, 46]`; five clicks of `#larger`, the
  grid 0.5 m again; "Zoom to fit", and the corners of the plot's paper and of the block within
  the canvas; `paper.groundAt` at the block's middle `paper.realAt` of the paper's downhill edge,
  column 92, in that row; in a tab of the side view, fitted, the pointer over the block, `#status`
  ending ` — no measured ground here`; in one of the 3D page, `data-solids` 1 and `data-beyond`
  53 at the least; and the made-up sketch, put in the store and opened in a tab of its own, at
  8 px a cell, its paper's top left corner at the canvas's, its text in the store as it was put
  there — with no error of a page on the way
- **Where a place of the paper lies**, for every browser test that points at one or reads the
  picture there, is `tests/e2e/sketch-paper.ts`'s, no test file by its name (T-042.3): the canvas
  is the window, and `placeOf(page, [column, row])` the CSS pixels of a place — its columns as
  the screen shows them, also in a flipped view — by `globalThis.zoom`'s `px`, `left` and `top`;
  `scaleOf(page)`, the canvas's pixels a cell; `pixelOf(page, place, whole)`, the canvas's pixel
  of a place, from the window's corner on a whole pixel, as `draw.js` lays it
- `tests/e2e/sketch-3d*.spec.ts` — the 3D page: what each holds, its own head says.
  `sketch-3d-picture.spec.ts` is ST-029's own there (T-029.5): File's "Picture (PNG)" saves
  the stage of the made-up house as it shows, `house-<day>.png` — a PNG with a pixel for
  each of the canvas's, held against the picture that the test takes of that canvas, in
  the Volumes and in White — and the page asks nobody for it. `sketch-3d-header.spec.ts`
  holds where Settings, Full screen and the two sides stand — the two buttons of the toolbar
  in no group, Settings first, each on a line of the header at every width — and what Settings
  take of the stage. `sketch-3d-show.spec.ts` is ST-033's own (T-033.6), the story's one
  end-to-end test: on the made-up pad with `tests/__fixtures__/sketch/every-part.json` in the
  page's store, in Materials, "Atelier "Süd"" switched off — `data-shown` from 12 to 3, the
  nine solids of its three boxes and six objects gone, by hand — the house opened along the
  front view's slice, `data-open` `front`; then "Full screen", `#full-screen`: `data-full`
  `on`, the header, `#side` and `#said` not seen, the canvas's box the window's and its pixels
  the window's; the corner's "Picture", `#full-picture`, saves `house-<day>.png` as large as
  the canvas; Escape, `data-full` `off`, the page as it was — the section still off, still
  open along the front — and the line saying what was saved; and the page asks nobody.
  `sketch-3d-slopes.spec.ts` is the story's own (ST-026): the made-up house, whose porch and
  bath have tops that slope, differs from the same house made level in each of the three ways
  and hides less of the backdrop; a wide staircase alone is sixteen parts, as a staircase is;
  and File's "3D file (GLB)" saves the sloping house. `sketch-3d-kml.spec.ts` is ST-038's own
  (T-038.2), its one browser test, and ST-016's main path with it: on the made-up plot, File's
  "Google Earth file (KML)" is on in the Volumes; `2.5` typed as the raise, it saves
  `house-<day>.kml` and the page says so, and that it holds 153 parts of the house — a KML
  document of 153 Placemarks of a part, named `<block> — <what>`, walls and 24 panes among
  them, as `tools/sketch/kml/house.check.js` works them out by hand, and the outline last;
  every colour `ffffffff` or `59ffffff`, no `innerBoundaryIs`; every point within 200 m of the
  made-up place, asked of the page's own `kml/wgs84.js`; the lowest altitude 814 m plus 2.5 and
  the highest 820 m plus 2.5; opened again, the field says `2.5`; `0` saved, every altitude of
  a part 2.5 m lower and the outline the same; then "Level 817 m" switched off by its checkbox
  and saved again, the raise still 0: 93 parts, the line saying 93, none above 817 m, and the
  file saying that what is switched off is left out — and the page asks nobody, and writes
  nothing of the sketch
- `sketch-3d-ground.spec.ts` — ST-027's own, and not of the 3D page alone: the made-up house
  with its lawn beside the same house with the lawn taken out of the text — both with the
  cut, so that the ground without the lawn is what the cut leaves of the hill. In the side
  view, a slice three rows on: earth beside the lawn's downhill end where the house without it
  leaves paper, and a place over the lawn 1.0 m above the ground where the pad says 2.2 m. In
  the slice the file opens with, the tree's foot in row 24 on the lawn and in row 27.14
  without it — the rule's, with the cut: the hill alone has 27.04 — read off the paper as the
  page draws it when it opens, by the rows in which the
  paper with the tree is another picture than the paper without it. **It is the one case that
  holds the order of the two lines of `refresh`**: with the layers read first the tree is
  drawn on the hill, in the earth of the lawn, and the case fails — tried, on a copy of the
  pad. In 3D, from one stand: another picture in each of the three ways — with the tree off
  both houses too, where nothing but the hill is another — with 35 solids each, and 36 where
  the lawn says no `is`: a room
- `sketch-3d-cut.spec.ts` — ST-028's own, the list, the rule and both views together: the
  made-up house with its cut, beside the same house with the cut's category taken out of the
  text — a room, as it has no name — and beside the house with the whole block taken out.
  From above, on the level at 814 m: the block drawn on its level, in red, with ink in its
  middle where the room has none; selected, the pad's words of a cut, to the letter, the list
  at "Ground cut" and under it that the category was picked. In the side view, on a copy
  whose slice runs along row 16: paper uphill of the block where the two other houses have
  earth, the pad's 2.0 m over the cut ground where it says 0.3 m of the others — held to a
  decimetre — and the sentence of the hint on a cut, to the letter. In 3D, from the stand of
  the pad's other side: another picture in each of the three ways — with the car off both
  houses too, which stands lower with the cut and would tell them apart alone — with 35
  solids each, and 36 where the block says no category. **Tried with the cut lifted over the
  hill, where it bites nowhere: every case fails**, the pictures of the two houses then one
  and the same to the pixel

The made-up sketch of these tests, `tests/__fixtures__/sketch/made-up.json`, has two tops that
slope, two staircases side by side, a lawn of ground before its porch, with its tree on it,
and a cut along its day rooms, by the category that was picked for it:
what it holds, which tests state it and how it was written is `tests/__fixtures__/CLAUDE.md`'s.

No browser test opens the pad itself on a sketch that it cannot read: what the alarm shows
of it is looked at by hand (Gotchas). **Ten browser tests open a pad without `--demo`**, each
case on a server of its own that is told its port alone (T-041.4), with a stand-in for swisstopo
beside it, which the map's page is told by its address: the two of the map (T-031.5) and the
layers' case moved out of the first, `sketch-map-layers.spec.ts` (T-044.12), the
marking's `sketch-new-plot.spec.ts`, `sketch-new-plot-made.spec.ts` (T-031.7),
`sketch-new-plot-unseen.spec.ts` (T-041.3) and `sketch-new-plot-large.spec.ts` (T-042.4), the
one of the word of plain ground, `sketch-map-plain.spec.ts` (T-031.8), the story's end-to-end
test of ST-043, `sketch-new-plot-parcel.spec.ts` (T-043.6), and the story's end-to-end
test of ST-041, `sketch-new-plot-folder.spec.ts` (T-041.5), in `sketch-folder.ts`'s browser. The tests of Open plot and of the plot shown last,
`sketch-plots.spec.ts` (T-040.3) and `sketch-plots-last.spec.ts` (T-040.2), hold plots in the
browser's store of the made-up pad instead.

**What they expect of the cadastre** they read from one statement (T-044.12): the map's page
shows the cadastral map from a metre a pixel where the pad offers the cadastre, and Blockplot,
the pad released, offers none (`docs/sketch/cadastre.md`, which this repository alone holds). A test loads no script of
the pad, so `tests/e2e/sketch-cadastre.ts` reads `tests/__fixtures__/cadastre.json` — the
cadastral map's layer, the ending of its pictures, the level it shows from and its credit, the
pad's `CADASTRE` stated a second time — or `null`, the file that Blockplot's tree has in its
place. Of it: `shownAt(level, photo)`, the layer that shows — the photo at the switch, the
cadastral map from its level on, the national map to 27, the photo at 28; `creditsOf(layer)`;
`onOf(...layers)`, what the body says the corners were marked on; `NEAR_CREDIT` and
`NEAR_GOLDEN`, the credit and the golden file of the pentagon marked at level 28 — on the
cadastral map, `trial-slope.json`, or on the photo, `trial-slope-photo.json`; and
`CADASTRE_FILES`, the pad's files that the map's page asks for only with the cadastre. The
cadastral map's layer of `sketch-own-pad.ts`'s `LAYERS` is its, and so is every expectation of
what shows from level 25 on in `sketch-map-layers.spec.ts`, `sketch-map-find.spec.ts`,
`sketch-new-plot.spec.ts`, `sketch-new-plot-made.spec.ts`, `sketch-new-plot-folder.spec.ts` and
`sketch-new-plot-unseen.spec.ts`, and the files of `sketch-map.spec.ts`: each passes in both
trees. Two are the cadastre's whole, and Blockplot's tree has neither: `sketch-map-plain.spec.ts`,
the word of plain ground, which shows with the cadastral map alone, and
`sketch-new-plot-parcel.spec.ts`, the parcel taken.
`playwright.sketch.config.ts` starts the made-up pad
alone, and every other test sees that one, as it was. What the two do not hold of a pad with
plots was tried by hand in the tests' browser, on a copy of the made-up plots (T-030.3): a
window on the pad's own plot hears of a block that is drawn on another and shows what it
showed; the tab's step is not taken up on another plot; and
with `site.js` answered by 404 the alarm said that the pad did not get its plot, and
every script after failed — eleven errors, the script that did not come among them — where
with the plot given the alarm was empty and no script failed. That was before T-040.2: since,
`boot.js` gives the page its plot, and since T-040.4 no page asks for `site.js` at all.

`tools/sketch/look.js` is no test, and no test and no gate runs it: it is tried by hand.

