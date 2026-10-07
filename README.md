# SonaMaint

SonaMaint is an intranet application for tracking PC maintenance history at the Sonatrach research laboratory in Boumerdes.

## Backend setup

The backend lives in [`backend/`](backend/). It requires Node.js LTS and PostgreSQL.

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Configure `.env` before starting the server. See [`backend/README.md`](backend/README.md) for architecture and verification commands.
