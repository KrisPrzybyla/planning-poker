import { createClient } from 'redis';
import { logger } from './logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Safety-net TTL on every room key: even if the presence sweep and startup
// reconciliation both somehow miss a room, it cannot live in Redis forever.
// Refreshed on every saveRoom, so an actively-used room never expires from
// under live users. 12h comfortably outlasts any real estimation session.
const ROOM_TTL_SECONDS = Number(process.env.ROOM_TTL_SECONDS) || 12 * 60 * 60;

// Namespaced so this app can safely share a single Redis instance with other
// services: every key lives under `pp:`, and the URL's own db index (e.g.
// redis://host:6379/1) gives a second, independent layer of isolation.
const KEY_PREFIX = 'pp:';
const ROOM_SET_KEY = `${KEY_PREFIX}rooms`;
const roomKey = (roomId) => `${KEY_PREFIX}room:${roomId}`;

export const client = createClient({ url: REDIS_URL });

client.on('error', (err) => {
  logger.error('Redis client error', { message: err?.message });
});

let connected = false;

export async function connectRedis() {
  if (connected) return;
  await client.connect();
  connected = true;
  logger.info('Redis connected', { url: REDIS_URL.replace(/:\/\/[^@]*@/, '://***@') });
}

export async function disconnectRedis() {
  if (!connected) return;
  await client.quit();
  connected = false;
}

export async function getRoom(roomId) {
  const raw = await client.get(roomKey(roomId));
  return raw ? JSON.parse(raw) : null;
}

export async function saveRoom(room) {
  // Atomic: the room blob and its index-set membership are written together,
  // so a crash can't leave a set entry without a key (or vice versa). The
  // TTL is (re)set on every save, keeping active rooms alive indefinitely.
  await client
    .multi()
    .set(roomKey(room.id), JSON.stringify(room), { EX: ROOM_TTL_SECONDS })
    .sAdd(ROOM_SET_KEY, room.id)
    .exec();
}

export async function deleteRoom(roomId) {
  // Idempotent: DEL on a missing key and sRem of a stale member are both
  // no-ops, so this doubles as the way to prune a ghost (a set member whose
  // key already expired).
  await client.del(roomKey(roomId));
  await client.sRem(ROOM_SET_KEY, roomId);
}

export async function roomExists(roomId) {
  return (await client.exists(roomKey(roomId))) === 1;
}

export async function listRoomIds() {
  return client.sMembers(ROOM_SET_KEY);
}

export async function countRooms() {
  return client.sCard(ROOM_SET_KEY);
}

// Serializes all mutations to a given room so concurrent socket events (e.g.
// two people voting at the same instant) never race on a read-modify-write
// of the same Redis key.
//
// This only coordinates within a single Node process. It is NOT safe across
// multiple app instances — if this service is ever scaled horizontally,
// replace it with a Redis-side atomic op (WATCH/MULTI or a Lua script);
// an in-process lock can't see what another process is doing.
const roomLocks = new Map();

export function withRoomLock(roomId, fn) {
  const previous = roomLocks.get(roomId) || Promise.resolve();
  const run = previous.then(fn, fn);
  const tail = run.then(() => {}, () => {});
  roomLocks.set(roomId, tail);

  // Self-cleaning: once this operation settles, drop the map entry — but only
  // if nothing else has queued behind it in the meantime (tail still current).
  // This keeps the map bounded without the race that an explicit "clear it
  // inside the critical section" would introduce, where a delete could let a
  // freshly-arriving op run concurrently with one still in flight.
  tail.then(() => {
    if (roomLocks.get(roomId) === tail) roomLocks.delete(roomId);
  });

  return run;
}
