// The browser's store of plots (ST-040, T-040.1), over IndexedDB and nothing else of the page:
// the plots this browser holds, each its file's text, and the sketches kept in it. What the store
// is, rules.js says; docs/STORAGE_FORMAT.md, "The browser's store - version 1", is the contract.
// No call here takes anything away (directive 33): a record is put, or added, and never removed.
// A page loads this module by import(). Wiring over the browser, with no check of its own
// (directive 14): the browser tests of T-040.2 to T-040.5 run it.
import { BASE, BASE_VERSION, heldOrder, KEPT, keptOrder, PLOTS, STORES } from './rules.js';

// One connection a page, opened when it is first asked for.
let opened = null;
// The browser's answer to whether it keeps what it holds: asked once a page.
let persisted = null;

/** The database, made where it is not there yet. One that cannot be opened rejects with the browser's error. */
function base() {
  opened ??= new Promise((resolve, reject) => {
    const opening = globalThis.indexedDB.open(BASE, BASE_VERSION);
    opening.onupgradeneeded = () => {
      const made = opening.result;
      for (const [name, { keyPath, index }] of Object.entries(STORES)) {
        const store = made.createObjectStore(name, { keyPath });
        if (index !== undefined) store.createIndex(index, index);
      }
    };
    opening.onsuccess = () => {
      // A later version, opened in another tab, is let in: this page asks anew.
      opening.result.onversionchange = () => {
        opening.result.close();
        opened = null;
      };
      resolve(opening.result);
    };
    opening.onerror = () => {
      opened = null;
      reject(opening.error);
    };
  });
  return opened;
}

/** One request in a transaction of its own: its result once the transaction is done. */
async function asked(name, mode, request) {
  const db = await base();
  return new Promise((resolve, reject) => {
    const done = db.transaction(name, mode);
    const one = request(done.objectStore(name));
    done.oncomplete = () => resolve(one.result);
    done.onabort = () => reject(one.error ?? done.error);
  });
}

/** Every held plot, without its text: the newest opened first. */
export async function held() {
  const all = await asked(PLOTS, 'readonly', (store) => store.getAll());
  const told = (record) =>
    Object.fromEntries(Object.entries(record).filter(([at]) => at !== 'text'));
  return heldOrder(all.map(told));
}

/** One held plot, whole - or null. */
export async function plot(id) {
  return (await asked(PLOTS, 'readonly', (store) => store.get(id))) ?? null;
}

/** A plot held: put, in the place of one of its id - a plot opened again is given again. */
export async function hold(record) {
  await asked(PLOTS, 'readwrite', (store) => store.put(record));
}

/**
 * A sketch kept on a plot: `{ kept: true }`, or `{ taken: true }` where that plot has a sketch of
 * that name. Never over one: the store adds, and a key that is there fails.
 */
export async function keep(plot, name, text) {
  try {
    await asked(KEPT, 'readwrite', (store) => store.add({ plot, name, text, at: Date.now() }));
    return { kept: true };
  } catch (error) {
    if (error?.name === 'ConstraintError') return { taken: true };
    throw error;
  }
}

/** The sketches kept on a plot, `[{ name, at }]`: the newest first. */
export async function kept(plot) {
  const all = await asked(KEPT, 'readonly', (store) => store.index('plot').getAll(plot));
  return keptOrder(all.map(({ name, at }) => ({ name, at })));
}

/** The text of a sketch kept on a plot - or null. */
export async function keptText(plot, name) {
  const one = await asked(KEPT, 'readonly', (store) => store.get([plot, name]));
  return one?.text ?? null;
}

/** Whether the browser keeps what it holds: `navigator.storage.persist()`, asked once a page. */
export function persist() {
  persisted ??= globalThis.navigator.storage.persist();
  return persisted;
}
