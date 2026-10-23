// The controls of the 3D page, above its stage and beside it: the ways of showing the scene;
// the stands, which put the view at a station; the switches of the ground and of the shadows;
// the entries of File that save the stage as a picture and the house as a file - a 3D file, and
// a Google Earth file with the raise typed under it; and the levels to cut the scene at, each
// with its switch (story ST-033) - the sections' and the objects' are switches.js's. 3d.html
// has their places, hidden: this fills them, shows them and hears them. It decides nothing: what
// is asked of it, it hands to its caller, and what is shown, its caller says. The menu itself -
// File, and what opens and shuts it - is the pad's own, views.js, as on the pad's page; what
// the button of Settings opens is settings.js's, and what Full screen does, full.js's.
import { ALL } from './showing.js';

// The places of 3d.html that are shown once there is a stage for them to work on: among them
// the group of the toolbar that holds nothing else, With, hidden until then word and all - and
// the two buttons of the toolbar that stand in no group: Settings, and Full screen (full.js).
const PLACES = 'ways stands with ground-row shadows-row settings-open full-screen side'.split(' ');
const STEP = { pageup: -1, pagedown: 1 };
// What is not seen, and keeps its place in the page: the switch of the shadows where the way
// that is shown has no sun - and File, until there is a stage: 3d.html marks it so.
const AWAY = 'away';
// What the entry of the file says of itself, to a pointer that rests on it.
const SAVES =
  'The house as it stands here - its parts, at this level, in metres - ' +
  'as one file that other 3D programs open';

/**
 * Opens the controls, and gives `shows({ cuts, cut, ground, way, shadows, sunlit, built,
 * placed, off })`: it lists the cuts - all, and the scene's levels from the top down, each under
 * the name `levelName` gives it, a level with its switch - marks the one the scene is shown at
 * and the way it is shown in, turns a level's switch off where `off.levels` holds it, and sets
 * the switches of the ground and of the shadows. The switch of the shadows shows where
 * `sunlit` says that the way has a sun to cast them: elsewhere it keeps its place in the page,
 * and is not seen. The entry of the file is on where `built` says that the way shows the house
 * as the parts it is built of: elsewhere it is off, and the line under it says why. The entry of
 * the Google Earth file is on where `placed` says that the plot says where it lies, in every
 * way: elsewhere it is off, and the line under it says why. And `shows.raised(text)` puts a
 * raise that was kept into its field; `shows.stood(stand)` marks that stand as chosen, by its
 * name, and the others not - `null` marks none: the view is at that stand, or at none.
 *
 * `ways` and `stands` are the ways and the stands as showing.js names them, and `sun` the words
 * that name the sun (scene/sun.js). `asked` is what the page does when it is asked: `way(way)` by
 * a click on a way, `stand(station)` by a click on a stand, `ground(on)` and `shadows(on)` by
 * their switches, `picture()` by a click on the entry of the picture - which is on in every way
 * - `save()` by a click on the entry of the file, `earth()` by a click on the entry of the
 * Google Earth file, `raise(text)` by what is typed into its field, as it is typed - a key
 * there is the field's - `cut(cut)` by a click on a level, `level(level, on)` by its switch, `on`
 * whether it is on now, and `step(by)` by Page Up, -1, and Page Down, 1 - as the pad's own top
 * view goes from layer to layer. `typing(event)` says
 * whether a key is typed into a field, as the pad says it - or pressed while a menu is open:
 * such a key is the field's, or the menu's, and steps no level.
 */
export function openPanel({ ways, stands, levelName, sun, typing }, asked) {
  const { document } = globalThis;
  const $ = (id) => document.getElementById(id);
  const button = (text, title) =>
    Object.assign(document.createElement('button'), { type: 'button', textContent: text, title });

  for (const { way, name, title } of ways) {
    const one = button(name, title);
    one.dataset.way = way;
    one.addEventListener('click', () => asked.way(way));
    $('ways').append(one);
  }
  for (const { stand, name, title } of stands) {
    const one = button(name, title);
    one.dataset.stand = stand;
    one.addEventListener('click', () => asked.stand(stand));
    $('stands').append(one);
  }
  $('ground').addEventListener('change', () => asked.ground($('ground').checked));
  $('shadows').addEventListener('change', () => asked.shadows($('shadows').checked));
  $('shadows-row').title = `The shadows of an ${sun}: off, the same house without them`;
  $('picture').addEventListener('click', () => asked.picture());
  $('save').title = SAVES;
  $('save').addEventListener('click', () => asked.save());
  $('earth').addEventListener('click', () => asked.earth());
  $('earth-raise').addEventListener('input', () => asked.raise($('earth-raise').value));
  document.addEventListener('keydown', (event) => {
    // A key typed into a field is the field's; with Ctrl or Alt it is the browser's.
    if (typing(event) || event.ctrlKey || event.metaKey || event.altKey) return;
    const by = STEP[event.key?.toLowerCase()];
    if (by === undefined) return;
    event.preventDefault();
    asked.step(by);
  });
  for (const id of PLACES) $(id).hidden = false;
  // There is a stage: File is seen, in the place it kept.
  $('file-group').classList.toggle(AWAY, false);

  // The switch of each level listed now, by its level.
  let switches = [];

  /**
   * A cut in the list: all of the house, or what stands on a level and below it - and after a
   * level's button its switch, a checkbox named by the level's name, which asks `level(level,
   * on)` as it is turned (story ST-033). "All" has none.
   */
  function entry(cut) {
    const pick =
      cut === ALL
        ? button('All', 'Every level: all that is drawn')
        : button(levelName(cut), 'What stands on this level and below it: all above is taken off');
    pick.dataset.level = String(cut);
    pick.addEventListener('click', () => asked.cut(cut));
    const item = document.createElement('li');
    item.append(pick);
    if (cut === ALL) return item;
    const on = Object.assign(document.createElement('input'), {
      type: 'checkbox',
      checked: true,
      ariaLabel: levelName(cut),
      title: 'Off: what stands on this level is not drawn, and can still be cut at',
    });
    on.addEventListener('change', () => asked.level(cut, on.checked));
    switches.push({ on, cut });
    item.append(on);
    return item;
  }

  // The list is written anew when the sketch has other levels, and not for a level picked: a
  // button that was clicked stays the one that the keys speak to.
  let listed = '';
  const shows = ({ cuts, cut, ground, way, shadows, sunlit, built, placed, off }) => {
    if (String(cuts) !== listed) {
      listed = String(cuts);
      switches = [];
      $('levels').replaceChildren(...cuts.map(entry));
    }
    for (const one of switches) one.on.checked = !off.levels.includes(one.cut);
    for (const pick of $('levels').querySelectorAll('button')) {
      pick.setAttribute('aria-pressed', String(pick.dataset.level === String(cut)));
    }
    for (const pick of $('ways').querySelectorAll('button')) {
      pick.setAttribute('aria-pressed', String(pick.dataset.way === way));
    }
    $('ground').checked = ground;
    $('shadows').checked = shadows;
    $('shadows-row').classList.toggle(AWAY, !sunlit);
    // An entry of a menu takes no place of the toolbar: it is off, and says why, where it stands.
    $('save').disabled = !built;
    $('save-why').hidden = Boolean(built);
    $('earth').disabled = !placed;
    $('earth-why').hidden = Boolean(placed);
  };
  // A raise that was kept, into its field: the page has it from the store, as it was typed.
  const raised = (text) => {
    $('earth-raise').value = text;
  };
  // The stand the view is at, marked as a way and a level are: the caller says which, or none.
  const stood = (stand) => {
    for (const one of $('stands').querySelectorAll('button')) {
      one.setAttribute('aria-pressed', String(one.dataset.stand === stand));
    }
  };
  return Object.assign(shows, { raised, stood });
}
