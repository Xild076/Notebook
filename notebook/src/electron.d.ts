// Type declarations for the Electron API exposed via preload script

interface DirEntry {
  name: string;
  isDirectory: boolean;
}

interface FileFilter {
  name: string;
  extensions: string[];
}

interface ElectronAPI {
  // Dialog APIs
  openFolder: () => Promise<string | null>;
  openFile: (options?: { filters?: FileFilter[] }) => Promise<string | null>;
  
  // File System APIs
  readDir: (dirPath: string) => Promise<DirEntry[]>;
  readTextFile: (filePath: string) => Promise<string>;
  readFile: (filePath: string) => Promise<Uint8Array>;
  writeTextFile: (filePath: string, content: string) => Promise<void>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<void>;
  mkdir: (dirPath: string) => Promise<void>;
  exists: (filePath: string) => Promise<boolean>;
  copyFile: (src: string, dest: string) => Promise<void>;
  moveFile: (src: string, dest: string) => Promise<void>;
  deleteFile: (filePath: string) => Promise<void>;
  showInExplorer: (filePath: string) => Promise<void>;
  
  // Menu action listeners
  onMenuAction: (callback: (action: string) => void) => void;
  onFormatAction: (callback: (action: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
