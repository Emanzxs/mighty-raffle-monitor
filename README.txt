Mighty.ph Raffle Monitor + FlareSolverr (Windows)

REQUIREMENTS
- Node.js 18 or newer (Node 20+ recommended)
- FlareSolverr running at http://localhost:8191

START
1. Extract this ZIP into a folder.
2. Keep your FlareSolverr terminal running.
3. Open PowerShell in this extracted folder.
4. Run: node server.js
5. Open http://localhost:3000 in your browser.

TEST
- Open http://localhost:3000/health
- Open http://localhost:3000/api/raffles
  The second URL should return JSON containing a "data" array.

IMPORTANT
- This connector assumes https://be.mighty.ph/api/v1/raffles returns JSON shaped like
  { "data": [ { "id": ..., "name": ..., "description": ..., "prize": { "quantity": ... } } ] }.
- If /api/raffles reports that it received non-JSON or an unexpected response shape,
  the API may require headers/session cookies or may be returning an anti-bot challenge.
  Do not paste login tokens, passwords, or session cookies into public chats.
- Keep this server bound to 127.0.0.1. Do not expose it publicly without adding
  authentication and appropriate security protections.
