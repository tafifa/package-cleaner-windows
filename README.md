# PackClean

PackClean is a Windows desktop app built with Electron + React to help developers clean dependency folders across many projects.

## v1 Features

- Multi-root scanning for project detection:
  - JavaScript/Node (`package.json` -> `node_modules`)
  - PHP (`composer.json` -> `vendor`)
  - Flutter/Dart (`pubspec.yaml` -> `.dart_tool` and `.pub-cache`)
- Recursive package-folder size calculation.
- Per-project size status: `EMPTY`, `SMALL`, `MEDIUM`, `LARGE`, `INACTIVE`.
- Filter by type, status, size, and search keyword.
- Multi-select for bulk actions.
- Safe delete to Recycle Bin.
- Dependency reinstall by project type.
- Terminal output panel.

## Tech Stack

- Electron 28+
- React + Vite (JavaScript)
- CSS Variables (custom CSS)
- Secure IPC via `preload` + `contextBridge`

## Project Structure

```text
.
|-- electron
|   |-- main.js
|   |-- preload.js
|   `-- scanner.js
|-- src
|   |-- App.jsx
|   |-- main.jsx
|   |-- components
|   `-- styles
|-- index.html
|-- package.json
`-- vite.config.js
```

## Requirements

- Node.js 18+ (LTS recommended)
- pnpm (recommended) or npm
- Windows for full `.exe` packaging flow

## Run Locally

### pnpm

```bash
pnpm install
pnpm dev
```

### npm

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev            # Vite + Electron (development)
npm run build:renderer # Build Vite frontend into dist/
npm run build          # Build renderer + package installer
npm run start          # Run electron from source
```

## Quick Usage

1. Add one or more root folders from the sidebar.
2. Click `Scan Ulang`.
3. Use filters/search to find targets.
4. Select projects.
5. Use the floating action bar:
   - `Clear Selected`
   - `Delete Selected`
   - `Reinstall Selected`

## Security Notes

- Renderer does not use `nodeIntegration`.
- File-system operations go through IPC handlers in `electron/main.js`.
- Delete uses `shell.trashItem()` (Recycle Bin).

## Project Status / Next Steps

See [TODO.md](TODO.md).

## Contributing

Keep contributions small and focused.
Do not break the main flow (`scan -> filter -> select -> delete/reinstall`).
Use commit prefixes: `feat:`, `fix:`, `refactor:`, `docs:`.

## Agent Rules

See [AGENTS.md](AGENTS.md).

## License

MIT. See [LICENSE](LICENSE).
