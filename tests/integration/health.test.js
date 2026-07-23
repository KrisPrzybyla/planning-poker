// Integration tests for the real HTTP API exposed by server.js — not a
// hand-rolled copy. Uses a dedicated Redis db (/14) so it can't interfere
// with the socket suite running against /15 in a parallel Jest worker.
// Must be set before server.js / roomStore.js are imported.
process.env.REDIS_URL = process.env.REDIS_URL_TEST_INTEGRATION || 'redis://localhost:6379/14';

import request from 'supertest';

describe('HTTP API (real server.js)', () => {
  let app;
  let connectRedis;
  let disconnectRedis;
  let saveRoom;
  let deleteRoom;
  let listRoomIds;

  const makeRoom = (id, overrides = {}) => ({
    id,
    users: [{ id: `${id}-u1`, name: 'Alice', role: 'Scrum Master', roomId: id, isConnected: true }],
    currentStory: null,
    isVotingActive: false,
    isResultsVisible: false,
    votingCount: 0,
    ...overrides,
  });

  beforeAll(async () => {
    const serverModule = await import('../../server.js');
    const roomStore = await import('../../roomStore.js');

    app = serverModule.app;
    connectRedis = roomStore.connectRedis;
    disconnectRedis = roomStore.disconnectRedis;
    saveRoom = roomStore.saveRoom;
    deleteRoom = roomStore.deleteRoom;
    listRoomIds = roomStore.listRoomIds;

    await connectRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  afterEach(async () => {
    const ids = await listRoomIds();
    await Promise.all(ids.map((id) => deleteRoom(id)));
  });

  describe('GET /api/health', () => {
    it('reports healthy with Redis active and the real payload shape', async () => {
      const res = await request(app).get('/api/health').expect(200);

      expect(res.body.status).toBe('healthy');
      expect(res.body.services).toMatchObject({ database: 'redis', redis: 'active' });
      expect(typeof res.body.stats.activeRooms).toBe('number');
      expect(typeof res.body.stats.totalConnections).toBe('number');
      expect(res.body.uptime).toBeGreaterThan(0);
    });

    it('reflects the actual room count read from Redis', async () => {
      await saveRoom(makeRoom('HLTH01'));

      const res = await request(app).get('/api/health').expect(200);
      expect(res.body.stats.activeRooms).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/stats', () => {
    it('returns the real stats shape', async () => {
      const res = await request(app).get('/api/stats').expect(200);

      expect(typeof res.body.activeRooms).toBe('number');
      expect(typeof res.body.totalConnections).toBe('number');
      expect(Array.isArray(res.body.rooms)).toBe(true);
    });

    it('surfaces a saved room with its derived fields', async () => {
      await saveRoom(
        makeRoom('HLTH02', {
          currentStory: { id: 's1', title: 'Story', description: '', votes: [] },
          isVotingActive: true,
          votingCount: 1,
        })
      );

      const res = await request(app).get('/api/stats').expect(200);
      const room = res.body.rooms.find((r) => r.id === 'HLTH02');

      expect(room).toMatchObject({
        id: 'HLTH02',
        userCount: 1,
        isVotingActive: true,
        hasStory: true,
      });
    });
  });
});
