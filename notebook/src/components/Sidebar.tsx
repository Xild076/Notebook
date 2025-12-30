import React, { useState } from 'react';
import { Settings, Search, Save, FolderOpen, Network, Home, Calendar, Bot } from 'lucide-react';
import { useAppStore } from '../store/store';
import { openFolder, createFile } from '../lib/fileSystem';
import { SettingsModal } from './SettingsModal';

export const Sidebar: React.FC = () => {
  const { setCurrentPath, activeFile, unsavedChanges, currentPath, openFile } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showVaultManager, setShowVaultManager] = useState(false);
  // Open VaultManager UI
  const handleOpenVaultManager = () => {
    window.localStorage.removeItem('lastVaultPath');
    window.location.reload(); // Triggers App to show VaultManager
  };

  const handleOpenFolder = async () => {
    const path = await openFolder();
    if (path) {
      setCurrentPath(path);
    }
  };

  const handleSave = () => {
    // Trigger save logic (handled globally or via event)
    window.dispatchEvent(new CustomEvent('app-save'));
  };

  const handleOpenGraph = () => {
    window.dispatchEvent(new CustomEvent('app-open-graph'));
  };

  const handleSearch = () => {
    window.dispatchEvent(new CustomEvent('app-toggle-search'));
  };

  const handleDailyNote = async () => {
    if (!currentPath) {
      alert('Please open a vault first');
      return;
    }
    
    // Format: YYYY-MM-DD.md
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fileName = `${year}-${month}-${day}.md`;
    const filePath = `${currentPath}\\${fileName}`;
    
    // Check if file exists
    const exists = await window.electronAPI.exists(filePath);
    
    if (!exists) {
      // Create daily note with template
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const content = `# ${weekdays[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}, ${year}\n\n## Notes\n\n`;
      await createFile(filePath, content);
      
      // Refresh file structure
      window.dispatchEvent(new CustomEvent('app-refresh-files'));
    }
    
    // Open the file
    openFile(filePath);
  };

  return (
    <div className="w-full h-full flex flex-col items-center py-4 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 space-y-6 overflow-hidden">
      <button
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
        title="Vault Manager"
        onClick={handleOpenVaultManager}
      >
        <Home size={24} />
      </button>
      <button 
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" 
        title="Graph View"
        onClick={handleOpenGraph}
      >
        <Network size={24} />
      </button>
      
      <button 
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" 
        title="Search"
        onClick={handleSearch}
      >
        <Search size={24} />
      </button>

      <button 
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" 
        title="Daily Note"
        onClick={handleDailyNote}
      >
        <Calendar size={24} />
      </button>

      <button 
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" 
        title="AI Copilot"
        onClick={() => window.dispatchEvent(new CustomEvent('app-open-copilot'))}
      >
        <Bot size={24} />
      </button>

      <div className="flex-grow" />

      <button 
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded relative" 
        title="Save (Ctrl+S)"
        onClick={handleSave}
      >
        <Save size={24} />
        {activeFile && unsavedChanges.has(activeFile) && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-900"></span>
        )}
      </button>

      <button 
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" 
        title="Open Folder"
        onClick={handleOpenFolder}
      >
        <FolderOpen size={24} />
      </button>

      <button 
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" 
        title="Settings"
        onClick={() => setIsSettingsOpen(true)}
      >
        <Settings size={24} />
      </button>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
