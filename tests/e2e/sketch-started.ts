import type { ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { createServer, type AddressInfo } from 'node:net';
import { expect } from '@playwright/test';

// A pad of a case's own, started: what sketch-own-pad.ts, for the map's and the marking's browser
// tests, starts one by. No test file, by its name. A case gets a pad on a port that was free a
// moment ago, told that port alone (T-041.4); where another took that port in between, the pad
// ends before its line, and is started again on another - three ports at the most.

const HOST = '127.0.0.1';
/** How many ports a pad is started on before the case fails: a port taken in between is rare, three in a row is no chance. */
const TRIES = 3;

/** Stops a process that runs still, and is over when it has stopped. */
export async function stopped(run: ChildProcess): Promise<void> {
  if (run.exitCode === null && run.signalCode === null && run.kill()) await once(run, 'close');
}

/** A port of this machine that was free a moment ago. */
async function free(): Promise<string> {
  const probe = createServer().listen(0, HOST);
  await once(probe, 'listening');
  const { port } = probe.address() as AddressInfo;
  probe.close();
  await once(probe, 'close');
  return String(port);
}

/** A pad that has said its line: its process, all that it has said - on stdout, and on stderr where that is heard - and its origin. */
export type Started = { run: ChildProcess; said: () => string; origin: string };

/** One try: the pad that `start` starts on the port, heard until it has said `says` or has ended. One that does neither in time is stopped, and fails the case with "the pad did not start". */
async function tried(
  start: (port: string) => ChildProcess,
  port: string,
  says: string,
): Promise<Omit<Started, 'origin'>> {
  const run = start(port);
  // However the run of the tests ends, this pad does not outlive it.
  const kill = (): boolean => run.kill();
  process.once('exit', kill);
  run.once('close', () => process.off('exit', kill));
  const [heard, said] = [[] as string[], () => heard.join('')];
  for (const out of [run.stdout, run.stderr])
    out?.on('data', (text: Buffer) => heard.push(text.toString()));
  let ended = false;
  run.once('close', () => (ended = true));
  try {
    const over = (): boolean => ended || said().includes(says);
    await expect.poll(over, `the pad did not start on port ${port}`).toBe(true);
  } catch (error) {
    await stopped(run);
    throw error;
  }
  return { run, said };
}

/**
 * Starts a pad of a case's own, by `start(port)` - which starts tools/sketch/serve.js on that port
 * as its caller does, with its own env and gate - on a port that was free a moment ago, and waits
 * until it has said `says`. Where the pad ended before it said that - its port taken in between -
 * it is started again on another port, `TRIES` times in all: the last fails the case with "the
 * pad did not start", the ports and what the last pad said.
 */
export async function padOn(start: (port: string) => ChildProcess, says: string): Promise<Started> {
  const ports: string[] = [];
  for (;;) {
    const port = await free();
    ports.push(port);
    const { run, said } = await tried(start, port, says);
    if (said().includes(says)) return { run, said, origin: `http://${HOST}:${port}` };
    if (ports.length === TRIES)
      throw new Error(`the pad did not start, on ports ${ports.join(', ')}: ${said()}`);
  }
}
