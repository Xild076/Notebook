import React, { useState, DragEvent, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, FilePlus, FolderPlus, ImagePlus, Folder, Pencil, GitBranch, Code, Kanban, Table, FileText, Plus, ChevronUp } from 'lucide-react';
import { FileEntry, useAppStore } from '../store/store';
import { createFile, createFolder, loadFileStructure } from '../lib/fileSystem';
import { InputModal } from './ui/InputModal';
import clsx from 'clsx';

// File type definitions for quick create
const FILE_TYPES = [
  { extension: '.md', label: 'Markdown', icon: FileText, defaultContent: '# New Note\n\n' },
  { extension: '.excalidraw', label: 'Excalidraw', icon: Pencil, defaultContent: '{"elements":[],"appState":{}}' },
  { extension: '.mermaid', label: 'Mermaid Diagram', icon: GitBranch, defaultContent: 'graph TD\n    A[Start] --> B[End]' },
  { extension: '.kanban', label: 'Kanban Board', icon: Kanban, defaultContent: '{"columns":[],"tasks":{}}' },
  { extension: '.sheet', label: 'Spreadsheet', icon: Table, defaultContent: '[]' },
  { extension: '.js', label: 'JavaScript', icon: Code, defaultContent: '// JavaScript file\n' },
  { extension: '.ts', label: 'TypeScript', icon: Code, defaultContent: '// TypeScript file\n' },
  { extension: '.json', label: 'JSON', icon: Code, defaultContent: '{\n  \n}' },
];

interface FileNodeProps {
  entry: FileEntry;
  depth?: number;
  onMoveFile: (sourcePath: string, targetFolder: string) => void;
}

const FileNode: React.FC<FileNodeProps> = ({ entry, depth = 0, onMoveFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { openFile, activeFile } = useAppStore();

  const handleClick = () => {
    if (entry.isDirectory) {
      setIsOpen(!isOpen);
    } else {
      openFile(entry.path);
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', entry.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (entry.isDirectory) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (entry.isDirectory) {
      const sourcePath = e.dataTransfer.getData('text/plain');
      if (sourcePath && sourcePath !== entry.path) {
        onMoveFile(sourcePath, entry.path);
      }
    }
  };

  return (
    <div>
      <div 
        className={clsx(
          "flex items-center py-1 px-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 select-none transition-colors",
          activeFile === entry.path && "bg-blue-100 dark:bg-blue-900",
          isDragOver && entry.isDirectory && "bg-blue-200 dark:bg-blue-800 ring-2 ring-blue-500"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="mr-1 text-gray-500">
          {entry.isDirectory ? (
            isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <File size={16} />
          )}
        </span>
        <span className="truncate text-sm">{entry.name}</span>
      </div>
      {isOpen && entry.children && (
        <div>
          {entry.children.map((child) => (
            <FileNode key={child.path} entry={child} depth={depth + 1} onMoveFile={onMoveFile} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC = () => {
  const { fileStructure, currentPath, setFileStructure } = useAppStore();
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<typeof FILE_TYPES[0] | null>(null);
  const quickCreateRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target as Node)) {
        setIsQuickCreateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refreshFileStructure = async () => {
    if (currentPath) {
      const files = await loadFileStructure(currentPath);
      setFileStructure(files);
    }
  };

  const handleMoveFile = async (sourcePath: string, targetFolder: string) => {
    try {
      const fileName = sourcePath.split('\\').pop();
      if (!fileName) return;
      
      const destPath = `${targetFolder}\\${fileName}`;
      
      // Don't move if destination is the same as source parent
      const sourceParent = sourcePath.substring(0, sourcePath.lastIndexOf('\\'));
      if (sourceParent === targetFolder) return;
      
      await window.electronAPI.moveFile(sourcePath, destPath);
      await refreshFileStructure();
    } catch (e) {
      console.error("Failed to move file", e);
      alert("Failed to move file: " + (e as Error).message);
    }
  };

  const handleCreateFile = async (name: string) => {
    if (!currentPath || !name) return;
    try {
      // If a quick create type is selected, append its extension and use default content
      let fullPath = `${currentPath}\\${name}`;
      let content = '';
      
      if (quickCreateType) {
        if (!name.endsWith(quickCreateType.extension)) {
          fullPath = `${currentPath}\\${name}${quickCreateType.extension}`;
        }
        content = quickCreateType.defaultContent;
        setQuickCreateType(null);
      }
      
      await createFile(fullPath, content);
      const files = await loadFileStructure(currentPath);
      setFileStructure(files);
    } catch (e) {
      console.error("Failed to create file", e);
      alert("Failed to create file");
    }
  };

  const handleQuickCreate = (fileType: typeof FILE_TYPES[0]) => {
    setQuickCreateType(fileType);
    setIsQuickCreateOpen(false);
    setIsNewFileModalOpen(true);
  };

  const handleCreateFolder = async (name: string) => {
    if (!currentPath || !name) return;
    try {
      const fullPath = `${currentPath}\\${name}`;
      await createFolder(fullPath);
      const files = await loadFileStructure(currentPath);
      setFileStructure(files);
    } catch (e) {
      console.error("Failed to create folder", e);
      alert("Failed to create folder");
    }
  };

  const handleImportImage = async () => {
    if (!currentPath) return;
    try {
      const selected = await window.electronAPI.openFile({
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
        }]
      });

      if (selected && typeof selected === 'string') {
        const fileName = selected.split('\\').pop();
        if (fileName) {
          const destPath = `${currentPath}\\${fileName}`;
          await window.electronAPI.copyFile(selected, destPath);
          const files = await loadFileStructure(currentPath);
          setFileStructure(files);
        }
      }
    } catch (e) {
      console.error("Failed to import image", e);
      alert("Failed to import image");
    }
  };

  const [isRootDragOver, setIsRootDragOver] = useState(false);

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsRootDragOver(true);
  };

  const handleRootDragLeave = () => {
    setIsRootDragOver(false);
  };

  const handleRootDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
    
    if (!currentPath) return;
    
    const sourcePath = e.dataTransfer.getData('text/plain');
    if (sourcePath) {
      await handleMoveFile(sourcePath, currentPath);
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <span className="font-semibold text-sm uppercase text-gray-500">Explorer</span>
        <div className="flex space-x-1">
          {/* Quick Create Dropdown */}
          <div className="relative" ref={quickCreateRef}>
            <button 
              className={clsx(
                "p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded flex items-center gap-0.5",
                isQuickCreateOpen && "bg-gray-200 dark:bg-gray-800"
              )}
              title="Quick Create"
              onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
            >
              <Plus size={16} />
              {isQuickCreateOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {isQuickCreateOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[160px] py-1">
                {FILE_TYPES.map((fileType) => {
                  const Icon = fileType.icon;
                  return (
                    <button
                      key={fileType.extension}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                      onClick={() => handleQuickCreate(fileType)}
                    >
                      <Icon size={14} className="text-gray-500" />
                      <span>{fileType.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button 
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" 
            title="New File"
            onClick={() => { setQuickCreateType(null); setIsNewFileModalOpen(true); }}
          >
            <FilePlus size={16} />
          </button>
          <button 
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" 
            title="New Folder"
            onClick={() => setIsNewFolderModalOpen(true)}
          >
            <FolderPlus size={16} />
          </button>
          <button 
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" 
            title="Import Image"
            onClick={handleImportImage}
          >
            <ImagePlus size={16} />
          </button>
        </div>
      </div>
      <div 
        className={clsx(
          "flex-grow overflow-y-auto",
          isRootDragOver && "bg-blue-100 dark:bg-blue-900/30"
        )}
        onDragOver={handleRootDragOver}
        onDragLeave={handleRootDragLeave}
        onDrop={handleRootDrop}
      >
        {currentPath ? (
          fileStructure.map((entry) => (
            <FileNode key={entry.path} entry={entry} onMoveFile={handleMoveFile} />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            No folder opened
          </div>
        )}
      </div>

      <InputModal
        isOpen={isNewFileModalOpen}
        onClose={() => { setIsNewFileModalOpen(false); setQuickCreateType(null); }}
        onSubmit={handleCreateFile}
        title={quickCreateType ? `Create New ${quickCreateType.label}` : "Create New File"}
        label="File Name"
        placeholder={quickCreateType ? `e.g., myfile${quickCreateType.extension}` : "e.g., note.md"}
      />

      <InputModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        onSubmit={handleCreateFolder}
        title="Create New Folder"
        label="Folder Name"
        placeholder="e.g., images"
      />
    </div>
  );
};
