# Incident Frontend

A Vue 3 + TypeScript frontend for the FastAPI backend in `E:\python_files\incident_dispatch`.

## Stack

- Vue 3
- Vue Router
- Vite
- TypeScript

## Design Notes

- The auth screen mirrors the structure and motion style of `E:\frontend\news_front2`.
- The UI language is English.
- The main workspace uses a white, restrained operational theme.

## API Base URL

The app reads `VITE_API_BASE_URL`.

Default development behavior:

```bash
leave it empty and Vite will proxy `/api` to `http://127.0.0.1:8000`
```

Optional local override:

```bash
cp .env.example .env
```

Then edit:

```bash
VITE_API_BASE_URL=
```

## Commands

Install:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Implemented Views

- Login / register
- Overview
- Incidents
- Tasks
- Teams
- Notifications

## Backend Endpoints Used

- `POST /api/v1/users/register`
- `POST /api/v1/users/login`
- `GET /api/v1/users/me`
- `GET /api/v1/users`
- `GET /api/v1/incidents`
- `GET /api/v1/incidents/mine`
- `GET /api/v1/incidents/search`
- `POST /api/v1/incidents`
- `GET /api/v1/incidents/{incident_id}`
- `POST /api/v1/incidents/{incident_id}/assign`
- `PATCH /api/v1/incidents/{incident_id}/status`
- `POST /api/v1/incidents/{incident_id}/comments`
- `GET /api/v1/incidents/{incident_id}/comments`
- `GET /api/v1/incidents/{incident_id}/timeline`
- `GET /api/v1/tasks/mine`
- `POST /api/v1/tasks/incident/{incident_id}`
- `GET /api/v1/tasks/incident/{incident_id}`
- `PATCH /api/v1/tasks/{task_id}/status`
- `GET /api/v1/teams`
- `POST /api/v1/teams`
- `GET /api/v1/teams/{team_id}/members`
- `POST /api/v1/teams/{team_id}/members`
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/{notification_id}/read`
- `POST /api/v1/notifications/read_all`
