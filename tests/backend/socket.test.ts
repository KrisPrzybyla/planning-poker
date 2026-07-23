// Redis db index dedicated to this test run — separate from dev (/1) and
// whatever else might share the instance. Must be set before server.js (and
// its roomStore.js import) is loaded, since the client reads it at import time.
process.env.REDIS_URL = process.env.REDIS_URL_TEST || 'redis://localhost:6379/15';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';

describe('Socket.IO Server (real server.js)', () => {
  let app: any;
  let server: any;
  let io: any;
  let runPresenceSweep: () => Promise<void>;
  let reconcileOnStartup: () => Promise<void>;
  let connectRedis: () => Promise<void>;
  let disconnectRedis: () => Promise<void>;
  let getRoom: (roomId: string) => Promise<any>;
  let saveRoom: (room: any) => Promise<void>;
  let listRoomIds: () => Promise<string[]>;
  let deleteRoom: (roomId: string) => Promise<void>;
  let redisClient: any;

  let port: number;
  const openClients: ClientSocket[] = [];

  const createClient = (): ClientSocket => {
    const socket = Client(`http://localhost:${port}`, { forceNew: true });
    openClients.push(socket);
    return socket;
  };

  const emitAck = <T = any>(socket: ClientSocket, event: string, payload: any): Promise<T> =>
    new Promise((resolve) => socket.emit(event, payload, resolve));

  const waitFor = (socket: ClientSocket, event: string): Promise<any> =>
    new Promise((resolve) => socket.once(event, resolve));

  // startVoting/submitVote/revealResults/resetVoting are fire-and-forget
  // broadcasts (no ack) — a plain .once('roomUpdated') can catch an earlier
  // broadcast still in flight rather than the one caused by this call. Wait
  // for a room snapshot that actually matches what we expect instead.
  const waitForRoomState = (
    socket: ClientSocket,
    predicate: (room: any) => boolean,
    timeoutMs = 2000
  ): Promise<any> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.off('roomUpdated', handler);
        reject(new Error('Timed out waiting for expected room state'));
      }, timeoutMs);
      function handler(room: any) {
        if (predicate(room)) {
          clearTimeout(timer);
          socket.off('roomUpdated', handler);
          resolve(room);
        }
      }
      socket.on('roomUpdated', handler);
    });

  beforeAll(async () => {
    const serverModule = await import('../../server.js');
    const roomStore = await import('../../roomStore.js');

    app = serverModule.app;
    server = serverModule.server;
    io = serverModule.io;
    runPresenceSweep = serverModule.runPresenceSweep;
    reconcileOnStartup = serverModule.reconcileOnStartup;
    connectRedis = roomStore.connectRedis;
    disconnectRedis = roomStore.disconnectRedis;
    getRoom = roomStore.getRoom;
    saveRoom = roomStore.saveRoom;
    listRoomIds = roomStore.listRoomIds;
    deleteRoom = roomStore.deleteRoom;
    redisClient = roomStore.client;

    await connectRedis();
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectRedis();
  });

  afterEach(async () => {
    openClients.forEach((s) => s.disconnect());
    openClients.length = 0;

    // Keep the test Redis db clean between tests.
    const ids = await listRoomIds();
    await Promise.all(ids.map((id) => deleteRoom(id)));
  });

  describe('Room Management', () => {
    it('should create a new room', async () => {
      const client = createClient();
      await waitFor(client, 'connect');

      const response = await emitAck(client, 'createRoom', { userName: 'Test User' });

      expect(response.success).toBe(true);
      expect(response.roomId).toBeDefined();
      expect(response.user.name).toBe('Test User');
      expect(response.user.role).toBe('Scrum Master');

      const room = await getRoom(response.roomId);
      expect(room).not.toBeNull();
      expect(room.users).toHaveLength(1);
    });

    it('should join an existing room', async () => {
      const creator = createClient();
      await waitFor(creator, 'connect');
      const created = await emitAck(creator, 'createRoom', { userName: 'Creator' });

      const joiner = createClient();
      await waitFor(joiner, 'connect');
      const joined = await emitAck(joiner, 'joinRoom', { roomId: created.roomId, userName: 'Joiner' });

      expect(joined.success).toBe(true);
      expect(joined.user.name).toBe('Joiner');
      expect(joined.user.role).toBe('Participant');

      const room = await getRoom(created.roomId);
      expect(room.users).toHaveLength(2);
    });

    it('should return an error when joining a non-existent room', async () => {
      const client = createClient();
      await waitFor(client, 'connect');

      const response = await emitAck(client, 'joinRoom', { roomId: 'NOPE99', userName: 'Test User' });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Room not found');
    });
  });

  describe('Voting System', () => {
    let roomId: string;
    let userId: string;
    let client: ClientSocket;

    beforeEach(async () => {
      client = createClient();
      await waitFor(client, 'connect');
      const created = await emitAck(client, 'createRoom', { userName: 'Scrum Master' });
      roomId = created.roomId;
      userId = created.user.id;
    });

    it('should start a voting session', async () => {
      client.emit('startVoting', { roomId, story: { title: 'Test Story', description: 'desc' } });

      const room = await waitForRoomState(client, (r) => r.isVotingActive === true);
      expect(room.currentStory.title).toBe('Test Story');
    });

    it('should submit and record a vote', async () => {
      client.emit('startVoting', { roomId, story: { title: 'Test Story' } });
      await waitForRoomState(client, (r) => r.isVotingActive === true);

      client.emit('submitVote', { roomId, userId, value: '5' });
      const room = await waitForRoomState(client, (r) => r.currentStory?.votes?.length > 0);

      expect(room.currentStory.votes).toEqual([{ userId, value: '5' }]);
    });

    it('should reject a vote value outside the Fibonacci deck', async () => {
      client.emit('startVoting', { roomId, story: { title: 'Test Story' } });
      await waitForRoomState(client, (r) => r.isVotingActive === true);

      client.emit('submitVote', { roomId, userId, value: '999' });
      // No roomUpdated should follow an invalid vote — assert directly against stored state.
      await new Promise((resolve) => setTimeout(resolve, 100));
      const room = await getRoom(roomId);
      expect(room.currentStory.votes).toEqual([]);
    });

    it('should reveal results and reset voting', async () => {
      client.emit('startVoting', { roomId, story: { title: 'Test Story' } });
      await waitForRoomState(client, (r) => r.isVotingActive === true);
      client.emit('submitVote', { roomId, userId, value: '8' });
      await waitForRoomState(client, (r) => r.currentStory?.votes?.length > 0);

      client.emit('revealResults', { roomId });
      await waitForRoomState(client, (r) => r.isResultsVisible === true);

      client.emit('resetVoting', { roomId });
      const room = await waitForRoomState(client, (r) => r.isResultsVisible === false && r.currentStory?.votes?.length === 0);
      expect(room.currentStory.votes).toEqual([]);
    });
  });

  describe('Scrum Master Controls', () => {
    it('should allow the Scrum Master to remove a participant', async () => {
      const sm = createClient();
      await waitFor(sm, 'connect');
      const created = await emitAck(sm, 'createRoom', { userName: 'Scrum Master' });

      const participant = createClient();
      await waitFor(participant, 'connect');
      const joined = await emitAck(participant, 'joinRoom', { roomId: created.roomId, userName: 'Participant' });

      const response = await emitAck(sm, 'removeUser', { roomId: created.roomId, userIdToRemove: joined.user.id });
      expect(response.success).toBe(true);

      const room = await getRoom(created.roomId);
      expect(room.users).toHaveLength(1);
    });

    it('should prevent a non-Scrum-Master from removing users', async () => {
      const sm = createClient();
      await waitFor(sm, 'connect');
      const created = await emitAck(sm, 'createRoom', { userName: 'Scrum Master' });

      const participant = createClient();
      await waitFor(participant, 'connect');
      await emitAck(participant, 'joinRoom', { roomId: created.roomId, userName: 'Participant' });

      const response = await emitAck(participant, 'removeUser', { roomId: created.roomId, userIdToRemove: 'anyone' });
      expect(response.success).toBe(false);
      expect(response.error).toBe('Only Scrum Master can remove users');
    });

    it('should refuse to remove the Scrum Master', async () => {
      const sm = createClient();
      await waitFor(sm, 'connect');
      const created = await emitAck(sm, 'createRoom', { userName: 'Scrum Master' });

      const response = await emitAck(sm, 'removeUser', { roomId: created.roomId, userIdToRemove: created.user.id });
      expect(response.success).toBe(false);
      expect(response.error).toBe('Cannot remove Scrum Master');
    });
  });

  describe('Disconnect handling and the presence sweep', () => {
    it('ignores a stale disconnect from a socket a user has already reconnected past', async () => {
      // This is a regression test for the bug diagnosed from a real HAR:
      // a client reconnects on a new socket before the server notices the
      // old one died; the old socket's belated 'disconnect' must not clobber
      // the fresh session.
      const original = createClient();
      await waitFor(original, 'connect');
      const created = await emitAck(original, 'createRoom', { userName: 'Alice' });
      const { roomId, user } = created;

      // Simulate the client reconnecting on a brand-new socket before the
      // old one's disconnect is detected by the server.
      const replacement = createClient();
      await waitFor(replacement, 'connect');
      const rejoined = await emitAck(replacement, 'rejoinRoom', { roomId, userId: user.id });
      expect(rejoined.success).toBe(true);

      // Now the *old* socket goes away. Without the fix, this would mark
      // the (still live, just-rejoined) user offline and start a removal
      // countdown.
      original.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const room = await getRoom(roomId);
      const persisted = room.users.find((u: any) => u.id === user.id);
      expect(persisted.isConnected).toBe(true);
      expect(persisted.disconnectedAt).toBeUndefined();
    });

    it('promotes a Temporary Scrum Master once the original has been away past the threshold', async () => {
      const sm = createClient();
      await waitFor(sm, 'connect');
      const created = await emitAck(sm, 'createRoom', { userName: 'Scrum Master' });
      const { roomId } = created;

      const participant = createClient();
      await waitFor(participant, 'connect');
      const joined = await emitAck(participant, 'joinRoom', { roomId, userName: 'Participant' });

      sm.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fast-forward time instead of waiting the real threshold: back-date
      // disconnectedAt directly in the store, then run one sweep tick.
      const room = await getRoom(roomId);
      const smUser = room.users.find((u: any) => u.role === 'Displaced Scrum Master');
      expect(smUser).toBeDefined();
      smUser.disconnectedAt = Date.now() - 10_000;
      await saveRoom(room);

      await runPresenceSweep();

      const updated = await getRoom(roomId);
      const promoted = updated.users.find((u: any) => u.id === joined.user.id);
      expect(promoted.role).toBe('Temporary Scrum Master');
    });

    it('permanently removes a user who never reconnects, and deletes the room once empty', async () => {
      const client = createClient();
      await waitFor(client, 'connect');
      const created = await emitAck(client, 'createRoom', { userName: 'Solo' });
      const { roomId } = created;

      client.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const room = await getRoom(roomId);
      room.users[0].disconnectedAt = Date.now() - 40_000;
      await saveRoom(room);

      await runPresenceSweep();

      const gone = await getRoom(roomId);
      expect(gone).toBeNull();
    });
  });

  describe('Rejoin', () => {
    it('restores the original Scrum Master and demotes the Temporary Scrum Master on return', async () => {
      const sm = createClient();
      await waitFor(sm, 'connect');
      const created = await emitAck(sm, 'createRoom', { userName: 'Scrum Master' });
      const { roomId, user: smUser } = created;

      const participant = createClient();
      await waitFor(participant, 'connect');
      const joined = await emitAck(participant, 'joinRoom', { roomId, userName: 'Participant' });

      sm.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 100));

      let room = await getRoom(roomId);
      const displaced = room.users.find((u: any) => u.id === smUser.id);
      displaced.disconnectedAt = Date.now() - 10_000;
      await saveRoom(room);
      await runPresenceSweep();

      room = await getRoom(roomId);
      expect(room.users.find((u: any) => u.id === joined.user.id).role).toBe('Temporary Scrum Master');

      // Original Scrum Master comes back.
      const returning = createClient();
      await waitFor(returning, 'connect');
      const rejoined = await emitAck(returning, 'rejoinRoom', { roomId, userId: smUser.id });
      expect(rejoined.success).toBe(true);
      expect(rejoined.user.role).toBe('Scrum Master');

      room = await getRoom(roomId);
      expect(room.users.find((u: any) => u.id === joined.user.id).role).toBe('Participant');
    });
  });

  describe('Startup reconciliation', () => {
    it('marks users from a previous process generation disconnected so stragglers can be reclaimed', async () => {
      // Simulate a room persisted before a restart: the user is flagged
      // connected in Redis, but there is no live socket for them.
      const client = createClient();
      await waitFor(client, 'connect');
      const created = await emitAck(client, 'createRoom', { userName: 'Ghost' });
      const { roomId } = created;
      client.disconnect();

      // Force the persisted state back to "connected, no disconnectedAt",
      // exactly how it looks the instant before a hard restart.
      let room = await getRoom(roomId);
      room.users[0].isConnected = true;
      delete room.users[0].disconnectedAt;
      await saveRoom(room);

      await reconcileOnStartup();

      room = await getRoom(roomId);
      expect(room.users[0].isConnected).toBe(false);
      expect(typeof room.users[0].disconnectedAt).toBe('number');

      // And the straggler is now eligible for removal by the sweep.
      room.users[0].disconnectedAt = Date.now() - 40_000;
      await saveRoom(room);
      await runPresenceSweep();
      expect(await getRoom(roomId)).toBeNull();
    });
  });

  describe('Vote identity hardening', () => {
    it('records the vote under the socket identity, ignoring a spoofed userId in the payload', async () => {
      const sm = createClient();
      await waitFor(sm, 'connect');
      const created = await emitAck(sm, 'createRoom', { userName: 'Scrum Master' });
      const { roomId, user: smUser } = created;

      const participant = createClient();
      await waitFor(participant, 'connect');
      const joined = await emitAck(participant, 'joinRoom', { roomId, userName: 'Participant' });

      sm.emit('startVoting', { roomId, story: { title: 'S' } });
      await waitForRoomState(sm, (r) => r.isVotingActive === true);

      // Participant tries to cast a vote as the Scrum Master by passing the
      // SM's userId in the payload. The server must attribute it to the
      // participant's own socket identity instead.
      participant.emit('submitVote', { roomId, userId: smUser.id, value: '5' });
      await waitForRoomState(participant, (r) => r.currentStory?.votes?.length > 0);

      const room = await getRoom(roomId);
      expect(room.currentStory.votes).toEqual([{ userId: joined.user.id, value: '5' }]);
    });
  });

  describe('Input validation and length limits', () => {
    it('rejects an empty user name on createRoom', async () => {
      const client = createClient();
      await waitFor(client, 'connect');
      const res = await emitAck(client, 'createRoom', { userName: '   ' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Name is required');
    });

    it('truncates an over-long user name to the cap', async () => {
      const client = createClient();
      await waitFor(client, 'connect');
      const longName = 'x'.repeat(500);
      const res = await emitAck(client, 'createRoom', { userName: longName });
      expect(res.success).toBe(true);
      expect(res.user.name.length).toBe(40); // MAX_NAME_LENGTH
    });

    it('truncates an over-long story title and description', async () => {
      const client = createClient();
      await waitFor(client, 'connect');
      const created = await emitAck(client, 'createRoom', { userName: 'SM' });
      const { roomId } = created;

      client.emit('startVoting', {
        roomId,
        story: { title: 'T'.repeat(500), description: 'D'.repeat(5000) },
      });
      const room = await waitForRoomState(client, (r) => r.isVotingActive === true);

      expect(room.currentStory.title.length).toBe(200); // MAX_TITLE_LENGTH
      expect(room.currentStory.description.length).toBe(2000); // MAX_DESCRIPTION_LENGTH
    });
  });

  describe('Room key TTL', () => {
    it('sets a positive expiry on the room key so abandoned rooms cannot live forever', async () => {
      const client = createClient();
      await waitFor(client, 'connect');
      const created = await emitAck(client, 'createRoom', { userName: 'SM' });

      const ttl = await redisClient.ttl(`pp:room:${created.roomId}`);
      // -1 = no expiry, -2 = missing key. We want a real, bounded TTL.
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(12 * 60 * 60); // ROOM_TTL_SECONDS
    });

    it('refreshes the TTL on every write, keeping active rooms alive', async () => {
      const client = createClient();
      await waitFor(client, 'connect');
      const created = await emitAck(client, 'createRoom', { userName: 'SM' });
      const key = `pp:room:${created.roomId}`;

      // Age the key artificially, then perform another write and confirm the
      // TTL is bumped back up near the full window.
      await redisClient.expire(key, 60);
      expect(await redisClient.ttl(key)).toBeLessThanOrEqual(60);

      client.emit('startVoting', { roomId: created.roomId, story: { title: 'S' } });
      await waitForRoomState(client, (r) => r.isVotingActive === true);

      expect(await redisClient.ttl(key)).toBeGreaterThan(60);
    });
  });

  describe('Concurrency (room lock)', () => {
    it('serializes simultaneous votes from different users so none are lost', async () => {
      const sm = createClient();
      await waitFor(sm, 'connect');
      const created = await emitAck(sm, 'createRoom', { userName: 'SM' });
      const { roomId } = created;

      const values = ['0', '1', '2', '3', '5', '8'];
      const participants: ClientSocket[] = [];
      for (let i = 0; i < values.length; i++) {
        const c = createClient();
        await waitFor(c, 'connect');
        await emitAck(c, 'joinRoom', { roomId, userName: `P${i}` });
        participants.push(c);
      }

      sm.emit('startVoting', { roomId, story: { title: 'S' } });
      await waitForRoomState(sm, (r) => r.isVotingActive === true);

      // Fire every vote in the same tick — maximal read-modify-write overlap
      // on the single room key. Without withRoomLock these would race and
      // clobber each other, ending with fewer than N recorded votes.
      participants.forEach((c, i) => c.emit('submitVote', { roomId, value: values[i] }));

      const room = await waitForRoomState(
        sm,
        (r) => r.currentStory?.votes?.length === values.length,
        4000
      );
      expect(room.currentStory.votes).toHaveLength(values.length);

      const persisted = await getRoom(roomId);
      expect(persisted.currentStory.votes).toHaveLength(values.length);
    });
  });
});
