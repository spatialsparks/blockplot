// What `pnpm sketch:look` is asked on its command line, read (look.js): the page, the sketch file,
// the picture file, which plot - the made-up one, --demo, or a plot's file, --plot=<file> - the
// width, and the steps, each made into what it does to the page. Nothing here starts a pad or a
// browser: look-args.check.js holds it by hand.
import { setTimeout as pause } from 'node:timers/promises';

export const SWITCH = '--demo';
// A plot's file, which the page is given through Open plot, as a person gives it.
const PLOT = /^--plot=(.+)$/;
// How wide the page is to be: a whole number of pixels, in figures alone, from the one to the other.
const WIDTH = /^--width=(\d+)$/;
const [NARROWEST, WIDEST] = [320, 4000];
// So wide where no --width says otherwise.
export const WIDE = 1440;
export const USAGE =
  'pnpm sketch:look <page> <sketch file> <picture file> --demo|--plot=<plot file> ' +
  `[--width=<pixels>] [step ...] - a width is a whole number from ${NARROWEST} to ${WIDEST}, and ` +
  'a step is click=<selector>, click=<x>,<y>, key=<key>, drag=<x>,<y>,<x>,<y>, ' +
  'sdrag=<x>,<y>,<x>,<y>, rdrag=<x>,<y>,<x>,<y>, wheel=<x>,<y>,<notches> or wait=<milliseconds>';
// The one sentence of a look that names no plot, or two: the pad holds no plot of its own.
export const NO_PLOT =
  "A look is of the made-up plot, --demo, or of a plot's file, --plot=<file>, and of one of the two: the pad holds no plot of its own.";
// A drag passes through so many places on its way, as a hand does.
const DRAG_PLACES = 12;
// A notch of the wheel, as a browser counts one: so many pixels down the page - and up it, for a
// wheel that is turned away from the hand, which is towards what the pointer is on.
const NOTCH_PX = 100;

/** So many numbers, written with commas between them - or null where the text is none. */
function numbers(text, count) {
  const parts = text.split(',').map((part) => (part.trim() === '' ? Number.NaN : Number(part)));
  return parts.length === count && parts.every(Number.isFinite) ? parts : null;
}

/** A drag with a button, from one place to another: what it does to the page, or null. */
function dragOf(what, button) {
  const line = numbers(what, 4);
  if (!line) return null;
  const [x1, y1, x2, y2] = line;
  return async (page) => {
    await page.mouse.move(x1, y1);
    await page.mouse.down({ button });
    await page.mouse.move(x2, y2, { steps: DRAG_PLACES });
    await page.mouse.up({ button });
  };
}

// What each kind of step does to the page, from what was written after its `=`; null where that
// makes no step of the kind.
const STEPS = {
  click(what) {
    const at = numbers(what, 2);
    if (at) return (page) => page.mouse.click(...at);
    return what === '' ? null : (page) => page.locator(what).click();
  },
  key: (what) => (what === '' ? null : (page) => page.keyboard.press(what)),
  drag: (what) => dragOf(what, 'left'),
  sdrag(what) {
    const drag = dragOf(what, 'left');
    if (!drag) return null;
    return async (page) => {
      await page.keyboard.down('Shift');
      // The key is let go however the drag ends: the steps after it are not Shift's.
      await drag(page).finally(() => page.keyboard.up('Shift'));
    };
  },
  rdrag: (what) => dragOf(what, 'right'),
  wheel(what) {
    const [x, y, notches] = numbers(what, 3) ?? [];
    if (!Number.isInteger(notches) || notches === 0) return null;
    return async (page) => {
      await page.mouse.move(x, y);
      // A notch at a time, as a hand turns it.
      for (let turned = 0; turned < Math.abs(notches); turned += 1) {
        await page.mouse.wheel(0, -Math.sign(notches) * NOTCH_PX);
      }
    };
  },
  wait(what) {
    const [ms] = numbers(what, 1) ?? [];
    return ms >= 0 ? () => pause(ms) : null;
  },
};

/**
 * What was asked for on the command line: `{ page, sketchFile, pictureFile, demo, plotFile,
 * width, steps }`. An argument nobody knows is refused, never skipped. Which plot is said once:
 * --demo, or --plot=<file> - neither, or both, is refused in one sentence, `NO_PLOT`. A width is
 * refused where it names no whole number of pixels from NARROWEST to WIDEST; of two, the last
 * counts.
 */
export function argsOf(asked) {
  const told = asked.filter((one) => one.startsWith('--') && one !== SWITCH && !PLOT.test(one));
  const widths = told.map((one) => Number(WIDTH.exec(one)?.[1] ?? Number.NaN));
  const unknown = told.find((_, at) => !(widths[at] >= NARROWEST && widths[at] <= WIDEST));
  if (unknown !== undefined) throw new Error(`"${unknown}" is no switch, or no width: ${USAGE}`);
  const plots = asked.filter((one) => PLOT.test(one)).map((one) => PLOT.exec(one)[1]);
  const demo = asked.includes(SWITCH);
  if (Number(demo) + plots.length !== 1) throw new Error(NO_PLOT);
  const width = widths.at(-1) ?? WIDE;
  const [page, sketchFile, pictureFile, ...written] = asked.filter((one) => !one.startsWith('--'));
  if (pictureFile === undefined) throw new Error(`Three things are needed: ${USAGE}`);
  const steps = written.map((text) => {
    const [kind, ...rest] = text.split('=');
    const act = Object.hasOwn(STEPS, kind) ? STEPS[kind](rest.join('=')) : null;
    if (!act) throw new Error(`"${text}" is no step: ${USAGE}`);
    return { text, act };
  });
  return { page, sketchFile, pictureFile, demo, plotFile: plots[0] ?? null, width, steps };
}
