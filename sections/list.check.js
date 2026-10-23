// The check of the sections beside the paper (ST-032, T-032.4, sections/list.js), by hand on the
// made-up house, with the pad's scripts, the model and the list on a made-up store, plot and page
// that keeps what is made: the parts, the rows, each button, what `show` gives back, `fill`, what
// the paper draws (layers.lit), the list on the right, and the text of page.js and index.html.
// Run by tools/sketch/check.js, or alone: pnpm exec node tools/sketch/sections/list.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import process from 'node:process';

// A browser's two stores, and A MADE-UP PAGE: a part keeps what it was given, its children, what
// was put before and after it, its attributes and listeners; `did`, who took or gave the focus.
const store = (held = new Map()) => ({ held, getItem: (key) => held.get(key) ?? null });
const [local, session] = [store(), store()];
for (const one of [local, session]) one.setItem = (key, text) => one.held.set(key, text);
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
const did = [];
function part(tag = 'p') {
  const made = { tagName: tag.toUpperCase(), children: [], hears: {}, dataset: {}, said: {} };
  made.append = (...more) => void made.children.push(...more);
  made.replaceChildren = (...all) => void (made.children = all);
  made.before = (...more) => void (made.preceded = more);
  made.after = (...more) => void (made.followed = more);
  made.addEventListener = (type, hear) => void (made.hears[type] = hear);
  made.setAttribute = (name, value) => void (made.said[name] = value);
  for (const act of ['focus', 'blur']) made[act] = () => void did.push(`${made.id} ${act}`);
  return made;
}
let page = {};
globalThis.document = { getElementById: (id) => (page[id] ??= part()), createElement: part };
// The questions that "New section" and "Rename" ask, kept: each is answered by `answer`.
const asked = [];
let answer;
globalThis.prompt = (question, offered) => asked.push([question, offered]) && answer;

// The model and the made-up plot, once; the pad's scripts in the order of index.html, as far as
// the list needs them, and the list last - a view at a time, each on a page of its own.
for (const file of ['sections/model', 'demo-site', 'categories']) await import(`../${file}.js`);
const { sections } = globalThis;
assert.equal(globalThis.SITE.name, 'Made-up hillside plot');
const SCRIPTS = ['paper', 'figures', 'shapes', 'blocks', 'earth', 'land', 'legacy', 'sketch'];
const MORE = ['strokes', 'levels', 'labels', 'layers', 'sections/list'];
let [loads, sketch, sectionList, layers, selected, tool] = [0, null, null, null, null, 'move'];
// AS THE PAGE DOES (page.js, `refresh`): the layers read; what is selected kept while it is there
// and shows; the list handed it and the tool - and the tool that the list gives back taken.
function refresh() {
  layers.refresh();
  if (!sketch.doc.things.includes(selected) || !sketch.shows(selected)) selected = null;
  tool = sectionList.show(selected, tool);
}
// The pad, in a view, on a store that holds a text - and the parts that the list made there.
let [title, tools, list, hint, add, rename, remove, side, more, choice] = [];
async function pad(hash, text) {
  for (const one of [local, session]) one.held.clear();
  local.held.set('blockplot/sketch/space', text);
  [page, globalThis.location, selected, tool, loads] = [{}, { hash }, null, 'move', loads + 1];
  for (const file of [...SCRIPTS, ...MORE]) await import(`../${file}.js?${loads}`);
  ({ sketch, sectionList, layers } = globalThis);
  sketch.onChange = refresh;
  refresh();
  [title, tools, list, hint] = page['layers-hint'].preceded;
  [[add, rename, remove], [side, ...more]] = [tools.children, page['swatch-row'].followed];
  [choice] = side.children;
}
const text = () => JSON.stringify(sketch.doc);
/** What an act does: the text of the sketch after it, and how many steps it took. */
function done(act) {
  const steps = sketch.past.length;
  act();
  return [text(), sketch.past.length - steps];
}
// A button pressed; one whose question is answered with `words`, and what the alarm says then; a
// stroke of the pick - a click, or a box from a place to a place; a pick in the list on the right.
const pressed = (button) => done(() => button.hears.click());
function press(button, words) {
  answer = words;
  return [...pressed(button), sketch.trouble];
}
const stroke = (from, to = from) => done(() => sectionList.fill({ tool: 'section', from, to }));
function pick(choice, value) {
  choice.value = value;
  return done(() => choice.hears.change())[1];
}

// THE MADE-UP HOUSE, tests/__fixtures__/sketch/made-up.json - and that house as the pad writes it
// with these sections listed and the boxes of these blocks, by their names, in them: the field
// last on a box, and the list last in the sketch, as the model's steps write them.
const FIXTURE = `${import.meta.dirname}/../../../tests/__fixtures__/sketch/made-up.json`;
const HOUSE = readFileSync(FIXTURE, 'utf8');
function housed(listed, of) {
  const doc = JSON.parse(HOUSE);
  for (const thing of doc.things) if (thing.name in of) thing.section = of[thing.name];
  return JSON.stringify(listed.length > 0 ? { ...doc, sections: listed } : doc);
}
const UPPER = { id: 1, name: 'Upper home' };
const LOWER = { id: 2, name: 'Lower home' };
const UPPER_FLOOR = { 'Night rooms': 1, Bath: 1, 'Roof terrace': 1 };
const LOWER_FLOOR = { 'Day rooms': 2, 'Glass porch': 2, Garden: 2 };

// THE PARTS, from above: before the layers' hint a heading, three buttons, the list, empty, and
// two sentences; after the swatch's row, right of the paper, a row with a list, hidden at first.
await pad('#top', HOUSE);
const PARTS = [title, tools, add, rename, remove, list, hint, side, choice];
const IDS = 'H2#sections-title P#section-tools BUTTON#section-add BUTTON#section-rename';
const AND = 'BUTTON#section-remove UL#sections P#sections-hint DIV#section-row SELECT#section';
assert.equal(PARTS.map((one) => `${one.tagName}#${one.id}`).join(' '), `${IDS} ${AND}`);
const PLAIN = [HOUSE, 'Sections', 'group', 0, []];
assert.deepEqual([text(), title.textContent, tools.className, more.length, list.children], PLAIN);
const shows = (one) => `${one.textContent} ${one.hidden !== true}`;
const SHUT = [['New section true', 'Rename false', 'Remove false'], true, [choice]];
assert.deepEqual([[add, rename, remove].map(shows), side.hidden, side.children], SHUT);
const HINT = /^Pick a section, .+ takes it out again\. The word beside a section hides its blocks/;
assert.match(hint.textContent, HINT);

// "NEW SECTION", with a made-up `prompt`: put away, nothing; a name of nothing, of 61 characters
// or taken, the model's sentence in the alarm and no step; one that it takes, a section at the
// foot of the list, picked - the section's tool. The same question each time, nothing offered.
assert.deepEqual(press(add, null), [HOUSE, 0, '']);
assert.deepEqual(press(add, '  '), [HOUSE, 0, 'A section needs a name.']);
const LONG = "A section's name has 60 characters at the most: this one has 61.";
assert.deepEqual(press(add, ` ${'é'.repeat(61)} `), [HOUSE, 0, LONG]);
const MADE = housed([UPPER], {});
const PICKED = [[MADE, 1, ''], 'section', 1];
assert.deepEqual([press(add, ' Upper home '), tool, sectionList.picked()], PICKED);
assert.deepEqual(press(add, 'UPPER HOME'), [MADE, 0, 'There is a section "Upper home" already.']);
const QUESTION = ['Name of the new section, 60 characters at the most', ''];
assert.deepEqual(asked.splice(0), Array(5).fill(QUESTION));
// A ROW A SECTION, as a level's: its name, pressed while picked; its switch; two arrows, read out
// by their titles; what it holds. And the two buttons for the section that is picked are there.
const said = ({ tagName, dataset, children: [named, switched, , , small] }) =>
  `${tagName} ${dataset.section}: ${named.textContent}, ${named.said['aria-pressed']}, ` +
  `${switched.textContent}, ${small.textContent}`;
const rows = () => list.children.map(said);
assert.deepEqual(rows(), ['LI 1: Upper home, true, shown, no block yet']);
const arrows = (place) => list.children[place].children.slice(2, 4);
const reads = (one) => `${one.textContent} ${one.said['aria-label']} | ${one.title}`;
const [UP, DOWN] = ['up', 'down'].map((way) => `Move this section ${way} in the list`);
assert.deepEqual(arrows(0).map(reads), [`▲ ${UP} | ${UP}`, `▼ ${DOWN} | ${DOWN}`]);
const tags = list.children[0].children.map((one) => one.tagName).join();
const THERE = ['BUTTON,BUTTON,BUTTON,BUTTON,SMALL', 'Rename true', 'Remove true'];
assert.deepEqual([tags, shows(rename), shows(remove)], THERE);

// FILL, from above on the level at 817 m: a click on the night rooms, column 32.5 and row 31.5,
// puts both boxes in, in one step; a click on the bed is a click on them, and takes both out:
// the text it was but for the list. A box puts every block it reaches in, in one step - two cells
// wide over the night rooms and the bath, both; over the upper floor, its three. A click beside
// every block does nothing.
assert.deepEqual(stroke([32.5, 31.5]), [housed([UPPER], { 'Night rooms': 1 }), 1]);
assert.deepEqual(rows(), ['LI 1: Upper home, true, shown, 1 block']);
assert.deepEqual(stroke([45, 26]), [MADE, 1]);
const TWO = housed([UPPER], { 'Night rooms': 1, Bath: 1 });
assert.deepEqual(stroke([39.5, 33.5], [40.5, 33.5]), [TWO, 1]);
const UPPER_FILLED = housed([UPPER], UPPER_FLOOR);
assert.deepEqual(stroke([29.5, 21.5], [50.5, 38.5]), [UPPER_FILLED, 1]);
assert.deepEqual(rows(), ['LI 1: Upper home, true, shown, 3 blocks']);
assert.deepEqual(stroke([10.5, 10.5]), [UPPER_FILLED, 0]);

// WHAT `show` GIVES BACK. Another tool ends the pick and comes back as it is; then the section's
// is 'move'. A click on a name picks it: at that one show 'section' comes back whatever the tool,
// and with the section's tool it stays. A second click ends it; a stroke then fills nothing.
const TOOLS = ['move', 'merge', 'line', 'text', 'erase', 'block', 'object'];
const nameOf = (place) => list.children[place].children[0];
const back = (...handed) => handed.map((one) => sectionList.show(null, one));
for (const one of TOOLS) {
  assert.deepEqual([back(one, 'section'), sectionList.picked()], [[one, 'move'], null], one);
  assert.deepEqual(back(...TOOLS), TOOLS, one);
  tool = one;
  nameOf(0).hears.click();
  assert.deepEqual([tool, back('section'), sectionList.picked()], ['section', ['section'], 1]);
}
nameOf(0).hears.click();
const ENDED = ['LI 1: Upper home, false, shown, 3 blocks'];
assert.deepEqual([tool, sectionList.picked(), rows(), rename.hidden], ['move', null, ENDED, true]);
assert.deepEqual(stroke([32.5, 31.5]), [UPPER_FILLED, 0]);
// AND UNDO that takes the picked section away ends the pick: Select. Redo: back, not picked.
const BOTH = housed([UPPER, LOWER], UPPER_FLOOR);
const MADE_TOO = [[BOTH, 1, ''], 'section', 2];
assert.deepEqual([press(add, 'Lower home'), tool, sectionList.picked()], MADE_TOO);
sketch.step(sketch.past, sketch.future);
assert.deepEqual([text(), tool, sectionList.picked()], [UPPER_FILLED, 'move', null]);
sketch.step(sketch.future, sketch.past);
assert.deepEqual([text(), tool, rows().length, asked.splice(0)], [BOTH, 'move', 2, [QUESTION]]);

// THE STEPS OF A ROW. "Rename" asks with the picked one's name: put away, nothing; taken, the
// model's sentence; another, a step. The arrows move it, at an end nothing; the switch hides and
// shows it; "Remove" asks nothing, its blocks are in none and the pick ends; Undo has it back.
nameOf(0).hears.click();
assert.deepEqual(press(rename, null), [BOTH, 0, '']);
const TAKEN = 'There is a section "Lower home" already.';
assert.deepEqual(press(rename, ' lower HOME'), [BOTH, 0, TAKEN]);
const RENAMED = BOTH.replace('"Upper home"', '"Upper floor"');
assert.deepEqual(press(rename, 'Upper floor'), [RENAMED, 1, '']);
assert.deepEqual(asked.splice(0), Array(3).fill(['Name of the section', 'Upper home']));
const FLOOR = { id: 1, name: 'Upper floor' };
const SWAPPED = JSON.stringify({ ...JSON.parse(RENAMED), sections: [LOWER, FLOOR] });
assert.deepEqual(pressed(arrows(0)[1]), [SWAPPED, 1]);
const LOWER_ROW = 'LI 2: Lower home, false, shown, no block yet';
assert.deepEqual(rows(), [LOWER_ROW, 'LI 1: Upper floor, true, shown, 3 blocks']);
assert.deepEqual(pressed(arrows(1)[1]), [SWAPPED, 0]);
assert.deepEqual(pressed(arrows(1)[0]), [RENAMED, 1]);
assert.deepEqual(pressed(arrows(0)[0]), [RENAMED, 0]);
const HIDDEN = RENAMED.replace('"Upper floor"}', '"Upper floor","hidden":true}');
const switched = () => pressed(list.children[0].children[1]);
const HIDES = [[HIDDEN, 1], 'LI 1: Upper floor, true, hidden, 3 blocks'];
assert.deepEqual([switched(), rows()[0]], HIDES);
assert.deepEqual(switched(), [RENAMED, 1]);
assert.deepEqual(press(remove, 'never asked'), [housed([LOWER], {}), 1, '']);
assert.deepEqual([rows(), tool, rename.hidden, asked], [[LOWER_ROW], 'move', true, []]);
sketch.step(sketch.past, sketch.future);
assert.deepEqual([text(), rows()[0]], [RENAMED, 'LI 1: Upper floor, false, shown, 3 blocks']);
nameOf(1).hears.click();
assert.deepEqual(press(remove), [housed([FLOOR], UPPER_FLOOR), 1, '']);

// IN THE SIDE VIEW, on the slice along row 30, the upper home and the lower in a section each, and
// a third, "Porch", made: a click on the porch, column 54.5 and row 22.5, puts it in. With "Upper
// home" hidden, a box over the whole paper reaches what shows of the slice - the day rooms, the
// porch, the store and the lawn - in one step, and none of the blocks it holds.
const LOOK = housed([UPPER, LOWER], { ...UPPER_FLOOR, ...LOWER_FLOOR });
await pad('#side', LOOK);
const { PLANE, WIDE, ROWS } = globalThis.paper;
assert.deepEqual([PLANE, sketch.on(), sectionList.picked(), tool], ['side', 30, null, 'move']);
press(add, 'Porch');
const its = (id) => (one) => sketch.isBox(one) && sections.of(one)?.id === id;
const inIt = (id) => sketch.doc.things.filter(its(id)).map((box) => box.name);
assert.deepEqual([stroke([54.5, 22.5])[1], inIt(3)], [1, ['Glass porch']]);
list.children[0].children[1].hears.click();
const UPSTAIRS = ['Night rooms', 'Night rooms', 'Bath', 'Roof terrace'];
const FILLED = [1, UPSTAIRS, ['Garden'], ['Day rooms', 'Glass porch', 'Store', 'Lawn']];
assert.deepEqual([stroke([0, 0], [WIDE - 1, ROWS - 1])[1], inIt(1), inIt(2), inIt(3)], FILLED);

// WHAT THE PAPER DRAWS (layers.lit), from above at 814 m, with a line drawn there: with none
// picked, what layers.js read; with "Lower home" picked, the layer drawn on twice - the store, the
// cut and the line faded, then in full the day rooms, porch and garden and their thirteen objects.
const LINE = { view: 'top', at: 24, line: [30, 20, 50, 20, 1] };
const NOTES = `"notes":[${JSON.stringify(LINE)}]`;
const ON_24 = LOOK.replace('"top":18', '"top":24').replace('"notes":[]', NOTES);
await pad('#top', ON_24);
assert.deepEqual([sketch.on(), layers.lit() === layers.drawn(), text()], [24, true, ON_24]);
nameOf(1).hears.click();
const [drawn, lit] = [layers.drawn(), layers.lit()];
const indices = (things) => things.map((one) => one.index).sort((a, b) => a - b);
const read = ({ key, faded, things, notes }) => [key, faded, indices(things), notes];
assert.deepEqual([lit.length, lit.slice(0, -2)], [drawn.length + 1, drawn.slice(0, -1)]);
assert.deepEqual(read(lit.at(-2)), [24, true, [2, 36], [LINE]]);
const DAY = [0, 1, 5, 6, 11, 12, 16, 19, 20, 21, 22, 23, 24, 25, 26, 34];
assert.deepEqual(read(lit.at(-1)), [24, false, DAY, []]);

// THE LIST ON THE RIGHT: of the day rooms "No section", with no word for a value, and every
// section by its name, at "Lower home"; of an object and of nothing, hidden. A pick puts the
// block in, in one step, and gives the focus back; "No section" takes it out; Escape gives the
// focus back, as the key goes down and as it comes up, and another key does not.
const option = ({ value, textContent }) => `${value}: ${textContent}`;
function select(index) {
  selected = sketch.doc.things[index] ?? null;
  refresh();
  return [side.hidden, choice.children.map(option), choice.value];
}
assert.deepEqual(select(0), [false, [': No section', '1: Upper home', '2: Lower home'], '2']);
assert.deepEqual([select(5)[0], select(-1)[0], select(3)[2]], [true, true, '1']);
assert.deepEqual([pick(choice, '2'), did.splice(0), choice.value], [1, ['section blur'], '2']);
const LOWER_NOW = ['Day rooms', 'Glass porch', 'Night rooms', 'Night rooms', 'Garden'];
assert.deepEqual([inIt(1), inIt(2)], [['Bath', 'Roof terrace'], LOWER_NOW]);
const OUT = [pick(choice, ''), did.splice(0), choice.value, inIt(1).length, inIt(2).length];
assert.deepEqual(OUT, [1, ['section blur'], '', 2, 3]);
for (const heard of ['keydown', 'keyup']) {
  for (const key of ['Escape', 'b', 'Enter']) choice.hears[heard]({ key });
  assert.deepEqual(did.splice(0), ['section blur'], heard);
}

// OF page.js AND index.html, the text. `refresh` hands the list what is selected and the tool,
// and takes the tool back, after it keeps what is selected and before it writes the pad's words;
// `pointerup` hands it a stroke in the line before the one of `sketch.apply`; Escape takes Select
// for the section's tool; the paper draws `layers.lit`. The page names the script once, after
// gallery.js and all that it asks, and before page.js.
const lines = (name) => readFileSync(`${import.meta.dirname}/../${name}`, 'utf8').split('\n');
const code = lines('page.js').map((line) => line.trim());
const KEEPS = 'if (!sketch.doc.things.includes(picked) || !sketch.shows(picked)) picked = null;';
const at = code.indexOf(KEEPS);
assert.match(code[at + 1], /^tool = globalThis\.sectionList\.show\(picked, tool\);/);
assert.match(code[at + 2], /^\$\('picked'\)\.textContent = /);
const FILL = "else if (stroke?.tool === 'section') globalThis.sectionList.fill(stroke);";
const APPLY = 'else if (stroke) sketch.apply({ ...stroke, colour, kind, turned, high });';
assert.equal(code[code.indexOf(FILL) + 1], APPLY);
assert.equal(code.filter((line) => line.includes('sectionList')).length, 2);
const ESCAPE = "[picked, tool] = [null, tool === 'section' ? 'move' : tool];";
const DRAWS = '{ layers: layers.lit(), cuts, picked: chosen(), preview: preview() };';
assert.deepEqual([code.includes(ESCAPE), code.includes(`const showing = ${DRAWS}`)], [true, true]);
const NAMES_A_SCRIPT = /^<script src="([^"]+)"><\/script>$/;
const scripts = lines('index.html').flatMap((line) => NAMES_A_SCRIPT.exec(line.trim())?.[1] ?? []);
const place = scripts.indexOf('sections/list.js');
const once = scripts.filter((name) => name === 'sections/list.js').length;
assert.deepEqual([once, scripts[place - 1]], [1, 'gallery.js']);
const BEFORE = ['sketch.js', 'sections/model.js', 'strokes.js', 'labels.js', 'layers.js'];
for (const before of [...BEFORE, 'swatch.js'])
  assert.ok(scripts.indexOf(before) >= 0 && scripts.indexOf(before) < place, before);
assert.ok(place < scripts.indexOf('page.js'), 'the page hands the list what is selected');

process.stdout.write(
  'tools/sketch/sections: the list beside the paper makes, names, picks, renames, moves, hides and removes a section through the model, its pick fills one by clicks and by a box, and a block says its section on the right\n',
);
