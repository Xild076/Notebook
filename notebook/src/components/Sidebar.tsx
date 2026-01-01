import React, { useState } from 'react';
import { 
  Settings, Search, Save, FolderOpen, Network, Home, 
  Calendar, Bot, CheckSquare, CalendarDays, BarChart3, Command,
  Cloud, Pencil, Timer, StickyNote, Info, Layout, Shapes,
  ChevronDown, ChevronRight, MoreHorizontal
} from 'lucide-react';
import { useAppStore } from '../store/store';
import { openFolder, createFile } from '../lib/fileSystem';
import { SettingsModal } from './SettingsModal';
import clsx from 'clsx';

// Sidebar item definitions
interface SidebarItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  shortcut?: string;
  category: 'navigation' | 'productivity' | 'creative' | 'tools' | 'system';
  action: () => void;
}

export const Sidebar: React.FC = () => {
  const { 
    setCurrentPath, activeFile, unsavedChanges, currentPath, openFile,
    sidebarConfig, setSidebarConfig, toggleSidebarItem 
  } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['navigation', 'productivity', 'creative', 'tools', 'system'])
  );

  // Action handlers
  const handleOpenVaultManager = () => {
    window.localStorage.removeItem('lastVaultPath');
    window.location.reload();
  };

  const handleOpenFolder = async () => {
    const path = await openFolder();
    if (path) setCurrentPath(path);
  };

  const handleSave = () => window.dispatchEvent(new CustomEvent('app-save'));
  const handleOpenGraph = () => window.dispatchEvent(new CustomEvent('app-open-graph'));
  const handleSearch = () => window.dispatchEvent(new CustomEvent('app-toggle-search'));

  const handleDailyNote = async () => {
    if (!currentPath) {
      alert('Please open a vault first');
      return;
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fileName = `${year}-${month}-${day}.md`;
    // Use forward slash for cross-platform compatibility
    const filePath = `${currentPath}/${fileName}`;
    
    const exists = await window.electronAPI.exists(filePath);
    if (!exists) {
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const content = `# ${weekdays[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}, ${year}\n\n## Notes\n\n`;
      await createFile(filePath, content);
      window.dispatchEvent(new CustomEvent('app-refresh-files'));
    }
    openFile(filePath);
  };

  // All sidebar items definition
  const allItems: SidebarItem[] = [
    // Navigation
    { id: 'home', icon: Layout, label: 'Home Dashboard', description: 'View your personalized dashboard with recent files, quick access, and productivity overview', category: 'navigation', action: () => window.dispatchEvent(new CustomEvent('app-open-homepage')) },
    { id: 'vault', icon: Home, label: 'Vault Manager', description: 'Switch between vaults, create new vaults, or open existing folders as vaults', category: 'navigation', action: handleOpenVaultManager },
    { id: 'graph', icon: Network, label: 'Graph View', description: 'Visualize connections and links between your notes as an interactive network graph', category: 'navigation', action: handleOpenGraph },
    { id: 'search', icon: Search, label: 'Search', description: 'Search through all notes and files in your vault with full-text search', shortcut: '⌘/', category: 'navigation', action: handleSearch },
    { id: 'daily', icon: Calendar, label: 'Daily Note', description: 'Open or create today\'s daily note for journaling and daily tracking', category: 'navigation', action: handleDailyNote },
    
    // Productivity
    { id: 'tasks', icon: CheckSquare, label: 'Tasks', description: 'Manage your to-do items with a kanban board and task tracking system', category: 'productivity', action: () => window.dispatchEvent(new CustomEvent('app-open-tasks')) },
    { id: 'calendar', icon: CalendarDays, label: 'Calendar', description: 'View and manage events, deadlines, and scheduled tasks in calendar format', category: 'productivity', action: () => window.dispatchEvent(new CustomEvent('app-open-calendar')) },
    { id: 'insights', icon: BarChart3, label: 'Insights', description: 'View analytics and statistics about your writing habits and vault activity', category: 'productivity', action: () => window.dispatchEvent(new CustomEvent('app-open-insights')) },
    
    // Creative
    { id: 'whiteboard', icon: Pencil, label: 'Whiteboard', description: 'Freehand drawing canvas for sketches, diagrams, and visual brainstorming', category: 'creative', action: () => window.dispatchEvent(new CustomEvent('app-open-whiteboard')) },
    { id: 'diagram', icon: Shapes, label: 'Diagram Maker', description: 'Create flowcharts, system diagrams, and structured visual diagrams with shapes and connectors', category: 'creative', action: () => window.dispatchEvent(new CustomEvent('app-open-diagram')) },
    
    // Tools
    { id: 'focus', icon: Timer, label: 'Focus Mode', description: 'Enter distraction-free writing mode with a Pomodoro timer for deep work sessions', category: 'tools', action: () => window.dispatchEvent(new CustomEvent('app-open-focus-mode')) },
    { id: 'quicknote', icon: StickyNote, label: 'Quick Note', description: 'Capture quick thoughts and ideas with floating sticky notes saved to your vault', category: 'tools', action: () => window.dispatchEvent(new CustomEvent('app-open-quicknote')) },
    { id: 'stickies', icon: StickyNote, label: 'All Stickies', description: 'View and manage all your quick notes and stickies in a grid overview', category: 'tools', action: () => window.dispatchEvent(new CustomEvent('app-open-stickies')) },
    { id: 'copilot', icon: Bot, label: 'AI Copilot', description: 'Get AI-powered writing assistance, summaries, and answers about your notes', category: 'tools', action: () => window.dispatchEvent(new CustomEvent('app-open-copilot')) },
    { id: 'command', icon: Command, label: 'Command Palette', description: 'Quick access to all commands and actions with fuzzy search', shortcut: '⌘K', category: 'tools', action: () => window.dispatchEvent(new CustomEvent('app-open-command-palette')) },
    { id: 'cloud', icon: Cloud, label: 'Cloud Sync', description: 'Sync your vault to cloud storage services like Dropbox, Google Drive, or iCloud', category: 'tools', action: () => window.dispatchEvent(new CustomEvent('app-open-cloudsync')) },
    
    // System
    { id: 'save', icon: Save, label: 'Save', description: 'Save all unsaved changes to disk immediately', shortcut: '⌘S', category: 'system', action: handleSave },
    { id: 'folder', icon: FolderOpen, label: 'Open Folder', description: 'Open a folder from your filesystem to browse or add to your vault', category: 'system', action: handleOpenFolder },
    { id: 'about', icon: Info, label: 'About', description: 'View app version, credits, and license information', category: 'system', action: () => window.dispatchEvent(new CustomEvent('app-open-about')) },
    { id: 'settings', icon: Settings, label: 'Settings', description: 'Customize appearance, editor behavior, plugins, and other preferences', category: 'system', action: () => setIsSettingsOpen(true) },
  ];

  const categories = [
    { id: 'navigation', label: 'Navigation' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'creative', label: 'Creative' },
    { id: 'tools', label: 'Tools' },
    { id: 'system', label: 'System' },
  ];

  const visibleItems = allItems.filter(item => sidebarConfig.visibleItems.includes(item.id));
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  // Compact mode - just icons grouped
  if (!isCustomizing) {
    // Group visible items by category for display
    const groupedItems: Record<string, SidebarItem[]> = {};
    visibleItems.forEach(item => {
      if (!groupedItems[item.category]) groupedItems[item.category] = [];
      groupedItems[item.category].push(item);
    });

    return (
      <div className="w-full h-full flex flex-col items-center py-3 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {categories.map((category, catIndex) => {
          const items = groupedItems[category.id];
          if (!items || items.length === 0) return null;
          
          return (
            <React.Fragment key={category.id}>
              {catIndex > 0 && items.length > 0 && (
                <div className="w-6 h-px bg-gray-300 dark:bg-gray-700 my-2" />
              )}
              <div className="flex flex-col items-center gap-1">
                {items.map(item => (
                  <button
                    key={item.id}
                    className={clsx(
                      "p-2 rounded transition-all duration-150 relative group",
                      "hover:bg-gray-200 dark:hover:bg-gray-800",
                      "active:scale-95"
                    )}
                    title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}`}
                    onClick={item.action}
                  >
                    <item.icon size={20} />
                    {item.id === 'save' && activeFile && unsavedChanges.has(activeFile) && (
                      <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-yellow-500 rounded-full" />
                    )}
                    {/* Enhanced Tooltip with description */}
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl min-w-[200px] max-w-[280px]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.label}</span>
                        {item.shortcut && <span className="text-xs opacity-60 bg-gray-800 dark:bg-gray-200 px-1.5 py-0.5 rounded">{item.shortcut}</span>}
                      </div>
                      <p className="text-xs opacity-70 mt-1 whitespace-normal">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </React.Fragment>
          );
        })}

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Customize button */}
        <button
          className="p-2 rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Customize Sidebar"
          onClick={() => setIsCustomizing(true)}
        >
          <MoreHorizontal size={18} />
        </button>

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    );
  }

  // Customization mode - expanded with checkboxes
  return (
    <div className="w-64 h-full flex flex-col bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Customize Sidebar</h3>
        <button
          onClick={() => setIsCustomizing(false)}
          className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Done
        </button>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-2">
        {categories.map(category => (
          <div key={category.id} className="mb-2">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-2 p-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
            >
              {expandedCategories.has(category.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {category.label}
            </button>
            
            {expandedCategories.has(category.id) && (
              <div className="ml-2 space-y-0.5">
                {allItems.filter(item => item.category === category.id).map(item => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer text-sm group"
                    title={item.description}
                  >
                    <input
                      type="checkbox"
                      checked={sidebarConfig.visibleItems.includes(item.id)}
                      onChange={() => toggleSidebarItem(item.id)}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 mt-0.5"
                    />
                    <item.icon size={16} className="text-gray-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="text-xs text-gray-400">{item.shortcut}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reset button */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setSidebarConfig({ 
            visibleItems: ['home', 'vault', 'graph', 'search', 'daily', 'tasks', 'calendar', 'insights', 'whiteboard', 'diagram', 'focus', 'quicknote', 'stickies', 'copilot', 'command', 'cloud', 'save', 'folder', 'about', 'settings'] 
          })}
          className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
        >
          Reset to Default
        </button>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
