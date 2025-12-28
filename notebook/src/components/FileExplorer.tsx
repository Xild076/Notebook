import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, FilePlus, FolderPlus, ImagePlus } from 'lucide-react';
import { FileEntry, useAppStore } from '../store/store';
import { createFile, createFolder, loadFileStructure } from '../lib/fileSystem';
import { InputModal } from './ui/InputModal';
import { open } from '@tauri-apps/plugin-dialog';
import { copyFile } from '@tauri-apps/plugin-fs';
import clsx from 'clsx';

interface FileNodeProps {
  entry: FileEntry;
  depth?: number;
}

const FileNode: React.FC<FileNodeProps> = ({ entry, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { openFile, activeFile } = useAppStore();

  const handleClick = () => {
    if (entry.isDirectory) {
      setIsOpen(!isOpen);
    } else {
      openFile(entry.path);
    }
  };

  return (
    <div>
      <div 
        className={clsx(
          "flex items-center py-1 px-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 select-none",
          activeFile === entry.path && "bg-blue-100 dark:bg-blue-900"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
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
            <FileNode key={child.path} entry={child} depth={depth + 1} />
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

  const handleCreateFile = async (name: string) => {
    if (!currentPath || !name) return;
    try {
      const fullPath = `${currentPath}\\${name}`;
      await createFile(fullPath);
      const files = await loadFileStructure(currentPath);
      setFileStructure(files);
    } catch (e) {
      console.error("Failed to create file", e);
      alert("Failed to create file");
    }
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
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
        }]
      });

      if (selected && typeof selected === 'string') {
        const fileName = selected.split('\\').pop();
        if (fileName) {
          const destPath = `${currentPath}\\${fileName}`;
          await copyFile(selected, destPath);
          const files = await loadFileStructure(currentPath);
          setFileStructure(files);
        }
      }
    } catch (e) {
      console.error("Failed to import image", e);
      alert("Failed to import image");
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <span className="font-semibold text-sm uppercase text-gray-500">Explorer</span>
        <div className="flex space-x-1">
          <button 
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" 
            title="New File"
            onClick={() => setIsNewFileModalOpen(true)}
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
      <div className="flex-grow overflow-y-auto">
        {currentPath ? (
          fileStructure.map((entry) => (
            <FileNode key={entry.path} entry={entry} />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            No folder opened
          </div>
        )}
      </div>

      <InputModal
        isOpen={isNewFileModalOpen}
        onClose={() => setIsNewFileModalOpen(false)}
        onSubmit={handleCreateFile}
        title="Create New File"
        label="File Name"
        placeholder="e.g., note.md"
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
