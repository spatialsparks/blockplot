// The gate of the pad's checks (ST-031, rule 3): no check, and no process that a check starts,
// asks another machine. Loaded before anything else - check.js imports it first - it puts a
// refusal in the place of net.Socket.prototype.connect, the one method that every TCP connection
// of a Node process starts with. A connection to a loopback address, written as an address, goes
// through; every other throws before a name is looked up or a byte is sent, and says where it
// was to go. And it adds itself to NODE_OPTIONS, so that every Node process started from this one
// loads it before its own first line: a pad, a stand-in, a check. After tests/setup/refusal.ts,
// of which the pad imports nothing. offline.check.js is its proof.
import net from 'node:net';
import process from 'node:process';

/**
 * Where a call of `socket.connect` leads, if that is anywhere but a loopback address - 127.0.0.0/8
 * or ::1, written as an address - or undefined: this machine. `args` is what `connect` was given,
 * read as Node reads it: options, the path of a pipe, or a port and a host. A name is refused,
 * `localhost` too - Node looks it up, and where it leads is the resolver's to say - and so is a
 * pipe, which on Windows may lie on another machine.
 */
export function beyond(args) {
  const [first, second] = args;
  // `net.connect` hands on what it was given already read, as one list: [options, callback].
  const given = Array.isArray(first) ? first[0] : first;
  // A string that is no port is the path of a pipe.
  if (typeof given === 'string' && !(Number(given) >= 0)) return given;
  const options = typeof given === 'object' && given !== null;
  const { path, host: named, port } = options ? given : { port: given, host: second };
  if (typeof path === 'string' && path !== '') return path;
  // Node asks `localhost` where it is given no host.
  const host = typeof named === 'string' && named !== '' ? named : 'localhost';
  if (host === '::1' || (net.isIP(host) === 4 && host.startsWith('127.'))) return undefined;
  const name = host.includes(':') ? `[${host}]` : host;
  return typeof port === 'number' || typeof port === 'string' ? `${name}:${port}` : name;
}

const sockets = net.Socket.prototype;
const connect = Object.hasOwn(sockets, 'connect') ? sockets.connect : null;
if (typeof connect !== 'function') {
  throw new Error("net.Socket has no connect of its own: the pad's checks are guarded by nothing.");
}
sockets.connect = function (...args) {
  const to = beyond(args);
  if (to === undefined) return connect.apply(this, args);
  throw new Error(
    `The pad's checks ask this machine alone (ST-031, rule 3), so nothing was sent: ${to}`,
  );
};

// Once: a process that was started with the order has it already.
const order = `--import=${import.meta.url}`;
const held = (process.env.NODE_OPTIONS ?? '').trim();
if (!held.split(' ').includes(order)) process.env.NODE_OPTIONS = `${held} ${order}`.trim();
