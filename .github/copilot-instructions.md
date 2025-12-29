# Copilot Instructions for Notebook

## Project Overview
Electron + React desktop note-taking app inspired by Obsidian/Notion. Local-first with rich embeds (Excalidraw, PDF, Mermaid, Kanban, Monaco, Spreadsheet). Uses Zustand for state, FlexLayout for tabs, and Tailwind for styling.

## Architecture

### Electron IPC Pattern
All file system operations flow through a strict IPC bridge:
- **Main process** ([src/main.ts](notebook/src/main.ts)): Defines `ipcMain.handle()` handlers for fs operations
- **Preload** ([src/preload.ts](notebook/src/preload.ts)): Exposes `window.electronAPI` via `contextBridge`
- **Types** ([src/electron.d.ts](notebook/src/electron.d.ts)): TypeScript declarations for the API
- **Usage** ([src/lib/fileSystem.ts](notebook/src/lib/fileSystem.ts)): Renderer-side wrapper functions

When adding new IPC operations: update all four files in order: main.ts → preload.ts → electron.d.ts → fileSystem.ts

### Embed System
Embeds in [src/components/embeds/](notebook/src/components/embeds/) follow a consistent pattern:
```tsx
interface EmbedProps {
  dataString: string;           // JSON-serialized content from file
  onChange: (newData: string) => void;  // Callback to save changes
}
```
- File extension determines embed type (see `FileTabContent` in [App.tsx](notebook/src/App.tsx#L45-L65))
- Parse `dataString` with `JSON.parse()` in initial state
- Call `onChange(JSON.stringify(data))` when content changes
- Handle Ctrl+S by dispatching `window.dispatchEvent(new Event('app-save'))`

### State Management
Single Zustand store in [src/store/store.ts](notebook/src/store/store.ts):
- `fileContents: Record<string, string>` — cached file content by path
- `unsavedChanges: Set<string>` — tracks dirty files
- `fileStructure: FileEntry[]` — recursive folder tree
- Always use Windows path separators (`\\`) for file paths

### File Types & Extensions
| Extension | Component | Data Format |
|-----------|-----------|-------------|
| `.excalidraw` | ExcalidrawEmbed | `{elements, appState}` JSON |
| `.mermaid` | MermaidEmbed | Mermaid DSL text |
| `.kanban` | KanbanEmbed | `{tasks, columns, columnOrder}` JSON |
| `.sheet` | SpreadsheetEmbed | JSON grid data |
| `.pdf` | PDFEmbed | Base64-encoded (read-only) |
| `.md` | Editor | Markdown with `[[wikilinks]]` |
| `.js,.ts,.py` etc | MonacoEmbed | Plain text |

## Development Commands
```bash
cd notebook
npm start          # Dev mode with hot reload + DevTools
npm run package    # Build unpacked app
npm run make       # Create distributable installer
```

## Key Conventions

### Adding a New Embed Type
1. Create `src/components/embeds/NewEmbed.tsx` following the `EmbedProps` pattern
2. Define a unique file extension (e.g., `.newtype`)
3. Add extension check in `FileTabContent` ([App.tsx](notebook/src/App.tsx#L45-L65))
4. Handle save with blur events or keyboard shortcuts

### Wikilink System
Links use `[[filename]]` syntax. Parsing in [src/lib/linkManager.ts](notebook/src/lib/linkManager.ts):
- `extractLinks()` — regex extracts link names
- `buildGraph()` — creates node/link data for GraphView
- Links resolve by filename match, not full path

### FlexLayout Tab Management
Uses `flexlayout-react` for dockable tabs. Key concepts:
- `Model.fromJson()` for layout state
- `factory` callback renders tab content based on `component` type
- Tab operations use `Actions.addNode()`, `Actions.deleteTab()`

### Styling
- Tailwind CSS with `clsx` for conditional classes
- Three themes: `obsidian`, `dark`, `light` (stored in Zustand)
- Typography plugin for markdown rendering
