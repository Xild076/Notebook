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

```markdown
# Copilot Instructions — Notebook (concise)

Purpose: help AI coding agents become productive quickly by describing architecture, conventions, common change patterns, and where to look for concrete examples.

Core pointers
- Renderer (React + Vite): [notebook/src/renderer.tsx](notebook/src/renderer.tsx) and [notebook/src/App.tsx](notebook/src/App.tsx). UI components live under [notebook/src/components/](notebook/src/components/).
- Electron main/preload: IPC surface lives in [notebook/src/main.ts](notebook/src/main.ts) and [notebook/src/preload.ts](notebook/src/preload.ts). Type declarations: [notebook/src/electron.d.ts](notebook/src/electron.d.ts).
- Renderer → Native calls: use `window.electronAPI` methods (see [notebook/src/lib/fileSystem.ts](notebook/src/lib/fileSystem.ts)) instead of direct Node fs calls.

IPC rules (must-follow)
- When adding a new IPC endpoint/update: 1) add handler in `main.ts`, 2) expose it via `preload.ts`, 3) add TypeScript types in `electron.d.ts`, 4) surface a friendly wrapper in `src/lib/fileSystem.ts` for renderer usage.

Embed pattern (how content components work)
- Embeds are in `src/components/embeds/`. Each embed follows an `EmbedProps` pattern: a `dataString` prop (file contents) and `onChange(newData: string)` callback.
- File extension → component mapping is done in `App.tsx`'s `FileTabContent` factory (see that file for exact checks).
- Example: add `src/components/embeds/MyEmbed.tsx`, register its extension in `FileTabContent`, and persist via the `onChange` callback.

State & file model
- Global state: single Zustand store at `src/store/store.ts`.
- Important keys: `fileContents: Record<string,string>`, `unsavedChanges: Set<string>`, `fileStructure: FileEntry[]`.
- Paths: the app expects Windows-style separators (`\\`) for internal keys in `fileContents` — keep this in mind when manipulating paths programmatically.

Tools & developer workflow
- Dev files live under the `notebook/` subfolder — run dev/build commands from there.
- Common commands (run from `notebook`):
  - `npm install`
  - `npm start`          # dev mode (Vite + Electron Forge)
  - `npm run package`    # build unpacked app
  - `npm run make`       # create distributable installer

Integration points and conventions
- File-system and vault interactions should go through `src/lib/fileSystem.ts` and `window.electronAPI` (no direct fs usage in renderer).
- IPC changes require coordinated edits in 4 places (main→preload→types→lib). Tests and builds often fail silently if types are not updated.
- Layout/tabs are managed with `flexlayout-react` (look for `Model.fromJson()` usage in `App.tsx`); adding new tab types uses the `factory` callback.
- The in-app AI panel (`src/components/CopilotPanel.tsx`) demonstrates how to define tool schemas and a permission flow for tool calls — useful when adding assistant-assisted features.

Project-specific behaviors worth knowing
- Ctrl+S / save flow: some components trigger a global `app-save` event: `window.dispatchEvent(new Event('app-save'))` — use this to hook save logic.
- Embeds: many expect JSON `dataString` (e.g., `.excalidraw`, `.kanban`, `.sheet`) while others use plain text (`.md`, code files) or base64 (`.pdf`). See `src/components/embeds/` for exact expectations.
- The in-app AI panel (`src/components/CopilotPanel.tsx`) demonstrates a tool permission flow and how to surface proposed file edits without applying them automatically.

Where to look for concrete examples
- IPC: [notebook/src/main.ts](notebook/src/main.ts), [notebook/src/preload.ts](notebook/src/preload.ts), [notebook/src/electron.d.ts](notebook/src/electron.d.ts), [notebook/src/lib/fileSystem.ts](notebook/src/lib/fileSystem.ts)
- Embeds: [notebook/src/components/embeds/](notebook/src/components/embeds/)
- State: [notebook/src/store/store.ts](notebook/src/store/store.ts)
- Layout & tabs: [notebook/src/App.tsx](notebook/src/App.tsx)
- AI + tooling example: [notebook/src/components/CopilotPanel.tsx](notebook/src/components/CopilotPanel.tsx)

Agent guidance (practical rules)
- Preserve the IPC sequence when editing native bridges — changing one file without the others causes runtime/type errors.
- Prefer adding a helper in `src/lib/fileSystem.ts` rather than calling `window.electronAPI` ad-hoc from many components.
- When proposing large edits, update `electron.d.ts` types and `fileSystem.ts` wrappers as part of the same change.
- Keep changes minimal and component-scoped: add new embed components + register them in `App.tsx` rather than modifying core state logic.

If anything here is unclear or you want more examples (for instance a new embed template or an IPC example), tell me which area to expand.
```
