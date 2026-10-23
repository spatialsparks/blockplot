# tools/sketch/example

The pad's own example: one plot, the made-up one, as a plot's file (ST-030). It is the plot that
the pad opens on where there is no other, and the first file of its format. The pad's folder
holds no plot but this one — and the check that holds it lies here.

## Public API

Nothing imports from here: a plot's file is read by its path, and a check is found by its name.

- `tools/sketch/example/plot.json` — the made-up plot as a plot's file: the format `blockplot/plot`, version 2, in
  its canonical form (`docs/STORAGE_FORMAT.md`, "The plot file — version 2"). "Made-up hillside
  plot": 644 m² stated, on a paper of 92 by 62 cells, with a ground that is a plane — the site
  that `tools/sketch/demo-site.js` gives, figure for figure and in its order of fields. It says
  where it lies, `originLV95`: `[2600000, 1200000]`, the zero of the Swiss grid, the old
  observatory of Bern — a made-up place, and no real plot's, so its Google Earth file stands
  nowhere real. 26 931 bytes on 127 lines, nearly all of them ground. `EXAMPLE_FILE` of `tools/sketch/routes.js` says where it lies, and
  `EXAMPLE`, `example`, is the id of its plot
- `tools/sketch/example/own.check.js` — the check that the pad's folder, `tools/sketch/`, holds no plot but the
  made-up one (ST-030, rule 1). Its one function, `amiss(folder)`, says what is amiss in a
  folder that is a pad's: a sentence a fault, each of a file by its name from the folder on and
  by nothing of what the file holds — and nothing, where all is well:
  - a file named `site.js`, in the folder or in a folder under it, under whatever case: the
    name that the owner's plot lay here under. It is said by its name and **never opened**
  - of the files that end in `.json`, each that reads as a plot's — JSON that says the plot's
    `format`, behind a byte-order mark too, whether the one reader would take the plot or
    refuse it — but the one, `example/plot.json`
  - of the scripts, the files that end in `.js`, each that leaves a site — anything but nothing
    under the name `SITE`, where a page reads its plot — but the one, `demo-site.js`. A script
    is run as a page runs it, with nothing of a page: its text as a classic script in a
    context of its own (`node:vm`), whose global answers to `globalThis`, `window` and `self`,
    with what it left to a promise, under a limit of a second. One that fails — it asks for a
    page, it is a module, its time is up — is no fault, and is asked what it had left by then
  - `example/plot.json` itself, where it is no plot's file, or not the made-up plot: it reads,
    by the one reader, and is named "Made-up hillside plot"; and `demo-site.js`, where it
    leaves no site

  `node_modules` is left out, and a link is neither a file nor a folder: nothing is listed and
  nothing opened through one. The function lives in its check, and nothing imports it

## Invariants

1. One plot. The folder holds three files and no other — the plot's file, this note, and the
   check of the pad's folder, `tools/sketch/example/own.check.js`: `tools/sketch/plot-file.check.js` holds what the folder
   holds, by the three names.
2. Made up, every figure and every name of it: nothing here is taken from a real plot
   (directive 34). It is `tools/sketch/demo-site.js` and nothing else.
3. No request changes it. The pad reads this file and writes nothing here: what is kept on the
   example goes among the owner's data, never into the pad's folder (ST-030, rule 1).
4. It is written by `write` of `tools/sketch/plot-file.js`, and never by hand; and it is never
   reformatted: `.prettierignore` names it, for the format has a canonical form of its own —
   a corner on four lines, a row of the ground on one — which the formatter would rewrite.
5. The made-up plot lies in the pad's folder twice, as the script `tools/sketch/demo-site.js` and as this
   file, and the two are one plot: `tools/sketch/plot-file.check.js` reads the file as the site that the
   script gives, figure for figure and in its order of fields, and writes that site as the
   file, byte for byte.
6. **This folder holds the pad's one plot, and the pad's folder no other** (ST-030, rule 1): a
   plot of the owner's is a file among their data, `design/plots/<id>/plot.json`, and nothing
   of one lies in `tools/sketch/`. `tools/sketch/example/own.check.js` holds of it what a check can, in the fast
   gate: no file there is named `site.js`, under whatever case; one file there is a plot's,
   this one; one script there leaves a site, `tools/sketch/demo-site.js`; and this plot is the made-up
   one. A file named `site.js`, a second plot's file or a second script that is a site, put
   into the pad's folder, turns the gate red, with the file's name and no word of what it holds.

## Test

`pnpm sketch:check` — `tools/sketch/plot-file.check.js`: the file against the script, both ways; by hand
its name, its 644 m², its bearing of 232, its six corners, its two notes, and at each of its 63
by 93 grid points `1400 − 10 c − 2 r` cm over 806 m; the canonical form, by its bytes and its
lines; and the three names of this folder. `tools/sketch/plot-place.check.js`: by hand its
place, `[2600000, 1200000]`, in the script and in the file, after its bearing, in a file of
version 2. `tools/sketch/plot-routes.check.js` reads it where
`EXAMPLE_FILE` says it lies.

And `tools/sketch/example/own.check.js`, which `tools/sketch/check.js` finds by its name, as it finds every check: `amiss` on
the pad's own folder, where it finds nothing — and, for a rule that matches nothing passes for
ever (directive 9), its proof, on a folder of its own making in the system's temporary files,
which it takes away however it ends. A made-up pad's folder: a page, `demo-site.js` and the
example, with what is no fault — a `package.json` and a sketch, which are no plot; a script that
asks for a page, a module, and a script that asks for a page in a promise that nobody waits
for, each of which says a site after the line it fails at; and a `node_modules`, and a link to
a folder that lies elsewhere — under a name that ends in `.json`, as a file to open might —
each with a `site.js`, a plot's file and a script that leaves a site in it. Nothing is amiss
there. Then one file at a time is put there, is another or is
gone, and each is said alone, in its sentence and by its name: `site.js`, and `Site.JS` in a
folder under it — each holds a script that says a site, and would be said a second time if it
were run; a second plot's file two folders down, a copy of the tests' terrace plot; a script
in a folder under it that says `var SITE = { … }`; a plot's file that the reader refuses, of
version 3, and one behind a byte-order mark; the example gone, no plot's file, another plot,
and a plot that does not read; `demo-site.js` gone, and failing; and an empty folder, which
lacks both. And of a script alone: a site is left under each name of the global, as a name
of the page's scripts (`const`), in a promise, and before the script fails; nothing, `null`
and a name that never got its value are none; and a script that never ends — in a loop, in
promises — is stopped at the limit, with what it had left by then.
**Tried with the check broken one thing at a time** (T-030.5), each of 35 breaks alone — a
rule left out, a filter turned, `node_modules` read, a link gone through, a file named
`site.js` opened, promises left to the process, no limit of time: the check failed each time.
**And tried on the pad's own folder**: a made-up `site.js`, `view3d/Site.JS`, a copy of the
terrace plot's file and a script that says a site were put there, one at a time — the check
failed on each, naming that file, and passed again once it was taken away.

## Gotchas

- Whoever changes the made-up plot changes `tools/sketch/demo-site.js`, by hand, and then writes this
  file anew, from the repository's root, in one command:

  ```sh
  pnpm exec node --input-type=module -e "import './tools/sketch/demo-site.js'; import { writeFileSync } from 'node:fs'; import { write } from './tools/sketch/plot-file.js'; writeFileSync('tools/sketch/example/plot.json', write(globalThis.SITE).text);"
  ```

  It writes nothing where `write` refuses the site — the command fails, and `pnpm sketch:check`
  says in which sentence. The command holds single quotes alone inside its one pair of double
  quotes, and none of the signs that a shell reads for itself, so that every shell passes it
  on as it stands. It was tried in Git Bash, and not in PowerShell.
- **A plot given its place** (T-016.2). A plot's file of version 1 says no place, and the pad
  never writes over a plot's file. A plot is given its place once, by hand, **with the owner's
  yes** — for the owner's plot, by the orchestrator — from the repository's root, with the
  plot's file and the east and the north of its frame's zero, in metres of LV95, in the place
  of `<plot.json> <east> <north>`:

  ```sh
  pnpm exec node --input-type=module -e "import { readFileSync, writeFileSync } from 'node:fs'; import { read, write } from './tools/sketch/plot-file.js'; const [file, east, north] = process.argv.slice(1); const { site } = read(readFileSync(file, 'utf8')); if (site === undefined) throw new Error('Not placed: the file is no plot that the pad reads.'); if ('originLV95' in site) throw new Error('Not placed: the plot says where it lies already.'); const { text } = write({ ...site, originLV95: [Number(east), Number(north)] }); if (text === undefined) throw new Error('Not placed: the two figures are no place of LV95.'); writeFileSync(file, text); console.log('placed');" <plot.json> <east> <north>
  ```

  It reads the file by `read`, and stops — writing nothing, and saying why in words of its own
  that hold nothing of the plot — where the file is not read, where it says a place already,
  and where `write` refuses the place: figures of LV03, a figure missing, what is no number.
  Else it adds `originLV95`, writes over the file the text that `write` gives — version 2, the
  place after the bearing, every other line as it was — and prints `placed`, and nothing of
  the plot. Like the command above, it holds no sign that a shell reads for itself. **Tried**
  in Git Bash on 2026-10-15, on a copy of `tests/__fixtures__/plots/terrace/plot.json` in the
  system's temporary files, and never on `design/plots/`: the copy became version 2 with its
  place, and differed from the fixture in its version and the four lines of its place alone;
  run again, it stopped, saying that the plot says where it lies already; and given LV03's
  `600000 200000`, on a fresh copy, it stopped and left the copy as it was. The figures stand
  on the command line, and so in the shell's history: whoever runs it on the owner's plot
  hands them over as the story says, without printing them.
- The script is loaded with `import`, there and in the checks that read its site, and not run
  by `node:vm`: `write` holds what it read against the site it was given, and a site out of
  another context does not read back as it was written (`docs/sketch/pad-gotchas.md`, Gotchas).
  `tools/sketch/example/own.check.js` does run it by `node:vm`, as it runs every script of the pad: it asks whether
  a site is left there, and reads and writes none.
- A change of the made-up plot is a change of more than this file: `tools/sketch/plot-file.check.js` holds
  the plot by hand, typed in, with the file's 26 931 bytes and 127 lines, and so do the checks
  and the browser tests that count on the made-up plot's paper and ground (`docs/sketch/pad-gotchas.md`, "The
  made-up ground is a plane"). A plot under another name than "Made-up hillside plot" turns
  `tools/sketch/example/own.check.js` red too.
- **No page reads this file** (T-040.4): the example is the page's own, and a page that shows
  it loads `tools/sketch/demo-site.js` in the place of `site.js`, on either pad — and
  `tools/sketch/plot-file.check.js` is what holds the two to be one plot. The server gives it to
  nobody, `/example/plot.json` is a 404, and reads it for nothing since T-040.5. Before T-040.4 a pad
  with plots made a script of it for a page, at `/plots/example/` and in the list of the plots.
- **What `tools/sketch/example/own.check.js` does not hold**: that no figure of a real plot stands in a file of the
  pad — typed into a script under another name than `SITE`, into a page, into a note, or in a
  file of another kind. No check could, without the plot. It holds the three ways in which a
  plot gets here by a slip: the file of before put back, a plot's file copied in, and a script
  that a page would take for its site.
- **A second made-up plot in the pad's folder is a change of that check**, which names the one
  file and the one script. A check or a look that needs another made-up site makes it up in
  its own text, or reads a plot of `tests/__fixtures__/plots/`. A script of the pad that
  leaves anything under the name `SITE` when it is run with nothing of a page — a `var`, a
  `const`, a property of the global — turns the fast gate red, by its name. A module leaves
  none: the check runs a text as a classic script, where an `import` or an `export` is an
  error, so the checks and the modules of `tools/sketch/scene/` and `tools/sketch/view3d/` fail at once.
- **The check runs every script of the pad**, some 160, each in a context of its own with
  nothing of a page and nothing of Node in it: no `document`, no `process`, no `require`, no
  timer — so no script reaches the disk or the network from there, and one that prints prints
  nowhere. Four in five are modules — the checks, the server, `tools/sketch/scene/` and `tools/sketch/view3d/` —
  and fail before their first line; of the page's own scripts most fail at the first line that
  asks for the plot or the page, and a few run to their end and leave their own globals. All
  of it takes a tenth of a second. A script that never ended would take the limit, a second,
  and be no fault: this check asks for a site, and not whether a script is sound. A script
  whose promise is rejected with nobody waiting for it would end the check's process, as Node
  has it: the check listens for those, and lets them be.
- A file named `site.js` that the check finds is never opened, by any of its rules: neither
  the check nor what it prints as it fails holds a word of the file. Whoever finds the gate
  red on such a name takes the file out of the pad's folder — a plot lies in
  `design/plots/<id>/plot.json` — and does not print it either.
- **A file added to this folder is a name more in one assertion of `tools/sketch/plot-file.check.js`**,
  which holds the folder to its three names, and which is full, at 299 lines: with the three
  the line has 98 of the formatter's 100 characters, so a fourth name wants the list worked
  out in a line that is made free first.
