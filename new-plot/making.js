// The making of a plot in the page (ST-041, T-041.3): what made.js did with an order before the
// disk, done where the map's page can do it. The order is read (request.js) and its paper worked
// out (frame.js), each refused with nothing asked; the ground under the paper is asked for
// (../swisstopo/ground.js), through the pad's one door; the plot is worked out (plot.js) and the
// text of its file made by the one writer (../plot-file.js). So a plot made in a browser is the
// plot the server made, byte for byte, of the same order and the same answers (the story's
// Rule 2). It names no global, no clock, no file and no request of its own: the ground's origin
// and the day are handed over, and the door asks (docs/sketch/new-plot.md, invariant 7). Every
// module it loads imports nothing of Node, so the page loads them: making.check.js holds both.
import { write } from '../plot-file.js';
import { groundOf } from '../swisstopo/ground.js';
import { paperOf } from './frame.js';
import { plotOf } from './plot.js';
import { SAID, folderOf, orderOf } from './request.js';

// How much of what the door or the reader said of the ground is said on, in characters as a
// script counts them, from its beginning - as made.js said it: the address that it ends with may
// name 32 tiles.
const WHY_MAX = 300;

/**
 * The plot of an order, made in the page - `{ folder, text }`: `folder` the folder that its name
 * gives (`folderOf`), before any is known to be taken, and `text` its file's text as `write`
 * gives it - or `{ refused }`, one sentence. `text` is the order as JSON, as the server is handed
 * it; `origin` whom the ground is asked of, the page's `terrain`; `day` as `2026-10-20`. In this
 * order, the first that holds:
 *
 * - the sentence of `orderOf`: the text is no order - nothing asked;
 * - the sentence of `paperOf`: its paper is none - nothing asked;
 * - `SAID.ground(why)`: whatever the door or the reader refused, `why` its message - never its
 *   cause - cut to its first 300 characters;
 * - the sentence of `plotOf`: `steep`;
 * - `SAID.disk(why)`: `write` refused the site, a fault of the pad that no order should meet.
 *
 * What `plotOf` throws - ground that does not cover the paper, which the ground of the paper's own
 * box cannot be - it rejects with: a fault of the pad, as made.js had it. One order's requests go
 * one after the other, as `groundOf` asks them.
 */
export async function plotMadeOf(text, { origin, day }) {
  const order = orderOf(text);
  if (order.refused !== undefined) return { refused: order.refused };
  const paper = paperOf(order.corners, order.side, order.aroundM);
  if (paper.refused !== undefined) return { refused: paper.refused };
  let ground;
  try {
    ground = await groundOf(origin, paper.box);
  } catch (error) {
    return { refused: SAID.ground(String(error?.message).slice(0, WHY_MAX)) };
  }
  const plot = plotOf({ ...order, ground, day });
  if (plot.refused !== undefined) return { refused: plot.refused };
  const file = write(plot.site);
  if (file.refused !== undefined) return { refused: SAID.disk(file.refused) };
  return { folder: folderOf(order.name), text: file.text };
}
