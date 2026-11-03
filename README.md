# Northwind Supply

A B2B workspace-supply storefront built with **Node.js, Express and React**. Teams can browse a focused product catalog, read and publish reviews, manage store credit, and — for operations staff — review account activity and run connectivity checks.

The app is a single Express process that serves the compiled React frontend and JSON API. A small companion site (`PerkPoint`) runs alongside it as a separate rewards partner.

## Requirements

- **Node.js 22.5+** (the data layer uses the built-in `node:sqlite` module; tested on Node 24)
- npm

## Run it

```bash
npm install
npm run demo          # builds the React app, then starts the servers
```

Open **http://localhost:3000**.

Port **4000** hosts the companion PerkPoint rewards page used in the customer-journey demo.

### Development

```bash
npm run dev
```

- React/Vite dev server: http://localhost:5173 (proxies `/api` to port 3000)
- Express API: http://localhost:3000
- PerkPoint: http://localhost:4000

### Other scripts

```bash
npm run build   # production build into dist/
npm start       # serve the existing build
```

## Demo accounts

| Username | Password | Role |
|----------|----------|------|
| `alice` | `alice123` | Member |
| `bob` | `bob123` | Member |
| `admin` | `S3cr3tAdm1n!` | Operations |
| `auditor` | `audit2026` | Member |
| `mallory` | `mallory123` | Member |

Member accounts start with store credit that can be transferred to another member. The admin account can open the operations overview and the network diagnostics tool.

## Features

- **Storefront** — featured products, categories and a simple buying flow.
- **Catalog** — keyword search plus category shortcuts from the storefront.
- **Product pages** — item details, ratings, customer reviews and review publishing.
- **Account** — profile summary, store-credit balance, credit transfers and recent activity.
- **Operations** — member/product/review/transfer snapshot and a connectivity check for outbound integrations.
- **PerkPoint** — a separate rewards-partner page, used to show how a third-party site can interact with the storefront.

Data is held in memory and reseeded on every server start, so restarts return the demo to a clean state.

## Project layout

```
server/
  db.js          in-memory SQLite schema and seed data
  index.js       Express API, session handling and static frontend
  attacker.js    companion PerkPoint site on port 4000
client/src/
  App.jsx        layout, routes and sidebar
  auth.jsx       session context
  api.js         fetch helper and formatting utilities
  components.jsx shared UI primitives
  pages/         store, catalog, product, login, account, admin, diagnostics
  styles.css     application styles
index.html
vite.config.js
```

## API overview

| Route | Purpose |
|-------|---------|
| `POST /api/auth/login` | Sign in and start a session |
| `GET /api/auth/me` | Current session and CSRF token |
| `POST /api/auth/logout` | End the session |
| `GET /api/products` | Catalog search (`?q=`) |
| `GET /api/products/:id` | Product details and reviews |
| `POST /api/products/:id/reviews` | Publish a review |
| `GET /api/account` | Profile, balance and transfers |
| `POST /api/account/transfer` | Send store credit |
| `GET /api/admin/overview` | Operations snapshot (admin only) |
| `POST /api/admin/diagnostics/ping` | Outbound connectivity check (admin only) |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Storefront port |
| `ATTACKER_PORT` | `4000` | PerkPoint port |
| `PROTECTED` | *(empty)* | Comma-separated list of hardening modules to enable |

The demonstration build defaults to the unhardened code paths so the customer-journey scenarios behave as expected. For a hardened run, start the server with the modules you want to enable:

```bash
PROTECTED=all node server/index.js
```

Individual module IDs are `sqli_auth`, `sqli_union`, `xss`, `cmdi` and `csrf`; `all` enables every one. Protection is configured on the server only — there is no in-app switch.

## Security notice

This project is a teaching artifact and is **intentionally not production-ready** in its default configuration. Run it on `localhost` only. Do not expose it to a network, and do not use it to test systems you do not own. For a hardened run, set `PROTECTED=all` as shown above.
