# Blockplot

A sketch pad for a house on a plot in Switzerland. You draw the house as boxes on half-metre
cells, over the plot's outline and its ground, and see it:

- in five views — from above, and in slices from the side, from far, from the front and from
  the back;
- in 3D, as volumes, as a white model or in its materials;
- in sections through the house;
- in Info, what the sketch adds up to — its floor areas, its volumes, and a rough cost at the
  rates you type in;
- and as a Google Earth file, the house standing on its plot.

Every view shows the one sketch: a change made in one shows in all.

## Open it

**https://spatialsparks.github.io/blockplot/**

It runs in the browser, with nothing to install. It opens on a made-up example plot, so you can
start drawing at once.

## Your own plot

**File, New plot** opens swisstopo's map of Switzerland. Find a place, go near, and mark the
corners of your plot by hand on the national map or the aerial photo: from half a metre a pixel
on, a click sets a corner. Then name the plot and make it: the page takes the ground under it
from swisstopo's height model, swissALTI3D, and writes the plot's folder
into a folder you pick — or, in a browser that cannot be given a folder, offers the plot's file,
`plot.json`, to save. New plot works for Switzerland only: the map and the ground are
swisstopo's.

Or give New plot **a GeoJSON file of your plot's outline**, under "From a file": choose the file,
or paste its text into the box, and press "Take the outline". Its corners stand on the map as if
you had clicked them, and the map goes to them. The file may be in LV95, Switzerland's grid
(EPSG:2056), or in longitude and latitude (WGS84), which is converted to LV95 to about a metre,
and the plot says so. The file is read in your browser alone: nothing of it is sent anywhere,
and only its corners go into the plot.

A plot is opened with **File, Open plot**, in one of two ways:

- **A plot's folder**, in Chrome and Edge — the browsers that let a page write to a folder you
  pick. The plot's file lies in the folder, and **Keep** writes each sketch you keep into its
  `sketches/` folder, next to the plot. Nothing is ever written over.
- **A plot's file**, in every browser, and the one way in elsewhere, such as Firefox and
  Safari. The sketches you keep on a plot that came as a file stay in this browser's own store,
  on this computer.

**File, Save file** saves the sketch as a file wherever you like, and **Open file** opens one.

## What it asks, and of whom

Your plot and your sketches stay on your computer: in the browser's own store, or in the folder
you picked. Nothing you draw is sent anywhere, and nothing of a GeoJSON file you give New plot.
New plot alone asks another machine, swisstopo's, for the map, a place and the ground. [PRIVACY.md](PRIVACY.md) says exactly what is asked, of
whom, and what each can see.

## Run it on your own computer

You need Node 24 and pnpm. Then, in a copy of this repository:

```sh
pnpm install
pnpm sketch
```

and open **http://127.0.0.1:4764** in your browser. The pad is served on your own computer
alone, at 127.0.0.1, and New plot still asks swisstopo for its map. Ctrl+C stops it.

### Its checks and its browser tests

```sh
pnpm sketch:check
```

runs the pad's checks. They ask no other machine: where swisstopo would be asked, a stand-in on
your own computer answers with made-up pictures, places and ground.

```sh
pnpm exec playwright install chromium   # once
pnpm e2e:sketch
```

runs its browser tests, in Chromium, against the made-up example — asking nobody either.

### Put it on a web host

```sh
pnpm sketch:published <folder>
```

writes the pad into `<folder>` as a web host is given it: plain files, with three.js beside
the pages. Any plain web server can serve that folder, under any path.

## The notes

`docs/sketch/` holds the pad's notes: what each part does, its rules, its checks and its
pitfalls. They are written for those who change the pad, not for those who use it, and they
name stories, tasks and decisions — `ST-…`, `T-…`, `ADR-…` — of the repository it is
developed in, which is not public.

## Where it is developed

Blockplot is developed elsewhere and released here, a commit a release. Each commit of this
repository is one release of the pad, as it was when it was released.

## Credits

- **[three.js](https://threejs.org/)**, which draws the 3D page — under the MIT licence,
  © 2010-2026 three.js authors.
- **swisstopo**, the Federal Office of Topography, whose national map, aerial photo, place search
  and height model, swissALTI3D, New plot shows and asks. The map shows "© swisstopo" wherever it
  shows, and a plot made on the map keeps its credit in its file.

## Licence

The code is under the MIT licence: see [LICENSE](LICENSE). The notes and pictures of
`docs/sketch/` are under the same licence — its grant covers "this software and associated
documentation files".
