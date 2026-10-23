// The compression of a swissALTI3D tile, undone (ST-031): LZW as TIFF 6.0 defines it in section
// 13, and as libtiff writes it. Nothing here knows of heights or of tiles: bytes in, bytes out.
// It is the parked product's reader, packages/adapters/src/geodata/terrain/lzw.ts, written anew
// as the pad's - a module that imports nothing - with its refusals to the word. lzw.check.js
// proves it on what nobody here wrote: the specification's example, and two blocks that libtiff
// packed.

// The code that empties the table, and the code that ends a block: the two that TIFF sets aside
// after the 256 codes that are bytes.
const CLEAR = 256;
const END = 257;
// The first code a block makes up itself, and how many codes there can be: twelve bits' worth.
const FIRST_OWN_CODE = 258;
const CODES = 4096;
// A code is written with nine bits at first - eight would not hold the two above - and with
// twelve at most.
const NARROWEST_BITS = 9;
const WIDEST_BITS = 12;

function refuse(reason) {
  throw new Error(`Not a block of LZW as TIFF has it: ${reason}`);
}

/**
 * The bytes a block of TIFF's LZW stands for - exactly `byteCount` of them, or an error that says
 * what was found instead. Codes are packed from the highest bit down, and a code grows by a bit
 * one code earlier than the table would need it to, as the specification has it. The block has
 * to end with the code for its end: a block that stops short, runs over, or names a code it
 * never made is refused, never filled up or cut.
 */
export function decodeLzw(packed, byteCount) {
  const bytes = new Uint8Array(byteCount);
  // A code stands for a run of bytes: the run of another code, and one byte after it.
  const before = new Uint16Array(CODES);
  const lastByte = new Uint8Array(CODES);
  const firstByte = new Uint8Array(CODES);
  const runLength = new Uint16Array(CODES);
  for (let code = 0; code < CLEAR; code += 1) {
    lastByte[code] = code;
    firstByte[code] = code;
    runLength[code] = 1;
  }

  let nextCode = FIRST_OWN_CODE;
  let bits = NARROWEST_BITS;
  // The code read before this one - none at the start, and none after the table was emptied.
  let previous;
  let written = 0;
  let held = 0;
  let heldBits = 0;
  let at = 0;

  for (;;) {
    while (heldBits < bits) {
      const byte = packed[at];
      if (byte === undefined) {
        refuse(`it stops after ${written} of ${byteCount} bytes, without the code for its end`);
      }
      held = (held << 8) | byte;
      heldBits += 8;
      at += 1;
    }
    heldBits -= bits;
    const code = held >>> heldBits;
    held &= (1 << heldBits) - 1;

    if (code === END) break;
    if (code === CLEAR) {
      nextCode = FIRST_OWN_CODE;
      bits = NARROWEST_BITS;
      previous = undefined;
      continue;
    }
    if (previous === undefined) {
      // The first code of a table can only be a byte: there is no run to stand for yet.
      if (code > 255) refuse(`code ${code} comes first, where only a byte can`);
    } else {
      if (code > nextCode) refuse(`code ${code} is used before it was made, at code ${nextCode}`);
      if (nextCode === CODES) refuse(`it makes more than ${CODES} codes without a new table`);
      // The new code: the run before, and the first byte of this one. Where this code is the new
      // one itself, its first byte is the run before's - which the line above has just written.
      before[nextCode] = previous;
      firstByte[nextCode] = firstByte[previous];
      lastByte[nextCode] = firstByte[code];
      runLength[nextCode] = runLength[previous] + 1;
      nextCode += 1;
      if (nextCode === (1 << bits) - 1 && bits < WIDEST_BITS) bits += 1;
    }

    const length = runLength[code];
    if (written + length > byteCount) {
      refuse(`it holds more than the ${byteCount} bytes of a block`);
    }
    for (let from = code, to = written + length - 1; to >= written; to -= 1) {
      bytes[to] = lastByte[from];
      from = before[from];
    }
    written += length;
    previous = code;
  }

  if (written !== byteCount) refuse(`it ends after ${written} of ${byteCount} bytes`);
  return bytes;
}
