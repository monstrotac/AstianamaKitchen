# The Gardeners — Order Management System

A web application for managing operations within The Order. The Solstice (admin) oversees Gardeners (members), assigns contracts, and monitors activity across the organisation.

## What it does

- **Oversight** — enlist new Gardeners, set code names, factions, and credentials
- **Contracts** — create and assign missions/tasks to Gardeners
- **Codex** — shared knowledge base with Nine Articles
- **Garden Channel** — live activity feed visible to all members
- **Rolls** — D20 dice rolls logged against contracts
- **Skills** — Gardener skill tracking
- **Sanctum** — restricted area for elevated members

Gardeners log in and see only their assigned contracts. They can edit notes, log rolls, and close contracts with harvest reports.

## Tech stack

- **Backend** — Node.js / Express, PostgreSQL, JWT auth (`gardeners-api`, port 3500)
- **Frontend** — Vite SPA (port 5173), proxies `/api` to the backend
- **Database** — PostgreSQL via Docker (port 5433)

## Quick start

See [SETUP.md](SETUP.md) for full setup instructions.

```bash
# 1. Start the database
docker compose up -d

# 2. Backend
cd backend && npm install
NODE_ENV=development npm run migrate
NODE_ENV=development npm run seed
npm run dev   # http://localhost:3500

# 3. Frontend (separate terminal)
cd frontend && npm install
npm run dev   # http://localhost:5173
```

Default admin login: `solstice@order.local` / `ChangeThisPassword123!`
**Change the password immediately after first login.**
