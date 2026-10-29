// Where swisstopo's map lies under the top view (ST-046, T-046.1): its level, the north-up view of
// the map that covers the window, and the turn, the scale and the place that lay that view under
// the paper, true to the plot's place. Pure arithmetic: no page, no address, no request, no clock.
// The page that lays the pictures loads it; place.check.js holds every figure by hand.
//
// FROM A PLACE OF LV95 TO THE TOP VIEW'S SCREEN, worked out by hand.
// 1. The plot's frame (new-plot/frame.js): `originLV95` is x = 0, y = 0; x runs at the bearing b,
//    `bearingDeg`, from north clockwise, and y to its left. A place [E, N] is d = [E, N] - origin
//    from the nought, and in the frame
//      x = dE sin b + dN cos b,    y = -dE cos b + dN sin b.
// 2. The top view's paper (paper.js, plane `top`, never flipped, so `shown(column)` is `column`):
//    its top left corner is x = `xFromM`, y = `yToM`, and a cell is `CELL_M`, half a metre:
//      column = (x - xFromM) / CELL_M,    row = (yToM - y) / CELL_M.
// 3. The zoom (zoom.js): `px` CSS pixels a cell, and `left`, `top` the cell at the window's top
//    left corner. The place lies, in CSS pixels from that corner,
//      sx = (column - left) * px,    sy = (row - top) * px.
//    One CSS pixel is so many metres of the ground: m = CELL_M / px, the same both ways.
// THE OTHER WAY ROUND, from a pixel of the window to LV95:
//      column = sx / px + left,    row = sy / px + top,
//      x = xFromM + column * CELL_M,    y = yToM - row * CELL_M,
//      E = oE + x sin b - y cos b,    N = oN + x cos b + y sin b
// (the frame's two axes are a turn, whose inverse is its transpose).
//
// THE MAP UNDER IT. A north-up view of the map, `{ level, e, n }` as map/view.js has one, shows
// [E, N] at its pixel a = (E - e) / M + wide / 2, d = (n - N) / M + high / 2, M the level's metres
// a pixel. A step of the map's pixels (Δa, Δd) is (ΔE, ΔN) = (Δa M, -Δd M), and step 1 and 3 put
// that on the screen, to the right and down, at
//      (M / m) * (Δa sin b - Δd cos b,  Δa cos b + Δd sin b),
// which is (Δa, Δd) turned clockwise by θ = 90° - b - cos θ = sin b, sin θ = cos b - and grown by
// M / m. So the box of the map's view, its middle laid on the window's middle, turned `turnDeg`
// = θ clockwise about its middle and sized `scale` = M / m about it, lies true to the plot: its
// middle, (e, n), is the place under the window's middle. With b = 90 x runs east and y north,
// and the map lies unturned; with b = 0 its north points right, a quarter turn clockwise.
//
// THE LEVEL is the coarsest whose metres a pixel are no more than the view's, M <= m, so that a
// picture is never shown larger than it is: `scale` is 1 or less - or `NEAREST` where the view is
// nearer than a tenth of a metre a pixel, whose pictures are then shown larger. Two neighbouring
// levels are at most 2.5 times apart (250 m and 100 m), so `scale` is never under 0.4 above the
// nearest, and at the pad's furthest rung, 0.006 pixels a cell, 83 m a pixel, the level is 18.
//
// THE BOX covers the whole window turned: its width (W |cos θ| + H |sin θ|) / scale and its
// height (W |sin θ| + H |cos θ|) / scale, up to a whole pixel, W and H the window's. Its pictures
// are `pictures(view, box)` of map/view.js, unchanged. Their number is bounded by the window: each
// side of the box is at most 2.5 D + 1 pixels, D the window's diagonal - |cos| W + |sin| H is
// never more than D - and a stretch of L pixels touches at most ceil(L / 256) + 1 pictures, so
// there are at most (ceil((2.5 D + 1) / 256) + 1)² of them: 529 in a window of 1920 by 1080,
// fewer nearer than the nearest level, and never more than `matrixOf` has of the sheet.
import { NEAREST } from '../map/view.js';
import { CELL_M, isLV95 } from '../new-plot/frame.js';
import { LEVELS, SHEET } from '../swisstopo/hosts.js';

// The story's sentence for a plot that has no place on the map, or lies off its sheet.
export const NO_PLACE = "This plot has no place on swisstopo's map.";
const QUARTER_DEG = 90;
const FULL_DEG = 360;
const RADIANS = Math.PI / (FULL_DEG / 2);
// A size is taken to this part of a pixel before it is rounded up: a cosine of a quarter turn is
// a hair over nought, and a box of 800 pixels would else be of 801 now and then.
const PARTS_OF_A_PIXEL = 1000;
const settled = (pixels) => Math.round(pixels * PARTS_OF_A_PIXEL) / PARTS_OF_A_PIXEL;

/** Whether a place of LV95, `[east, north]`, lies on swisstopo's sheet, its edges with it. */
const onSheet = ([east, north]) =>
  east >= SHEET.west && east <= SHEET.east && north >= SHEET.south && north <= SHEET.north;

/** The level that fits `metres` a CSS pixel: the coarsest no coarser than it, else the nearest. */
function levelOf(metres) {
  const level = LEVELS.findIndex((its) => its <= metres);
  return level === -1 ? NEAREST : level;
}

/** The place of LV95, `{ e, n }`, under a pixel `[sx, sy]` of the window: the other way round. */
function placeUnder({ originLV95, bearingDeg, xFromM, yToM }, { px, left, top }, [sx, sy]) {
  const x = xFromM + (sx / px + left) * CELL_M;
  const y = yToM - (sy / px + top) * CELL_M;
  const [sin, cos] = [Math.sin(bearingDeg * RADIANS), Math.cos(bearingDeg * RADIANS)];
  return { e: originLV95[0] + x * sin - y * cos, n: originLV95[1] + x * cos + y * sin };
}

/**
 * How the map lies under the top view. `place` is the plot as `SITE` has it - `originLV95`,
 * `bearingDeg`, and the paper's top left corner, `xFromM` and `yToM`; `zoom` is zoom.js's
 * `{ px, left, top }`; `size` the window's `{ wide, high }`, in CSS pixels. It gives
 * `{ level, view, box, turnDeg, scale, centre }`: the map's level, its north-up view
 * `{ level, e, n }` and the box of pixels `{ wide, high }` that it shows in - their pictures are
 * `pictures(view, box)` of map/view.js - and how that box lies under the paper: its middle on
 * `centre`, `[x, y]` in CSS pixels from the window's top left corner, turned `turnDeg` degrees
 * clockwise about it, from 0 to under 360, and `scale` CSS pixels to one of its own. Or
 * `{ refused }`, `NO_PLACE`: the plot has no place in LV95, or it lies off `SHEET`.
 */
export function underOf(place, zoom, size) {
  const origin = place?.originLV95;
  if (!isLV95(origin) || !onSheet(origin)) return { refused: NO_PLACE };
  const metres = CELL_M / zoom.px;
  const level = levelOf(metres);
  const scale = LEVELS[level] / metres;
  const turnDeg = (((QUARTER_DEG - place.bearingDeg) % FULL_DEG) + FULL_DEG) % FULL_DEG;
  const [cos, sin] = [Math.cos(turnDeg * RADIANS), Math.sin(turnDeg * RADIANS)];
  const across = (one, other) =>
    Math.ceil(settled((one * Math.abs(cos) + other * Math.abs(sin)) / scale));
  const box = { wide: across(size.wide, size.high), high: across(size.high, size.wide) };
  const centre = [size.wide / 2, size.high / 2];
  const { e, n } = placeUnder(place, zoom, centre);
  return { level, view: { level, e, n }, box, turnDeg, scale, centre };
}
