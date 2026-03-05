# Bookend Docs

## CI

The project uses GitHub Actions workflow in [.github/workflows/ci.yml](../../.github/workflows/ci.yml).

### What runs
- **backend-smoke:** installs backend dependencies and runs `npm run test:smoke` in `bookend/backend`
- **frontend-build:** installs frontend dependencies and runs `npm run build` in `bookend/frontend`

### Trigger
- Runs on every push
- Runs on every pull request

### Local equivalent checks
- Backend smoke test:
  - `cd bookend/backend`
  - `npm ci`
  - `npm run test:smoke`
- Frontend build:
  - `cd bookend/frontend`
  - `npm ci`
  - `npm run build`
