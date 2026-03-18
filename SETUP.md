# The Gardeners — Setup

## Prerequisites
- Node.js 18+
- Docker (for the database)

---

## 1. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL on **port 5433** (host) to avoid conflicts with any existing DB on 5432.
The database, user, and password are all `gardeners`. Data is persisted in a Docker volume.

---

## 2. Backend

```bash
cd backend
npm install
```

`.env.development` is pre-configured for the Docker DB:
```
DATABASE_URL=postgresql://gardeners:gardeners@localhost:5433/gardeners_dev
JWT_SECRET=dev_gardeners_secret_change_me
```

Run migrations:
```bash
NODE_ENV=development npm run migrate
```

Seed initial data (Nine Articles + Solstice account):
```bash
NODE_ENV=development npm run seed
```

Default Solstice login: `solstice@order.local` / `ChangeThisPassword123!`
**Change the password immediately after first login via Admin → Reset PW.**

Start the dev server:
```bash
npm run dev
# API runs on http://localhost:3500
```

---

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
# Proxies /api → http://localhost:3500
```

Open `http://localhost:5173` in your browser.

---

## Workflow

1. Log in as The Solstice
2. Go to **Oversight** tab → enlist new Gardeners (set code name, faction, email, passphrase)
3. Create contracts in **Contracts** tab → assign them to Gardeners
4. Gardeners log in and see only their assigned contracts
5. Gardeners edit notes, log D20 rolls, and close contracts with harvest reports
6. All members see the live feed in **Garden Channel**

---

## Environment files (not committed to git)

- `backend/.env.development` — dev DB, port 3500
- `backend/.env.production` — prod DB, port 3501
- `frontend/.env.development` — `VITE_API_URL=/api` (proxied)
- `frontend/.env.production` — `VITE_API_URL=https://your-api-domain/api`
