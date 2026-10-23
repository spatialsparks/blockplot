// The ground of the scene as meshes: what a view in 3D draws of the hill - its top, and the walls
// and the base that make a solid of it - and, where the sketch reaches past the plot's paper or
// the paper is large (ST-042), the near grids and the far squares, their skirts, and one base
// under all of it. It imports nothing and names no global.

/**
 * The ground as triangles. `positions` holds every grid point, three numbers a point - x, y and
 * h, in metres - a row of the grid after another; `indices` holds three points a triangle. There
 * are two triangles for every cell where ground is drawn, and none where it is not: a point that
 * no triangle takes stays in `positions`, and is not drawn. Seen from above, a triangle runs
 * anticlockwise: it faces up.
 */
export function groundMesh({ xs, ys, heights, drawn }) {
  const positions = ys.flatMap((y, row) => xs.flatMap((x, column) => [x, y, heights[row][column]]));
  const point = (row, column) => row * xs.length + column;
  const indices = drawn.flatMap((cells, row) =>
    cells.flatMap((there, column) => {
      if (!there) return [];
      // The cell's corners as the top view's paper has them: top left and right, bottom left
      // and right. The paper's top is the larger y.
      const [tl, tr] = [point(row, column), point(row, column + 1)];
      const [bl, br] = [point(row + 1, column), point(row + 1, column + 1)];
      return [tl, bl, br, tl, br, tr];
    }),
  );
  return { positions, indices };
}

/**
 * How far under the lowest point of the scene the base of the hill lies, in metres: so much
 * earth is left under the deepest cellar, and under the lowest corner of the paper.
 */
export const BASE_BELOW_M = 2;

/** How far a far square's skirt hangs under its edges at the least, in metres: else half its side. */
export const SKIRT_M = 1;

/** A shape that grows by fours: each four points, given in turn, two triangles. */
function shapeOf() {
  const [positions, indices] = [[], []];
  const four = (...points) => {
    const first = positions.length / 3;
    for (const point of points) positions.push(...point);
    indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
  };
  return { positions, indices, four };
}

/**
 * The walls of a grid of ground, each by `four`: along every edge of a drawn cell with no ground
 * beyond it - but by `rim` where no cell of the grid lies beyond, along the grid's own edge.
 */
function wallsOf({ xs, ys, heights, drawn }, base, four, rim = four) {
  const top = (row, column) => [xs[column], ys[row], heights[row][column]];
  const foot = (row, column) => [xs[column], ys[row], base];
  const ground = (row, column) => drawn[row]?.[column] === true;
  const inside = (row, column) => drawn[row]?.[column] !== undefined;
  drawn.forEach((cells, row) =>
    cells.forEach((there, column) => {
      if (!there) return;
      // The cell's four edges, each from one grid point to the next as they lie anticlockwise
      // seen from above - down its left side, along its bottom, up its right side and back
      // along its top - and the cell beyond each. The earth lies to the left of such an edge.
      const [tl, tr] = [
        [row, column],
        [row, column + 1],
      ];
      const [bl, br] = [
        [row + 1, column],
        [row + 1, column + 1],
      ];
      const edges = [
        [tl, bl, [row, column - 1]],
        [bl, br, [row + 1, column]],
        [br, tr, [row, column + 1]],
        [tr, tl, [row - 1, column]],
      ];
      for (const [from, to, beyond] of edges) {
        if (ground(...beyond)) continue;
        (inside(...beyond) ? four : rim)(foot(...from), foot(...to), top(...to), top(...from));
      }
    }),
  );
}

/** The base: one flat rectangle `[left, top, right, bottom]` in metres - top the larger y - at `base`, facing up. */
const baseOf = ([left, top, right, bottom], base, four) =>
  four([left, top, base], [left, bottom, base], [right, bottom, base], [right, top, base]);

/**
 * What makes a hill of the ground: its walls and its base, as triangles. `lowest` is the lowest
 * point of the scene, in metres above sea level - its `box.min[2]`: of its ground, or of a block
 * dug deeper. The base lies `BASE_BELOW_M` under it: one flat rectangle under the whole paper,
 * the floor of every pit, facing up.
 *
 * A wall stands along every edge of a cell where ground is drawn that has no ground beyond it: a
 * cell where a block stands, or no cell at all - the edge of the paper. It reaches from the
 * ground, as high as that lies at either end of the edge, straight down to the base, and faces
 * away from the earth: into the pit, or outward. There is no other wall: none between two cells
 * of ground, and none where a block stands at the edge of the paper - no earth is there to hold,
 * and the pit is open to the side. With `groundMesh` on top, the walls and the base close the
 * hill.
 *
 * `positions` holds four points for each wall - its foot at one end of the edge and at the
 * other, then its top at the other end and at the first - and last the four corners of the base;
 * `indices` holds two triangles for each four. Seen from where it faces, a triangle runs
 * anticlockwise. No two walls share a point: each is flat, and is lit as a flat thing.
 */
export function hillMesh(ground, lowest) {
  const { positions, indices, four } = shapeOf();
  const base = lowest - BASE_BELOW_M;
  wallsOf(ground, base, four);
  const { xs, ys } = ground;
  baseOf([xs[0], ys[0], xs.at(-1), ys.at(-1)], base, four);
  return { positions, indices };
}

/**
 * The box around a scene's `box` and every far square of its ground: all that is drawn of it, of
 * which the camera's sight is to reach every point. Of a ground of one grid, the box itself.
 */
export function drawnBox({ far = [] }, { min, max }) {
  const [low, high] = [[...min], [...max]];
  for (const [x0, y0, x1, y1, ...heights] of far) {
    [low[0], high[0]] = [Math.min(low[0], x0), Math.max(high[0], x1)];
    [low[1], high[1]] = [Math.min(low[1], y1), Math.max(high[1], y0)];
    [low[2], high[2]] = [Math.min(low[2], ...heights), Math.max(high[2], ...heights)];
  }
  return { min: low, max: high };
}

/**
 * The land as meshes, of the scene's ground and its lowest point: `{ top, hill }`, and `skirts`
 * where it has any. Of a ground of one grid, `groundMesh` and `hillMesh`, as they were. Of one of
 * near grids and far squares (scene.js, `groundOf`):
 * - `top`: every near grid's cells where ground is drawn, two triangles a cell, then every far
 *   square's two - `[x0, y0, x1, y1, h00, h10, h01, h11]`, its top left corner, its bottom
 *   right, and its heights at top left, top right, bottom left and bottom right - and `light`, a
 *   1 for every point of a cell or a square that lies beyond the plot's paper, else a 0;
 * - `hill`: the walls of the pits of each near grid, where a block stands, as `hillMesh` stands
 *   them, and one base under all of it, `BASE_BELOW_M` under the lowest of the scene and of the
 *   far squares;
 * - `skirts`: the walls along each near grid's own edge, down to the base, as `hillMesh` stands
 *   the paper's; and a skirt hung from each edge of a far square straight down by half its side
 *   and at least `SKIRT_M`, each end from its own height - and down to the base where the edge
 *   lies on the rim of all that is drawn. Their tops meet the ground of the next grid or square:
 *   a view draws them behind it (view3d/build.js), where the walls of a pit are drawn ahead.
 */
export function landOf(ground, lowest) {
  if (ground.near === undefined) return { top: groundMesh(ground), hill: hillMesh(ground, lowest) };
  const { near, far, paper } = ground;
  const beyond = (x, y) =>
    x < paper.min[0] || x > paper.max[0] || y < paper.min[1] || y > paper.max[1];
  const top = { positions: [], indices: [], light: [] };
  const add = ({ positions, indices }, light) => {
    const first = top.positions.length / 3;
    for (const figure of positions) top.positions.push(figure);
    for (const at of indices) top.indices.push(first + at);
    for (let at = 0; at < positions.length; at += 3) top.light.push(light);
  };
  for (const grid of near) {
    const { xs, ys } = grid;
    const off = (row, column) =>
      beyond((xs[column] + xs[column + 1]) / 2, (ys[row] + ys[row + 1]) / 2);
    for (const light of [0, 1]) {
      const drawn = grid.drawn.map((cells, row) =>
        cells.map((there, column) => there && Number(off(row, column)) === light),
      );
      if (drawn.some((cells) => cells.includes(true))) add(groundMesh({ ...grid, drawn }), light);
    }
  }
  const box = drawnBox(ground, {
    min: [Infinity, Infinity, lowest],
    max: [-Infinity, -Infinity, lowest],
  });
  for (const grid of near) {
    box.min = [Math.min(box.min[0], grid.xs[0]), Math.min(box.min[1], grid.ys.at(-1)), box.min[2]];
    box.max = [Math.max(box.max[0], grid.xs.at(-1)), Math.max(box.max[1], grid.ys[0]), box.max[2]];
  }
  const [hill, skirts] = [shapeOf(), shapeOf()];
  const base = box.min[2] - BASE_BELOW_M;
  for (const grid of near) wallsOf(grid, base, hill.four, skirts.four);
  const rim = [box.min[0], box.max[1], box.max[0], box.min[1]];
  for (const square of far) {
    const [x0, y0, x1, y1, h00, h10, h01, h11] = square;
    const [tl, tr, bl, br] = [
      [x0, y0, h00],
      [x1, y0, h10],
      [x0, y1, h01],
      [x1, y1, h11],
    ];
    add(
      { positions: [tl, tr, bl, br].flat(), indices: [0, 2, 3, 0, 3, 1] },
      Number(beyond((x0 + x1) / 2, (y0 + y1) / 2)),
    );
    const hangs = Math.max((x1 - x0) / 2, SKIRT_M);
    // Its edges anticlockwise seen from above, as a cell's walls run, and whether each lies on the rim.
    const edges = [
      [tl, bl, x0 === rim[0]],
      [bl, br, y1 === rim[3]],
      [br, tr, x1 === rim[2]],
      [tr, tl, y0 === rim[1]],
    ];
    for (const [from, to, onRim] of edges) {
      const foot = ([x, y, h]) => [x, y, onRim ? base : h - hangs];
      skirts.four(foot(from), foot(to), to, from);
    }
  }
  baseOf(rim, base, hill.four);
  const [dug, hung] = [hill, skirts].map(({ positions, indices }) => ({ positions, indices }));
  return { top, hill: dug, skirts: hung };
}
