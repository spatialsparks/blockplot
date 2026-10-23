# What Blockplot asks, and of whom

Blockplot keeps nothing of yours on any server. It has no account and sets no cookie, counts
nobody and shows no advert. This page says every machine its pages ask, what they ask it for,
and what that machine can see.

## The pages ask where they came from, and nobody else

The pad's pages ask the address they were served from, for their own files — pages, scripts,
styles and three.js — and nobody else. The 3D page and the Info page ask nobody at all beyond
their own files: what the 3D page saves, it writes in the page and hands to your browser.

## New plot asks swisstopo

**File, New plot** alone asks another machine: swisstopo, the Federal Office of Topography, from
the moment its page is opened. It asks three hosts of swisstopo's, and no fourth:

| Host | Asked for |
| --- | --- |
| `wmts.geo.admin.ch` | the pictures of the map: the national map, the aerial photo |
| `api3.geo.admin.ch` | a place you search for, by the words you type into Find |
| `data.geo.admin.ch` | the ground under a plot when you make it, from swisstopo's height model, swissALTI3D |

What that lets swisstopo see:

- which part of the map you look at, and how near;
- the words you search for;
- where the plot lies, from the ground asked for under it — but not its name, which is never
  sent.

Every request goes without a cookie and without a referrer. It carries what any request on the
web carries: its address, the browser's own `Origin` — the address the pad was opened at, with
no path — and, as every server sees, the internet address of your connection. The pad
keeps nothing of the map: no picture is stored by it, and none is sent on.

## What you draw never leaves your browser

A plot and its sketches are kept on your computer, and nothing of them is sent anywhere:

- in **the browser's own store** — its IndexedDB, local storage and session storage — on that
  computer, for that browser, until the browser itself clears them;
- or, where you opened a plot as a folder, in **that folder**, which the browser writes into on
  the pad's behalf: the sketches you keep go into its `sketches/` folder.

**Save file**, **Picture (PNG)**, **3D file (GLB)** and the Google Earth file are written in the
page and handed to your browser to save. No page sends them anywhere.

## The web host

GitHub Pages serves the pad at https://spatialsparks.github.io/blockplot/. Like any web host it
sees that its files are asked for, by which internet address and browser, and when.
[GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
says what it keeps of that.

## On your own computer

Run with `pnpm sketch`, the pad is served on 127.0.0.1 alone, at http://127.0.0.1:4764: no
other computer can reach it. New plot asks swisstopo there as it does on the web.
