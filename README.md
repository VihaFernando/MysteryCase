# MysteryCase

```
frontend/   CMS (TanStack Start + React) — talks to the API via VITE_API_URL / VITE_WS_URL
backend/    Bun API + WebSocket + SQLite, shared by the CMS and the player app
  src/index.ts        Bun.serve wiring (CORS, /ws)
  src/config.ts       env config
  src/lib/            db (SQLite docs), http helpers, realtime broadcast
  src/routes/         one file per resource (cases, media, users, notifications, app)
```

## Run
```
bun run install:all
cp frontend/.env.example frontend/.env     # points the CMS at http://localhost:3001
cp backend/.env.example backend/.env
bun run dev:api    # API + WS on :3001
bun run dev:web    # CMS
```

Player app reads published cases from `GET /app/cases` and `GET /app/cases/:id` (no auth).
CMS routes follow `frontend/src/api/endpoints/index.ts`; set `API_TOKEN` to require a bearer token.
