<p align="center">
  <a href="https://github.com/yuyosy/textfsm-editor" target="_blank" rel="noopener noreferrer">
    <img width="180" src="pictures/icon.svg" alt="TextFSM Editor logo">
  </a>
</p>

# TextFSM Editor

A web-based editor for TextFSM templates with real-time parsing and validation. It helps network engineers and developers compose templates, run them against sample data, and inspect the parsed results in table or JSON form.

日本語版: [README.ja.md](README.ja.md)

> [!NOTE]
>
> This project is under active development. Some parts of the implementation may still be rough, and security/performance hardening may be incomplete.

![screenshot1](pictures/editor.png)

## Features

- 🎨 Interface Themes
  - Light and Dark mode support
- 📝 Advanced Editor Integration (Monaco Editor)
  - TextFSM syntax highlighting
  - Intelligent word suggestions and auto-completion
  - Code folding and minimap navigation
- 📄 Downloads Files
  - Supports downloading entered data and result data as files
- 📋 Clipboard Integration
  - Quick copy support

### Parsing Features

- ⚡ Real-time Template Parsing
  - Instant feedback on template changes
  - Error detection
- 🔍 Multiple Data View Options
  - Table view for structured data representation
  - JSON view for programmatic access
- 🕰️ Parsing history
  - The values of Data, Template, and Result are temporarily stored in LocalStorage

### Template Management
- 🗃️ Presets
  - Load template from NTC Templates
  - Template search using regular expressions, fuzzy search
- 🗂️ Template Management
  - Save templates to LocalStorage
  - Load existing templates
- 🖇️ Import/Export Capabilities
  - Import templates from files
  - Export templates to files

Interface theme
![interface theme](pictures/editor-theme.png)

Word suggestion and syntax highlighting
![Word suggestion and code highlight](pictures/feature-highlight-suggetion.png)

Table display of parsed data
![Table display of parsed data](pictures/feature-result-table-view.png)

JSON display of parsed data
![JSON display of parsed data](pictures/feature-result-json-view.png)

Editor's useful features
![Editor features](pictures/editor-features.png)


## Project structure

```text
textfsm-editor/
├ backend/                              # FastAPI backend
│   ├ src/                               # Python application code
│   ├ public/                            # Static assets and generated output
│   ├ pyproject.toml                     # Python project metadata and dependencies
│   ├ Dockerfile                         # Backend container definition
│   └ ...
├ frontend/                             # React frontend
│   ├ src/                               # TypeScript application source
│   ├ public/                            # Static assets bundled by Vite
│   ├ package.json                       # Frontend scripts and dependencies
│   └ ...
├ docker-compose.yml                    # Container orchestration
├ README.md                             # English overview
├ README.ja.md                          # Japanese overview
├ CONTRIBUTING.md                       # Development and contribution workflow
├ textfsm-editor.code-workspace
├ pictures/                             # Screenshots and icons
└ ...
```

Open the workspace file in VS Code to work on both applications together.

## Quick start

### Prerequisites

- Node.js 20+ and npm
- Python 3.12+
- uv for backend dependency installation
- Docker + Docker Compose (optional)

### Install dependencies

```bash
git clone https://github.com/yuyosy/textfsm-editor.git
cd textfsm-editor

cd frontend
npm install

cd ../backend
uv sync
```

### Run in development mode

Open two terminals.

```bash
# Terminal 1: frontend (standard dev mode)
cd frontend
npm run dev
```

```bash
# Terminal 2: backend API
cd backend
uv run uvicorn src.main:app --reload
```

You can also run the frontend in the browser-side Pyodide mode for local parsing without the backend:

```bash
cd frontend
npm run dev -- --mode pyodide
```

This is useful for testing the browser-only execution path. The app still exposes the same frontend URL on Vite, and the selected parser mode is saved in local storage.

Then open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

### Build modes

The frontend supports multiple processing modes:

- `npm run build:backend` — builds the normal app and targets the backend API flow
- `npm run build:pyodide` — builds the static browser version using Pyodide
- `npm run build` — same as the backend build
- `npm run build:deploy` — builds the frontend and copies it into the backend for production serving

### Docker Compose

```bash
docker compose --profile dev up --build --watch
```

Access the same endpoints above after the containers start.

## Production build

```bash
cd frontend
npm run build:deploy
```

This builds the frontend and copies the generated static files to the backend. Then run the backend in production mode:

```bash
cd backend
MODE=production uv run uvicorn src.main:app --host 0.0.0.0 --port 8000
```

## Development guide

For setup details, code quality checks, and contribution workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT License. Copyright (c) 2023 yuyosy

## References

- [Monaco Editor](https://github.com/microsoft/monaco-editor)
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [FastAPI](https://fastapi.tiangolo.com)
