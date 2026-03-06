# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MovieTime is a group movie-picking app where participants join a room, submit preferences, and vote on AI-generated recommendations. It uses a React frontend (Vite) and Express backend with Claude AI for movie recommendations. All room state is held in-memory (no database).

## Commands

```bash
# Run production server (serves React build + API on port 3000)
npm start

# Build client
npm run build  # runs: cd client && npm install && npm run build

# Frontend dev server (port 5173, proxies /api to localhost:3000)
cd client && npm run dev
```

No test or lint tooling is configured.

**Required env variable:** `ANTHROPIC_API_KEY` must be set for the recommendation service.

## Architecture

**Backend (root):** Express.js with ES modules (`"type": "module"`).
- `server.js` — entry point, serves static build from `client/dist` and mounts API routes
- `src/routes/rooms.js` — REST route handlers for all `/api/rooms` endpoints
- `src/services/roomService.js` — in-memory room state (Map), room lifecycle logic
- `src/services/recommendationService.js` — calls Claude API to generate 7 movie recommendations from group preferences

**Frontend (`client/`):** React 18 + React Router v6, built with Vite.
- `src/App.jsx` — router: `/` (Home) and `/room/:code` (RoomRouter)
- `src/api.js` — API client layer wrapping fetch calls
- `src/hooks/useRoom.js` — polls `/api/rooms/:code` every 2.5s to sync room state
- `src/pages/` — one component per phase: Home, Lobby, Preferences, Voting, Results

**Room state machine:** `lobby → preferences → voting → results`
- Host advances phases via `POST /api/rooms/:code/advance`
- Transition from preferences→voting triggers Claude AI recommendation generation
- Session identity stored in browser `sessionStorage` (participantId, isHost, roomCode)

**Styling:** Dark theme using CSS variables defined in `client/src/index.css` (--bg, --surface, --accent, --success).

## API Endpoints

- `POST /api/rooms` — create room
- `GET /api/rooms/:code` — get room state (used for polling)
- `POST /api/rooms/:code/join` — join room
- `POST /api/rooms/:code/advance` — advance phase (host only)
- `POST /api/rooms/:code/preferences` — submit preferences
- `POST /api/rooms/:code/vote` — submit vote (up/down per movie)
- `GET /api/rooms/:code/results` — get ranked results
- `POST /api/rooms/:code/winner` — set winner (host only)
