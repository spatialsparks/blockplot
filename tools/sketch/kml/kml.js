// The text of a KML file (ST-016, ST-038): boxes - each a part's shape, a level box or a slant
// between two sloping planes - each a closed shape of plain faces at its heights above sea
// level, no face of no height and no edge drawn, and a plot's outline on Google Earth's ground.
// The one writer of KML in the pad; nothing is asked and nothing is written here - a caller
// saves the text.
// It runs in a page and in Node, and imports onMap and isLV95 of the plot's frame and wgs84Of,
// and nothing else: WGS84 lies in kml/ alone (directive 35). kml.check.js proves it.
import { isLV95, onMap } from '../new-plot/frame.js';
import { wgs84Of } from './wgs84.js';

// KML's name, which Google Earth needs and nobody asks: swisstopo/named.check.js lets it
// through, to the letter.
const NAMESPACE = 'http://www.opengis.net/kml/2.2';
// How much a see-through block hides of what stands behind it: HIDES of view3d/build.js, typed
// in again here, for this module may not import that one - it imports three.js. As KML's alpha,
// a share of 255.
const HIDES = 0.35;
const ALPHA = {
  solid: 'ff',
  through: Math.round(HIDES * 255)
    .toString(16)
    .padStart(2, '0'),
};
// Two points of a ring nearer than this, in metres along each of x, y and h, are one.
const SAME_M = 1e-9;
// A box that has no name of its own, and the outline.
const BLOCK = 'Block';
const OUTLINE = 'Plot outline';

const SAID = {
  place:
    'The place is no place of LV95: an east from 2 000 000 to under 3 000 000 and a north from 1 000 000 to under 2 000 000.',
  bearing: 'The bearing is no finite number.',
  raise: 'The raise is no finite number.',
  empty: 'There is nothing to write: no box and no outline.',
};

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
/** A text from outside, with each of the five signs that XML gives a meaning written as its entity. */
const escaped = (text) => String(text).replace(/[&<>"']/g, (sign) => ENTITIES[sign]);

/** KML's colour of a box, `aabbggrr`: of `'#rrggbb'` and how it is seen. */
function kmlColour(colour, see) {
  const [r, g, b] = [1, 3, 5].map((at) => colour.slice(at, at + 2).toLowerCase());
  return `${ALPHA[see] ?? ALPHA.solid}${b}${g}${r}`;
}

/** The id of a box's style: its colour and how it is seen. */
const styleId = (box) => `box-${kmlColour(box.colour, box.see)}`;

/**
 * The faces of a box: its foot, its top and its four sides, each a ring of points `[x, y, h]`,
 * closed, its first point again at its end. Its corners are `[x, y]` of `min` and `max`. A
 * `box` - and a box that says no `shape` - has its foot at `min[2]` and its top at `max[2]`; a
 * `slant` its foot at `low[0]` where x (along 0) or y (along 1) is `min[along]` and at `low[1]`
 * where it is `max[along]`, its top at `high[0]` and `high[1]` the same way. A point that is
 * the one before it again, counting round the ring, is left out, and a face of fewer than three
 * points is none: a slant that comes down to an edge has five faces, two of them triangles.
 */
function facesOf(box) {
  const { min, max } = box;
  const corners = [
    [min[0], min[1]],
    [max[0], min[1]],
    [max[0], max[1]],
    [min[0], max[1]],
  ];
  const slants = box.shape === 'slant';
  const lineAt = (line, corner) => line[corner[box.along] === min[box.along] ? 0 : 1];
  const foot = corners.map((corner) => [...corner, slants ? lineAt(box.low, corner) : min[2]]);
  const roof = corners.map((corner) => [...corner, slants ? lineAt(box.high, corner) : max[2]]);
  const sides = corners.map((_, at) => {
    const next = (at + 1) % 4;
    return [foot[at], foot[next], roof[next], roof[at]];
  });
  return [[...foot].reverse(), roof, ...sides]
    .map(distinct)
    .filter((ring) => ring.length >= 3)
    .map((ring) => [...ring, ring[0]]);
}

/** Two points of a ring that are one, within `SAME_M`. */
const same = (one, other) => one.every((figure, axis) => Math.abs(figure - other[axis]) <= SAME_M);
/** An open ring less each point that is the one before it again, counting round the ring. */
const distinct = (ring) =>
  ring.filter((point, at) => !same(point, ring[(at + ring.length - 1) % ring.length]));

/**
 * The text of a KML file. `name` a text; `about` a list of texts, the lines of its description;
 * `place` `{ originLV95, bearingDeg }` - where x = 0, y = 0 of the plot's frame lies in LV95, and
 * the bearing x runs at, as a plot's site has both; `raiseM` the metres that every height of a
 * box is raised by; `boxes` shapes as the scene's parts have them (scene/parts.js) - of which
 * `shape`, `min`, `max`, a slant's `along`, `low` and `high`, and `colour`, `see` and `name` are
 * read, `shape` `'box'` where it says none - each written in plain faces; `outline` a plot's open
 * ring of `[x, y]`. It throws, in one sentence, where the place is no place of LV95, the bearing
 * or the raise no finite number, or there is no box and no outline: no half file is written.
 */
export function kmlOf({ name, about, place, raiseM, boxes, outline }) {
  const refused = refusal(place, raiseM, boxes, outline);
  if (refused !== null) throw new Error(refused);
  const onEarth = onMap({ origin: place.originLV95, bearingDeg: place.bearingDeg });
  const point = ([x, y, h]) => {
    const [longitude, latitude] = wgs84Of(onEarth([x, y]));
    return `${longitude.toFixed(7)},${latitude.toFixed(7)},${h.toFixed(2)}`;
  };
  const raised = ([x, y, h]) => [x, y, h + raiseM];
  const styles = [...new Map(boxes.map((box) => [styleId(box), box])).entries()];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<kml xmlns="${NAMESPACE}">`,
    '  <Document>',
    `    <name>${escaped(name)}</name>`,
    `    <description>${about.map(escaped).join('\n')}</description>`,
    ...styles.flatMap(([id, box]) => styleOf(id, kmlColour(box.colour, box.see))),
    ...boxes.flatMap((box) => boxOf(box, (ring) => ring.map(raised).map(point).join(' '))),
    ...(outline.length === 0 ? [] : outlineOf(outline, point)),
    '  </Document>',
    '</kml>',
    '',
  ].join('\n');
}

/** Why a file is refused - or null. */
function refusal(place, raiseM, boxes, outline) {
  if (!isLV95(place?.originLV95)) return SAID.place;
  if (!Number.isFinite(place.bearingDeg)) return SAID.bearing;
  if (!Number.isFinite(raiseM)) return SAID.raise;
  return boxes.length === 0 && outline.length === 0 ? SAID.empty : null;
}

/** A style: the faces in their colour, plain - no edge is drawn, as White draws none. */
const styleOf = (id, colour) => [
  `    <Style id="${id}">`,
  `      <PolyStyle><color>${colour}</color><outline>0</outline></PolyStyle>`,
  '    </Style>',
];

/** A box: one Placemark of a Polygon a face, in absolute altitudes, each ring written by `ring`. */
const boxOf = (box, ring) => [
  '    <Placemark>',
  `      <name>${escaped(box.name ?? BLOCK)}</name>`,
  `      <styleUrl>#${styleId(box)}</styleUrl>`,
  '      <MultiGeometry>',
  ...facesOf(box).flatMap((face) => [
    '        <Polygon>',
    '          <altitudeMode>absolute</altitudeMode>',
    `          <outerBoundaryIs><LinearRing><coordinates>${ring(face)}</coordinates></LinearRing></outerBoundaryIs>`,
    '        </Polygon>',
  ]),
  '      </MultiGeometry>',
  '    </Placemark>',
];

/** The outline: one Placemark, a line on Google Earth's ground through its corners and back to the first. */
const outlineOf = (outline, point) => [
  '    <Placemark>',
  `      <name>${OUTLINE}</name>`,
  '      <LineString>',
  '        <tessellate>1</tessellate>',
  '        <altitudeMode>clampToGround</altitudeMode>',
  `        <coordinates>${[...outline, outline[0]].map(([x, y]) => point([x, y, 0])).join(' ')}</coordinates>`,
  '      </LineString>',
  '    </Placemark>',
];
