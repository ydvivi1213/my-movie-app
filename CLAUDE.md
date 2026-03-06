# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MovieTime is a group movie-picking app where participants join a room, submit preferences, and vote on AI-generated recommendations. It uses a React frontend (Vite) and Express backend with Claude AI for movie recommendations. All room state is held in-memory (no database).

## Commands

```bash
# Run production server (serves React build + API on port 3000)
ANTHROPIC_API_KEY=... node server.js

# Build client
npm run build  # runs: cd client && npm install && npm run build

# Frontend dev server (port 5173, proxies /api to localhost:3000)
cd client && npm run dev
```

No test or lint tooling is configured.

**Required env variables:**
- `ANTHROPIC_API_KEY` — required for Claude recommendation service
- `TMDB_API_KEY` — optional, enables real movie posters via TMDB API (free at themoviedb.org/settings/api). Without it, cards show gradient placeholders.

## Architecture

**Backend (root):** Express.js with ES modules (`"type": "module"`).
- `server.js` — entry point, serves static build from `client/dist` and mounts API routes
- `src/routes/rooms.js` — REST route handlers for all `/api/rooms` endpoints
- `src/services/roomService.js` — in-memory room state (Map), room lifecycle logic
- `src/services/recommendationService.js` — calls Claude API to generate 7 movie recommendations from group preferences, then enriches with TMDB poster URLs
- `src/services/tmdbService.js` — fetches poster URLs from TMDB `/search/movie`; no-ops gracefully if `TMDB_API_KEY` is not set

**Frontend (`client/`):** React 18 + React Router v6, built with Vite.
- `src/App.jsx` — router: `/` (Home) and `/room/:code` (RoomRouter)
- `src/api.js` — API client layer wrapping fetch calls
- `src/hooks/useRoom.js` — polls `/api/rooms/:code` every 2.5s to sync room state
- `src/pages/RoomRouter.jsx` — reads room state and renders the correct phase page. Also accepts `?participantId=&isHost=` URL params as a fallback (used for Figma screen capture only — not a real auth mechanism)
- `src/pages/` — one component per phase: Home, Lobby, Preferences, Voting, Results

**Room state machine:** `lobby → preferences → voting → results`
- Host advances phases via `POST /api/rooms/:code/advance`
- Transition from preferences→voting triggers Claude AI recommendation generation + TMDB poster enrichment
- Session identity stored in browser `sessionStorage` (participantId, isHost, roomCode) — **sessionStorage not localStorage**, so each browser tab is an independent user

**Styling:** Dark theme using CSS variables defined in `client/src/index.css` (--bg, --surface, --accent, --success). Voting and Results screens use full-bleed poster card UI with gradient overlays.

## API Endpoints

- `POST /api/rooms` — create room
- `GET /api/rooms/:code` — get room state (used for polling)
- `POST /api/rooms/:code/join` — join room
- `POST /api/rooms/:code/advance` — advance phase (host only)
- `POST /api/rooms/:code/preferences` — submit preferences
- `POST /api/rooms/:code/vote` — submit vote (up/down per movie)
- `GET /api/rooms/:code/results` — get ranked results (no thumbs-down, sorted by thumbs-up)
- `POST /api/rooms/:code/winner` — set winner (host only)

## Deployment

- **Production:** Railway — auto-deploys on push to `main` via GitHub (`ydvivi1213/my-movie-app`)
- Railway runs `npm run build` (builds React) then `npm start` (starts Express)
- Set `ANTHROPIC_API_KEY` and `TMDB_API_KEY` in Railway → Variables tab
- **Local sharing:** `ssh -R 80:localhost:3000 nokey@localhost.run` creates a temporary public URL (no account needed, URL changes each time)

## Session Progress (March 2026)

### What was built this session

Started from a single-file prototype (vanilla JS + Claude API). Rebuilt into a full multi-room session app:

**Core app:**
- Room service with in-memory state machine (`lobby → preferences → voting → results`)
- 8 REST API endpoints covering the full game loop
- React + Vite frontend with per-phase routing (RoomRouter polls every 2.5s)
- Fixed multi-user browser testing by switching `localStorage` → `sessionStorage`
- Deployed to Railway with auto-deploy on git push

**UI upgrades:**
- Voting screen: full-bleed poster cards with dark gradient overlay, in/out buttons overlaid
- Results screen: three-tier layout — hero winner card (340px with green glow), survivor cards (tappable by host to pick winner), eliminated cards (greyscale, dimmed)
- TMDB integration for real movie posters with gradient placeholder fallback

**Figma workflow established:**
- Capture script injected in `client/index.html` (leave it — used for re-captures)
- Existing Figma file: `https://www.figma.com/design/0mfJ6706wm1HoaCz7lFUrd` ("MovieTime UI")
- Contains 7 screens: Home, Lobby, Preferences ×3 states, Voting, Results
- Workflow: design in Figma → share URL → implement with `/figma:implement-design`

### What's not done yet (natural next steps)

- **TMDB_API_KEY not added to Railway** — posters not showing in production yet
- **Voting screen UX** — currently a scrollable list; could be a swipe card stack (Tinder-style)
- **Loading state during "Find matching movies"** — host sees a static button for ~10s while Claude runs; guests see nothing
- **Room expiry** — rooms live forever in memory; server restart wipes all rooms
- **Mobile polish** — functional on mobile but not optimized (font sizes, touch targets)
- **Reconnect flow** — if you close the tab and reopen, sessionStorage is gone and you can't rejoin your room
- **Shareable deep link** — guests currently need the code; could auto-join via URL (`/join/CODE`)
