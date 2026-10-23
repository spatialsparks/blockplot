import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

// "3D file (GLB)" on the pad's 3D page, end to end, on the made-up plot with the made-up sketch:
// the file that entry of File saves - a binary glTF of version 2, as long as it says, with what
// is shown and no more, where the stage has it, in metres with y up; in White white, and glass;
// in Materials a material a surface; a level down, less of it - and that the page asked nobody.
// Where the entry stands is sketch-3d-header.spec.ts's. `pnpm sketch --demo` serves the pad as files, and its page puts
// tools/sketch/demo-site.js in the place of site.js. The real plot is in no part of this run: a
// case asks yes or no whether its page is on the made-up plot, before a matcher reads that page
// (directive 34). What a rule makes of the sketch - which parts, of which surfaces - is asked of
// the page's own scripts: by hand is the box around the house, which its blocks give.

// The made-up sketch as "Save file" writes it, and where the page keeps its sketch: `KEY` of
// tools/sketch/sketch.js, stated a second time.
const SKETCH = readFileSync(
  fileURLToPath(new URL('../../tests/__fixtures__/sketch/made-up.json', import.meta.url)),
  'utf8',
);
const KEY = 'blockplot/sketch/plot/example/space';
const PLOT = 'Made-up hillside plot';
const NO_STAGE = 'this browser gives no WebGL: there is no stage, and so nothing to save';
// The house alone: the made-up sketch without what stands on the ground beside it, a car above
// it and a tree below it. The tree stands on the lawn and is higher than the house: with it the
// box around all that shows is as high as the tree, at whatever level. Lawn and cut stay: no parts.
const DOC = JSON.parse(SKETCH) as { things: { floor?: unknown }[] };
const ALONE = DOC.things.filter((thing) => thing.floor !== 'ground');
const HOUSE = JSON.stringify({ ...DOC, things: ALONE });
// The box around the house, by hand (docs/sketch/pad-gotchas.md, tests/__fixtures__/CLAUDE.md). Its
// blocks reach from column 22 to column 58, from row 22 to row 44 of the top view and from row
// 12 to row 24 of a standing one. A column is 2 * (x + 4), a row 2 * (28 - y) and a standing row
// 2 * (826 - height): x from 7 to 25 m, y from 6 to 17 m, the height from 814 to 820 m - 18 m
// long, 11 m across and 6 m high, for the blocks are the outer size of the house. The stage has
// the plot's x, its height over the lowest point of the ground - 820 m less 0.2 m for each of 46
// m down the paper and 0.04 m for each of 31 m across it, 809.56 m - and its y the other way
// round: x from 7 to 25, y from 4.44 to 10.44, z from -17 to -6.
const HOUSE_BOX = [7, 4.44, -17, 25, 10.44, -6];
const [JSON_CHUNK, BIN_CHUNK] = [0x4e4f534a, 0x004e4942];

type Face = { baseColorFactor?: number[]; metallicFactor: number; roughnessFactor: number };
type Material = { name: string; alphaMode?: string; pbrMetallicRoughness: Face };
type Primitive = { attributes: { POSITION: number }; indices: number; material: number };
interface Gltf {
  asset: { version: string };
  scene: number;
  scenes: { nodes: number[] }[];
  nodes: { name: string; mesh: number }[];
  meshes: { primitives: Primitive[] }[];
  materials: Material[];
  accessors: { bufferView: number; count: number }[];
  bufferViews: { byteOffset: number }[];
}
/** A file that was saved: its name, how long it is, what it holds; and of its meshes their materials, the box around all their places and how many triangles they are. */
type Saved = Record<'bytes' | 'triangles', number> &
  Record<'name', string> & { json: Gltf; faces: Material[]; box: number[] };

/** Reads a binary glTF as its specification lays one out: the word, the version and the length of the whole, then a chunk of JSON and a chunk of numbers, and nothing after them. */
function read(name: string, file: Buffer): Saved {
  expect(file.toString('latin1', 0, 4)).toBe('glTF');
  expect([file.readUInt32LE(4), file.readUInt32LE(8)]).toEqual([2, file.length]);
  const long = file.readUInt32LE(12);
  const numbers = file.readUInt32LE(20 + long);
  expect([file.readUInt32LE(16), file.readUInt32LE(24 + long)]).toEqual([JSON_CHUNK, BIN_CHUNK]);
  expect([long % 4, numbers % 4, 28 + long + numbers]).toEqual([0, 0, file.length]);
  const json = JSON.parse(file.toString('utf8', 20, 20 + long)) as Gltf;
  // The places of every mesh, out of the chunk of numbers: three a point, of four bytes each.
  const box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  let triangles = 0;
  const faces = json.nodes.map((node) => {
    const [one] = json.meshes[node.mesh]?.primitives ?? [];
    const places = json.accessors[one?.attributes.POSITION ?? -1];
    const from = json.bufferViews[places?.bufferView ?? -1]?.byteOffset;
    const face = json.materials[one?.material ?? -1];
    const corners = json.accessors[one?.indices ?? -1];
    if (!places || from === undefined || !face || !corners) throw new Error(`no ${node.name}`);
    for (let at = 0; at < 3 * places.count; at += 1) {
      const value = file.readFloatLE(28 + long + from + 4 * at);
      box[at % 3] = Math.min(box[at % 3] ?? value, value);
      box[(at % 3) + 3] = Math.max(box[(at % 3) + 3] ?? value, value);
    }
    triangles += corners.count / 3;
    return face;
  });
  return { name, bytes: file.length, json, faces, box, triangles };
}

/** Has every case of a group open in a tab that has a sketch in the pad's store and never looked at the 3D view. */
function withSketch(sketch: string): void {
  test.use({
    storageState: async ({ baseURL }, use) => {
      const origin = new URL(baseURL ?? '').origin;
      const kept = [{ name: KEY, value: sketch }];
      await use({ cookies: [], origins: [{ origin, localStorage: kept }] });
    },
  });
}
/** Opens the 3D page, fails unless it is on the made-up plot - asked yes or no, before any matcher reads it - and says whether its stage is drawn. */
async function open(page: Page): Promise<boolean> {
  await page.goto('/3d.html');
  const madeUp = await page.evaluate<boolean>(`globalThis.SITE?.name === ${JSON.stringify(PLOT)}`);
  expect(madeUp, 'the pad is not on the made-up plot').toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-stage', /^(drawn|none)$/);
  return (await page.locator('body').getAttribute('data-stage')) === 'drawn';
}
const pick = (page: Page, way: string) => page.locator(`button[data-way=${way}]`).click();
const entry = (page: Page) => page.getByRole('button', { name: '3D file (GLB)' });
const press = async (page: Page) => (await page.locator('#file-menu').click(), entry(page).click());
/** Presses File and then its entry, and reads the file that the browser saved: the page says under which name, on a quiet line - over the stage, which begins under it on a whole pixel. */
async function save(page: Page): Promise<Saved> {
  const [download] = await Promise.all([page.waitForEvent('download'), press(page)]);
  const name = download.suggestedFilename();
  const said = `Saved as ${name}, where this browser saves its files.`;
  await expect(page.locator('#said')).toHaveText(said);
  await expect(page.locator('#said')).toHaveClass('line');
  const [line, stage] = await Promise.all(
    ['#said', '#stage'].map((one) => page.locator(one).boundingBox()),
  );
  expect(stage?.y).toBe((line?.y ?? NaN) + (line?.height ?? NaN));
  expect(Number.isInteger(stage?.y)).toBe(true);
  return read(name, readFileSync(await download.path()));
}
// Page code, handed over as text: these tests are typed for Node, which has no `document`.
// What the page's own rules make of the sketch it keeps, at a cut: the surfaces of the parts
// that show, in the order they first come; how many parts; and the box around them where the
// stage has them - the plot's x, the height over the scene's lowest point, the plot's y the
// other way round. With every surface as scene/surfaces.js has it.
type Surface = { colour: string; rough: number; hides?: number };
type Shown = { names: string[]; parts: number; box: number[]; surfaces: Record<string, Surface> };
const SCRIPTS = ['/view3d/read.js', '/scene/scene.js', '/scene/cut.js', '/scene/surfaces.js'];
const shownAt = (page: Page, cut: number | 'all'): Promise<Shown> =>
  page.evaluate<Shown>(`Promise.all(${JSON.stringify(SCRIPTS)}.map((one) => import(one))).then(
    ([{ read, site }, { sceneOf }, { partsShown }, { SURFACES }]) => {
      const { things, figures } = read(true);
      const scene = sceneOf(site, things, figures);
      const parts = partsShown(scene, ${JSON.stringify(cut)});
      const staged = ([x, y, h]) => [x, h - scene.box.min[2], -y];
      const ends = parts.flatMap(({ min, max }) => [staged(min), staged(max)]);
      const reach = (pick) => [0, 1, 2].map((axis) => pick(...ends.map((end) => end[axis])));
      return {
        names: [...new Set(parts.map((part) => part.surface))],
        parts: parts.length,
        box: [...reach(Math.min), ...reach(Math.max)],
        surfaces: SURFACES,
      };
    },
  )`);
/** Two boxes are one, to the centimetre. */
function expectBox(actual: number[], expected: number[]): void {
  const off = actual.map((value, at) => Math.abs(value - (expected[at] ?? NaN)));
  expect(actual.length).toBe(expected.length);
  expect(Math.max(...off), `${String(actual)} is not ${String(expected)}`).toBeLessThan(0.005);
}
/** A share of light as a level of the screen, of 255: a file states a colour in light, the pad as the screen has it. */
const level = (share: number): number =>
  Math.round(255 * (share <= 0.0031308 ? 12.92 * share : 1.055 * share ** (1 / 2.4) - 0.055));
const hexOf = (shares: number[]): string =>
  `#${shares.map((share) => level(share).toString(16).padStart(2, '0')).join('')}`;

test.describe('with the made-up sketch', () => {
  withSketch(SKETCH);

  test('in White the entry saves what is shown as one binary glTF, and asks nobody', async ({
    page,
  }) => {
    // What goes wrong in the page, and what three.js or its exporter warns of there; and what
    // the page asks for, of whomever, from the press of the entry on.
    const errors: string[] = [];
    const asked: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      const warned = message.type() === 'warning' && /THREE|GLTF/i.test(message.text());
      if (message.type() === 'error' || warned) errors.push(message.text());
    });
    test.skip(!(await open(page)), NO_STAGE);
    await pick(page, 'white');
    page.on('request', (request) => asked.push(request.url()));
    const days = [new Date().toISOString().slice(0, 10)];
    const file = await save(page);
    days.push(new Date().toISOString().slice(0, 10));
    // Its name says the day, as a saved sketch's does.
    expect(days.map((day) => `house-${day}.glb`)).toContain(file.name);
    // A scene of meshes with their materials, and their numbers: no camera, no light - which a
    // file of glTF has as an extension - no picture, nothing to lay one on, nothing that moves.
    const { json } = file;
    const HELD = ['accessors', 'asset', 'bufferViews', 'buffers', 'materials', 'meshes', 'nodes'];
    expect(Object.keys(json).sort()).toEqual([...HELD, 'scene', 'scenes']);
    for (const none of ['cameras', 'extensions', 'images', 'textures', 'samplers', 'animations']) {
      expect(json).not.toHaveProperty(none);
    }
    expect([json.asset.version, json.scene, json.scenes.length]).toEqual(['2.0', 0, 1]);
    // A mesh for each surface that a part which shows is of, under its name - and no other.
    const shown = await shownAt(page, 'all');
    expect(json.nodes.map((node) => node.name)).toEqual(shown.names);
    expect(json.scenes[0]?.nodes).toEqual(json.nodes.map((_, at) => at));
    await expect(page.locator('body')).toHaveAttribute('data-parts', String(shown.parts));
    // All is white, as rough as chalk, with no metal - and glass is glass: a white that hides
    // the share that glass hides, and no more, under its name.
    const { hides = 1 } = shown.surfaces['glass'] ?? {};
    expect([shown.names.includes('glass'), hides < 1]).toEqual([true, true]);
    file.faces.forEach((face, at) => {
      const glass = json.nodes[at]?.name === 'glass';
      const white = { metallicFactor: 0, roughnessFactor: 1 };
      const veil = glass ? { baseColorFactor: [1, 1, 1, hides] } : {};
      const expected = { pbrMetallicRoughness: { ...veil, ...white }, name: 'white' };
      expect(face).toEqual(glass ? { ...expected, alphaMode: 'BLEND', name: 'glass' } : expected);
    });
    expect(json.materials.map((face) => face.name).sort()).toEqual(['glass', 'white']);
    // Every place is where the stage has it: the box around all of them is the box around the
    // parts that show - the house, the car above it and the tree below it. And a part is twelve
    // triangles at the least, a box.
    expectBox(file.box, shown.box);
    expect(file.triangles).toBeGreaterThanOrEqual(12 * shown.parts);
    // The page asked nobody for it, wrote nothing of the sketch, and nothing went wrong.
    expect(asked).toEqual([]);
    expect(await page.evaluate<string | null>(`localStorage.getItem('${KEY}')`)).toBe(SKETCH);
    expect(errors).toEqual([]);
    // And its policy is as it was: it lets the page ask nobody - the pad itself is refused.
    const policy = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(policy).toHaveAttribute('content', "connect-src 'none'");
    const fetched = `fetch('/3d.html').then(() => 'answered', () => 'refused')`;
    expect(await page.evaluate<string>(fetched)).toBe('refused');
  });

  test('in Materials each surface is a material, with its colour and its roughness', async ({
    page,
  }) => {
    test.skip(!(await open(page)), NO_STAGE);
    await pick(page, 'white');
    const white = await save(page);
    await pick(page, 'materials');
    const file = await save(page);
    const shown = await shownAt(page, 'all');
    // A mesh a surface and a material a surface, each once, under the surface's name - though
    // the stage has two faces of a surface that the house and something in it are both of.
    const names = file.json.nodes.map((node) => node.name);
    expect(names).toEqual(shown.names);
    expect(file.json.materials.map((face) => face.name).sort()).toEqual([...names].sort());
    expect(new Set(names).size).toBe(names.length);
    file.faces.forEach((face, at) => {
      const surface = shown.surfaces[names[at] ?? ''];
      if (!surface) throw new Error(`${names[at]} is no surface`);
      const { baseColorFactor: light = [], ...other } = face.pbrMetallicRoughness;
      expect([face.name, hexOf(light.slice(0, 3))]).toEqual([names[at], surface.colour]);
      expect(other).toEqual({ metallicFactor: 0, roughnessFactor: surface.rough });
      expect([light[3], face.alphaMode]).toEqual(
        surface.hides === undefined ? [1, undefined] : [surface.hides, 'BLEND'],
      );
    });
    // It is the house that White saved, in its surfaces: the same places, as many triangles.
    expectBox(file.box, white.box);
    expect(file.triangles).toBe(white.triangles);
    expect(white.json.nodes.map((node) => node.name)).toEqual(names);
  });
});

test.describe('with the made-up house alone', () => {
  withSketch(HOUSE);

  test('the box around its places is the house, in metres with y up; a level down, a lower one', async ({
    page,
  }) => {
    test.skip(!(await open(page)), NO_STAGE);
    await pick(page, 'white');
    const whole = await save(page);
    const all = await shownAt(page, 'all');
    expectBox(whole.box, HOUSE_BOX);
    expectBox(whole.box, all.box);
    // At the lower level the upper storey is off, and the roof of the lower: the file holds less
    // - fewer parts, fewer triangles, fewer bytes - and its box is the box around what shows
    // then. That stands on the same ground and is as long and as wide, and lower: by the upper
    // storey, 3 m, less what of a staircase reaches up to its floor.
    await page.locator('button[data-level="814"]').click();
    await expect(page.locator('body')).toHaveAttribute('data-level', '814');
    const lower = await save(page);
    const shown = await shownAt(page, 814);
    expectBox(lower.box, shown.box);
    await expect(page.locator('body')).toHaveAttribute('data-parts', String(shown.parts));
    expect(shown.parts).toBeLessThan(all.parts);
    expect([lower.triangles < whole.triangles, lower.bytes < whole.bytes]).toEqual([true, true]);
    const [, foot = NaN, , , top = NaN] = lower.box;
    expectBox([...lower.box.slice(0, 4), ...lower.box.slice(5)], [7, 4.44, -17, 25, -6]);
    expect([(whole.box[4] ?? NaN) - top > 2, top - foot > 2]).toEqual([true, true]);
  });
});

test('where nothing is drawn no file is saved, and the page says so after its words on the sketch', async ({
  page,
}) => {
  test.skip(!(await open(page)), NO_STAGE);
  await pick(page, 'white');
  let files = 0;
  page.on('download', () => (files += 1));
  await press(page);
  const NONE =
    /^Nothing is drawn yet: .+ No 3D file was saved: nothing of a house is shown here\.$/;
  await expect(page.locator('#said')).toHaveText(NONE);
  await expect(page.locator('#said')).toHaveClass('line');
  expect(files).toBe(0);
});
