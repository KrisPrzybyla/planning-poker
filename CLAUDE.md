# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Real-time Planning Poker (Fibonacci estimation) for Scrum teams. React + TypeScript + Chakra UI frontend, Express + Socket.IO backend, Redis for room/vote persistence. Node >= 22.12.0 (see `.nvmrc`).

## Commands

```bash
npm run dev:all        # client (Vite :5173) + server (Express :3000) together
npm run dev            # client only
npm run server         # backend only (node server.js)
npm run build          # tsc -b && vite build → dist/ (server serves dist/ in prod)
npm run lint           # eslint .

# Tests — four independent suites; `npm test` runs all four in order
npm run test:unit         # Vitest, src/utils/**/*.test.ts (pure logic)
npm run test:react        # Jest + jsdom, tests/react/** (components/hooks/context)
npm run test:backend      # Jest, tests/backend/** (imports real server.js)
npm run test:integration  # Jest, tests/integration/**

# Run a single test
npx vitest run src/utils/__tests__/votingUtils.test.ts
npx jest --config jest.react.config.cjs tests/react/components/FibonacciCard.test.tsx
npx jest --config jest.config.cjs -t 'partial test name'
```

Local Redis for dev: `docker run -p 6379:6379 redis:7-alpine`. `REDIS_URL` defaults to `redis://localhost:6379`; if Redis is unreachable, `/api/health` returns 503 and rooms cannot be created.

## Architecture

### Single server: `server.js`

`server.js` is the one server (referenced by `package.json`, `Dockerfile`, tests). It is Redis-backed; there is no in-memory or MySQL alternate.

### State lives in Redis, not process memory (`roomStore.js`)

Rooms are JSON blobs at key `pp:room:<id>`, indexed in the `pp:rooms` set, so a server restart/redeploy doesn't drop live sessions. Everything goes through the `pp:` prefix (safe to share a Redis instance). Key rules when touching room state:

- **Always mutate rooms inside `withRoomLock(roomId, async () => { ... })`** — it serializes read-modify-write so concurrent socket events (two votes at once) don't clobber each other. This lock is **in-process only**; horizontal scaling would require Redis-side atomics (WATCH/MULTI/Lua).
- `saveRoom` writes the blob + set membership atomically via MULTI and (re)sets a 12h TTL, so active rooms never expire but abandoned ones can't leak forever.

### Real-time protocol (Socket.IO)

Client and server communicate almost entirely over sockets; the only meaningful REST endpoint is `/api/health`. Server handlers live in the `io.on('connection')` block in `server.js`; the client wraps them in `src/context/RoomContext.tsx`.

- Client → server events: `createRoom`, `joinRoom`, `rejoinRoom`, `startVoting`, `submitVote`, `revealResults`, `resetVoting`, `endSession`, `removeUser`.
- Server → client events: `roomUpdated` (the workhorse — pushes the full room after any change), `scrumMasterChanged`, `sessionEnded`, `serverShuttingDown`.
- The server almost always broadcasts full room state via `io.to(roomId).emit('roomUpdated', room)` rather than deltas — the client replaces its whole `room` object.

### Presence & Scrum Master reassignment

A `setInterval` presence sweep (`PRESENCE_SWEEP_INTERVAL_MS`) reconciles disconnects. A disconnected user gets a grace period (`DISCONNECT_REMOVAL_MS`, 30s) to reconnect via `rejoinRoom` (client persists identity in `localStorage` under `planningPoker_currentUser` and auto-reconnects). Scrum Master role has four states (`Scrum Master`, `Temporary Scrum Master`, `Displaced Scrum Master`, `Participant` — see `src/types/index.ts`): when a Scrum Master drops, a temporary one is promoted; the original reclaims the role on return, otherwise promotion becomes permanent when they time out. A startup reconciliation marks all persisted users disconnected so ghosts from a prior process generation get reclaimed.

### Frontend structure

`src/context/RoomContext.tsx` is the single source of truth for socket + room state; components/pages consume it via the `useRoom()` hook. Business logic is factored into hooks (`src/hooks/`: `useVoting`, `useScrumMasterActions`, `useHealthCheck`, `useAutoRedirect`, etc.). Pure vote math (`average`, `distribution`, `mostFrequent`) lives in `src/utils/votingUtils.ts` and is the one thing covered by Vitest. Routes: `/`, `/room/:roomId`, `/join/:roomId` (see `src/App.tsx`).

## Conventions

- **English only** for all docs, comments, and code — never Polish.
- Backend `.js` files are authored as real ESM (`"type": "module"`). `babel.config.cjs` compiles them to CJS so Jest backend tests import the **actual** `server.js`/`roomStore.js` rather than a re-implemented copy — keep them import/export-clean.
- A Husky pre-commit hook runs the full React + backend test suites before every commit (`GIT_HOOKS.md`); a lint-staged variant exists as an alternative.
- Logging goes through `logger.js` (structured JSON) — don't add raw `console.log` to `server.js`.

## Configuration

Key env vars (see `.env.example`): `REDIS_URL` (required in prod), `TRUST_PROXY=true` behind a reverse proxy/CDN, `CORS_ORIGIN` (prod only), `API_RATE_WINDOW_MS`/`API_RATE_MAX` (default 60000ms / 180), `ROOM_TTL_SECONDS`, `PORT` (default 3000). Deployment details in `PRODUCTION.md`.
