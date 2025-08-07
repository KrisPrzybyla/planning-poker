# Planning Poker

A task estimation application using Planning Poker methodology for Scrum teams.

## Features

- **Fibonacci Planning Poker** - cards with values: 0, 1, 2, 3, 5, 8, 13, 21, ?, ☕
- **Room Creation** - unique 6-character code for each session
- **Participant Invitation** - via room code or direct link
- **Real-time Synchronization** - WebSocket for instant updates
- **User Roles** - Scrum Master (moderator) and Participants (team members)
- **Session Management** - start voting, reveal results, reset votes
- **Voting Statistics** - average points, vote distribution, most common vote

## Technologies

- React + TypeScript
- Chakra UI for user interface
- Socket.IO for real-time communication
- Express.js for backend server

## Running the Application

### Requirements

- Node.js
- npm

### Installation

```bash
# Install dependencies
npm install
```

### Development Mode

```bash
# Run client and server simultaneously
npm run dev:all

# Or separately:
# Run client
npm run dev

# Run server
npm run server
```

### Production Build

```bash
npm run build
```

## Running with Docker

### Requirements

- Docker
- Docker Compose (optional)

### Running with Docker Compose (recommended)

```bash
# Build and run application
npm run docker:up

# Stop application
npm run docker:down
```

### Running with Docker (manually)

```bash
# Build Docker image
npm run docker:build

# Run container in background (with automatic restart)
npm run docker:run

# Stop container
npm run docker:stop
```

### Manual Docker Commands

```bash
# Build image
docker build -t planning-poker .

# Run container in background with automatic restart
docker run -d --name planning-poker-app --restart unless-stopped -p 80:3000 planning-poker

# Stop container
docker stop planning-poker-app && docker rm planning-poker-app

# Run with docker-compose
docker-compose up -d

# Stop
docker-compose down
```

After running, the application will be available at: `http://localhost` (port 80)

## Server Deployment (EC2, VPS, Cloud)

### Server Requirements

- Docker and Docker Compose
- Open ports: 80 (HTTP) and optionally 443 (HTTPS)

### Deployment Steps

1. **Clone repository on server:**
```bash
git clone <repository-url>
cd trae_poker
```

2. **Run application:**
```bash
# Option 1: Docker Compose (recommended)
npm run docker:up

# Option 2: Docker manually
npm run docker:build
npm run docker:run
```

3. **Check status:**
```bash
docker ps
```

4. **Application will be available at server IP address:**
```
http://YOUR_SERVER_IP
```

### Important Deployment Notes

- **Socket.IO**: Application automatically detects server address (doesn't use localhost)
- **Ports**: Application maps port 80 (external) to port 3000 (internal container)
- **Restart**: Container automatically restarts after server restart
- **Firewall**: Make sure port 80 is open in security groups (EC2) or firewall

### Troubleshooting

If Socket.IO doesn't work:
1. Check if port 80 is open
2. Check container logs: `docker logs planning-poker-app`
3. Check if container is running: `docker ps`

## Project Structure

- `/src` - client application source code
  - `/components` - React components
  - `/context` - React context for state management
  - `/hooks` - custom React hooks
  - `/pages` - application pages
  - `/styles` - CSS styles
  - `/types` - TypeScript type definitions
  - `/utils` - utility functions
- `server.js` - backend server with WebSocket support

## Usage

1. Open application in browser
2. Create new room as Scrum Master or join existing room as Participant
3. Scrum Master can add new tasks for estimation
4. Participants vote by selecting Fibonacci cards
5. Scrum Master reveals voting results
6. Results are analyzed and displayed as statistics
