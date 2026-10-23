// Full screen, on the 3D page (story ST-033, task T-033.6): the stage alone, with two small
// buttons in its top right corner - a picture of it, and back. The button of the toolbar,
// `#full-screen`, has it begin; Back, Escape, or the browser leaving its own full screen have it
// end. 3d.html has the button, hidden until there is a stage (panel.js); this makes the two
// buttons in the stage's place, hears all four, and asks the browser for its full screen - which
// a browser may refuse, a frame or the tests' browser among them: the stage is then alone in the
// window, and nothing is said, for a refusal is no fault. It decides whether the page is alone,
// and nothing else: what the page looks like alone is side.css's, and what it saves, its
// caller's. Nothing of it is kept: a browser gives its full screen only at a click.

// What the two buttons of the corner say, and say in full to a pointer that rests on them.
const PICTURE = [
  'full-picture',
  'Picture',
  'The stage as it shows, as a picture, as File saves it',
];
const BACK = ['full-back', 'Back', 'Back to the page, as it was: Escape too'];

/**
 * Opens full screen over `place`, the stage's element of the page, and gives `{ on() }`: whether
 * the page shows the stage alone by now. Makes in `place` the two buttons of its corner, each
 * with its title. `asked` is what the page does when it is asked: `full(on)`, the stage alone or
 * the page as it was, once at each change - and `picture()` by the corner's "Picture".
 *
 * A click on `#full-screen` asks `full(true)` and the browser's full screen for the page's root,
 * in the turn of that click, as a browser wants it; a refusal is taken quietly, and the stage
 * stays alone. Back, Escape and the browser leaving its full screen each ask `full(false)` once,
 * and the browser's full screen is left where the page still has it. Where the page is not
 * alone, none of them asks anything.
 */
export function openFull(place, asked) {
  const { document } = globalThis;
  const make = ([id, text, title]) =>
    Object.assign(document.createElement('button'), {
      type: 'button',
      id,
      textContent: text,
      title,
    });
  const [picture, back] = [make(PICTURE), make(BACK)];
  const corner = Object.assign(document.createElement('div'), { id: 'full-corner' });
  corner.append(picture, back);
  place.append(corner);
  let alone = false;

  // The browser's own full screen, asked for and taken back: either may be refused, and neither
  // is a fault - the stage is alone in the window then, or the page is back all the same.
  const quietly = (promise) => promise?.catch?.(() => {});
  function begin() {
    if (alone) return;
    alone = true;
    asked.full(true);
    quietly(document.documentElement.requestFullscreen?.());
  }
  function end() {
    if (!alone) return;
    alone = false;
    asked.full(false);
    if (document.fullscreenElement) quietly(document.exitFullscreen?.());
  }

  document.getElementById('full-screen').addEventListener('click', begin);
  picture.addEventListener('click', () => asked.picture());
  back.addEventListener('click', end);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') end();
  });
  // The browser left its full screen - by its own Escape, which the page may never hear.
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) end();
  });
  return { on: () => alone };
}
