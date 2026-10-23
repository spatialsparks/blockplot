// What the paper shows: the window that the canvas is (story ST-042), over a paper with no edge.
// How large - so many screen pixels a cell, `px`, on the rungs of `grid.LADDER` (grid.js), from
// 0.006 to 32 - and where: `left` and `top`, the place of the plane's paper, in cells, at the
// canvas's top left corner as the view shows it - a flipped view counts its screen's columns by
// `paper.shown`. A place lies on the screen `((shown(column) - left) * px, (row - top) * px)`
// from the canvas's corner, and `left` and `top` are kept on whole pixels of the screen.
// The two buttons, and Ctrl with the wheel, zoom a rung at a time - what was under the pointer,
// or in the middle of the window, stays there; the wheel pans, down and up, and with Shift or a
// wheel that turns sideways across; the middle button dragged, or the left with Space held, pans.
// Zoom to fit, `#fit`: the largest rung at which the plot's paper and all that the view shows fit
// the window both ways, centred. page.js keeps `px`, `left` and `top` for the tab.
(() => {
  const { document, paper, views, grid } = globalThis;
  const { WIDE, ROWS, COLS, shown } = paper;
  const scroller = document.getElementById('scroller');
  // How far a wheel's line goes, in pixels, where it counts in lines and not in pixels.
  const LINE_PX = 16;
  // The window's size, in CSS pixels; and a place of the paper on a whole pixel of the screen.
  const size = () => [scroller.clientWidth, scroller.clientHeight];
  const whole = (cells) => {
    const scale = zoom.px * (globalThis.devicePixelRatio || 1);
    return Math.round(cells * scale) / scale;
  };

  const zoom = {
    // The first time, the largest rung at which the whole plot fits from left to right; a zoom
    // the tab kept that is no rung, the rung under it.
    px: grid.rung(views.seen.px ?? scroller.clientWidth / COLS),
    left: 0,
    top: 0,
    // The page's: draws the paper anew, at the size and the place it has now.
    onChange() {},
    /** Shows the paper with this place at the window's top left corner, on whole pixels. */
    place(left, top) {
      [zoom.left, zoom.top] = [whole(left), whole(top)];
      zoom.onChange();
    },
    /** Zooms to the rung at or under `px`, and keeps what was under a point of the window - its middle, or the pointer - there. */
    to(px, x = size()[0] / 2, y = size()[1] / 2) {
      const [from, to] = [zoom.px, grid.rung(px)];
      zoom.px = to;
      zoom.place(zoom.left + x / from - x / to, zoom.top + y / from - y / to);
    },
    /** Pans the paper by so many CSS pixels of the window. */
    by(dx, dy) {
      zoom.place(zoom.left + dx / zoom.px, zoom.top + dy / zoom.px);
    },
    /** The largest rung at which the plot's paper and these rects of the plane's paper fit the window both ways, centred. */
    fit(rects) {
      const all = [[0, 0, WIDE, ROWS], ...rects];
      const xs = all.flatMap(([l, , r]) => [shown(l), shown(r)]);
      const ys = all.flatMap(([, t, , b]) => [t, b]);
      const [left, right, top, bottom] = [xs, ys].flatMap((v) => [Math.min(...v), Math.max(...v)]);
      const [wide, high] = size();
      const fits = (px) => (right - left) * px <= wide && (bottom - top) * px <= high;
      zoom.px = grid.LADDER.findLast(fits) ?? grid.LADDER[0];
      zoom.place((left + right - wide / zoom.px) / 2, (top + bottom - high / zoom.px) / 2);
    },
  };

  /** All that this view shows of the sketch, as rects of the plane's paper: its things, and its lines. */
  function drawn() {
    const around = (points) => {
      const [xs, ys] = [0, 1].map((axis) => points.map((point) => point[axis]));
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    };
    return globalThis.layers
      .lit()
      .flatMap(({ things, notes }) => [
        ...things.map((entry) => entry.rect),
        ...notes.flatMap(({ line }) => (line ? [around(globalThis.lines.points(line))] : [])),
      ]);
  }

  document
    .getElementById('smaller')
    .addEventListener('click', () => zoom.to(grid.next(zoom.px, -1)));
  document.getElementById('larger').addEventListener('click', () => zoom.to(grid.next(zoom.px, 1)));
  document.getElementById('fit').addEventListener('click', () => zoom.fit(drawn()));
  scroller.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const box = scroller.getBoundingClientRect();
      if (event.ctrlKey) {
        const to = grid.next(zoom.px, event.deltaY < 0 ? 1 : -1);
        zoom.to(to, event.clientX - box.left, event.clientY - box.top);
        return;
      }
      const by = event.deltaMode === 1 ? LINE_PX : 1;
      const [dx, dy] = [event.deltaX * by, event.deltaY * by];
      if (event.shiftKey && dx === 0) zoom.by(dy, 0);
      else zoom.by(dx, dy);
    },
    { passive: false },
  );

  // Panned by hand: the middle button, or the left with Space held - before any tool hears it.
  let space = false;
  let pan = null;
  document.addEventListener('keydown', (event) => {
    if (event.key === ' ' && !views.typing(event)) space = true;
  });
  document.addEventListener('keyup', (event) => {
    if (event.key === ' ') space = false;
  });
  const hold = { capture: true };
  scroller.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 1 && !(event.button === 0 && space)) return;
      event.preventDefault();
      event.stopPropagation();
      scroller.setPointerCapture(event.pointerId);
      pan = [event.clientX, event.clientY];
    },
    hold,
  );
  scroller.addEventListener(
    'pointermove',
    (event) => {
      if (!pan) return;
      event.stopPropagation();
      zoom.by(pan[0] - event.clientX, pan[1] - event.clientY);
      pan = [event.clientX, event.clientY];
    },
    hold,
  );
  for (const type of ['pointerup', 'pointercancel']) {
    scroller.addEventListener(
      type,
      (event) => {
        if (!pan) return;
        event.stopPropagation();
        pan = null;
      },
      hold,
    );
  }
  // The window's size changed: the canvas takes it, and the paper is drawn anew.
  globalThis.addEventListener('resize', () => zoom.onChange());

  globalThis.zoom = zoom;
})();
