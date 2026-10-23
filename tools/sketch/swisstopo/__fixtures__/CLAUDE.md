# tools/sketch/swisstopo/__fixtures__

Three files that the checks of the pad's reader of a tile of swissALTI3D read (ST-031, T-031.2),
and this note. Each is **a copy, byte for byte, of the parked product's**, in
`packages/adapters/src/geodata/terrain/__fixtures__/` under the same name. None is ground of
anywhere: two hold bytes that a rule makes up, and the third holds what a real tile states of
itself, and no cell. What a later task puts beside them — the catalogue's answers, T-031.4 — is
that task's to say.

## What lies here

| The file | Bytes | SHA-256 |
| --- | --- | --- |
| `libtiff/noise-and-run.lzw` | 7628 | `909ce0d8f886fe9cb05504799b9ea759ddf6853ed5f8eec2bdd04252fabc3f1c` |
| `libtiff/ramp.lzw` | 289 | `3a1c2c66e5802cc9556b203c2b64b7d3b5a1ea5850aba4243340bb433c2ed4ab` |
| `real/head-2600-1200.tif` | 4512 | `71ccbdc8ba154daeec7670ffdfa3e0317dc1d2849c82a182a7a08c4f0393dc96` |

- `libtiff/noise-and-run.lzw` and `libtiff/ramp.lzw` — two blocks of TIFF's LZW that **libtiff
  packed**: libtiff 4.6.0 through Pillow 11.0.0, by hand, on 2026-10-06, each as one strip of an
  8-bit image. What it was given to pack is made up by a rule, which stands in `../lzw.check.js`
  as it stands in the parked `lzw.test.ts`. The first: 5632 bytes of noise — each the third byte
  of a number that is multiplied by 1103515245 and has 12345 added, starting from 1 and kept to 32
  bits — and then the letter A, 512 times, as a strip of 128 by 48. The noise fills the table of
  codes so that it has to be emptied once, at every width of a code from 9 bits to 12; the run of
  one letter is packed into codes that are used the moment they are made. The second: the bytes 0
  to 253, one after the other, as one row of 254 — where the code for the end is the block's
  first of ten bits. They are what the reader, `decodeLzw`, is proved on, and what the packer of
  the made-up tiles, `packLzw`, is held to: it writes these very bytes.
- `real/head-2600-1200.tif` — **the first 4512 of the 15 969 669 bytes of one real tile** of
  swissALTI3D: the tile north-east of the origin of the Swiss grid in Bern, E 2 600 000 /
  N 1 200 000, in its state of 2025, recorded on 2026-10-06 by a request for that part of its
  file. It is the whole of the tile's four directories — of its image, 2000 by 2000 cells, and of
  the three smaller copies of it — and **holds no cell**: the first block of the file begins at
  byte 4512, and of the heights it states the statistics of the whole tile alone — the lowest,
  the highest, the mean and how far they spread. It is here to show what a real tile states of
  itself. © swisstopo.

## Invariants

1. **Nothing here is ever reformatted, and nothing is changed.** `.gitattributes` keeps what lies
   under a `__fixtures__/` folder byte for byte, the formatter and the linter leave it alone, and
   `../lzw.check.js` holds each of the three files to its length and its SHA-256. It does not
   hold what else lies in the folder: a file that is added wants a check to hold it.
2. **No tile lies here.** The made-up tiles that the checks and the stand-in read are written in
   memory, by `madeUpTile` of `../made-up-tile.js`. The parked product keeps four recorded tiles
   beside its copies of these files; they were not copied — `../made-up-tile.check.js` holds the
   pad's writer to each of them by its length and its SHA-256.
3. Nothing of a plot of the owner's, and nothing that a service sent for one: the origin of the
   Swiss grid is where the federal services were asked, by hand, and nowhere else.

## Test

`pnpm sketch:check` — `../lzw.check.js` holds the three files, and reads the two blocks;
`../tiff.check.js` and `../made-up-tile.check.js` read the head.
