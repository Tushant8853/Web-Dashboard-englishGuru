# English Guru — Web Dashboard

React admin dashboard for the English Guru app. Manages intro/sales videos, chat UI flags, and user overview stats via the FastAPI backend.

## Stack

- Vite 6 + React 19 + React Router 7 + Tailwind CSS 4 + Axios

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

## Environment

| Variable | Description |
| -------- | ----------- |
| `VITE_PORT` | Dev server port (default `5173`) |
| `VITE_API_BASE_URL` | Node backend origin, e.g. `http://localhost:4001` |
| `VITE_ASSET_BASE_URL` | CloudFront base URL for video preview |

Backend must have `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_JWT_SECRET` configured for login.

## Scripts

- `npm run dev` — local development
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build

## API

All routes use the backend prefix `/api/web-admin/*` (login, overview, intro/sales video config and upload, chat UI config).
