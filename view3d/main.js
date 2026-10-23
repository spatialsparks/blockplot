// The sketch pad's 3D page: the sketch on the ground of the plot - as solids, or as the parts a
// house is built of, by the way of showing - cut at a level or whole, with the ground or
// without, seen from where the tab was looking the last time or from the front - and again
// whenever the sketch that the browser keeps was changed: by another window, or by a figure of
// the house that was written here, in Settings. Less what the tab's switches take away - a
// section, a level, a group of objects (story ST-033), kept by the tab with the rest and written
// into nothing - and opened along a slice of the pad where the tab picked a side, the cut moved
// with the slice at every reading. three.js comes from the pad's own server, by the
// page's import map. The page says on its body what became of it: `data-three` is three.js's
// revision once that is loaded; `data-solids` is how many solids the scene of the sketch has,
// set before anything is drawn, and `data-beyond`, how far beyond the plot's paper the ground
// drawn reaches, in whole metres (ST-042); `data-stage` is `drawn` once the stage was drawn, or
// `none` where nothing could be - and then the page says why, in words; and where there is a stage,
// `data-way`, `data-shadows`, `data-level`, `data-ground`, `data-shown`, `data-parts` and
// `data-open` say what it shows - and `data-full`, `on` while the stage is shown alone, full
// screen (full.js), and else `off`. Where this script itself does not load, 3d.html says so. And
// where the house stands there as its parts, the page saves them as a file when it is asked
// (file.js) - and,
// in whichever way it is shown, the stage as it shows as a picture, and where the plot says where
// it lies, the house as a Google Earth file - the parts that White builds of it above the ground,
// less what the tab has switched off, whole at every cut and opened along nothing, raised as
// typed (../kml/house.js) - and says in words how that went, and how many parts the file holds.
import { REVISION } from 'three';
import { houseFile, keepRaise, keptRaise, raiseOf } from '../kml/house.js';
import { drawnBox } from '../scene/ground.js';
import { sceneOf } from '../scene/scene.js';
import { openAlong, shownBy } from '../scene/shows.js';
import { sunOf } from '../scene/sun.js';
import { save, saveKml, savePicture } from './file.js';
import { openFull } from './full.js';
import { openPanel } from './panel.js';
import {
  FIGURES,
  groups,
  keep,
  levelName,
  read,
  seen,
  site,
  typed,
  typing,
  usual,
  watch,
  winds,
} from './read.js';
import { openSettings } from './settings.js';
import {
  WAYS,
  cutOf,
  cutsOf,
  keptOf,
  lineOf,
  offOf,
  opensOf,
  standsOf,
  stepped,
  switchable,
  wayOf,
} from './showing.js';
import { openStage } from './stage.js';
import { openSwitches } from './switches.js';
import { openView } from './view.js';

const { document } = globalThis;
const { body } = document;
const said = document.getElementById('said');
const NO_WEBGL =
  'This browser gives the page no WebGL, so nothing can be drawn in 3D here. ' +
  'The five other views work as before.';
const NOTHING_YET =
  'Nothing is drawn yet: this is the ground of the plot, with its outline. ' +
  'What is drawn in one of the five other views stands here.';

body.dataset.three = REVISION;
const stage = openStage(document.getElementById('stage'), () => {
  body.dataset.stage = 'drawn';
});
// The sun over this plot: the one that is named, where the plot's bearing puts it.
const sun = sunOf(site.bearingDeg);
// What the tab shows: the way, the shadows, the cut, the ground and what is switched off as it
// kept them the last time - the volumes, all levels, the ground and the shadows on and nothing
// off, the first time - and the scene of the sketch as it was read last, with its sections.
const { look, ...showing } = keptOf(seen);
const view = stage && openView(stage, look, sun.toward);
let scene = null;
let sections = [];
// Where the pad's two slices run, as the sketch was read last: what the house opens along.
let on = null;
// The groups of objects that a switch takes away: the gallery's, but for doors, windows, stairs.
const kinds = switchable(groups);
// The meshes of the parts that stand on the stage by now: what a file of the house holds.
let staged = [];
// What the page has to say on its line over the stage: of the sketch - what went wrong with it,
// or that nothing is drawn yet - and of what it saved last: a file of the house, or a picture.
const told = { sketch: { words: '', wrong: false }, file: { words: '', wrong: false } };
// Whether the plot says where it lies, and so makes a Google Earth file; and the raise in Google
// Earth as it was typed last, kept by the browser for this plot.
const placed = site.originLV95 !== undefined;
let raise = keptRaise();

/** Says one of the two anew, and so the line: the sketch's words first, then those of what was saved last. */
function say(more) {
  Object.assign(told, more);
  const { words, line } = lineOf(told.sketch, told.file);
  [said.textContent, said.className] = [words, line];
}

/**
 * The stage as it shows at the click, taken in the turn of a drawing, saved as a PNG and said
 * where a file is - by File's "Picture (PNG)" and by the corner's "Picture" in full screen alike.
 * Said while the stage is alone, the line shows once the page is back: side.css hides it till then.
 */
const pictured = () => stage.picture().then((taken) => say({ file: savePicture(taken) }));

/**
 * Shows the scene as the tab shows it by now, on the stage and in the controls, and says so on
 * the body: the way it is shown in; whether shadows are cast, `on` or `off` - and they are where
 * the way has a sun and they are not switched off; the level it is cut at, or `all`; the ground
 * `on` or `off`; how many solids show at the cut with the switches (`shownBy`) - counted off the
 * stage where they stand on it, and of the scene where its parts stand in their place; and how
 * many parts stand on the stage, counted off its meshes: none, in the volumes. A level that the
 * sketch has no more is all levels.
 */
function show() {
  showing.cut = cutOf(scene, showing.cut);
  const { sun: sunlit, parts: built } = wayOf(showing.way);
  shows({ cuts: cutsOf(scene), ...showing, sunlit, built, placed });
  switched({ sections, groups: kinds, off: showing.off, open: showing.open });
  const along = openAlong(site, on, showing.open);
  const { solids, parts } = view.show(scene, { ...showing, along });
  staged = parts;
  const whole = built
    ? shownBy(scene, showing.cut, showing.off).solids
    : solids.filter((solid) => solid.visible);
  body.dataset.way = showing.way;
  body.dataset.shadows = sunlit && showing.shadows ? 'on' : 'off';
  body.dataset.level = String(showing.cut);
  body.dataset.ground = showing.ground ? 'on' : 'off';
  body.dataset.shown = String(whole.length);
  body.dataset.parts = String(parts.reduce((sum, mesh) => sum + mesh.userData.parts, 0));
  body.dataset.open = showing.open;
}

/** What a control asks for: one thing of what the tab shows is another now, and the scene is shown so. */
const sets = (what) => (to) => {
  showing[what] = to;
  show();
};

/**
 * What a switch asks for: what it holds - a section, a level, a group - is off now, or on again,
 * in that list of what is switched off. Nothing is written into the sketch, and it is no step.
 */
const turns = (list) => (held, on) => {
  const others = showing.off[list].filter((one) => one !== held);
  sets('off')({ ...showing.off, [list]: on ? others : [...others, held] });
};

// The controls are in the page before the stage is first drawn, as the line of words is: the
// stage has its size from the first drawing, and the view is fitted to that. Put there later,
// either changes the size of the stage's place while its observer speaks: the stage is then
// drawn twice as it opens, and the browser sends the window the error "ResizeObserver loop
// completed with undelivered notifications".
const shows =
  stage &&
  openPanel(
    { ways: WAYS, stands: standsOf(winds), levelName, sun: sun.name, typing },
    {
      stand: (station) => {
        view.stand(station);
        shows.stood(station);
      },
      way: sets('way'),
      shadows: sets('shadows'),
      ground: sets('ground'),
      cut: sets('cut'),
      level: turns('levels'),
      step: (by) => sets('cut')(stepped(scene, showing.cut, by)),
      // What stands there at the click: a level stepped while the file is written is not in it.
      save: () => save(staged).then((file) => say({ file })),
      picture: pictured,
      // White's parts of the house above the ground at the click, less what is switched off -
      // in every way, and whole at every cut: the file follows no cut and no "Open along".
      earth: () => {
        const now = new Date();
        say({ file: saveKml(houseFile(scene, site, raiseOf(raise), now, showing.off), now) });
      },
      raise: (text) => {
        raise = text;
        keepRaise(text);
      },
    },
  );
shows?.raised(raise);
// The stand the view is at is marked as chosen (T-000.23): Front, where the tab kept no look and
// the view is put there; none, where it is where it was - a place, not a stand. A stand is a
// place to look from, which the next drag leaves: the view moved by hand - a change of the
// stage's controls between their start and their end, by a drag or the wheel - marks none. A
// click on the stage that moves nothing, and a stand's own change, leave the mark as it is.
if (stage) {
  shows.stood(look === null ? 'front' : null);
  let held = false;
  stage.controls.addEventListener('start', () => (held = true));
  stage.controls.addEventListener('end', () => (held = false));
  stage.controls.addEventListener('change', () => {
    if (held) shows.stood(null);
  });
}
// Under the levels, a switch a section and a group of objects, and the sides to open along (ST-033).
const switched =
  stage &&
  openSwitches(
    { section: turns('sections'), group: turns('groups'), open: sets('open') },
    opensOf(winds),
  );
// Settings, right of the stage, closed until their button of the toolbar opens them: the figures
// of the house, each written into the sketch as it is typed, by read.js. Of a figure that was
// written the page hears as it hears of a change from elsewhere - by `watch`, below - and reads
// the sketch again. Opened, they take their width of the stage's place, and shut, the stage has
// it back: its observer draws it anew at that size, and no camera moves. Where there is no
// stage, there are none.
const figured = stage && openSettings(FIGURES, { typed, usual });
// Full screen: the stage alone, with a picture and back in its corner, until Back, Escape or the
// browser's leaving (full.js). Nothing is kept of it, and no camera moves: the stage's observer
// draws it at its new size. Where there is no stage, there is none.
if (stage) {
  body.dataset.full = 'off';
  openFull(document.getElementById('stage'), {
    picture: pictured,
    full: (on) => {
      body.dataset.full = on ? 'on' : 'off';
    },
  });
}

/**
 * Reads the sketch, works out its scene and says how many solids it has; and where there is a
 * stage, has Settings say its figures, says in words what is to be said of the sketch - what
 * went wrong with it, or that nothing is drawn yet - on a line over the stage, and shows the
 * scene. `again` is for a sketch that was changed since the page read it, by another window or
 * by a figure written here: read from the browser's store, and seen from where the view was
 * looking, at the level it was cut at.
 *
 * The scene stands on the plot as the sketch was read with it, `land`: the site, on the ground
 * that the sketch's blocks of ground shape (story ST-027) - the hill, the outline on it and the
 * ground that a rule asks are that one. A block of ground is no solid: a sketch of nothing
 * else has nothing drawn yet, on a hill that is shaped.
 */
function see(again) {
  const { things, figures, trouble, locked, land, sections: listed, on: slices } = read(again);
  scene = sceneOf(land, things, figures);
  // What the sketch no longer has is no longer switched off: a section, a level.
  [sections, on] = [listed, slices];
  showing.off = offOf(showing.off, scene, sections);
  body.dataset.solids = String(scene.solids.length);
  body.dataset.beyond = String(land.ground.beyond ?? 0);
  if (view === null) return;
  stage.sight(drawnBox(scene.ground, scene.box));
  figured({ figures, locked });
  const words = trouble || (scene.solids.length === 0 ? NOTHING_YET : '');
  // The line is there before the stage is drawn: the stage has its size from the first drawing.
  say({ sketch: { words, wrong: trouble !== '' } });
  show();
}

if (stage === null) {
  said.textContent = NO_WEBGL;
  body.dataset.stage = 'none';
} else {
  // Where nothing is drawn, nothing is shown: what the tab kept of a stage stays as it is.
  keep(() => ({ ...showing, ...view.looking() }));
}
see(false);
watch(() => see(true));
