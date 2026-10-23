// The two ways in (ST-040, T-040.1): a plot's folder, picked and read, and the sketches kept in
// its sketches/, over the File System Access API and nothing else of the page - and a new plot's
// folder, made by New plot in a folder that was picked (ST-041, T-041.3). A plot's file,
// the other way, is a `File` that whoever has it reads with `file.text()`: nothing here for it.
// Chrome and Edge give a folder; another browser has no `showDirectoryPicker`, and is offered the
// file alone. A page loads this module by import(). Wiring over the browser, with no check of
// its own (directive 14): the browser tests of T-040.3 and T-040.5 run it. A test cannot answer
// the real picker - store/CLAUDE.md, "Gotchas", says how one hands a folder over.
import { PLOT_FILE, PLOT_KEEPS } from '../routes.js';
import { fileOf, folderId, keptOrder, REFUSED, sketchesOf } from './rules.js';

const WRITE = Object.freeze({ mode: 'readwrite' });
// What the File System Access API says of a name that is not there, and of one of another kind.
const NOT_THERE = ['NotFoundError', 'TypeMismatchError'];

/** Whether this browser can be given a folder. */
export const takesFolders = () => 'showDirectoryPicker' in globalThis;

/**
 * A folder picked, to read and to write in, so that the browser asks once - or null, where the
 * person shut the picker.
 */
export async function pickFolder() {
  try {
    return await globalThis.showDirectoryPicker({ id: 'blockplot-plot', ...WRITE });
  } catch (error) {
    if (error?.name === 'AbortError') return null;
    throw error;
  }
}

/** A thing in a folder by its name - a file's handle, or a folder's - or null, where none is. */
async function within(folder, name, kind) {
  try {
    return kind === 'file'
      ? await folder.getFileHandle(name)
      : await folder.getDirectoryHandle(name);
  } catch (error) {
    if (NOT_THERE.includes(error?.name)) return null;
    throw error;
  }
}

/** The text of a file in a folder - or null, where there is no file of that name. */
async function textIn(folder, name) {
  const file = await within(folder, name, 'file');
  return file === null ? null : (await file.getFile()).text();
}

/**
 * A picked folder as a plot: `{ id, text }`, its id and the text of its plot.json - or
 * `{ refused }`, for its name or for a plot.json that is not there. The text is not read here:
 * a page reads it with `read` of plot-file.js.
 */
export async function fromFolder(handle) {
  const named = folderId(handle.name);
  if (named.refused !== undefined) return named;
  const text = await textIn(handle, PLOT_FILE);
  return text === null ? { refused: REFUSED.file } : { id: named.id, text };
}

/**
 * Whether the page may write into the folder: granted, or asked and then granted. To ask, the
 * browser wants a click - Keep's; asked without one, it is no.
 */
export async function mayWrite(handle) {
  const now = await handle.queryPermission(WRITE);
  if (now === 'granted') return true;
  if (now !== 'prompt') return false;
  try {
    return (await handle.requestPermission(WRITE)) === 'granted';
  } catch (error) {
    if (error?.name === 'SecurityError') return false;
    throw error;
  }
}

/**
 * The sketches kept in a plot's folder: `{ kept: [{ name, at }], other }` - `at` the time its
 * file was last written, the newest first - and how many files end in .json under a name the
 * pad does not take. None where there is no sketches/.
 */
export async function keptIn(handle) {
  const folder = await within(handle, PLOT_KEEPS, 'folder');
  if (folder === null) return { kept: [], other: 0 };
  const files = new Map();
  for await (const entry of folder.values())
    if (entry.kind === 'file') files.set(entry.name, entry);
  const { names, other } = sketchesOf([...files.keys()]);
  const timed = async (name) => ({
    name,
    at: (await files.get(fileOf(name)).getFile()).lastModified,
  });
  return { kept: keptOrder(await Promise.all(names.map(timed))), other };
}

/**
 * A sketch kept in a plot's folder: sketches/ made where there is none, and the file written
 * whole - `{ kept: true }` - or `{ taken: true }`, where a file of that name lies there. Never
 * over one.
 */
export async function keepIn(handle, name, text) {
  const folder = await handle.getDirectoryHandle(PLOT_KEEPS, { create: true });
  if ((await within(folder, fileOf(name), 'file')) !== null) return { taken: true };
  const file = await folder.getFileHandle(fileOf(name), { create: true });
  // The text goes to a file beside it, which takes the file's place as it is closed, whole.
  const writing = await file.createWritable();
  await writing.write(text);
  await writing.close();
  return { kept: true };
}

/** The names of what lies in a folder: files and folders alike. */
export async function namesIn(handle) {
  const names = [];
  for await (const name of handle.keys()) names.push(name);
  return names;
}

/** Writes a text whole into a file's handle: beside it, and in its place as it is closed. */
async function written(file, text) {
  const writing = await file.createWritable();
  try {
    await writing.write(text);
    await writing.close();
  } catch (error) {
    // What was written beside the file goes with the writing: the file stays as it was begun.
    await writing.abort().catch(() => {});
    throw error;
  }
}

/**
 * A new plot's folder (ST-041, T-041.3), made in a folder that the person picked: a folder `id`,
 * in it plot.json, the text written whole, and an empty sketches/ - `{ folder }`, its handle - or
 * `{ taken: true }`, where anything of that name lies in `parent`, with nothing made; and so where
 * the folder that is there after all holds a plot.json. Where a step fails it rejects, after
 * taking away what it made itself and nothing else: the plot.json that it began, then the folder
 * that it made - each by its one name, never all that lies under it. Where that taking away fails
 * too, it rejects with what the browser said of it, marked `left`: something of it is left.
 */
export async function makeIn(parent, id, text) {
  const there = (await within(parent, id, 'file')) ?? (await within(parent, id, 'folder'));
  if (there !== null) return { taken: true };
  const folder = await parent.getDirectoryHandle(id, { create: true });
  if ((await within(folder, PLOT_FILE, 'file')) !== null) return { taken: true };
  let begun = false;
  try {
    const file = await folder.getFileHandle(PLOT_FILE, { create: true });
    begun = true;
    await written(file, text);
    await folder.getDirectoryHandle(PLOT_KEEPS, { create: true });
  } catch (error) {
    try {
      if (begun) await folder.removeEntry(PLOT_FILE);
      await parent.removeEntry(id);
    } catch (left) {
      throw Object.assign(left, { left: true });
    }
    throw error;
  }
  return { folder };
}

/** The text of a sketch kept in a plot's folder - or null. */
export async function keptTextIn(handle, name) {
  const folder = await within(handle, PLOT_KEEPS, 'folder');
  return folder === null ? null : textIn(folder, fileOf(name));
}
