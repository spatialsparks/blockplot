// The check of full screen on the 3D page (story ST-033, task T-033.6), on a made-up page as
// panel.check.js makes one: the two buttons of the corner are made in the stage's place, each
// with its title; a click on "Full screen" asks `full(true)` once, and the browser's full screen
// for the page's root once; a second click while alone asks nothing more; Back, Escape and the
// browser leaving its full screen each ask `full(false)` once - and the browser's full screen is
// left only where the page still has it; a refused full screen is still alone, and goes wrong
// nowhere; Escape, Back and the browser's leaving ask nothing where the page is not alone, nor
// does another key; and the corner's "Picture" asks for a picture, once. What the page looks like
// alone is a look's, and the browser's: tests/e2e/sketch-3d-show.spec.ts. No browser, and nothing
// of the pad. Run by tools/sketch/check.js, as every *.check.js is.
import assert from 'node:assert/strict';
import process from 'node:process';
import { setTimeout as later } from 'node:timers/promises';
import { openFull } from './full.js';

// A made-up page: a place for every name asked for, which keeps what it is given and notes who
// listens for what on it; and a document that notes the same, with the browser's full screen,
// which grants or refuses as `grants` says, and says which element has it.
const places = new Map();
const place = () => ({
  heard: {},
  children: [],
  append(...more) {
    this.children.push(...more);
  },
  addEventListener(type, hear) {
    this.heard[type] = hear;
  },
});
const heard = {};
const browser = { grants: true, asked: [], left: 0 };
const root = {
  requestFullscreen() {
    browser.asked.push(this);
    if (!browser.grants) return Promise.reject(new TypeError('Permissions check failed'));
    document.fullscreenElement = root;
    return Promise.resolve();
  },
};
const document = {
  documentElement: root,
  fullscreenElement: null,
  createElement: (tag) => Object.assign(place(), { tag }),
  getElementById: (id) => places.get(id) ?? places.set(id, place()).get(id),
  addEventListener: (type, hear) => (heard[type] = hear),
  exitFullscreen() {
    browser.left += 1;
    document.fullscreenElement = null;
    return Promise.resolve();
  },
};
globalThis.document = document;
const [fulls, pictures] = [[], []];
const stage = place();
const full = openFull(stage, {
  full: (on) => fulls.push(on),
  picture: () => pictures.push('asked'),
});
const $ = (id) => places.get(id);
/** What was asked since the last time, of the page and of the browser: `full(on)`, and the browser's full screen asked for and left. */
const since = () => {
  const now = [[...fulls], browser.asked.length, browser.left];
  [fulls.length, browser.asked.length, browser.left] = [0, 0, 0];
  return now;
};
const press = (key) => heard.keydown({ key });
// The browser left its full screen, as it says it: no element has it any more.
const leaves = () => {
  document.fullscreenElement = null;
  heard.fullscreenchange();
};

// The corner: a picture and back, two buttons in the stage's place, each saying what it does in
// full to a pointer that rests on it. The page is not alone as it opens, and nothing was asked.
const [corner] = stage.children;
assert.equal(corner.id, 'full-corner');
const [picture, back] = corner.children;
assert.deepEqual(
  [picture, back].map(({ tag, type, id, textContent }) => [tag, type, id, textContent]),
  [
    ['button', 'button', 'full-picture', 'Picture'],
    ['button', 'button', 'full-back', 'Back'],
  ],
);
assert.ok([picture, back].every(({ title }) => title.length > 20));
assert.equal(full.on(), false);
assert.deepEqual(since(), [[], 0, 0]);
assert.deepEqual(Object.keys(heard).sort(), ['fullscreenchange', 'keydown']);

// Not alone, Escape, Back and the browser's leaving ask nothing: there is nothing to go back to.
press('Escape');
back.heard.click();
leaves();
assert.deepEqual([since(), full.on()], [[[], 0, 0], false]);

// "Full screen": the stage alone, asked once, and the browser's full screen for the page's root,
// in the turn of the click. A second click while alone asks nothing more.
$('full-screen').heard.click();
assert.deepEqual([since(), full.on()], [[[true], 1, 0], true]);
$('full-screen').heard.click();
assert.deepEqual(since(), [[], 0, 0]);
// Entered, the browser says so: that is no leaving. Nor is another key.
heard.fullscreenchange();
press('PageDown');
press('a');
assert.deepEqual([since(), full.on()], [[[], 0, 0], true]);
// The corner's picture asks for one, once, and leaves the page alone.
picture.heard.click();
assert.deepEqual([pictures, full.on()], [['asked'], true]);
// Escape: the page as it was, asked once, and the browser's full screen left once - the browser's
// word of that, which follows, asks nothing more.
press('Escape');
leaves();
assert.deepEqual([since(), full.on()], [[[false], 0, 1], false]);

// Back, the same.
$('full-screen').heard.click();
back.heard.click();
assert.deepEqual([since(), full.on()], [[[true, false], 1, 1], false]);

// The browser leaving its full screen - by its own Escape, which the page did not hear: the page
// as it was, once, and nothing left that the browser had left already. Then Escape asks nothing.
$('full-screen').heard.click();
leaves();
press('Escape');
assert.deepEqual([since(), full.on()], [[[true, false], 1, 0], false]);

// A browser that refuses: the stage is alone all the same, nothing goes wrong, and back is back -
// with no full screen of the browser's to leave.
browser.grants = false;
const unhandled = [];
process.on('unhandledRejection', (why) => unhandled.push(why));
$('full-screen').heard.click();
await later(0);
assert.deepEqual([since(), full.on(), unhandled], [[[true], 1, 0], true, []]);
press('Escape');
assert.deepEqual([since(), full.on()], [[[false], 0, 0], false]);

// And a browser that has no full screen to give: alone in the window, all the same.
delete root.requestFullscreen;
$('full-screen').heard.click();
assert.deepEqual([since(), full.on()], [[[true], 0, 0], true]);
back.heard.click();
assert.deepEqual([since(), full.on(), pictures.length], [[[false], 0, 0], false, 1]);

process.stdout.write(
  'tools/sketch/view3d: Full screen shows the stage alone at a click, with a picture and back in its corner; Back, Escape and the browser leaving its full screen each bring the page back once; a refused full screen is still alone; and where the page is not alone they ask nothing\n',
);
