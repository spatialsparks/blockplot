// The check of the gallery of the objects as text (story ST-029): of page.js and index.html,
// which want a whole page to load, the text alone - how page.js hands the gallery the kind and
// takes a pick, and where index.html names the gallery's scripts and its stylesheet, and the
// one button of the Objects group. It loads no script: tools/sketch/gallery.check.js holds the
// gallery as it is built. Cut out of that check, whole, to make room for kinds (T-034.1). Run by
// tools/sketch/check.js, or alone:
//   pnpm exec node tools/sketch/gallery-text.check.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import process from 'node:process';

// OF page.js, which wants a whole page to load, the text alone. `refresh` hands the gallery the
// kind that is picked, and whether Object is the tool, in the line after it hands the swatch what
// is selected - and nowhere else; a pick takes the kind and the Object tool, and that is all of
// it; and the script asks the page for no list of kinds.
const read = (file) => readFileSync(`${import.meta.dirname}/${file}`, 'utf8');
const lines = (file) => read(file).split('\n');
const code = lines('page.js').map((line) => line.trim());
const refresh = code.slice(code.indexOf('function refresh() {'));
const at = refresh.findIndex((line) => line.startsWith('globalThis.swatch.show(picked);'));
assert.ok(at > 0 && at < refresh.indexOf('render();'), 'refresh hands the swatch what is selected');
assert.match(refresh[at + 1], /^globalThis\.gallery\.show\(kind, tool === 'object'\);/);
assert.equal(code.filter((line) => line.includes('gallery.show')).length, 1, 'shown once');
const PICK = ['globalThis.gallery.onPick = (key) => {', "[kind, tool] = [key, 'object'];"];
const where = code.indexOf(PICK[0]);
assert.deepEqual(code.slice(where, where + 4), [...PICK, 'refresh();', '};'], 'a pick');
assert.ok(!read('page.js').includes("$('kind')"), 'page.js asks the page for a list of kinds');
// OF index.html: the groups' script is named in the line after furniture.js, the last of the
// files that draw a kind; the gallery's once, after the sketch - a door's size is the sketch's
// figure - and before page.js, which hands it the kind. No part has the id `kind`, and the page
// has no list; the one button of the Objects group is the Object tool, with a picture and a name
// to write into. And the page names its own stylesheet in the line after the frame's, by its
// bare name, and keeps no rule itself.
const html = lines('index.html').map((line) => line.trim());
const after = (line) => html[html.indexOf(line) + 1];
const script = (name) => `<script src="${name}"></script>`;
const sheet = (name) => `<link rel="stylesheet" href="${name}" />`;
assert.equal(after(script('furniture.js')), script('object-groups.js'));
assert.equal(after(sheet('frame.css')), sheet('pad.css'));
assert.equal(after('id="object"'), 'data-tool="object"');
const ONCE = [script('object-groups.js'), script('gallery.js'), sheet('pad.css'), 'id="object"'];
for (const once of [...ONCE, 'data-tool="object"'])
  assert.equal(html.filter((line) => line === once).length, 1, once);
const place = html.indexOf(script('gallery.js'));
for (const first of ['paper.js', 'shapes.js', 'object-groups.js', 'sketch.js'])
  assert.ok(html.indexOf(script(first)) > 0 && html.indexOf(script(first)) < place, first);
assert.ok(place < html.indexOf(script('page.js')), 'the page hands the gallery the kind');
assert.ok(!/id="kind"|<select|<style/.test(read('index.html')), 'a list, or a rule, in the page');
for (const id of ['object-picture', 'object-name'])
  assert.equal(read('index.html').split(`id="${id}"`).length, 2, id);

process.stdout.write(
  'tools/sketch: page.js hands the gallery the kind and takes a pick, and index.html names the gallery, its groups and its stylesheet in their places, with one button for the Objects group\n',
);
