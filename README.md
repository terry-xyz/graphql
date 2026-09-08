# GraphQL Profile Dashboard

[![CI](https://github.com/terry-xyz/graphql/actions/workflows/ci.yml/badge.svg)](https://github.com/terry-xyz/graphql/actions/workflows/ci.yml)

A browser-based profile dashboard for the Zone01 platform. It authenticates with the Zone01 API, then displays identity details, XP progression, and audit statistics with SVG charts.

## Requirements

- Node.js 20 or newer for checks
- A Zone01 account
- A modern browser

## Run locally

```bash
npm install
npx --yes serve .
```

Open the local URL printed by `serve`. The app must be served over HTTP because browser module loading is restricted when opening `index.html` directly from disk.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm test` | Run the test suite |
| `npm run check` | Run tests and syntax checks |

## Configuration and security

The Zone01 API endpoints are defined in [`src/config.js`](src/config.js). No API secrets are required or stored in this repository. Login credentials are sent directly to the configured Zone01 authentication endpoint over HTTPS, and the returned JWT is kept in a cookie with `Max-Age=86400` (24 hours), `SameSite=Strict`, and `Path=/`; the session is restored after page reloads until logout or expiry.

## Project layout

- [`index.html`](index.html) — browser entrypoint and accessible page structure
- [`src/`](src) — authentication, GraphQL access, rendering, and styles
- [`tests/`](tests) — dependency-free Node.js tests
- [`docs/`](docs) — project notes and original assignment material

The source code and tests are the authority for application behavior; this README is intentionally limited to setup and operational guidance.
