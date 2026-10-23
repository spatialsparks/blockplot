// The house as a file: what stands on the stage as the parts of a house - in White, and in
// Materials - saved as one binary glTF, a `.glb`, which other 3D programs open (story ST-024,
// rule 7). What is drawn is what is saved: the meshes of the parts (meshes.js), each point where
// the stage has it - a unit a metre, y up, from the stage's own zero (frame.js) - and of each
// face what such a file keeps: its name, its colour, how rough it is and how much it hides. And
// no more: the caller hands over those meshes and nothing else of the stage, so the file holds
// no ground, no outline, no solid, no light, no camera and no picture. three.js's own exporter
// writes it, an addon that the pad's own server gives as it gives the orbit controls; the page
// saves it itself, out of its memory, by a link, as the pad saves a sketch (files.js): nothing
// is asked of any machine, this one included. And the picture of the stage, which the stage
// takes of itself (stage.js), is saved here the same way, by the same link: a PNG of the stage
// as it shows - ground, backdrop and all, in whichever way - where the file is the parts alone.
// And so is the Google Earth file (ST-016, ST-038), whose text ../kml/house.js writes: the parts
// that White builds of the house's blocks above the ground, at the plot, less what the page has
// switched off - in every way, whole at every cut and opened along nothing.
import { Mesh, MeshStandardMaterial, Scene } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// What a file of the house is, to whatever opens it: a binary glTF.
const TYPE = 'model/gltf-binary';
// The browser reads the file from the page's memory once the link is clicked: after so long it
// has, and the memory is given back - as files.js does it for a sketch.
const GIVEN_BACK_AFTER_MS = 10_000;
// The name of a face that has none on the stage: White's, the one white every part is drawn in.
const WHITE = 'white';
// How rough a face is that says nothing of it - White's, again: as rough as chalk, from 0 to 1.
const CHALK = 1;
// What the page says of a file: that it was saved, and under which name; that none was, for
// nothing of a house stands on the stage; and that none was because the writing failed - after
// which it says why, in the words of whatever failed. And of a picture: that it was saved, in
// the same words, or that none was, for the browser gave none.
const savedAs = (name) => `Saved as ${name}, where this browser saves its files.`;
const NOTHING = 'No 3D file was saved: nothing of a house is shown here.';
const NOT_SAVED = 'The 3D file was not saved:';
const NO_PICTURE = 'No picture was saved: this browser gave none of the stage.';
// And of a Google Earth file (ST-016, ST-038): saved, in the same words, and how many parts it
// holds; none, for nothing of the house that is switched on stands above the ground - nothing
// wrong - or for the raise is no number; and not saved, and why.
const KML = 'application/vnd.google-earth.kml+xml';
const partsIn = (count) => `It holds ${count} ${count === 1 ? 'part' : 'parts'} of the house.`;
const NO_PART =
  'No Google Earth file was saved: nothing of the house that is switched on stands above the ground.';
const NO_RAISE = 'No Google Earth file was saved: the raise is no number of metres.';
const NOT_KML = 'The Google Earth file was not saved:';

// A name says the day, by the world's clock, as the name of a saved sketch does (files.js).
const named = (now, ending) => `house-${now.toISOString().slice(0, 10)}.${ending}`;
/** The name of the file of a house that is saved at `now`, a Date: `house-2026-10-10.glb`. */
export const nameAt = (now) => named(now, 'glb');
/** The name of the picture of the stage that is saved at `now`: `house-2026-10-10.png`. */
export const pictureAt = (now) => named(now, 'png');
/** The name of the Google Earth file of the house that is saved at `now`: `house-2026-10-10.kml`. */
export const kmlAt = (now) => named(now, 'kml');

/**
 * Hands the browser a file out of the page's memory, a Blob, under a name: by a link that says
 * the name and is clicked here, as the pad saves a sketch (files.js). The browser saves it
 * where it saves files, and nobody is asked. `page` is the window: its document, its `URL` and
 * its `setTimeout`.
 */
function hand(name, file, { document, URL, setTimeout }) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), GIVEN_BACK_AFTER_MS);
}

// The faces of a file, each made once and never given back: one for all that a file keeps of a
// face of the stage.
const faces = new Map();
/**
 * The face that a file holds for a mesh of the stage: three.js's standard material, which its
 * exporter writes as it is, with what a file of glTF keeps of the face the mesh is drawn with -
 * its colour, how rough it is, how much metal is in it, and how much it hides. Under that
 * face's name, which in Materials is its surface's. White's faces have no name: there the file's
 * is `white` - or, of a see-through one, the surface of its mesh, so that glass is glass.
 *
 * Two faces of the stage that are alike in all of that are one face here. In Materials a surface
 * has two - the house's own, and one a step behind in the depth for what stands in the house
 * (meshes.js): a file knows no such step, and holds one material a surface.
 */
function faceOf({ name: surface, material: drawn }) {
  const name = drawn.name !== '' ? drawn.name : drawn.transparent ? surface : WHITE;
  const [rough, metal] = [drawn.roughness ?? CHALK, drawn.metalness ?? 0];
  const { transparent, opacity } = drawn;
  const key = [name, drawn.color.getHexString(), rough, metal, transparent, opacity].join(' ');
  if (!faces.has(key)) {
    const face = { name, color: drawn.color, roughness: rough, metalness: metal };
    faces.set(key, new MeshStandardMaterial({ ...face, transparent, opacity }));
  }
  return faces.get(key);
}

/**
 * What a file holds of the meshes of the stage (`all.children` of meshes.js): a scene of its
 * own, with one mesh for each surface - under the surface's name, in the order the surfaces
 * first come - and nothing else. A mesh there has the shape of the stage's mesh of that surface,
 * point for point; where the stage has several of one surface with one face in the file - the
 * house's own, and what stands in it - they are one mesh here, the shapes one after the other.
 * Its face is the file's (`faceOf`). No mesh says how many parts it is, casts a shadow or lies
 * anywhere but where its points are: a file has places, and no stage.
 *
 * The meshes of the stage are left as they are, and stay where they stand.
 */
export function houseOf(meshes) {
  const held = new Map();
  for (const mesh of meshes) {
    const face = faceOf(mesh);
    const key = `${mesh.name} ${face.uuid}`;
    if (!held.has(key)) held.set(key, { surface: mesh.name, face, shapes: [] });
    held.get(key).shapes.push(mesh.geometry);
  }
  const house = new Scene();
  for (const { surface, face, shapes } of held.values()) {
    const one = new Mesh(shapes.length === 1 ? shapes[0] : mergeGeometries(shapes), face);
    one.name = surface;
    house.add(one);
  }
  return house;
}

/**
 * The meshes of the stage as one binary glTF: a promise of its bytes, an ArrayBuffer, as
 * three.js's exporter writes them of `houseOf` - or of why it could not. The exporter puts the
 * file together with the browser's own reader of files, `FileReader`: where there is none, as
 * in Node, it fails, and says so.
 */
export const bytesOf = (meshes) => new GLTFExporter().parseAsync(houseOf(meshes), { binary: true });

/**
 * Saves the meshes of the stage as a file of the house, and says how it went: a promise of
 * `{ words, wrong }` - what the page is to say, and whether something went wrong.
 *
 * The file is written into the page's memory and handed to the browser by a link that says its
 * name, `nameAt(now)`: the browser saves it where it saves files, and asks nobody. Where no mesh
 * stands on the stage, none is written, and the words say so: nothing is wrong with that. Where
 * the writing fails, nothing is saved, and the words say why.
 *
 * `page` is the window: its document, its `Blob`, its `URL` and its `setTimeout`.
 */
export async function save(meshes, now = new Date(), page = globalThis) {
  if (meshes.length === 0) return { words: NOTHING, wrong: false };
  try {
    const name = nameAt(now);
    const bytes = await bytesOf(meshes);
    hand(name, new page.Blob([bytes], { type: TYPE }), page);
    return { words: savedAs(name), wrong: false };
  } catch (error) {
    const why = error instanceof Error ? error.message : String(error);
    return { words: `${NOT_SAVED} ${why}`, wrong: true };
  }
}

/**
 * Saves a picture of the stage, and says how it went: `{ words, wrong }`, as `save` says it of
 * a file. `picture` is what the stage gave (`picture` of stage.js): a PNG, as a Blob, which is
 * in the page's memory already - or null. It is handed to the browser as it is, by the link
 * that a file is handed over by, under the name `pictureAt(now)`. Where the stage gave none,
 * nothing is saved, and the words say so: that went wrong.
 *
 * `page` is the window: its document, its `URL` and its `setTimeout`.
 */
export function savePicture(picture, now = new Date(), page = globalThis) {
  if (picture === null) return { words: NO_PICTURE, wrong: true };
  const name = pictureAt(now);
  hand(name, picture, page);
  return { words: savedAs(name), wrong: false };
}

/**
 * Saves the house as a Google Earth file, and says how it went: `{ words, wrong }`, as `save`
 * says it, and how many parts the file holds - `1 part`, else `<n> parts`. `file` is what
 * `houseFile` of ../kml/house.js gave: its text is handed to the browser as a KML file, by the
 * link that a file is handed over by, under the name `kmlAt(now)`. Where it gave none, nothing is
 * saved, and the words say why.
 *
 * `page` is the window: its document, its `Blob`, its `URL` and its `setTimeout`.
 */
export function saveKml(file, now = new Date(), page = globalThis) {
  if (file.refused !== undefined) return { words: file.refused, wrong: true };
  if (file.unraised) return { words: NO_RAISE, wrong: true };
  if (file.failed !== undefined) return { words: `${NOT_KML} ${file.failed}`, wrong: true };
  if (file.text === null) return { words: NO_PART, wrong: false };
  const name = kmlAt(now);
  hand(name, new page.Blob([file.text], { type: KML }), page);
  return { words: `${savedAs(name)} ${partsIn(file.parts)}`, wrong: false };
}
