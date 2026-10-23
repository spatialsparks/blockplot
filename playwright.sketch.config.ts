import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

// The sketch pad's browser tests alone: `pnpm e2e:sketch`. Two projects, `sketch` and the 3D
// page's `sketch-3d`, a few files at a time, beside it (T-000.29), against one server -
// `pnpm sketch --demo`, the pad's files, whose pages show the made-up plot, tools/sketch/demo-site.js, where the browser holds no other - with no network and nothing of
// the real site (directive 34). Nothing is built, and the web app's server is not started: the
// pad's tests ask it nothing. The pad's own server
// listens on 127.0.0.1 and on nothing else. A Vite server first tries its port on every network
// interface, and Windows then asks about a firewall rule, once for every new worktree: so this
// is the command an agent runs the pad's browser tests with.
//
// What the two configurations share is said here, once: playwright.config.ts, of `pnpm e2e`,
// takes it from here and adds the web app's project and server.
const SKETCH_PORT = 4765;
const sketchURL = `http://127.0.0.1:${SKETCH_PORT}`;
/** The pad's tests by their name; every other test file is the web app's. */
export const SKETCH_TESTS = '**/sketch*.spec.ts';
export const onCI = process.env['CI'] !== undefined;
export const browser = devices['Desktop Chrome'];

/** How every browser test runs, whichever project it is in. */
export const shared = {
  testDir: './tests/e2e',
  timeout: 30_000,
  forbidOnly: onCI, // a stray .only fails CI instead of skipping the rest
  retries: onCI ? 1 : 0, // locally a failure fails at once
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { trace: 'on-first-retry' },
} satisfies PlaywrightTestConfig;

/** The 3D page's tests by their name: they run in a lane of their own, `sketch-3d`. */
export const SKETCH_3D_TESTS = '**/sketch-3d*.spec.ts';
/**
 * How many 3D files run at once. Every browser draws WebGL in software, on the CPU: ten 3D pages
 * at once took a picture past the test's 30 s in the full verify. Why three, and beside `sketch`
 * rather than after it: docs/adr/ADR-0180-the-3d-tests-in-a-lane-of-their-own.md.
 */
const SKETCH_3D_WORKERS = 3;
type Project = NonNullable<PlaywrightTestConfig['projects']>[number];

/** The pad's project: its tests but the 3D page's, in the browser, against the pad's address. */
export const sketchProject = {
  name: 'sketch',
  testMatch: SKETCH_TESTS,
  testIgnore: SKETCH_3D_TESTS,
  use: { ...browser, baseURL: sketchURL },
} satisfies Project;

/** The 3D page's tests, a few at a time, against the same pad. */
export const sketch3dProject = {
  name: 'sketch-3d',
  testMatch: SKETCH_3D_TESTS,
  workers: SKETCH_3D_WORKERS,
  use: { ...browser, baseURL: sketchURL },
} satisfies Project;

/** The pad's server, the made-up pad: plain files, and no plot of its own. */
export const sketchServer = {
  command: 'pnpm sketch --demo',
  // The pad listens where the environment names a port. Here none is named, whatever the
  // shell says: the tests ask the port that the switch itself gives the pad, and prove it.
  env: { PORT: '' },
  url: sketchURL,
  reuseExistingServer: !onCI,
  timeout: 60_000,
};

export default defineConfig({
  ...shared,
  projects: [sketchProject, sketch3dProject],
  webServer: [sketchServer],
});
