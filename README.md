# GraphQL Profile Dashboard

[![CI](https://github.com/terry-xyz/graphql/actions/workflows/ci.yml/badge.svg)](https://github.com/terry-xyz/graphql/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/terry-xyz/graphql/actions/workflows/pages.yml/badge.svg)](https://github.com/terry-xyz/graphql/actions/workflows/pages.yml)

A browser-based profile dashboard for the Zone01 platform. It authenticates with the Zone01 API, then displays identity details, XP progression, and audit statistics with SVG charts.

## Requirements

- Node.js 20 or newer for checks and builds
- A Zone01 account
- A modern browser

## Run locally

```bash
npm install
npm run build
npx --yes serve dist
```

Open the local URL printed by `serve`. The app must be served over HTTP because browser module loading is restricted when opening `index.html` directly from disk.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm test` | Run the test suite |
| `npm run build` | Copy the production site into `dist/` |
| `npm run check` | Run tests, syntax checks, and a production build |

## Configuration and security

The Zone01 API endpoints are defined in [`src/config.js`](src/config.js). No API secrets are required or stored in this repository. Login credentials are sent directly to the configured Zone01 authentication endpoint over HTTPS, and the returned session token is kept in browser local storage until logout or the storage is cleared.

## Deployment

The repository includes a GitHub Pages workflow at [`.github/workflows/pages.yml`](.github/workflows/pages.yml). To enable it in a new repository:

1. Open **Settings → Pages**.
2. Set **Build and deployment** to **GitHub Actions**.
3. Push to `main` or run the deployment workflow manually.

The published site is expected at [terry-xyz.github.io/graphql](https://terry-xyz.github.io/graphql/) after the first successful deployment.

## Project layout

- [`index.html`](index.html) — browser entrypoint and accessible page structure
- [`src/`](src) — authentication, GraphQL access, rendering, and styles
- [`tests/`](tests) — dependency-free Node.js tests
- [`docs/`](docs) — project notes and original assignment material

The source code and tests are the authority for application behavior; this README is intentionally limited to setup and operational guidance.
