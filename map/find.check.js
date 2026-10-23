// The check of Find (ST-031): the first half of find.js - what it asks of the search and what it
// says of the answers, with nothing of the page in it - loaded with a `fetch` of the check's own,
// which writes down what is asked and asks the stand-in itself: stand-in.js as a process of its
// own, on a port that the operating system picked, asked by node:http over 127.0.0.1, as
// open-plot.check.js asks its server. The four made-up places come as three, each by its name as
// text and its place in LV95; each word that fails is said in its sentence, to the letter; one
// search is one request, at the address that searchAddress builds, with no cookie and no
// referrer asked for, and no second is asked while one is; then answers that the check makes up
// itself - figures the wrong way round, places beside the sheet, more than an answer may hold,
// what is no list, a failure with long words, a body that breaks off, no answer at all - and the
// rule for a service's words, by hand; and the clock, on a server of the check's own that never
// answers. Of the script, the text: it asks in one place, and hears the form when it is sent and
// at no key. The form and the list are a browser test's, tests/e2e/sketch-map-find.spec.ts.
// Nobody but the stand-in and that server is asked. Run by check.js.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import { createServer, request } from 'node:http';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { PLACES_MOST, SEARCH_MAX, SHEET, searchAddress } from '../swisstopo/hosts.js';

const HERE = import.meta.dirname;
const HOST = '127.0.0.1';
// What Find says, typed in, to the letter.
const TYPE = 'Type an address or a place, and press Enter.';
const LONG = 'A search has 80 characters at the most.';
const THREE = '3 places. Pick one, and the map goes there.';
const NOT_COME = "The search did not come: swisstopo's search";
const SILENT = `${NOT_COME} does not answer.`;
const UNREAD = `${NOT_COME} answered what cannot be read.`;
// How a search is asked: with no cookie, and with no word of where it came from.
const HOW = { credentials: 'omit', referrerPolicy: 'no-referrer' };
const nothing = (said) => ({ places: [], said });

// The stand-in as a process of its own, on a port that the system picks: it says its address.
const standIn = spawn(process.execPath, [path.join(HERE, '..', 'swisstopo', 'stand-in.js')], {
  env: { ...process.env, PORT: '' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
// However this check ends, nothing it started outlives it.
process.once('exit', () => standIn.kill());
const soon = { signal: globalThis.AbortSignal.timeout(20_000) };
const [line] = await once(standIn.stdout, 'data', soon);
const origin =
  /^The stand-in for swisstopo: (\S+) - /.exec(`${line}`)?.[1] ?? assert.fail(`${line}`);
const port = Number(origin.slice(`http://${HOST}:`.length));
assert.equal(origin, `http://${HOST}:${port}`);

// The stand-in, asked at an address of its own origin, as a page's `fetch` answers: its status,
// and its body as text once that is asked for.
async function ask(address) {
  assert.ok(address.startsWith(`${origin}/`), address);
  const how = { host: HOST, port, path: address.slice(origin.length), agent: false };
  const [answer] = await once(request(how).end(), 'response');
  const body = Buffer.concat(await Array.fromAsync(answer));
  return { status: answer.statusCode, text: () => Promise.resolve(`${body}`) };
}
// An answer that the check makes up itself: a status, and a body as text - or one that breaks off.
const made = (status, body) => ({
  status,
  text: () => (body === null ? Promise.reject(new Error('cut off')) : Promise.resolve(body)),
});
// What the script asks is written down, and answered by the stand-in - until a case answers it.
// Every search comes with a clock - one without fails here - which whoever answers is handed.
const asked = [];
let answering = ask;
const machines = globalThis.fetch;
const clocked = (signal) => signal instanceof globalThis.AbortSignal;
globalThis.fetch = (address, { signal, ...how }) =>
  asked.push([address, how]) && clocked(signal) && answering(address, signal);
const { FIND_MS, NAME_SHOWN, placesOf, search, wordsOf } = await import('./find.js');
assert.deepEqual([NAME_SHOWN, SEARCH_MAX, PLACES_MOST, FIND_MS], [120, 80, 10, 20_000]);

try {
  // The four made-up places come as three: the first by its name without its tags; the second as
  // its words, and nothing of the tag that would run a script; the third cut to 120 characters,
  // with the sign after them; the fourth, which lies off the map, left out. Each at its place -
  // `y` the easting and `x` the northing. And it was one request, at the address of its words.
  const CUT = `Made-up place with a long name${' long'.repeat(18)}…`;
  assert.equal(Array.from(CUT).length, 121);
  const PLACES = [
    { name: 'Made-up lane 1 0000 Madeupville', e: 2_600_020, n: 1_200_010 },
    { name: 'Made-up square 0000 Madeupville', e: 2_600_038, n: 1_200_034 },
    { name: CUT, e: 2_600_300, n: 1_200_300 },
  ];
  assert.deepEqual(await search(origin, 'lane'), { places: PLACES, said: THREE });
  const LANE = `${origin}/rest/services/api/SearchServer?searchText=lane&type=locations&sr=2056&limit=10`;
  assert.deepEqual(asked.splice(0), [[LANE, HOW]]);
  assert.equal(searchAddress(origin, 'lane'), LANE);
  // What is typed is asked for without the blanks at its ends, in one value of the query.
  assert.equal((await search(origin, '  lane 1 & more\t')).said, THREE);
  assert.deepEqual(asked.splice(0), [[searchAddress(origin, 'lane 1 & more'), HOW]]);

  // Each word that fails, in its sentence: nothing found, a failure with what the service said -
  // without its tags - and an answer that is no JSON.
  const FAILED = `${NOT_COME} answered 500. It said: A made-up failure of the search with markup`;
  const fails = { nowhere: 'Nothing was found for "nowhere".', fails: FAILED, garbage: UNREAD };
  for (const [words, said] of Object.entries(fails)) {
    assert.deepEqual(await search(origin, ` ${words} `), nothing(said), words);
    assert.deepEqual(asked.splice(0), [[searchAddress(origin, words), HOW]]);
  }
  // No words, and too many: said, and nothing asked. Eighty are asked.
  for (const none of ['', '   ', '\t\n'])
    assert.deepEqual(await search(origin, none), nothing(TYPE));
  assert.deepEqual(await search(origin, 'a'.repeat(81)), nothing(LONG));
  assert.deepEqual(asked, []);
  assert.equal((await search(origin, ` ${'a'.repeat(80)} `)).said, THREE);
  assert.deepEqual(asked.splice(0), [[searchAddress(origin, 'a'.repeat(80)), HOW]]);
  // Half a sign of two halves is no word that an address holds: nothing is asked.
  assert.deepEqual(await search(origin, String.fromCharCode(0xd83d)), nothing(TYPE));
  assert.deepEqual(asked, []);

  // No second search while one is asked: nothing is asked and nothing said, whatever is typed -
  // and once the first is answered, the next is asked.
  const [first, second, third] = ['lane', 'square', ''].map((words) => search(origin, words));
  assert.deepEqual([await second, await third], [null, null]);
  assert.equal((await first).said, THREE);
  assert.deepEqual(asked.splice(0), [[LANE, HOW]]);
  assert.equal((await search(origin, 'square')).said, THREE);
  assert.deepEqual(asked.splice(0), [[searchAddress(origin, 'square'), HOW]]);
  // And the stand-in was asked what the script asked, each once, and nothing else.
  const heard = JSON.parse(await (await ask(`${origin}/asked`)).text());
  const SEARCHED = ['lane', 'lane 1 & more', 'nowhere', 'fails', 'garbage', 'a'.repeat(80)];
  const targets = [...SEARCHED, 'lane', 'square'].map((words) => searchAddress(origin, words));
  assert.deepEqual(
    heard.map(({ target }) => `${origin}${target}`),
    targets,
  );

  // From here on the check answers. A place is its name and two numbers on the sheet of the map:
  // told the wrong way round - the northing as `y` - it is left out; so is one a metre beside
  // the sheet, one whose figures are no numbers, and one with no name. On the sheet's edge it is
  // a place.
  const result = (label, y, x) => ({ attrs: { label, x, y }, id: 1, weight: 7 });
  const answers = (...results) => {
    answering = () => Promise.resolve(made(200, JSON.stringify({ results })));
    return search(origin, 'made up');
  };
  const NONE = nothing('Nothing was found for "made up".');
  assert.deepEqual(await answers(result('Swapped', 1_200_010, 2_600_020)), NONE);
  const { west, east, south, north } = SHEET;
  const BESIDE = [
    [west - 1, south],
    [east + 1, north],
    [west, south - 1],
    [east, north + 1],
    ['2600020', 1_200_010],
    [2_600_020, null],
    [Number.NaN, 1_200_010],
  ];
  for (const [e, n] of BESIDE) assert.deepEqual(await answers(result('Beside', e, n)), NONE);
  for (const label of ['', ' \t ', '<b></b>', 7, null, undefined]) {
    assert.deepEqual(await answers(result(label, 2_600_020, 1_200_010)), NONE, `${label}`);
  }
  for (const no of [null, 7, 'place', [], { attrs: null }, { attrs: 'place' }]) {
    assert.deepEqual(await answers(no), NONE, JSON.stringify(no));
  }
  const corners = await answers(
    result('South-west', west, south),
    result('North-east', east, north),
  );
  assert.deepEqual(corners, {
    places: [
      { name: 'South-west', e: west, n: south },
      { name: 'North-east', e: east, n: north },
    ],
    said: '2 places. Pick one, and the map goes there.',
  });
  // One place is one place; and of twelve an answer holds ten, the first ten that are places.
  const one = await answers(result('Off', 0, 0), result('<i>Only</i> one', 2_600_000, 1_200_000));
  const ONLY = { name: 'Only one', e: 2_600_000, n: 1_200_000 };
  assert.deepEqual(one, { places: [ONLY], said: '1 place. Pick one, and the map goes there.' });
  const twelve = Array.from({ length: 12 }, (_, at) =>
    result(`Place ${at}`, 2_600_000 + at, north),
  );
  twelve.splice(3, 0, result('Off the map', 0, 0));
  const ten = await answers(...twelve);
  assert.equal(ten.said, '10 places. Pick one, and the map goes there.');
  assert.deepEqual(
    ten.places.map(({ name }) => name),
    Array.from({ length: 10 }, (_, at) => `Place ${at}`),
  );
  // An answer that holds no list of places cannot be read - and neither can one that breaks off.
  for (const body of [
    '{}',
    '{"results":{}}',
    '{"results":"none"}',
    'null',
    '[]',
    '7',
    '',
    '{',
    null,
  ]) {
    answering = () => Promise.resolve(made(200, body));
    assert.deepEqual(await search(origin, 'made up'), nothing(UNREAD), `${body}`);
    assert.deepEqual(placesOf(body ?? 'cut off'), null, `${body}`);
  }
  // A status that is not 200 is said with the service's words: without their tags, blanks made
  // one, and cut to 200 characters - or alone, where the service said nothing.
  const refusal = async (status, body) => {
    answering = () => Promise.resolve(made(status, body));
    return (await search(origin, 'made up')).said;
  };
  const LONG_WORDS = `<html><body>\n  <h1>Too  many\trequests</h1>${' slow down'.repeat(40)}</body></html>`;
  const SHOWN = `Too many requests${' slow down'.repeat(40)}`.slice(0, 200);
  assert.equal(await refusal(429, LONG_WORDS), `${NOT_COME} answered 429. It said: ${SHOWN}…`);
  assert.equal(
    await refusal(404, 'No such <b>service</b>.'),
    `${NOT_COME} answered 404. It said: No such service.`,
  );
  for (const body of ['', ' \n ', '<p></p>', null]) {
    assert.equal(await refusal(503, body), `${NOT_COME} answered 503.`, `${body}`);
  }
  // And a status that is not 200 holds no places, whatever its body lists.
  const listed = JSON.stringify({ results: [result('A', west, south)] });
  assert.equal(await refusal(201, listed), `${NOT_COME} answered 201. It said: ${listed}`);
  // No answer at all: the service does not answer - made up, and then with the stand-in stopped.
  answering = () => Promise.reject(new TypeError('Failed to fetch'));
  assert.deepEqual(await search(origin, 'lane'), nothing(SILENT));
  await Promise.all([once(standIn, 'close'), standIn.kill()]);
  answering = ask;
  assert.deepEqual(await search(origin, 'lane'), nothing(SILENT));
  // After a search that failed the next one is asked: nothing holds Find back.
  const twice = [LANE, LANE].map((address) => [address, HOW]);
  assert.deepEqual(asked.slice(-2), twice);
  // The clock. A server of the check's own hears a search and never answers it - or, asked for
  // `half`, answers a status and half a body, and no more. The machine's own `fetch` asks it, as
  // a page's does, with the clock handed over short: at its end the search does not answer, the
  // request itself was given up - the server sees its client go - and Find takes the next.
  let went = null;
  const mute = createServer((sent, given) => {
    given.once('close', () => went(sent.url));
    if (sent.url.includes('half')) given.writeHead(200).write('{"results":[');
  });
  await once(mute.listen(0, HOST), 'listening');
  const silent = `http://${HOST}:${mute.address().port}`;
  answering = (address, signal) => machines(address, { signal });
  for (const words of ['never', 'half']) {
    const gone = new Promise((left) => (went = left));
    const late = globalThis.AbortSignal.timeout(3000);
    assert.deepEqual([await search(silent, words, 60), late.aborted], [nothing(SILENT), false]);
    const [left] = await Promise.race([Promise.all([gone]), once(late, 'abort')]);
    assert.equal(`${silent}${left}`, searchAddress(silent, words), `${words}: not given up`);
  }
  answering = () => Promise.resolve(made(200, '{"results":[]}'));
  assert.deepEqual(await search(silent, 'next'), nothing('Nothing was found for "next".'));
  await Promise.all([once(mute, 'close'), mute.close(), mute.closeAllConnections()]);

  // The rule for a service's words, by hand. A tag is what opens and closes with nothing opening
  // in between, and goes; what opens and never closes is no tag, and stays among the words.
  assert.equal(wordsOf('Sidlerstrasse 5 <b>3012 Bern</b>', 120), 'Sidlerstrasse 5 3012 Bern');
  assert.equal(wordsOf('1 < 2 <i class="a">and</i> 3 > 2', 120), '1 < 2 and 3 > 2');
  assert.equal(wordsOf('Zü<b>rich</b><br/>', 120), 'Zürich');
  // Read in one pass, the words may hold a tag once their tags are out: so a page shows them as
  // text, whatever they hold - the rule takes out what would be read, and makes nothing safe.
  assert.equal(wordsOf('<<b></b>img src="x">Made-up', 120), '<img src="x">Made-up');
  // Blanks that follow each other are one, whatever kind they are, and none stands at an end; a
  // sign that a line cannot show is a blank; and one that takes no room is left out - the signs
  // that turn a line round among them. Each is named by its number here, never typed.
  const sign = (...codes) => String.fromCodePoint(...codes);
  assert.equal(wordsOf(` a \t\r\n b${sign(0xa0, 0x2003)}c `, 120), 'a b c');
  assert.equal(wordsOf(`a${sign(0)}b${sign(7, 0x1b)}c${sign(0x7f)}`, 120), 'a b c');
  assert.equal(wordsOf(`a${sign(0x200b)}b${sign(0x202e, 0xad, 0xfeff)}c`, 120), 'abc');
  // Cut to so many characters, whole ones, with the sign after them - and not cut where they
  // have room. A character of two halves is one: it is shown whole or not at all.
  assert.equal(wordsOf('abcdef', 3), 'abc…');
  assert.equal(wordsOf('abc', 3), 'abc');
  const face = sign(0x1f600);
  assert.equal(face.length, 2);
  assert.equal(wordsOf(face.repeat(3), 2), `${face}${face}…`);
  assert.equal(wordsOf(face.repeat(2), 2), `${face}${face}`);
  // And the words are read in one pass: 200 000 signs that each open a tag and never close it
  // take a moment, where a pattern that reads on from each to the end takes half a minute.
  const began = performance.now();
  assert.equal(wordsOf('<'.repeat(200_000), 3), '<<<…');
  assert.ok(performance.now() - began < 2000, `${performance.now() - began} ms`);

  // Of the script, the text: it asks in one place - the form's search with the clock that no
  // caller hands over, all of FIND_MS; and it hears a click on a place and the form when it is
  // sent, and nothing else - no key, and no word as it is typed.
  const text = fs.readFileSync(path.join(HERE, 'find.js'), 'utf8');
  assert.equal(text.match(/\bfetch\s*\(/g).length, 1);
  assert.ok(text.includes('search(origin, typed, ms = FIND_MS)'));
  assert.ok(text.includes('await search(origin, field.value);'));
  const hears = Array.from(text.matchAll(/addEventListener\(\s*'(\w+)'/g), ([, what]) => what);
  assert.deepEqual(hears, ['click', 'submit']);
  assert.ok(!/\bon(input|key|change)\w*\b/i.test(text));
} finally {
  standIn.kill();
}

process.stdout.write(
  'tools/sketch/map: Find by hand - the made-up places by their names as text, each word that fails in its sentence, one request a search and no second while one is asked, a search that never comes given up when its clock ends, and the rule for the words of a service\n',
);
