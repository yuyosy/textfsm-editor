# Frontend

## Builds and processing modes

Run `npm ci` from `frontend`, then choose a build:

| Command | Output | Processing modes |
| --- | --- | --- |
| `npm run build:backend` | `dist/` | Backend, JS compatibility |
| `npm run build:pyodide` | `dist-pyodide/` | Pyodide, JS compatibility |

`npm run build` builds the Backend edition. Use `npm run build:deploy` to copy
that build to FastAPI. Publish `dist-pyodide/` on a static host, or preview it
with `npm run preview -- --mode pyodide`. Use HTTPS or localhost.
Both builds restore the pinned NTC template sources from `SOURCE.json` if
missing, verify the archive SHA-256, and generate the static template assets.

- **JS compatibility** uses TxtFSM in a Web Worker. Some templates may fail or
  produce different results from Python TextFSM.
- **Backend** sends the input and template to Python TextFSM via
  `POST /api/parse`. Only the Backend build includes the API client.
- **Pyodide** runs Python TextFSM 2.1.0 in a browser Worker. The first Pyodide
  parse loads the runtime from jsDelivr and the package from PyPI. The
  Notifications panel shows the loading stage and lets you cancel. After a
  cancellation or startup error, select **Send** to retry or use the card to
  switch to **JS compatibility** and parse the current input.
  Both options in the Pyodide build process input and templates locally.

The help button explains the available modes. The selection is saved in local
storage and applies to both Send and AutoParse. The Backend build starts in
JS compatibility and the static build starts in Pyodide on first visit.
Switching modes cancels pending work
and clears the previous result. AutoParse reruns with the selected mode.
Cancellation stops waiting for an HTTP response; work already running on the
backend may continue there.

The API origin uses the existing `VITE_API_ENTRYPOINT_DEV` (default
`http://localhost:8000`) or `VITE_API_ENTRYPOINT_PROD` (default same origin).
The frontend adds `/api/parse`; configure the origin without that suffix.
For a separate backend origin, allow the frontend origin in the backend's
`CORS_ALLOWED_ORIGINS`. Restart Vite or rebuild after changing environment values.

## Runtime asset URLs

The static build reads the pinned defaults in `.env.pyodide`. To use a mirror
or serve the same files yourself, override these settings in
`.env.pyodide.local` or in the build environment:

| Setting | Asset |
| --- | --- |
| `VITE_PYODIDE_RUNTIME_URL` | Pyodide's `pyodide.mjs`. Keep the rest of the runtime distribution alongside it. |
| `VITE_TEXTFSM_WHEEL_URL` | The TextFSM wheel for the version pinned in `backend/uv.lock`. |
| `VITE_MONACO_BASE_URL` | Optional Monaco loader base ending in `/min/vs`. Set it in `.env.local` for both builds. |

Use an absolute URL or a path starting with `/` on the application origin.
Rebuild after changing the settings. The built files contain these public URLs.

## Updating ntc-templates

Run from `frontend` with Node.js 22 or later:

```sh
npm run vendor:ntc -- --version 9.3.0
```

The command downloads the specified source distribution from PyPI, verifies its
SHA-256 against PyPI metadata, and imports only `LICENSE`, `index`, and `.textfsm`
files. It generates `vendor/ntc-templates/VERSION` and `SOURCE.json` from the
downloaded contents, then runs the existing asset generator. No Python or tar
executable is required. The retrieval date is recorded in UTC. `template_count`
and `aggregate_bytes` count `.textfsm` files only, excluding `index` and LICENSE.

The archive and its index references are validated in a temporary directory
before updating the current vendor. Files are backed up and updated in place,
without moving the vendor directory (which can fail on Windows/network drives).
Failed updates restore the previous files. If recovery also fails, the error
reports the retained backup directory for manual recovery. A failed write to the public directory may require rerunning
`npm run assets:ntc`.

Public assets are generated directly into `src/public/ntc-templates/`, with
`manifest.json` and `templates/`. The version is recorded in the manifest;
application code does not pin a template version. Requests revalidate browser
caches, and template contents are verified against the manifest SHA-256.
The generator removes obsolete template files and old version directories with
a matching generated manifest after writing the new assets.

`src/public/THIRD_PARTY_NOTICES.txt` is generated automatically by `assets:ntc`
(and therefore `build`). The build command runs generation explicitly, even when
npm lifecycle hooks are disabled with `ignore-scripts`. It includes ntc-templates, installed runtime npm
dependencies and their transitive dependencies from `package-lock.json`, plus
the actual CDN version of Monaco. LICENSE, COPYING, NOTICE, and third-party
notice files at each package's top level are preserved verbatim, including the
Google TextFSM attribution distributed with TxtFSM. The list conservatively
includes installed runtime packages that bundling may remove. Build-only
dependencies are excluded. Vite's `build.license` also emits its list of bundled
dependencies in `dist/.vite/license.md`.

About provides a single link to `THIRD_PARTY_NOTICES.txt`. Do not edit this file
manually. After `npm ci`, regenerate it without rebuilding template assets with:

```sh
npm run licenses
```

Normal generation is offline. The Monaco loader's default CDN version is checked
against the license copies in `vendor/monaco-editor-cdn/`. After a loader update
changes that version, refresh those copies and regenerate:

```sh
npm run licenses:monaco
npm run licenses
```

Commit the CDN license copies and their SOURCE.json. If the application starts
overriding `loader.config` to use another CDN, update the collector to match.
Generation fails on missing license text, mismatched installed versions, or
stale CDN copies. Packages that omit license text require a version-specific,
reviewed copy in `vendor/license-overrides/`; the current react-remove-scroll-bar
copy records its upstream source and checksum. Review it when that package is
updated. Keep libraries used by the browser (including Shiki) in `dependencies`.
Review the vendor metadata, notices, license, and
generated manifest before committing. Template files are currently ignored by
Git (`vendor/ntc-templates/templates/**`); use `git add -f` for that directory if
the vendor contents should be available in a fresh checkout.

Normal builds use the local vendor and do not download or update it:

```sh
npm run assets:ntc
npm run build
```
