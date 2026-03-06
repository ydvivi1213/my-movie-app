# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MovieTime is a group movie-picking app where participants join a room, submit preferences, and vote on AI-generated recommendations. It uses a React frontend (Vite) and Express backend with Claude AI for movie recommendations. All room state is held in-memory (no database).

## Commands

```bash
# Run production server (serves React build + API on port 3000)
ANTHROPIC_API_KEY=... TMDB_API_KEY=... node server.js

# Build client
npm run build  # runs: cd client && npm install && npm run build

# Frontend dev server (port 5173, proxies /api to localhost:3000)
cd client && npm run dev
```

No test or lint tooling is configured.

**Required env variables:**
- `ANTHROPIC_API_KEY` — required for Claude recommendation service
- `TMDB_API_KEY` — enables real movie posters via TMDB API (free at themoviedb.org/settings/api). Without it, cards show deterministic gradient placeholders.

## Architecture

**Backend (root):** Express.js with ES modules (`"type": "module"`).
- `server.js` — entry point, serves static build from `client/dist`, mounts `/api/rooms` routes
- `src/routes/rooms.js` — REST route handlers for all `/api/rooms` endpoints
- `src/services/roomService.js` — in-memory room state (Map), full room lifecycle + `sanitize()` for safe public payloads
- `src/services/recommendationService.js` — calls Claude API to generate 7 recommendations from group preferences, then enriches with TMDB poster URLs
- `src/services/tmdbService.js` — fetches poster URLs from TMDB `/search/movie`; no-ops gracefully if `TMDB_API_KEY` not set

**Frontend (`client/`):** React 18 + React Router v6, built with Vite.
- `src/App.jsx` — router: `/` → Home, `/room/:code` → RoomRouter
- `src/api.js` — fetch wrapper for all API calls
- `src/hooks/useRoom.js` — polls `/api/rooms/:code` every 2.5s to keep room state in sync
- `src/pages/RoomRouter.jsx` — polls room state and routes to correct phase page. Also accepts `?participantId=&isHost=` URL params as fallback (used for Figma captures only)
- `src/pages/` — one component per phase: Home, Lobby, Preferences, Voting, Results

**Room state machine:** `lobby → preferences → voting → results`
- Host advances phases via `POST /api/rooms/:code/advance`
- Transition preferences→voting triggers Claude AI call + TMDB poster enrichment (~10s)
- Session stored in `sessionStorage` (not localStorage) — each browser tab = independent user

**Styling:** Purple glassmorphism theme. CSS variables in `client/src/index.css`:
- Background: `#0a0814` + two ambient purple radial gradients (`background-attachment: fixed`)
- Cards: `rgba(139,92,246,0.06)` + `blur(24px)` + `rgba(139,92,246,0.2)` border
- Featured cards: stronger glow border `rgba(139,92,246,0.55)` + `box-shadow` glow
- Primary buttons: `linear-gradient(135deg, #7c3aed, #9f67fa)` with purple glow shadow
- Voting/Results: full-bleed poster cards with dark gradient overlay; page bg is transparent so ambient purple shows through

## API Endpoints

- `POST /api/rooms` — create room
- `GET /api/rooms/:code` — get room state (polled every 2.5s)
- `POST /api/rooms/:code/join` — join room
- `POST /api/rooms/:code/advance` — advance phase (host only; preferences→voting triggers Claude+TMDB)
- `POST /api/rooms/:code/preferences` — submit preferences
- `POST /api/rooms/:code/vote` — submit vote (up/down per movie)
- `GET /api/rooms/:code/results` — ranked results (no thumbs-down, sorted by thumbs-up)
- `POST /api/rooms/:code/winner` — set winner (host only)

## Deployment

- **Production:** Railway — auto-deploys on push to `main` via GitHub (`ydvivi1213/my-movie-app`)
- Railway runs `npm run build` then `npm start`
- Both `ANTHROPIC_API_KEY` and `TMDB_API_KEY` are set in Railway → Variables tab
- **Temporary public URL:** `ssh -R 80:localhost:3000 nokey@localhost.run` (no account, URL changes each session)

## Figma Workflow

- Capture script is injected in `client/index.html` — leave it, used for re-captures
- Existing file: `https://www.figma.com/design/0mfJ6706wm1HoaCz7lFUrd` ("MovieTime UI")
- To capture a screen: use `mcp__figma-remote-mcp__generate_figma_design` with `outputMode: existingFile`, `fileKey: 0mfJ6706wm1HoaCz7lFUrd`
- RoomRouter accepts `?participantId=X&isHost=true` so screens can be opened directly for capture without a real session
- To implement a Figma design: use `/figma:implement-design` skill with the Figma URL

## Full Session History

### Session 1 — Core build (March 2026)

Started from a single-file vanilla JS prototype. Rebuilt into a full multi-room session app:

**Core:**
- In-memory room service with state machine (`lobby → preferences → voting → results`)
- 8 REST API endpoints covering the full game loop
- React + Vite frontend with RoomRouter polling every 2.5s
- Fixed multi-tab testing: switched `localStorage` → `sessionStorage`
- Deployed to Railway with GitHub auto-deploy

**UI — Voting screen:**
- Full-bleed poster cards with dark gradient overlay
- 👍/👎 vote buttons overlaid at bottom of each card
- Green/red border highlight reflects current vote

**UI — Results screen:**
- Three-tier layout: hero winner card (340px, green glow), survivor cards (tappable by host), eliminated cards (greyscale, dimmed)
- TMDB poster integration with deterministic gradient fallback

**UI — Visual theme (purple glassmorphism):**
- Deep `#0a0814` background with ambient purple radial gradients (fixed, so they don't scroll)
- All cards use glassmorphism: semi-transparent purple surface + blur + purple border
- Featured elements get stronger glow border + box-shadow
- Primary buttons: purple gradient (`#7c3aed → #9f67fa`) with glow

**Figma workflow:**
- All 8 screens captured to Figma file (Home ×2, Lobby, Preferences ×3, Voting, Results with real posters)
- TMDB_API_KEY: `eca0cfe8afcafc4c04010c3ba47cb624` (also set in Railway)

## What's Not Done Yet (Next Steps)

- **Voting UX** — scrollable list works but a swipe card stack (Tinder-style) would feel better on mobile
- **Loading state for "Find matching movies"** — host waits ~10s with no feedback; guests see nothing during this time
- **Room expiry** — rooms live forever in memory; server restart wipes all active rooms
- **Reconnect flow** — closing and reopening the tab loses sessionStorage; user can't rejoin their room
- **Shareable deep link** — guests type a code manually; could support `/join/CODE` URL to auto-populate
- **Mobile touch targets** — functional on phone but not optimized (some buttons small, no haptics)
