// The check of TIFF's LZW, undone (ST-031): lzw.js on things nobody here wrote - the example of
// the TIFF specification, packed by hand below, and two blocks that libtiff packed - and, through
// those blocks, the packer of made-up-tile.js, which writes the same bytes as libtiff and so
// stands in for it in the checks of the tiles. Every case of the parked product's lzw.test.ts,
// packages/adapters/src/geodata/terrain/, under the title it has there, on the same bytes and
// with the same figures: fifteen. The packer is `encodeLzw` there, and `packLzw` here. And three
// cases of the pad's own: before them, the three fixtures of this folder are the bytes that
// they were copied as - the two blocks, and the head of a real tile, which tiff.check.js and
// made-up-tile.check.js read; and among them, the code after the one that is being made, and
// a block whose codes fill their last byte. Nothing runs and nothing is asked. Run by check.js,
// as every check is.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { decodeLzw } from './lzw.js';
import { packLzw } from './made-up-tile.js';

// A case, under its title: where one fails, the title says which.
let cases = 0;
function it(title, run) {
  cases += 1;
  try {
    run();
  } catch (error) {
    throw new Error(`${title}: ${error.message}`, { cause: error });
  }
}
/** That a call refuses in these words, to the letter. */
const refuses = (call, reason) =>
  assert.throws(call, { name: 'Error', message: `Not a block of LZW as TIFF has it: ${reason}` });

/**
 * The bytes libtiff was given to pack, by hand, on 2026-10-06 - libtiff 4.6.0 through Pillow
 * 11.0.0, as one strip of an 8-bit image, 128 by 48. A rule makes them up: 5632 bytes of noise,
 * each the third byte of a number that is multiplied by 1103515245 and has 12345 added, starting
 * from 1 and kept to 32 bits; then the letter A, 512 times. The noise fills the table of codes
 * so that it has to be emptied once, at every width of a code from 9 bits to 12; the run of one
 * letter is packed into codes that are used the moment they are made.
 */
function noiseAndRun() {
  const bytes = new Uint8Array(5632 + 512).fill(0x41);
  let state = 1;
  for (let index = 0; index < 5632; index += 1) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    bytes[index] = (state >>> 16) & 0xff;
  }
  return bytes;
}

/**
 * And a second block of the same day's: the bytes 0 to 253, one after the other, as one row of
 * 254. No two neighbours come twice, so every byte is a code of its own - 254 of them, which is
 * where a code grows from nine bits to ten: the code for the end is the block's first of ten.
 */
const ramp = () => Uint8Array.from({ length: 254 }, (_, index) => index);

// The fixtures: three files, copies of the parked product's, each by its length and its SHA-256.
// What else lies in their folder is not held here: the catalogue's two answers are T-031.4's.
const FIXTURES = path.join(import.meta.dirname, '__fixtures__');
const HELD = [
  [
    'libtiff/noise-and-run.lzw',
    7628,
    '909ce0d8f886fe9cb05504799b9ea759ddf6853ed5f8eec2bdd04252fabc3f1c',
  ],
  ['libtiff/ramp.lzw', 289, '3a1c2c66e5802cc9556b203c2b64b7d3b5a1ea5850aba4243340bb433c2ed4ab'],
  [
    'real/head-2600-1200.tif',
    4512,
    '71ccbdc8ba154daeec7670ffdfa3e0317dc1d2849c82a182a7a08c4f0393dc96',
  ],
];
const fixture = (name) => new Uint8Array(fs.readFileSync(path.join(FIXTURES, name)));
it('holds each fixture to its length and its SHA-256', () => {
  for (const [name, length, sha256] of HELD) {
    const hash = createHash('sha256').update(fixture(name)).digest('hex');
    assert.deepEqual([name, fixture(name).length, hash], [name, length, sha256]);
  }
});

/** What libtiff packed them into, 7628 bytes and 289, kept as it wrote them. */
const packedByLibtiff = (name = 'noise-and-run') => fixture(`libtiff/${name}.lzw`);

/** The same bytes, said as yes or no: a case of thousands of bytes fails at once, not in a list. */
const same = (bytes, others) => Buffer.compare(bytes, others) === 0;

/**
 * Codes written out as a block, for a block that no packer would write: from the highest bit
 * down, nine bits wide, and a bit wider from the code on that a reader's table calls for it.
 */
function written(codes) {
  let bits = '';
  let width = 9;
  let made = 258;
  let first = true;
  for (const code of codes) {
    bits += code.toString(2).padStart(width, '0');
    if (code === 256) [width, made, first] = [9, 258, true];
    else if (first) first = false;
    else if ((made += 1) === (1 << width) - 1 && width < 12) width += 1;
  }
  const bytes = bits.match(/.{1,8}/g) ?? [];
  return Uint8Array.from(bytes, (byte) => Number.parseInt(byte.padEnd(8, '0'), 2));
}

/**
 * The example of TIFF 6.0, section 13: the bytes 7 7 7 8 8 7 7 6 6 are the codes
 * 256 7 258 8 8 258 6 6 257 - empty the table, 7, "7 7" as the first code made, 8, 8, "7 7"
 * again, 6, 6, the end. Nine bits each, from the highest bit down:
 *
 *   100000000 000000111 100000010 000001000 000001000 100000010 000000110 000000110 100000001
 *
 * and cut into bytes, the last one filled up with zeros:
 *
 *   10000000 00000001 11100000 01000000 10000000 01000100 00001000 00001100 00000110
 *   10000000 10000000
 */
const SPECIFICATION = Uint8Array.of(
  0x80,
  0x01,
  0xe0,
  0x40,
  0x80,
  0x44,
  0x08,
  0x0c,
  0x06,
  0x80,
  0x80,
);
const SPECIFICATION_SAYS = Uint8Array.of(7, 7, 7, 8, 8, 7, 7, 6, 6);

// decodeLzw.
it('reads the example of the TIFF specification', () => {
  assert.deepEqual(decodeLzw(SPECIFICATION, 9), SPECIFICATION_SAYS);
  // And the helper of this file writes those codes as the hand did.
  assert.deepEqual(written([256, 7, 258, 8, 8, 258, 6, 6, 257]), SPECIFICATION);
});

it('reads what libtiff packed: every width of a code, and a table that was emptied', () => {
  const packed = packedByLibtiff();
  assert.equal(packed.length, 7628);
  assert.equal(same(decodeLzw(packed, 6144), noiseAndRun()), true);
});

it('reads what libtiff packed where the code for the end is the first of ten bits', () => {
  // 9 bits to empty the table, 254 codes of 9 bits, 10 bits for the end: 2305 bits, 289 bytes.
  const packed = packedByLibtiff('ramp');
  assert.equal(packed.length, 289);
  assert.deepEqual(decodeLzw(packed, 254), ramp());
});

it('reads a code that is used the moment it is made', () => {
  // "A A A A A A": empty the table, A, then 258 - which is "A A", and is made by this very
  // code - then 259, "A A A", made the same way, and the end.
  const sixTimesA = new Uint8Array(6).fill(0x41);
  assert.deepEqual(decodeLzw(written([256, 0x41, 258, 259, 257]), 6), sixTimesA);
});

it('reads a block of cells back: 128 by 128 floats, as a tile has them', () => {
  const heights = (_, index) => 500 + (index % 128) / 4 + index / 4096;
  const bytes = new Uint8Array(new Float32Array(128 * 128).map(heights).buffer);
  assert.equal(same(decodeLzw(packLzw(bytes), bytes.length), bytes), true);
  // A flat block is the same four bytes 16 384 times, and packs to under a fiftieth of its size.
  const flat = new Uint8Array(new Float32Array(128 * 128).fill(520).buffer);
  assert.ok(packLzw(flat).length < flat.length / 50);
  assert.equal(same(decodeLzw(packLzw(flat), flat.length), flat), true);
  assert.deepEqual(decodeLzw(packLzw(new Uint8Array()), 0), new Uint8Array());
});

const cutOff = 'it stops after 5 of 9 bytes, without the code for its end';
const empty = 'it stops after 0 of 4 bytes, without the code for its end';
const REFUSED = [
  ['is cut off', SPECIFICATION.subarray(0, 6), 9, cutOff],
  ['ends too early', SPECIFICATION, 10, 'it ends after 9 of 10 bytes'],
  ['runs on too long', SPECIFICATION, 8, 'it holds more than the 8 bytes of a block'],
  ['is empty', new Uint8Array(), 4, empty],
  [
    'uses a code it never made',
    written([256, 7, 300, 257]),
    9,
    'code 300 is used before it was made, at code 258',
  ],
  [
    'begins with a code that is no byte',
    written([256, 258, 257]),
    2,
    'code 258 comes first, where only a byte can',
  ],
];
for (const [what, packed, byteCount, reason] of REFUSED) {
  it(`refuses a block that ${what}`, () => refuses(() => decodeLzw(packed, byteCount), reason));
}

it('refuses a block that makes more codes than twelve bits can name', () => {
  // 3839 times the byte 0 and never a new table: every code but the first makes one, and the
  // 3838 codes from 258 to 4095 are all there are. The last zero would make the 3839th.
  const zeros = (count) => new Array(count).fill(0);
  assert.deepEqual(decodeLzw(written([256, ...zeros(3839), 257]), 3839), new Uint8Array(3839));
  refuses(
    () => decodeLzw(written([256, ...zeros(3840), 257]), 3840),
    'it makes more than 4096 codes without a new table',
  );
});

// And a case that the parked product has not: with the modules broken one thing at a time, a
// reader that took one code more than was made passed all of the cases above.
it('refuses the code after the one that it is about to make', () => {
  // After 256 and 7 the reader is about to make 258: 258 itself is "7 7", and 259 is nothing yet.
  assert.deepEqual(decodeLzw(written([256, 7, 258, 257]), 3), Uint8Array.of(7, 7, 7));
  const one = () => decodeLzw(written([256, 7, 259, 257]), 3);
  refuses(one, 'code 259 is used before it was made, at code 258');
});

// packLzw, the packer of the made-up tiles.
it('writes the example of the TIFF specification as the specification does', () => {
  assert.deepEqual(packLzw(SPECIFICATION_SAYS), SPECIFICATION);
});

it('writes, byte for byte, what libtiff wrote for the same bytes', () => {
  assert.equal(same(packLzw(noiseAndRun()), packedByLibtiff()), true);
});

it('counts the last code too, as libtiff does: the end is written a bit wider after it', () => {
  assert.deepEqual(packLzw(ramp()), packedByLibtiff('ramp'));
  // One byte fewer, and the end is still nine bits wide: 255 codes of 9 bits, 2295, in 287 bytes.
  assert.equal(packLzw(ramp().subarray(0, 253)).length, 287);
  assert.deepEqual(decodeLzw(packLzw(ramp().subarray(0, 253)), 253), ramp().subarray(0, 253));
});

// And a case that the parked product has not: a packer that wrote a byte more passed the above.
it('writes no byte after the code for the end where the codes fill their last byte', () => {
  // Six bytes of which none comes twice are eight codes of nine bits: nine bytes, and no tenth.
  const packed = packLzw(Uint8Array.of(1, 2, 3, 4, 5, 6));
  assert.deepEqual(packed, written([256, 1, 2, 3, 4, 5, 6, 257]));
  assert.equal(packed.length, 9);
});

assert.equal(cases, 18);
process.stdout.write(
  `tools/sketch/swisstopo: the three fixtures are the bytes they were copied as; TIFF's LZW is undone to the byte - the specification's example, two blocks that libtiff packed, a block of heights - a block that is none is refused in its words, and the packer writes libtiff's very bytes: ${cases} cases\n`,
);
