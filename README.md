# Studio Ghibli Quiz

A fast, multiplayer-ready quiz game inspired by the Studio Ghibli universe.

## Play Online

Live app: **https://ghibli-quizz-app.onrender.com**

Create a room, share the code, and play with friends in real time.

## What the App Does

- Generates dynamic quiz sessions from live APIs.
- Supports solo mode and multiplayer room mode.
- Offers four question families:
	- Character species
	- Character -> movie
	- Movie -> character
	- Japanese movie title
- Uses a per-question timer and live score updates.
- Saves score history locally.
- Lets players report incorrect images directly from the question card.

## How It Is Built

### Frontend

- **Nuxt 4 + Vue 3 + TypeScript**
- Main game flow in `app/components/GameBoard.vue`
- Room/lobby controls in `app/components/GameRoomLobby.vue`
- Question card + image reporting in `app/components/QuizCard.vue`
- State composables:
	- `app/composables/useGameRoom.ts`
	- `app/composables/useGameSettings.ts`
	- `app/composables/useScoreHistory.ts`

### Quiz Generation Engine

- Question orchestration in `app/services/game/quizGame.ts`
- Question factories in `app/services/game/questionType/*`
- Data fetched from Ghibli API + Jikan API via typed service modules in `app/services/api/*`

### Multiplayer Realtime Service

- Dedicated Socket.IO server in `server/index.ts`
- Room lifecycle:
	- create
	- join
	- start
	- publish shared questions
	- submit answers
	- auto-advance when everyone answered
	- end/reset

### Reporting Pipeline

- Client-side report request in `app/services/api/Reports.ts`
- Server endpoint in `server/api/reports/question.post.ts`
- Reports persisted to `report/question-image-reports.json`

## Real Complexity (And Why It Matters)

This project is intentionally more than a basic quiz app.

1. **External API reliability and mismatched schemas**
	 - Character image lookup merges data from multiple sources.
	 - Includes exception mapping and graceful fallback strategies when a perfect match does not exist.

2. **Question validity guarantees**
	 - Generated questions are validated before use.
	 - Duplicate answer IDs and malformed choices are rejected.
	 - Quiz generation retries until enough valid questions are built.

3. **Realtime multiplayer synchronization**
	 - One host generates/publishes questions once.
	 - All players receive the exact same question set and timer.
	 - Room scoring is authoritative on the socket server.

4. **Deployment topology**
	 - The app runs as two services in production:
		 - Nuxt web app
		 - Socket server
	 - Render-specific host and public URL environment handling is wired in `render.yaml`.

## The Fun Parts

- Fast rounds with visual feedback and timer pressure.
- Room code flow for instant social play.
- End-of-game leaderboard with ranking.
- A built-in quality loop: if an image is wrong, players can report it from inside the game.

## Great Ideas Already in the Project

- **Shared-question multiplayer**: avoids each player generating different quiz content.
- **Image provenance metadata**: each question can carry context useful for debugging data quality.
- **Issue reporting as gameplay UX**: not hidden in admin tools, but available during the round.
- **Persistent local score history**: gives replay value without requiring authentication.

## Great Ideas for Next Versions

- Add difficulty presets (easy/normal/hard) based on distractor quality.
- Add team mode (2v2) with aggregated score.
- Add ranked seasonal ladders.
- Add screenshot attachments to image reports.
- Add optional account sync for cross-device history.

## Run Locally

Install dependencies:

```bash
npm install
```

Run frontend + socket server together:

```bash
npm run dev:full
```

For LAN testing:

```bash
npm run dev:full:network
```

App URL: `http://localhost:3000`

## Production Build

```bash
npm run build
npm run start
```

Socket service:

```bash
npm run start:socket
```

## Deploy on Render

This repo includes a ready-to-use blueprint: `render.yaml`.

Services:

- `ghibli-quizz-app` (Nuxt)
- `ghibli-quizz-socket` (Socket.IO)

Key env vars already defined:

- `SOCKET_HOST=0.0.0.0`
- `CLIENT_ORIGIN` (from app host)
- `NUXT_PUBLIC_SOCKET_URL=https://ghibli-quizz-socket.onrender.com`

## Project Goal

Build a quiz that is not only playable, but robust: resilient against imperfect APIs, fun in multiplayer, and easy to improve through user feedback.
