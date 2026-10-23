// The rule of the sketch pad's server: which path gets which file, of which type, and in which
// mode and on which port the server runs - and the names of a plot's folder. Nothing here touches
// the network or the disk, and nothing is imported: serve.js does what this says, a page loads
// it for the names (store/ways.js), and routes.check.js and plot-routes.check.js prove it. The
// server is a plain file server (ST-041): it makes no plot and keeps no sketch - New plot makes a
// plot in the page, and Keep keeps in the browser, or in a plot's folder that the browser was
// given.

// The one switch. With it the pad has the made-up plot, no New plot, and asks no other machine.
export const SWITCH = '--demo';
// The project's ports are its own: 4761 the inspector, 4762 the web app, 4763 its demo preview,
// 4764 the pad, 4765 the pad on the made-up plot. A browser keeps a sketch for the address it
// was drawn at: on a port of its own, the made-up plot does not open the sketch of the real one.
export const PORTS = { pad: 4764, demo: 4765 };
export const HOST = '127.0.0.1';
const LAST_PORT = 65_535;

// What the pad's address alone asks for.
const PAGE = 'index.html';
const HTML = 'text/html; charset=utf-8';
const JS = 'text/javascript; charset=utf-8';
const CSS = 'text/css; charset=utf-8';
// A file's type, by the ending of its name, in small letters as the pad's files have it: a
// page, a script, a stylesheet - and no fourth. The server says `nosniff` (serve.js): a
// stylesheet that came as any other type, no browser would take.
const TYPES = { '.html': HTML, '.js': JS, '.css': CSS };
const typeOf = (name) => {
  const dot = name.lastIndexOf('.');
  const ending = dot < 0 ? '' : name.slice(dot);
  return Object.hasOwn(TYPES, ending) ? TYPES[ending] : null;
};
// A name, of a file or of a folder, as the rule takes it: letters of the English alphabet,
// digits, - and _, in parts with one dot between them. So no name is `.` or `..`, none begins or
// ends with a dot, and none holds a %, a backslash, a colon or a blank: nothing is decoded and
// nothing is worked out, and what is written any other way gets no file.
const NAME = /^[\w-]+(\.[\w-]+)*$/;
// A folder the page gets nothing of, under whatever case a disk takes for its name.
const NO_FOLDER = 'node_modules';
// three.js, the pad's one dependency, lies where pnpm links it: in the pad's own node_modules.
// The page gets it under three/, beside the pages, and of it the scripts of two folders alone -
// what a browser loads: the build, and the addons at whatever depth.
const THREE = 'three';
const THREE_IN = `${NO_FOLDER}/${THREE}`;
const isBuild = (names) => names.length === 2 && names[0] === 'build';
const isAddon = (names) => names.length > 2 && names[0] === 'examples' && names[1] === 'jsm';
// The map's page (ST-031), in a folder of its own: the page of a new plot, and the one page that
// asks another machine - under a policy that the page brings in its own head. So the made-up
// pad, which asks nobody, has nothing of that folder, and no pad gives it under other letters.
// But for the page itself, which the made-up pad answers with nothing: File asks for it, to know
// whether the pad has New plot (open-plot.js), and a 204 has no body and is no error on a page's
// console - where a 404 would be one (ST-041, T-041.4).
export const MAP = 'map';
export const MAP_PAGE = `${MAP}/${PAGE}`;
export const NO_PAGE = Object.freeze({ status: 204 });

/**
 * In which mode and on which port the server runs - `{ demo, port }` - or why it does not:
 * `{ refused }`. `asked` are its arguments, `environment` what the shell names. A switch nobody
 * knows is refused, never skipped: a mistyped --demo must not show the real plot. Where the
 * environment names a port, the pad listens there instead: a second pad beside the one that
 * runs. Named but empty is not named.
 */
export function setting(asked, environment) {
  const unknown = asked.find((argument) => argument !== SWITCH);
  if (unknown !== undefined) {
    return { refused: `"${unknown}" is no switch of its. It has one, ${SWITCH}.` };
  }
  const demo = asked.includes(SWITCH);
  const named = environment.PORT || undefined;
  const port = named === undefined ? PORTS[demo ? 'demo' : 'pad'] : Number(named);
  if (!Number.isInteger(port) || port < 1 || port > LAST_PORT) {
    return { refused: `PORT is "${named}", no port.` };
  }
  return { demo, port };
}

/**
 * The file a request gets, from the pad's folder on, and its type - or null: no file; or
 * `NO_PAGE`, an answer of 204 with nothing, on the made-up pad for the map's page alone. `target`
 * is what the request asks for, as it was written: a path, and after a `?` what the server does
 * not read. The pad's own pages, scripts and stylesheets, in its folder and in its folders one
 * deep - of the map's folder on a pad that is not the made-up one alone, and in small letters;
 * under /three/, the scripts of three.js's build and of its addons, and no other type; and
 * nothing else. No path is made into a plot (ST-040): site.js, kept/, plots/ and new-plot/ are
 * names as any other, of what the pad's folder does not hold, and get nothing.
 */
export function route(target, demo) {
  if (typeof target !== 'string' || !target.startsWith('/')) return null;
  const [path] = target.split('?');
  const names = path === '/' ? [PAGE] : path.slice(1).split('/');
  if (!names.every((name) => NAME.test(name))) return null;
  const [first, ...rest] = names;
  const last = names.at(-1);
  const type = typeOf(last);
  if (type === null) return null;

  if (first === THREE) {
    const given = type === JS && (isBuild(rest) || isAddon(rest));
    return given ? { file: `${THREE_IN}/${rest.join('/')}`, type } : null;
  }
  if (names.length > 2 || (names.length === 2 && first.toLowerCase() === NO_FOLDER)) return null;
  if (first.toLowerCase() === MAP && path !== path.toLowerCase()) return null;
  if (first === MAP && demo) return path === `/${MAP_PAGE}` ? NO_PAGE : null;
  return { file: names.join('/'), type };
}

// The names of a plot (ST-030). A plot is a folder: in it the plot's file and, in a folder of
// their own, the sketches that were kept on that plot. The folder's name is the plot's id. The
// server has no plot of its own, gives none and keeps no sketch (ST-040): a page gets its plot
// from the browser (boot.js), Keep writes into a plot's folder through the browser (kept.js), and
// New plot makes one in the page (map/make.js). plot-routes.check.js holds the names.
// In a plot's folder: its file, and the folder of its kept sketches.
export const PLOT_FILE = 'plot.json';
export const PLOT_KEEPS = 'sketches';
// The example's file, the made-up plot's, lies in the pad's own folder, from that folder on.
export const EXAMPLE_FILE = 'example/plot.json';
