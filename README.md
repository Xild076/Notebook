# Notebook

A powerful, local-first note-taking desktop application built with Electron and React. Inspired by Obsidian, Notion, Excalidraw, OneNote, and GoodNotes.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Electron](https://img.shields.io/badge/Electron-39.2.7-47848F.svg?logo=electron) ![React](https://img.shields.io/badge/React-19.1.0-61DAFB.svg?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?logo=typescript)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [Extensibility](#extensibility)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### 📝 Rich Document Types

| Type | Description |
|------|-------------|
| **Markdown Editor** | GitHub-flavored markdown with syntax highlighting and live preview |
| **Excalidraw** | Freehand drawing, diagrams, and handwriting recognition |
| **PDF Viewer** | View and annotate PDF documents directly in-app |
| **Mermaid Diagrams** | Flowcharts, sequence diagrams, and more |
| **Code Playground** | Monaco editor (VS Code's editor) with full syntax highlighting |
| **Kanban Board** | Trello-style task management |
| **Spreadsheets** | Data grid for tabular data |
| **Desmos Calculator** | Embedded graphing calculator |
| **Website Embeds** | Embed any website in your notes |
| **CSV Viewer** | View and edit CSV files |
| **HTML Preview** | Render HTML files with live preview |

### 🎯 Core Features

- **File Explorer** — Obsidian/VS Code-style navigation with folder support
- **Flexible Layout** — Drag-and-drop tabs with split panes (FlexLayout)
- **Graph View** — Visualize connections between notes via `[[wikilinks]]`
- **Full-text Search** — Quickly find content across all files
- **Quick Switcher** — Rapidly navigate between files
- **Version History** — Track changes to your documents
- **Vault Manager** — Manage multiple note vaults
- **Dark Mode** — Eye-friendly theme support with customizable themes
- **AI Copilot** — Built-in AI assistant with safe tool-calling patterns
- **Local-first** — All data stays on your machine

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [Electron](https://www.electronjs.org/) + [Electron Forge](https://www.electronforge.io/) |
| Frontend | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Bundler | [Vite](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Layout | [FlexLayout React](https://github.com/nickelstar/FlexLayout) |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ALEXA8596/Notebook.git
cd Notebook/notebook

# Install dependencies
npm install

# Start the development server
npm start
```

### Build

```bash
# Package the app (unpacked)
npm run package

# Create distributable installer
npm run make
```

---

## Project Structure

```
notebook/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # IPC bridge (contextBridge)
│   ├── electron.d.ts        # TypeScript declarations for IPC
│   ├── renderer.tsx         # React entry point
│   ├── App.tsx              # Main React component & tab factory
│   ├── components/
│   │   ├── editor/          # Markdown editor components
│   │   ├── embeds/          # Embed components (Excalidraw, PDF, etc.)
│   │   ├── ui/              # Reusable UI components (Modal, ContextMenu)
│   │   ├── CopilotPanel.tsx # AI assistant
│   │   ├── FileExplorer.tsx # File tree navigation
│   │   ├── GraphView.tsx    # Note graph visualization
│   │   ├── SettingsModal.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── fileSystem.ts    # Renderer-side fs helpers
│   │   ├── linkManager.ts   # Wikilink parsing & graph building
│   │   ├── addonManager.ts  # Theme/plugin loading
│   │   └── versionHistory.ts
│   └── store/
│       └── store.ts         # Zustand global state
├── examples/                 # Example themes & plugins
├── forge.config.ts          # Electron Forge config
├── vite.*.config.ts         # Vite configurations
└── package.json
```

---

## Development

### Commands

All commands should be run from the `notebook/` directory:

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server with hot reload |
| `npm run package` | Build unpacked app |
| `npm run make` | Create distributable installer |

### Debugging

- DevTools are available in dev mode (Vite HMR + Electron Forge)
- Inspect IPC calls via `src/preload.ts` and `src/electron.d.ts`
- React components can be inspected with React DevTools

### IPC Architecture

All filesystem operations flow through the Electron IPC bridge. When adding new IPC endpoints, update these files **in order**:

1. `src/main.ts` — Add `ipcMain.handle()` handler
2. `src/preload.ts` — Expose via `contextBridge`
3. `src/electron.d.ts` — Add TypeScript declarations
4. `src/lib/fileSystem.ts` — Create renderer-side wrapper

> ⚠️ Never import Node `fs` directly in renderer code. Always use `window.electronAPI` or helpers in `src/lib/fileSystem.ts`.

### State Management

Global state is managed by a single Zustand store (`src/store/store.ts`):

| Key | Type | Description |
|-----|------|-------------|
| `fileContents` | `Record<string, string>` | Cached file content by path |
| `unsavedChanges` | `Set<string>` | Tracks dirty files |
| `fileStructure` | `FileEntry[]` | Recursive folder tree |

> Note: Paths use Windows-style separators (`\\`) internally.

---

## Extensibility

### Adding a New Embed Type

1. Create `src/components/embeds/MyEmbed.tsx`:
   ```tsx
   interface EmbedProps {
     dataString: string;
     onChange: (newData: string) => void;
   }
   ```
2. Register the file extension in `App.tsx`'s `FileTabContent` factory
3. Handle save via `onChange()` or the global `app-save` event

### Themes

Custom themes are CSS files placed in `examples/` (e.g., `Dracula.theme.css`). See existing themes for the pattern.

### Plugins

A plugin example exists at `examples/ExamplePlugin.plugin.js`. Currently experimental — no formal loader API is documented.

### AI Copilot

The built-in AI assistant (`src/components/CopilotPanel.tsx`) demonstrates:
- Safe tool-calling with permission modals
- Proposed edits shown as diffs before applying
- Session-level and per-tool allow/deny controls

---

## Roadmap

See [Roadmap.md](Roadmap.md) for planned features and progress.

**Planned/In Progress:**
- Command Palette enhancements
- Formal plugin API
- Automated testing

---

## Contributing

1. Follow existing code style
2. Keep IPC changes coordinated across all four files
3. Use Windows-style path separators (`\\`) for store keys
4. Test on your platform before submitting PRs

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

**Author:** [ALEXA8596](https://github.com/ALEXA8596)