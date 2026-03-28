# Skyline

## Overview

Skyline is a goal-tracking platform where users set goals, track progress, and visualize collective ambition through a Cleveland skyline-themed interface.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/skyline)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Replit Auth (OIDC/PKCE) via @workspace/replit-auth-web
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (server), Vite (frontend)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── skyline/            # React+Vite frontend (served at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── replit-auth-web/    # Replit Auth browser hook (useAuth)
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Pages

1. **Landing (/)** — Hero with Cleveland skyline background, CTA to login
2. **Dashboard (/dashboard)** — User's goals as building cards (bright=completed, dim=in-progress)
3. **Create Goal (/create-goal)** — Form for title, description, category, city
4. **Goal Detail (/goal/:id)** — Goal info + progress timeline + add update form
5. **Public Feed (/feed)** — All goals with filter by category/city

## Database Schema

- `users` — Replit Auth users (id, email, firstName, lastName, profileImageUrl)
- `sessions` — Session store (sid, sess, expire)
- `goals` — Goals (id, userId, title, description, category, city, status)
- `goal_updates` — Progress updates (id, goalId, userId, content)

## API Routes

All routes at `/api`:
- `GET /healthz` — Health check
- `GET /auth/user` — Current auth user
- `GET /login`, `GET /callback`, `GET /logout` — OIDC auth flow
- `GET /goals` — Public feed (filter by category, city)
- `POST /goals` — Create goal (auth required)
- `GET /goals/mine` — Current user's goals (auth required)
- `GET /goals/:id` — Goal detail with updates
- `PATCH /goals/:id` — Update goal status/content (auth required, owner only)
- `GET /goals/:id/updates` — List updates for a goal
- `POST /goals/:id/updates` — Add progress update (auth required)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all lib packages as project references.

## Development

- `pnpm --filter @workspace/api-server run dev` — Run API server
- `pnpm --filter @workspace/skyline run dev` — Run frontend
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API client/Zod schemas
- `pnpm --filter @workspace/db run push` — Push DB schema changes
