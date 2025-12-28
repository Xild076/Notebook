# Notebook

A powerful, all-in-one note-taking desktop application built with Electron and React. Inspired by Obsidian, Notion, Excalidraw, OneNote, and GoodNotes.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Electron](https://img.shields.io/badge/Electron-39.2.7-47848F.svg?logo=electron) ![React](https://img.shields.io/badge/React-19.1.0-61DAFB.svg?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?logo=typescript)

## Features

### Rich Document Types
- **Markdown Editor** — Write and preview GitHub-flavored markdown with syntax highlighting
- **Excalidraw Integration** — Freehand drawing and diagrams with handwriting recognition
- **PDF Viewer & Annotator** — View and annotate PDF documents directly in the app
- **Mermaid Diagrams** — Create flowcharts, sequence diagrams, and more
- **Code Playground** — Monaco editor (VS Code's editor) with syntax highlighting
- **Kanban Board** — Trello-style task management boards
- **Spreadsheets** — Data grid for tabular data
- **Desmos Calculator** — Embedded graphing calculator
- **Website Embeds** — Embed any website in your notes

### Core Features
- **File System Navigation** — Obsidian/VS Code-style file explorer with folder support
- **Flexible Layout** — Drag-and-drop tab management with split panes (FlexLayout)
- **Graph View** — Visualize connections between your notes
- **Full-text Search** — Quickly find content across all your files
- **Dark Mode** — Eye-friendly dark theme support
- **Local-first** — All your data stays on your machine

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [Electron](https://www.electronjs.org/) with [Electron Forge](https://www.electronforge.io/) |
| Frontend | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Bundler | [Vite](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Layout | [FlexLayout React](https://github.com/nickelstar/FlexLayout) |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Icons | [Lucide React](https://lucide.dev/) |

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
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
# Package the app for your platform
npm run package

# Create distributable installers
npm run make
```

## Project Structure

```
notebook/
├── src/
│   ├── main.ts           # Electron main process
│   ├── preload.ts        # Preload script for IPC bridge
│   ├── renderer.tsx      # React entry point
│   ├── App.tsx           # Main React component
│   ├── components/
│   │   ├── editor/       # Editor components
│   │   ├── embeds/       # Embed components (Excalidraw, PDF, etc.)
│   │   ├── ui/           # Reusable UI components
│   │   ├── FileExplorer.tsx
│   │   ├── GraphView.tsx
│   │   └── ...
│   ├── lib/              # Utility functions
│   └── store/            # Zustand state management
├── forge.config.ts       # Electron Forge configuration
├── vite.*.config.ts      # Vite configurations
└── package.json
```

## Roadmap

See [Roadmap.md](Roadmap.md) for planned features and progress.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**ALEXA8596**