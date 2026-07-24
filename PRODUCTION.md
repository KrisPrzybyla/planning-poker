# Planning Poker - Production Deployment

## Requirements

- **Node.js 22+** (Node 20 is reaching EOL — use the active LTS)
- **npm** (bundled with Node.js)
- **Redis** (required — room/vote state is stored in Redis so a restart doesn't wipe active sessions)

## Quick Start

### Option 1: Automated script

```bash
./start-production.sh
```

### Option 2: Manual start

```bash
# 1. Make sure you are on Node.js 22+
nvm use 22  # if you use nvm

# 2. Build the app (if not already built)
npm run build

# 3. Run on port 80 (requires sudo)
sudo PORT=80 npm start

# OR run on another port (no sudo)
PORT=3000 npm start
PORT=8080 npm start
```

## Detailed Instructions

### 1. Prepare the environment

#### Check your Node.js version:

```bash
node --version
```

If your version is lower than 22.12.0, install a newer one:

**With nvm (recommended):**

```bash
nvm install 22
nvm use 22
```

**Or download from the official site:**
https://nodejs.org/

### 2. Install dependencies

```bash
npm install
```

### 3. Build the app

```bash
npm run build
```

This command:

- Compiles TypeScript (`tsc -b`)
- Builds the React app with Vite (`vite build`)
- Creates the `dist/` directory with static files

### 4. Start the server

#### On port 80 (standard HTTP):

```bash
sudo PORT=80 npm start
```

**Note:** Port 80 requires administrator privileges (sudo) on most systems.

#### On another port:

```bash
PORT=3000 npm start  # Port 3000
PORT=8080 npm start  # Port 8080
```

### 5. Verification

The app will be available at:

- **Port 80:** http://localhost
- **Port 3000:** http://localhost:3000
- **Port 8080:** http://localhost:8080

#### Check the health status:

```bash
curl http://localhost/api/health
```

## Production Configuration

### Environment variables

- `PORT` - server port (default 3000)
- `NODE_ENV` - environment (automatically set to "production" in production mode)
- `REDIS_URL` - Redis connection string (required). Rooms/votes live in Redis so a restart or redeploy doesn't drop active sessions. Defaults to `redis://localhost:6379` if unset.
- `TRUST_PROXY` - set to `true` if the app runs behind a reverse proxy/CDN (Nginx, Cloudflare). Enables correct client IP detection and proper rate limiting.
- `API_RATE_WINDOW_MS` - rate-limiting time window (in milliseconds). Default `60000` (60s).
- `API_RATE_MAX` - maximum number of requests per IP within the window. Default `180`.

### Example with configuration:

```bash
NODE_ENV=production PORT=80 REDIS_URL=redis://localhost:6379 npm start
```

## Architecture

The app consists of:

1. **Express server** (`server.js`)
   - Serves static files from the `dist/` directory
   - Handles API endpoints (`/api/*`)
   - Manages Socket.IO connections

2. **React app** (built into `dist/`)
   - Single Page Application (SPA)
   - All routes handled by React Router

3. **Socket.IO**
   - Real-time communication
   - Room and voting management

4. **Redis**
   - Persistent storage for room/vote state
   - Survives server restarts and redeploys

## Troubleshooting

### Problem: "Permission denied" on port 80

**Solution:** Use `sudo` or run on another port:

```bash
PORT=3000 npm start
```

### Problem: "Module not found" or build errors

**Solution:** Check the Node.js version and reinstall dependencies:

```bash
node --version  # Should be 22+
rm -rf node_modules
npm install
npm run build
```

### Problem: The app does not load in the browser

**Solution:** Check that the server is running and the files were built:

```bash
curl http://localhost/api/health
ls -la dist/
```

## Monitoring

### Check the server status:

```bash
curl http://localhost/api/health | jq .
```

### Check the stats:

```bash
curl http://localhost/api/stats | jq .
```

## Stopping the server

Press `Ctrl+C` in the terminal where the server is running.

## Automatic startup (optional)

You can configure automatic startup on system boot using:

- **systemd** (Linux)
- **launchd** (macOS)
- **PM2** (cross-platform)

### Example with PM2:

```bash
npm install -g pm2
pm2 start npm --name "planning-poker" -- start
pm2 startup
pm2 save
```
