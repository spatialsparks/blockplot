import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices, expect, test as base } from '@playwright/test';
import type { BrowserContext, Locator, Page } from '@playwright/test';

// A plot's folder in a browser test (story ST-040; T-040.3, and T-040.5's Keep): no test file,
// by its name. A test cannot answer the real folder picker - Playwright refuses it - so the case's
// browser is given a stand-in picker, which hands over a folder of the origin's private file
// system: a real folder's handle, which the pad reads and writes as it would one of the disk.
// Putting such a handle into IndexedDB crashes Playwright's own Chromium in a context that keeps
// nothing, so the case's browser has a profile of its own, in a folder of the system's temporary
// files, taken away however the case ends (tools/sketch/store/CLAUDE.md, "Gotchas"). Its `test`
// gives a case `folders`: that browser, on the case's address - the project's, unless the test
// gives its own `baseURL` - and as the project's device; a
// made-up plot's folder put there from tests/__fixtures__/plots, and a file put beside it; the
// folder the picker hands over next; what lies there, read back; and the permission to write there withdrawn. After every case
// no page has said an error or asked another origin (directive 34) - but `alsoAsks`, where a
// test names one: the stand-in for swisstopo of sketch-new-plot-folder.spec.ts (T-041.5).

const FIXTURES = fileURLToPath(new URL('../__fixtures__/plots/', import.meta.url));

/** A case's browser of its own, and the folders of its private file system. Page code is handed over as text: these tests are typed for Node. */
export type Folders = {
  browser: BrowserContext;
  /** A made-up plot's folder, `tests/__fixtures__/plots/<id>/`, put into the private file system under a name - its own where none is given. */
  put: (id: string, name?: string) => Promise<void>;
  /** A file written whole into a folder there, its folders made - `write(text, 'terrace', 'sketches', 'old.json')`: as somebody, or a pad of before, put it (T-040.5). */
  write: (text: string, ...names: string[]) => Promise<void>;
  /** The folder that the stand-in picker hands over next, by its name. */
  picks: (name: string) => Promise<void>;
  /** The text of a file in a folder there - `['terrace', 'sketches', 'plan.json']` - or null, where none lies there. */
  read: (...names: string[]) => Promise<string | null>;
  /** The names in a folder there, sorted - or null, where there is no such folder. */
  list: (...names: string[]) => Promise<string[] | null>;
  /** The permission to write into a folder withdrawn, for every page opened from now on: asked, it is `prompt`; requested, `denied`. */
  withdraw: () => Promise<void>;
};

/** The files of a made-up plot's folder, each by its path in the folder - `sketches/plan.json` - and its text. */
function filesOf(id: string, under = ''): [string, string][] {
  const at = path.join(FIXTURES, id, under);
  return readdirSync(at).flatMap((name): [string, string][] => {
    const inner = path.posix.join(under, name);
    return statSync(path.join(at, name)).isDirectory()
      ? filesOf(id, inner)
      : [[inner, readFileSync(path.join(at, name), 'utf8')]];
  });
}

// What a page of the case's browser does with the private file system: a folder by its path,
// made where asked to; a file written whole; a file's text read; a folder's names.
const WALK = `const walk = async (names, create) => {
  let at = await navigator.storage.getDirectory();
  for (const name of names) at = await at.getDirectoryHandle(name, { create });
  return at;
};`;

export const test = base.extend<{ folders: Folders; alsoAsks: string | null }>({
  // An origin more that a page of the case may ask - a stand-in's (T-041.5) - or none.
  alsoAsks: [null, { option: true }],
  folders: async ({ baseURL, alsoAsks }, use) => {
    if (baseURL === undefined) throw new Error('the project names no address of the pad');
    const profile = mkdtempSync(path.join(tmpdir(), 'blockplot-profile-'));
    const wrong: string[] = [];
    let browser: BrowserContext | null = null;
    try {
      const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } =
        devices['Desktop Chrome'];
      const device = { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch, baseURL };
      const context = await chromium.launchPersistentContext(profile, device);
      browser = context;
      context.on('weberror', (error) => wrong.push(error.error().message));
      context.on('console', (said) => said.type() === 'error' && wrong.push(said.text()));
      // An address may have a path - the pad under one, as a web host serves it (T-044.2).
      const origin = new URL(baseURL).origin;
      context.on('request', (request) => {
        const to = new URL(request.url()).origin;
        if (to !== origin && to !== alsoAsks) wrong.push(`asked: ${request.url()}`);
      });
      // The stand-in picker: the folder that the case names, of the origin's private file system.
      await context.addInitScript(`globalThis.showDirectoryPicker = async () =>
        (await navigator.storage.getDirectory()).getDirectoryHandle(
          localStorage.getItem('test/picks') ?? 'terrace');`);
      // A page of the pad's address, for what the case does in the private file system.
      const own = await context.newPage();
      await own.goto(new URL('frame.css', baseURL).href);
      const run = <T>(code: string): Promise<T> =>
        own.evaluate<T>(`(async () => { ${WALK} ${code} })()`);
      /** Files written whole, each `[path, text]`, its path's folders made. */
      const written = (files: [string[], string][]) =>
        run<void>(`for (const [parts, text] of ${JSON.stringify(files)}) {
          const folder = await walk(parts.slice(0, -1), true);
          const writing = await (await folder.getFileHandle(parts.at(-1), { create: true })).createWritable();
          await writing.write(text);
          await writing.close();
        }`);
      const folders: Folders = {
        browser: context,
        put: (id, name = id) =>
          written(filesOf(id).map(([file, text]) => [[name, ...file.split('/')], text])),
        write: (text, ...names) => written([[names, text]]),
        picks: (name) => run(`localStorage.setItem('test/picks', ${JSON.stringify(name)});`),
        read: (...names) =>
          run(`try {
            const folder = await walk(${JSON.stringify(names.slice(0, -1))}, false);
            return await (await (await folder.getFileHandle(${JSON.stringify(names.at(-1))})).getFile()).text();
          } catch { return null; }`),
        list: (...names) =>
          run(`try {
            const names = [];
            for await (const name of (await walk(${JSON.stringify(names)}, false)).keys()) names.push(name);
            return names.sort();
          } catch { return null; }`),
        withdraw: async () => {
          // A page that is no secure context - a new window's blank page - has no such handle.
          await context.addInitScript(`if (globalThis.FileSystemHandle !== undefined) {
            FileSystemHandle.prototype.queryPermission = async () => 'prompt';
            FileSystemHandle.prototype.requestPermission = async () => 'denied';
          }`);
        },
      };
      await use(folders);
      expect(wrong).toEqual([]);
    } finally {
      await browser?.close();
      rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
    }
  },
});
export { expect };

// What Keep and Open kept are pressed with, by the kept sketches' tests and the story's test of a
// plot's folder (T-040.5). Their words, stated a second time: tools/sketch/kept-ways.js says them.
export const BROWSER = 'in this browser only — save a file to keep a copy';
export const NO_ROOM = 'This browser may clear it when it is short of room.';
export const TAKEN = (name: string): string =>
  `"${name}" is taken: a sketch is kept under that name, and nothing was written. ` +
  'Give this one another name.';

/** A name that no earlier run kept: letters, figures and blanks, as a name is. */
export const named = (what: string): string =>
  `${what} ${String(Date.now())} ${String(process.pid)}`;

/** An entry of the File menu, pressed: File first, which opens the menu, and then the entry. */
export const pick = async (one: Locator): Promise<void> => {
  await one.page().locator('#file-menu').click();
  await one.click();
};

/** The window that Keep and Open kept open: its field, where it says sketches are kept, its list, and what it says. */
export function keptWindow(
  page: Page,
): Record<'shown' | 'field' | 'where' | 'picks' | 'said', Locator> {
  const shown = page.getByRole('dialog', { name: /^(Keep the sketch|Open a kept sketch)$/ });
  const [field, picks] = [shown.locator('#kept-name'), shown.locator('#kept-list button')];
  return {
    shown,
    field,
    where: shown.locator('#kept-where'),
    picks,
    said: shown.locator('#kept-said'),
  };
}

/** Keep, pressed - unless its window is open still, on a name that was refused - a name given and sent: what the window then says. */
export async function keepAs(page: Page, name: string): Promise<string> {
  const { shown, field, said } = keptWindow(page);
  if (!(await shown.isVisible())) await pick(page.locator('#keep'));
  await field.fill(name);
  await field.press('Enter');
  await expect(said).not.toHaveText(
    /^(A kept sketch is never written over: a name is used once\.)?$/,
  );
  return (await said.textContent()) ?? '';
}

/** The bytes of the file that "Save file" saves of the sketch that shows: its download, read back. */
export async function saved(page: Page): Promise<Buffer> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    pick(page.locator('#save')),
  ]);
  return readFileSync(await download.path());
}

/** File, Open plot, "A plot's folder…": the folder the stand-in picker hands over, shown - and the window shut. */
export async function openFolder(page: Page, id: string): Promise<void> {
  await pick(page.locator('#open-plot'));
  await page.locator('#plot-folder').click();
  await expect(page.locator(`html[data-shown="${id}"]`)).toHaveCount(1);
  // The window opens again with the page where it has a word to say - the browser's no to keeping
  // what it holds, as the first plot is held.
  const plots = page.getByRole('dialog', { name: 'Open a plot' });
  const opened = await plots.waitFor({ timeout: 2000 }).then(
    () => true,
    () => false,
  );
  if (opened) await plots.getByRole('button', { name: 'Close' }).click();
  await expect(plots).toBeHidden();
}
