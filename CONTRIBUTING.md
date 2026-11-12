# Contributing

Thanks for considering a contribution to TextFSM Editor.

This repository is split into two main parts:

- `frontend/` — React + Vite app for the editor UI
- `backend/` — FastAPI service for template parsing and static asset hosting

The project is intentionally structured so the frontend and backend can be developed independently while sharing the same workspace.

## Development setup

### Prerequisites

- Node.js 20+ and npm
- Python 3.12+
- uv (recommended for backend dependency management)
- Docker + Docker Compose (optional, for local container-based development)

### Install dependencies

```bash
git clone https://github.com/yuyosy/textfsm-editor.git
cd textfsm-editor

cd frontend
npm install

cd ../backend
uv sync
```

## Running the app locally

Open two terminals.

### Frontend

```bash
cd frontend
npm run dev
```

The app is usually served at `http://localhost:5173`.

For the browser-side Pyodide flow, use:

```bash
cd frontend
npm run dev -- --mode pyodide
```

This starts the frontend in the Pyodide execution mode and is useful for testing the browser-local parsing path.

### Backend

```bash
cd backend
uv run uvicorn src.main:app --reload
```

The API is served at `http://localhost:8000` by default.

### Quality checks and build targets

```bash
cd frontend
npm run check
npm run test -- --run
npm run build
npm run build:pyodide
```

The project supports both the standard backend build and the Pyodide build, and the parser mode is selected at runtime.

### Docker workflow

```bash
docker compose --profile dev up --build --watch
```

This is useful when you want to validate the same environment as the project container setup.

## Project structure

```text
textfsm-editor/
├ backend/
│   ├ src/
│   ├ public/
│   ├ pyproject.toml
│   ├ Dockerfile
│   └ ...
├ frontend/
│   ├ src/
│   ├ public/
│   ├ package.json
│   ├ vite.config.*
│   └ ...
├ README.md
├ README.ja.md
├ CONTRIBUTING.md
├ docker-compose.yml
├ .vscode/
├ pictures/
└ ...
```

## Typical quality checks

From the frontend project:

```bash
cd frontend
npm run check
npm run test -- --run
npm run build
```

The `check` script runs TypeScript and Biome validation. The `build` script compiles the frontend and prepares backend assets for deployment.

## Updating bundled template assets

If you need to refresh the bundled NTC templates or third-party notices, run the frontend asset generation scripts:

```bash
cd frontend
npm run vendor:ntc -- --version 9.3.0
npm run licenses
```

These commands are relevant when changing the pinned template source or the generated notices.

## Contribution guidelines

- Keep pull requests focused and reviewable.
- Prefer small, well-scoped changes.
- Update the relevant docs when behavior, setup, or workflow changes.
- Validate UI or backend changes with the smallest relevant command available.
- When changing startup, deployment, or environment behavior, update the README and this document together.

## Pull request flow

1. Create a topic branch from the current default branch.
2. Implement and validate the change.
3. Make sure the relevant documentation is up to date.
4. Open a pull request with a clear summary of what changed and why.

If you are unsure about the expected workflow, start from the setup commands above and use the existing scripts in `frontend/package.json` as the source of truth for local validation.
