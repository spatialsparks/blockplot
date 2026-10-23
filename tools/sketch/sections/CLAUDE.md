# tools/sketch/sections

The sections of a sketch (ST-032; version 7 of `docs/STORAGE_FORMAT.md`), and their list.

## Public API

`model.js` — `globalThis.sections`, after `sketch.js` on the pad's page, after `views.js` on the
3D page and on Info; reads nothing as it loads. The 3D page asks it `list` and `of` alone.

- `list(doc = sketch.doc)` — the sections in the owner's order, each `{ id, name, hidden }`
- `of(thing)` — its section, or null: of a box by the first box of its block that names a
  listed one, of an object by the last box on its level that holds its middle, edges and all
- `hides(thing)` — whether that section is hidden; with none hidden, no before it looks
- `NAME_MOST`, 60; `named(text, but)`, `{ name }` trimmed or `{ refused }` in one of three sentences
- The steps, each through `sketch.change`: `make(text)`, `{ id }` or `{ refused }`; `rename(id,
  text)`, `{ name }`, `{ refused }`, or `{}` for an `id` the list has not; `move(id, by)`, -1 up;
  `hide(id, hidden)`, only `true` hides; `remove(id)`; `put(things, id)`, with `null` out

`list.js` — `globalThis.sectionList` (T-032.4), after `gallery.js` on the pad's page alone. It
makes its parts — before `#layers-hint`, `#sections-title`, `#section-tools` with `#section-add`
and, while one is picked, `#section-rename` and `#section-remove`, then `#sections`, a row
`li[data-section]` each, and `#sections-hint`; after `#swatch-row`, `#section-row` and `#section`
— and asks the model alone, its refusals to `sketch.trouble`. A picked section is the tool
`'section'`: `show(selected, tool)`, from `refresh`, gives the tool back; `fill(stroke)`, a click
or a box; `picked()`, the `id` or null, by which `layers.lit()` draws it in full, the rest faded.

## Invariants

1. One reading: whoever needs a section asks `list`, `of` or `hides`, and reads no `section`
   and no `sections` itself. The steps are the format's only writers.
2. A box names its section by a number, never by its name: renaming, moving and hiding change
   no box. A new `id` is one more than the largest that the list or any box says.
3. What is none says nothing and stays as written until a step changes something: `sections`
   is then what the pad read of it. What changes nothing is no step.
4. No stroke knows a section: a piece of a cut, a copy, a merged block keep what their boxes say.
   `sketch.shows` alone asks `hides` (T-032.3), and no stroke reaches what it hides.

## Test

`pnpm sketch:check` finds six: `model`, `named`, `steps`, `strokes`, `hidden` and `list.check.js`,
the list on the made-up house; in a browser, `e2e/sketch-hidden.spec.ts` and `sketch-sections*`.
