// The check that the pad's code names three hosts and no other (ST-031, rule 1). One function,
// `amiss`, says what is amiss in a folder that is a pad's, over every .js, .html and .css file of
// it at whatever depth - but node_modules, __fixtures__ and this check itself - each fault of a
// file by its name:
//
//   - an address that says how it is asked - http://, https://, ws://, wss:// - names one of the
//     three hosts, 127.0.0.1, or a host that the script puts together itself, `${HOST}`; the
//     names of two kinds of file, which nobody asks - SVG's, of a picture written out as text,
//     and KML's, of the Google Earth file - and the four names of frames of a GeoJSON's crs
//     that New plot's reader of a file takes, which nobody asks either (ST-045), where each
//     stands so, to the letter. In a
//     page and in a stylesheet no src, no href and no url( begins with //. Not held: // in a
//     script, where it begins every comment - a script asks through fetch(, which is held below;
//   - each of the three hosts is named in hosts.js, and typed in once more in hosts.check.js -
//     and no other file names a host of theirs: every other takes one from HOSTS;
//   - of the scripts that are no checks, fetch( stands in kept.js and open-plot.js, in the
//     scripts of map/ and in swisstopo/door.js, and in no other - nor in a page; and no file says
//     XMLHttpRequest, WebSocket, EventSource or sendBeacon.
//
// A link is neither a file nor a folder of the pad's: nothing is read through one. The check runs
// the function on the pad's own folder, where it finds nothing, and - a rule that matches nothing
// passes for ever (directive 9) - on a folder of its own making in the system's temporary files,
// which is taken away however it ends. Run by check.js, as every check is.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { HOSTS } from './hosts.js';

// The three, and what they share: the three hosts are swisstopo's, under one name.
const THREE = Object.values(HOSTS);
const THEIRS = THREE[0].split('.').slice(1).join('.');
assert.ok(THREE.length === 3 && THREE.every((host) => host.endsWith(`.${THEIRS}`)), THEIRS);
// What is read, what is left out, and the two files that name the hosts.
const KINDS = ['.js', '.html', '.css'];
const LEFT_OUT = ['node_modules', '__fixtures__'];
const SELF = 'swisstopo/named.check.js';
const NAMING = ['swisstopo/hosts.js', 'swisstopo/hosts.check.js'];
// The scripts that ask, of those that are no checks: two of the pad's own page, the server's
// door, and the scripts of the map's page, one folder deep.
const ASKING = ['kept.js', 'open-plot.js', 'swisstopo/door.js'];
const asks = (name) => ASKING.includes(name) || /^map\/[^/]+\.js$/.test(name);
const isCheck = (name) => name.endsWith('.check.js');
// An address that says how it is asked, up to what ends it in a text; and those that the pad's
// code may name beside the three: the name of a picture, the name of KML and the four names of
// frames of new-plot/geojson.js, each whole, and this machine's address, with or without a port.
const ADDRESS = /\b(?:https?|wss?):\/\/[^\s'"`<>()\\,;\]]*/gi;
const PICTURE = 'http://www.w3.org/2000/svg';
const KML = 'http://www.opengis.net/kml/2.2';
const FRAMES = [
  'http://www.opengis.net/def/crs/EPSG/0/2056',
  'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
  'http://www.opengis.net/def/crs/EPSG/0/4326',
  'http://www.opengis.net/def/crs/EPSG/0/21781',
];
const THIS_MACHINE = /^127\.0\.0\.1(:(\d+|\$\{.*))?$/;
const SLASHES = /(?:\b(?:src|href)\s*=\s*["']?|url\(\s*["']?)\s*\/\//i;
const WORDS = ['XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon'];
// What is said of a file, after its name.
const SAID = {
  host: (host) =>
    `names "${host}": the pad's code names the three hosts of swisstopo/hosts.js and 127.0.0.1, and no other.`,
  theirs:
    "names a host of swisstopo's: hosts.js does, and its check - every other file takes one from HOSTS.",
  lacks: (host) => `does not name ${host}: the three hosts stand there, typed in.`,
  asks: 'says fetch(: of what is no check, kept.js, open-plot.js, the scripts of map/ and swisstopo/door.js ask, and no other.',
  word: (word) => `says ${word}: no file of the pad does.`,
  slashes: 'names an address that begins with //: no page and no stylesheet of the pad does.',
};

/**
 * The files of a folder that the rule reads, each by its name from the folder on, a slash between
 * its parts: every page, script and stylesheet at whatever depth, but what is left out. A link
 * is neither a file nor a folder here.
 */
function read(folder, under = '') {
  const here = fs.readdirSync(path.join(folder, under), { withFileTypes: true });
  return here.flatMap((entry) => {
    const name = under + entry.name;
    if (entry.isDirectory()) return LEFT_OUT.includes(entry.name) ? [] : read(folder, `${name}/`);
    return entry.isFile() && KINDS.includes(path.extname(name)) && name !== SELF ? [name] : [];
  });
}

/**
 * The host that an address names where the pad's code may not name it so - or null. Its host is
 * what stands between the two slashes and the next `/`, `?` or `#`, without the dot or the colon
 * that a sentence ends with. No host at all, and one that begins `${`, is put together by the
 * script itself.
 */
function strange(address) {
  if (address === PICTURE || address === KML || FRAMES.includes(address)) return null;
  const [host] = address.slice(address.indexOf('://') + 3).split(/[/?#]/);
  const named = host.replace(/[.:]+$/, '');
  const known = named === '' || named.startsWith('${') || THREE.includes(named);
  return known || THIS_MACHINE.test(named) ? null : named;
}

/**
 * What is amiss in a folder that is a pad's: a sentence a fault, each of a file by its name from
 * the folder on, in the order of the names - and nothing, where its code names the three hosts
 * in the two files, and asks where it may.
 */
function amiss(folder) {
  const faults = [];
  for (const name of read(folder)) {
    const text = fs.readFileSync(path.join(folder, name), 'utf8');
    const say = (fault) => faults.push(`${name} ${fault}`);
    const hosts = (text.match(ADDRESS) ?? []).map(strange).filter((host) => host !== null);
    for (const host of new Set(hosts)) say(SAID.host(host));
    const lacked = NAMING.includes(name) ? THREE.filter((host) => !text.includes(host)) : [];
    for (const host of lacked) say(SAID.lacks(host));
    if (!NAMING.includes(name) && text.toLowerCase().includes(THEIRS)) say(SAID.theirs);
    if (!isCheck(name) && !asks(name) && /\bfetch\s*\(/.test(text)) say(SAID.asks);
    const words = WORDS.filter((word) => new RegExp(`\\b${word}\\b`).test(text));
    for (const word of words) say(SAID.word(word));
    if (!name.endsWith('.js') && SLASHES.test(text)) say(SAID.slashes);
  }
  return faults.sort();
}

// The pad's own folder: nothing is amiss in it - and it has the two files that name the hosts.
const pad = path.join(import.meta.dirname, '..');
const found = amiss(pad);
const HELD =
  'tools/sketch names a host that the pad does not ask, or asks where it may not (ST-031):';
assert.equal(found.length, 0, [HELD, ...found].join('\n'));
const its = read(pad);
assert.ok(
  [...NAMING, 'serve.js', 'map/index.html', 'icons.css'].every((name) => its.includes(name)),
);
assert.ok(its.length > 100 && !its.some((name) => name === SELF || name.includes(LEFT_OUT[0])));

// The proof. A folder that is a pad's, made up: a page, a stylesheet that writes a picture out,
// the scripts that ask, the two files that name the hosts, a server that puts its own address
// together, a check that asks it - and what is left out, each naming a fourth host: this check
// itself, a note, a node_modules, fixtures, and a link to a folder that lies elsewhere. Then one
// file at a time is put there or is another: each is said by its name, in its sentence, and alone.
const ELSEWHERE = 'tiles.example.org';
const FOURTH = `const tile = 'https://${ELSEWHERE}/26/1406/1171.png';\n`;
const SECOND = `const tile = 'https://${THREE[0]}/26/1406/1171.png';\n`;
const NO_FAULT = {
  'index.html': '<link rel="stylesheet" href="frame.css" /><script src="kept.js"></script>\n',
  'frame.css': `a::before { --icon: url("data:image/svg+xml,<svg xmlns='${PICTURE}'/>"); }\n`,
  'kept.js': "const kept = () => fetch('kept/'); // Kept, at the pad's own address.\n",
  'open-plot.js': "const plots = () => fetch('/plots/');\n",
  'map/map.js': 'const found = (address) => fetch(address);\n',
  'swisstopo/door.js': 'export const asked = (address) => fetch(address);\n',
  [NAMING[0]]: `export const HOSTS = ${JSON.stringify(HOSTS)};\n`,
  [NAMING[1]]: `const TYPED = ${JSON.stringify(THREE)};\n${SECOND}fetch('ws://127.0.0.1');\n`,
  'serve.js': 'const ORIGIN = `http://${HOST}:${PORT}`; // As http://127.0.0.1:4764.\n',
  'routes.check.js': "await fetch(`http://127.0.0.1:${port}//index.html`, 'https://' + host);\n",
  [SELF]: `${FOURTH}new WebSocket(url);\n`,
  'CLAUDE.md': FOURTH,
  'node_modules/three/build/three.module.js': `${FOURTH}fetch(tile);\n`,
  'scene/__fixtures__/recorded.js': FOURTH,
};
const made = fs.mkdtempSync(path.join(tmpdir(), 'blockplot-named-'));
try {
  const folder = path.join(made, 'pad');
  const put = (name, text, into = folder) => {
    fs.mkdirSync(path.dirname(path.join(into, name)), { recursive: true });
    fs.writeFileSync(path.join(into, name), text);
  };
  for (const [name, text] of Object.entries(NO_FAULT)) put(name, text);
  put('fourth.js', FOURTH, path.join(made, 'elsewhere'));
  fs.symlinkSync(path.join(made, 'elsewhere'), path.join(folder, 'linked'), 'junction');
  assert.deepEqual(fs.readdirSync(path.join(folder, 'linked')), ['fourth.js']);
  assert.deepEqual(amiss(folder), []);

  /** What is amiss once one file of the folder is put there or is another: then it is as it was. */
  const tried = (name, text) => {
    const file = path.join(folder, name);
    const was = fs.existsSync(file) ? fs.readFileSync(file) : null;
    put(name, text);
    const faults = amiss(folder);
    if (was === null) fs.rmSync(file);
    else fs.writeFileSync(file, was);
    return faults;
  };
  const alone = (name, text, ...faults) => {
    const said = faults.map((fault) => `${name} ${fault}`).sort();
    assert.deepEqual(tried(name, text), said, `${name}: ${text}`);
  };
  // The three of the card: a script that names a fourth host, one that names one of the three
  // outside hosts.js, and a server's script that says fetch(.
  alone('fourth.js', FOURTH, SAID.host(ELSEWHERE));
  alone('view3d/second.js', SECOND, SAID.theirs);
  alone('serve.js', 'const answer = await fetch(address);\n', SAID.asks);
  // A fourth host, however it is asked and wherever it stands: in a check, in a page, in a
  // stylesheet, in a comment; by a name that only begins as this machine's or as one of the
  // three; this machine by its name; and the picture's name with more after it.
  for (const name of ['a.check.js', 'map/index.html', 'pad.css', 'scene/deep/er/cut.js']) {
    alone(name, `/* ${FOURTH} */`, SAID.host(ELSEWHERE));
  }
  for (const scheme of ['http', 'https', 'ws', 'wss', 'HTTPS']) {
    alone('page.js', `open('${scheme}://${ELSEWHERE}');\n`, SAID.host(ELSEWHERE));
  }
  const NO_HOSTS = ['127.0.0.1.example.org', '127.0.0.10:80', '127.0.0.1:4764x', 'localhost:4764'];
  NO_HOSTS.push(`127.0.0.1@${ELSEWHERE}`, `127.0.0.1:4764@${ELSEWHERE}`, 'www.w3.org');
  for (const host of NO_HOSTS) {
    alone('page.js', `// At http://${host}/2000/svg/more.\n`, SAID.host(host));
  }
  alone('page.js', '// At http://[::1]:4764/.\n', SAID.host('[::1'));
  alone('page.js', `const xlink = 'http://www.w3.org/1999/xlink';\n`, SAID.host('www.w3.org'));
  alone('page.js', `const svg = '${PICTURE}', at = "${PICTURE}";\n`);
  // KML's name, to the letter, and its near miss: another version of it is a host not to name.
  alone('kml/kml.js', `const head = '<kml xmlns="${KML}">';\n`);
  alone('page.js', `const kml = 'http://www.opengis.net/kml/2.3';\n`, SAID.host('www.opengis.net'));
  // The four names of frames, each to the letter, and their near miss: a frame the pad takes not.
  for (const frame of FRAMES) alone('new-plot/geojson.js', `const name = '${frame}';\n`);
  alone('page.js', `const lv95 = 'http://www.opengis.net/def/crs/EPSG/0/2056';\n`);
  const web = 'http://www.opengis.net/def/crs/EPSG/0/3857';
  alone('page.js', `const web = '${web}';\n`, SAID.host('www.opengis.net'));
  const [beside, behind] = [`${THREE[0]}.example.org`, `${THREE[0]}@${ELSEWHERE}`];
  alone('page.js', `open('https://${beside}/');\n`, SAID.host(beside), SAID.theirs);
  alone('page.js', `open('https://${behind}/');\n`, SAID.host(behind), SAID.theirs);
  // One of the three, or their name alone, in any file but the two - in other letters too; and
  // one of the two without one of the three.
  alone('a.check.js', `const host = '${THREE[2]}';\n`, SAID.theirs);
  alone('map/index.html', `<p>The map of ${THEIRS.toUpperCase()}</p>\n`, SAID.theirs);
  alone(
    NAMING[0],
    `export const HOSTS = ${JSON.stringify(THREE.slice(0, 2))};\n`,
    SAID.lacks(THREE[2]),
  );
  alone(NAMING[1], `const TYPED = ['${THREE[1]}'];\n`, SAID.lacks(THREE[0]), SAID.lacks(THREE[2]));
  // fetch( where no script asks: in a page, two folders deep in map/, in a folder map/ of another
  // folder, beside the door - and in a check it is no fault. And the four words, typed in here
  // once more, in whatever file.
  const NO_ASKING = ['page.js', 'map/index.html', 'map/tiles/map.js', 'swisstopo/reader.js'];
  for (const name of [...NO_ASKING, 'scene/map/map.js', 'remap/map.js']) {
    alone(name, 'const answer = await fetch (address);\n', SAID.asks);
  }
  for (const name of ['a.check.js', 'map/corners.js', 'map/map.check.js']) {
    alone(name, 'const answer = await fetch(address);\n');
  }
  alone('refetch.js', 'const refetch = (address) => prefetch(address);\n');
  for (const word of ['XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon']) {
    alone('a.check.js', `new ${word}(address);\n`, SAID.word(word));
    alone('map/map.js', `navigator.${word}(address, fetch(address));\n`, SAID.word(word));
  }
  alone('page.js', 'const sockets = new WebSocketsOfMine();\n');
  // And an address that begins with //, in a page and in a stylesheet - where a script may have
  // it, as the path that a check tries.
  const SLASHED = [
    '<img src="//host/a.png" />',
    "<a href='//host/'>",
    '<script src = //host/a.js>',
  ];
  for (const tag of SLASHED) alone('map/index.html', `${tag}\n`, SAID.slashes);
  for (const rule of ['url(//host/a.png)', 'url( "//host/a.css" )', "URL('//host/a.png')"]) {
    alone('pad.css', `a { background: ${rule}; }\n`, SAID.slashes);
  }
  alone('routes.check.js', "const tried = ['//index.html', 'src=\"//host/a.png\"'];\n");
  // After all of it the folder is as it was made, and nothing is amiss in it.
  assert.deepEqual(amiss(folder), []);
} finally {
  fs.rmSync(made, { recursive: true, force: true, maxRetries: 5 });
}

process.stdout.write(
  "tools/sketch/swisstopo: the pad's code names three hosts in one file and its check, and no other; a fourth host, one of the three elsewhere and a script that asks where none may are each said by name\n",
);
