// The patterns of the house's own faces in Materials (story ST-033): wood laid in planks, stone in
// tiles, concrete in panels, grass in small spots. A pattern is no image (ST-024, rule 6): it is a
// few figures in metres, and a few lines of the shader language that work out, for each point of
// a face, how much darker or lighter it is - from where the point lies on the stage and the way
// its face looks. Nothing is loaded and nothing is made but those lines. A pattern keeps its
// colour (ST-033, rule 3): the surface's own colour fills more than two thirds of every face, and
// joints, plank ends and spots take less than a third (`coverOf`). This module is text and
// figures: it imports nothing, and meshes.js hands what it gives to three.js's shader.

// The ways a face is patterned: by joints - planks, tiles and panels, a grid whose rows may be
// staggered - by spots, or not at all.
const PLAIN = { kind: 'none' };
/**
 * The pattern of each surface, by its name: a row for every surface of `SURFACES`
 * (scene/surfaces.js), and no other.
 *
 * A row of `joints` is a grid of pieces, `long` metres along the face and `wide` across it,
 * with a joint `joint` metres wide between two of them, which is darker by the share `dark` of
 * the light. Each row of pieces has its ends moved on by the share `stagger` of a piece from
 * the row before it - 0, and the ends line up. On what lies level a piece is long along the
 * plot's x; on what stands, along the run of its wall.
 *
 * A row of `spots` is a field of cells `cell` metres square, each with one round spot of
 * `spot` metres' radius somewhere in it - wholly in it - lighter or darker by the share `shade`.
 *
 * Every figure was set by eye, in Materials, on pictures of the made-up house from above a
 * level down and from the front: wood against the night rooms' floor, stone against the bath's,
 * concrete against the day rooms' roof, grass against the garden. The joints are wider than
 * they are in a house, as they are in a model: a joint of a few millimetres would fade at
 * the distance a house is seen from. Concrete's joints are the faintest of the three.
 */
export const PATTERNS = {
  plaster: PLAIN,
  wood: { kind: 'joints', long: 2.4, wide: 0.2, joint: 0.012, stagger: 0.382, dark: 0.35 },
  joinery: PLAIN,
  stone: { kind: 'joints', long: 0.6, wide: 0.6, joint: 0.012, stagger: 0, dark: 0.3 },
  concrete: { kind: 'joints', long: 2.4, wide: 1.2, joint: 0.02, stagger: 0, dark: 0.12 },
  glass: PLAIN,
  grass: { kind: 'spots', cell: 0.12, spot: 0.03, shade: 0.15 },
  water: PLAIN,
  metal: PLAIN,
  fabric: PLAIN,
  ceramic: PLAIN,
  leaf: PLAIN,
  paint: PLAIN,
  plain: PLAIN,
};

/**
 * The share of a face that a pattern's joints or spots take, worked out from its figures alone:
 * of a grid, what is a joint along it or across it; of spots, a disc a cell. The surface's own
 * colour fills the rest. 0 for a face with no pattern.
 */
export function coverOf(row) {
  if (row.kind === 'joints') return 1 - (1 - row.joint / row.long) * (1 - row.joint / row.wide);
  if (row.kind === 'spots') return (Math.PI * row.spot ** 2) / row.cell ** 2;
  return 0;
}

/** A figure as the shader language writes a number with a point: 2 as 2.0. */
const glsl = (figure) => (Number.isInteger(figure) ? figure.toFixed(1) : String(figure));

// What every pattern puts into the shader. Of a point of the face: where it lies on the stage, and
// the way its face looks - handed from the vertex to the point. And `patternOn`: the two
// coordinates of the point on the plane that its face is nearest to across, in metres - x and
// the depth on what lies level, along the wall and up on what stands; `patternJoint`, how much
// of a pixel a joint takes, where `s` runs across the joints `period` metres apart and `w` is
// how far `s` runs over one pixel - so a joint thinner than a pixel is a share of it, and fades;
// and `patternHash`, three numbers from 0 to 1 for a cell, the same each time it is asked.
const VARYINGS = 'varying vec3 vPatternAt;\nvarying vec3 vPatternLooks;';
const KEPT = 'vPatternAt = transformed;\nvPatternLooks = objectNormal;';
const SHARED = `${VARYINGS}
vec2 patternOn(vec3 at, vec3 looks) {
  vec3 a = abs(looks);
  if (a.y >= a.x && a.y >= a.z) return at.xz;
  if (a.x >= a.z) return vec2(at.z, at.y);
  return at.xy;
}
float patternJoint(float s, float w, float period, float joint) {
  float d = abs(s - period * floor(s / period + 0.5));
  float lit = min(d + 0.5 * w, 0.5 * joint) - max(d - 0.5 * w, -0.5 * joint);
  return max(lit, 0.0) / w;
}
vec3 patternHash(vec2 cell) {
  vec3 p = fract(cell.xyx * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yzx + 33.33);
  return fract((p.xxy + p.yzz) * p.zyx);
}`;

/** The lines of the point that make it darker or lighter: `patternShade`, of a row. */
function shadeOf(row) {
  const f = Object.fromEntries(Object.entries(row).map(([name, figure]) => [name, glsl(figure)]));
  if (row.kind === 'joints') {
    return `float patternShade(vec2 on) {
  vec2 w = max(fwidth(on), vec2(1e-6));
  float row = floor(on.y / ${f.wide});
  float along = on.x + ${f.long} * fract(row * ${f.stagger});
  float joint = max(patternJoint(along, w.x, ${f.long}, ${f.joint}),
    patternJoint(on.y, w.y, ${f.wide}, ${f.joint}));
  return 1.0 - ${f.dark} * joint;
}`;
  }
  return `float patternShade(vec2 on) {
  float w = max(max(fwidth(on.x), fwidth(on.y)), 1e-6);
  vec2 cell = floor(on / ${f.cell});
  vec3 h = patternHash(cell);
  vec2 middle = (cell + ${glsl(row.spot / row.cell)} + h.xy * ${glsl(1 - (2 * row.spot) / row.cell)}) * ${f.cell};
  float edge = clamp(0.5 + (${f.spot} - length(on - middle)) / w, 0.0, 1.0);
  float seen = min(1.0, pow(2.0 * ${f.spot} / w, 2.0));
  return 1.0 + (h.z < 0.5 ? -${f.shade} : ${f.shade}) * edge * seen;
}`;
}

/**
 * What three.js's shader has a line for, and what a pattern puts after it: `chunk` must stand in
 * the shader, or the pattern refuses to go in at all - a three.js that names its parts otherwise
 * is told at once.
 */
function after(text, chunk, added) {
  const line = `#include <${chunk}>`;
  if (!text.includes(line)) throw new Error(`the shader has no ${line}: three.js has changed`);
  return text.replace(line, `${line}\n${added}`);
}

/**
 * What a face of a surface has its shader given, or null for a surface that stays plain:
 * `{ key, vertex, fragment }` - the key of the program of its pattern, one a pattern, and two
 * functions from three.js's own vertex and fragment shaders, as its standard material has them,
 * to the same with the pattern in: the point's place and the way its face looks kept, and the
 * colour - once it is read, at `color_fragment` - made darker or lighter by the pattern.
 */
export function patterned(surface) {
  const row = PATTERNS[surface];
  if (row === undefined || row.kind === 'none') return null;
  const vertex = (text) => after(after(text, 'common', VARYINGS), 'begin_vertex', KEPT);
  const fragment = (text) =>
    after(
      after(text, 'common', `${SHARED}\n${shadeOf(row)}`),
      'color_fragment',
      'diffuseColor.rgb *= patternShade(patternOn(vPatternAt, vPatternLooks));',
    );
  return { key: `pattern ${surface}`, vertex, fragment };
}
