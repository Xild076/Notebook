import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore, FileEntry } from '../../store/store';
import { readFileContent } from '../../lib/fileSystem';
import { Eye, Edit3, Columns, AlertTriangle } from 'lucide-react';

// Constants
const MAX_CONTENT_LENGTH = 500000; // 500KB character limit
const DEBOUNCE_DELAY = 150;

// Obsidian-like color palette
const colors = {
  bg: 'var(--bg-primary, #1e1e1e)',
  bgSecondary: 'var(--bg-secondary, #252525)',
  bgTertiary: 'var(--bg-tertiary, #2d2d2d)',
  text: 'var(--text-primary, #dcddde)',
  textMuted: 'var(--text-muted, #888)',
  accent: 'var(--accent, #7c3aed)',
  accentHover: 'var(--accent-hover, #8b5cf6)',
  border: 'var(--border, #3d3d3d)',
};

// Embedded file component
const EmbeddedFile: React.FC<{ 
  filePath: string; 
  fileName: string;
  onNavigate?: (path: string) => void;
}> = ({ filePath, fileName, onNavigate }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fileContents, setActiveFile } = useAppStore();

  useEffect(() => {
    const loadContent = async () => {
      if (fileContents[filePath]) {
        setContent(fileContents[filePath]);
        setLoading(false);
        return;
      }
      
      try {
        const data = await readFileContent(filePath);
        setContent(data);
      } catch (e) {
        setError('Failed to load file');
      }
      setLoading(false);
    };
    loadContent();
  }, [filePath, fileContents]);

  const handleClick = () => {
    if (onNavigate) {
      onNavigate(filePath);
    } else {
      setActiveFile(filePath);
    }
  };

  if (loading) {
    return <div className="p-2 text-[#888] text-sm">Loading {fileName}...</div>;
  }

  if (error || content === null) {
    return (
      <div className="p-2 border border-red-800 bg-red-900/20 rounded text-red-400 text-sm">
        Could not embed: {fileName}
      </div>
    );
  }

  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'md') {
    return (
      <div 
        className="border-l-4 border-[#7c3aed] pl-4 py-2 my-2 bg-[#2d2d2d] rounded-r cursor-pointer hover:bg-[#333] transition-colors"
        onClick={handleClick}
        title={`Click to open ${fileName}`}
      >
        <div className="text-xs text-[#888] mb-1 font-medium">{fileName}</div>
        <div className="prose prose-invert prose-sm max-w-none text-[#dcddde]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="border border-[#404040] rounded my-2 cursor-pointer hover:border-[#7c3aed] transition-colors"
      onClick={handleClick}
      title={`Click to open ${fileName}`}
    >
      <div className="text-xs text-[#888] px-3 py-1 bg-[#2d2d2d] border-b border-[#404040] font-medium">
        📄 {fileName}
      </div>
      <pre className="p-3 text-sm overflow-x-auto bg-[#1e1e1e] text-[#dcddde] max-h-40">{content}</pre>
    </div>
  );
};

interface TextBlockProps {
  content: string;
  onChange: (newContent: string) => void;
  onContextMenu?: (e: React.MouseEvent, cursorIndex?: number) => void;
  onNavigate?: (path: string) => void;
  filePath?: string;
}

const flattenFiles = (entries: FileEntry[], depth = 0): { name: string; path: string; depth: number }[] => {
  const result: { name: string; path: string; depth: number }[] = [];
  for (const entry of entries) {
    if (entry.isDirectory && entry.children) {
      result.push(...flattenFiles(entry.children, depth + 1));
    } else {
      result.push({ name: entry.name, path: entry.path, depth });
    }
  }
  return result.sort((a, b) => a.depth - b.depth);
};

const findFileByLinkName = (linkName: string, files: { name: string; path: string; depth: number }[]): string | null => {
  const normalizedLink = linkName.toLowerCase();
  const match = files.find(f => 
    f.name.toLowerCase() === normalizedLink || 
    f.name.toLowerCase() === `${normalizedLink}.md`
  );
  return match?.path || null;
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

type ViewMode = 'edit' | 'preview' | 'split';

export const TextBlock: React.FC<TextBlockProps> = ({ content, onChange, onContextMenu, onNavigate, filePath }) => {
  const { fileStructure, setActiveFile, activeFile } = useAppStore();
  const [value, setValue] = useState(content);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isTruncated, setIsTruncated] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const flatFiles = useMemo(() => flattenFiles(fileStructure), [fileStructure]);
  const lastExternalContent = useRef(content);
  
  // Get file name from path (use activeFile which is the actual file, not currentPath which is the vault)
  const fileName = useMemo(() => {
    // Prefer filePath prop, then activeFile from store
    const path = filePath || activeFile;
    if (!path) return 'Untitled';
    const name = path.split('/').pop() || 'Untitled';
    return name.replace(/\.md$/i, '');
  }, [filePath, activeFile]);
  
  // Debounce for preview rendering to improve performance
  const debouncedValue = useDebounce(value, DEBOUNCE_DELAY);

  // Sync content from props - only when external content changes (file switch or external update)
  useEffect(() => {
    // Only sync if content prop changed from outside (not from our own onChange)
    if (content !== lastExternalContent.current) {
      lastExternalContent.current = content;
      // Truncate if needed
      if (content.length > MAX_CONTENT_LENGTH) {
        setValue(content.substring(0, MAX_CONTENT_LENGTH));
        setIsTruncated(true);
      } else {
        setValue(content);
        setIsTruncated(false);
      }
    }
  }, [content]);

  // Handle format events
  useEffect(() => {
    const handleFormat = (e: CustomEvent<{ action: string }>) => {
      if (!textareaRef.current) return;
      
      const textarea = textareaRef.current;
      const { selectionStart, selectionEnd } = textarea;
      const selectedText = value.substring(selectionStart, selectionEnd);
      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);
      
      let newValue = value;
      let newCursorStart = selectionStart;
      let newCursorEnd = selectionEnd;
      
      const formatMap: Record<string, { prefix: string; suffix: string }> = {
        'bold': { prefix: '**', suffix: '**' },
        'italic': { prefix: '*', suffix: '*' },
        'strikethrough': { prefix: '~~', suffix: '~~' },
        'inline-code': { prefix: '`', suffix: '`' },
        'link-file': { prefix: '[[', suffix: ']]' },
        'embed-file': { prefix: '![[', suffix: ']]' },
        'link-external': { prefix: '[', suffix: '](url)' },
      };

      const blockFormatMap: Record<string, string> = {
        'h1': '# ',
        'h2': '## ',
        'h3': '### ',
        'blockquote': '> ',
        'code-block': '```\n',
        'hr': '\n---\n',
        'ul': '- ',
        'ol': '1. ',
        'task': '- [ ] ',
      };

      const action = e.detail.action;
      
      if (formatMap[action]) {
        const { prefix, suffix } = formatMap[action];
        if (selectedText) {
          newValue = before + prefix + selectedText + suffix + after;
          newCursorEnd = selectionStart + prefix.length + selectedText.length;
        } else {
          newValue = before + prefix + suffix + after;
          newCursorStart = newCursorEnd = selectionStart + prefix.length;
        }
      } else if (blockFormatMap[action]) {
        const syntax = blockFormatMap[action];
        if (action === 'code-block') {
          if (selectedText) {
            newValue = before + '```\n' + selectedText + '\n```' + after;
          } else {
            newValue = before + '```\n\n```' + after;
            newCursorStart = newCursorEnd = selectionStart + 4;
          }
        } else {
          const lineStart = before.lastIndexOf('\n') + 1;
          const linePrefix = before.substring(lineStart);
          newValue = before.substring(0, lineStart) + syntax + linePrefix + selectedText + after;
          newCursorStart = newCursorEnd = lineStart + syntax.length + linePrefix.length + selectedText.length;
        }
      }
      
      if (newValue !== value) {
        setValue(newValue);
        onChange(newValue);
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = newCursorStart;
          textarea.selectionEnd = newCursorEnd;
        }, 0);
      }
    };

    window.addEventListener('editor-format', handleFormat as EventListener);
    return () => window.removeEventListener('editor-format', handleFormat as EventListener);
  }, [value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;

    // Tab handling
    if (e.key === 'Tab') {
      e.preventDefault();
      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);
      
      if (e.shiftKey) {
        const lineStart = before.lastIndexOf('\n') + 1;
        const lineContent = value.substring(lineStart);
        if (lineContent.startsWith('  ') || lineContent.startsWith('\t')) {
          const removeCount = lineContent.startsWith('\t') ? 1 : 2;
          const newValue = before.substring(0, lineStart) + lineContent.substring(removeCount);
          setValue(newValue);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, selectionStart - removeCount);
          }, 0);
        }
      } else {
        const newValue = before + '  ' + after;
        setValue(newValue);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
        }, 0);
      }
      return;
    }

    // Autocomplete navigation
    if (showAutocomplete) {
      const filteredFiles = flatFiles.filter(f => 
        f.name.toLowerCase().includes(autocompleteQuery.toLowerCase())
      ).slice(0, 10);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredFiles.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          insertAutocomplete(filteredFiles[selectedIndex].name);
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowAutocomplete(false);
        return;
      }
    }

    // Smart list continuation
    if (e.key === 'Enter' && !e.shiftKey) {
      const before = value.substring(0, selectionStart);
      const lineStart = before.lastIndexOf('\n') + 1;
      const currentLine = before.substring(lineStart);
      
      const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s(\[[ x]\]\s)?/);
      if (listMatch) {
        e.preventDefault();
        const indent = listMatch[1];
        const marker = listMatch[2];
        const checkbox = listMatch[3] || '';
        
        // Empty list item - remove it
        if (currentLine.trim() === marker || currentLine.trim() === `${marker} [ ]` || currentLine.trim() === `${marker} [x]`) {
          const newValue = value.substring(0, lineStart) + value.substring(selectionStart);
          setValue(newValue);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart;
          }, 0);
          return;
        }
        
        // Continue list
        const newMarker = marker.match(/\d+/) ? `${parseInt(marker) + 1}.` : marker;
        const newLine = `\n${indent}${newMarker} ${checkbox ? '[ ] ' : ''}`;
        const newValue = before + newLine + value.substring(selectionEnd);
        setValue(newValue);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + newLine.length;
        }, 0);
        return;
      }
      
      // Blockquote continuation
      const quoteMatch = currentLine.match(/^(\s*>+\s*)/);
      if (quoteMatch && currentLine.trim() !== '>') {
        e.preventDefault();
        const newValue = before + '\n' + quoteMatch[1] + value.substring(selectionEnd);
        setValue(newValue);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + quoteMatch[1].length;
        }, 0);
        return;
      }
    }
  };

  const insertAutocomplete = (fileName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const textBefore = value.substring(0, pos);
    const bracketPos = textBefore.lastIndexOf('[[');
    
    if (bracketPos !== -1) {
      const linkName = fileName.replace(/\.md$/i, '');
      const before = value.substring(0, bracketPos);
      const after = value.substring(pos);
      const newValue = before + '[[' + linkName + ']]' + after.replace(/^\]\]/, '');
      setValue(newValue);
      onChange(newValue);
      
      setTimeout(() => {
        const newPos = bracketPos + linkName.length + 4;
        textarea.selectionStart = textarea.selectionEnd = newPos;
        textarea.focus();
      }, 0);
    }
    
    setShowAutocomplete(false);
    setSelectedIndex(0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    
    // Truncate if exceeds limit
    if (newValue.length > MAX_CONTENT_LENGTH) {
      newValue = newValue.substring(0, MAX_CONTENT_LENGTH);
      setIsTruncated(true);
    } else {
      setIsTruncated(false);
    }
    
    setValue(newValue);
    lastExternalContent.current = newValue; // Track that we made this change
    onChange(newValue);

    // Autocomplete detection
    const pos = e.target.selectionStart;
    const textBefore = newValue.substring(0, pos);
    const bracketMatch = textBefore.match(/\[\[([^\]]*?)$/);
    
    if (bracketMatch) {
      setAutocompleteQuery(bracketMatch[1]);
      setShowAutocomplete(true);
      setSelectedIndex(0);
      
      // Calculate position relative to textarea
      const textarea = e.target;
      const lines = textBefore.split('\n');
      const currentLineIndex = lines.length - 1;
      const currentLineLength = lines[currentLineIndex].length;
      
      // Approximate position
      const lineHeight = 24;
      const charWidth = 8;
      setAutocompletePosition({
        top: Math.min((currentLineIndex + 1) * lineHeight + 60, 300),
        left: Math.min(currentLineLength * charWidth + 24, 400)
      });
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      const cursorIndex = textareaRef.current?.selectionStart;
      onContextMenu(e, cursorIndex);
    }
  };

  const handleLinkClick = useCallback((linkName: string) => {
    const targetPath = findFileByLinkName(linkName, flatFiles);
    if (targetPath) {
      if (onNavigate) {
        onNavigate(targetPath);
      } else {
        setActiveFile(targetPath);
      }
    }
  }, [flatFiles, onNavigate, setActiveFile]);

  // Memoized render for wiki links in preview
  const renderContent = useCallback((text: string): React.ReactNode[] => {
    const parts = text.split(/(!\[\[.*?\]\]|\[\[.*?\]\])/g);
    return parts.map((part, i) => {
      const embedMatch = part.match(/^!\[\[(.*?)\]\]$/);
      if (embedMatch) {
        const embedName = embedMatch[1];
        const targetPath = findFileByLinkName(embedName, flatFiles);
        if (targetPath) {
          return <EmbeddedFile key={i} filePath={targetPath} fileName={embedName} onNavigate={onNavigate} />;
        }
        return (
          <div key={i} className="p-2 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded text-red-500 text-sm my-2">
            Embed not found: {embedName}
          </div>
        );
      }
      
      const linkMatch = part.match(/^\[\[(.*?)\]\]$/);
      if (linkMatch) {
        const linkName = linkMatch[1];
        const targetPath = findFileByLinkName(linkName, flatFiles);
        return (
          <span
            key={i}
            className={`cursor-pointer font-medium ${targetPath ? 'text-blue-500 hover:text-blue-600 hover:underline' : 'text-red-400'}`}
            onClick={(e) => { e.stopPropagation(); handleLinkClick(linkName); }}
            title={targetPath || 'File not found'}
          >
            {linkName}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }, [flatFiles, handleLinkClick, onNavigate]);

  const filteredFiles = useMemo(() => 
    flatFiles.filter(f => 
      f.name.toLowerCase().includes(autocompleteQuery.toLowerCase())
    ).slice(0, 10),
    [flatFiles, autocompleteQuery]
  );

  const Toolbar = useMemo(() => () => (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-[#404040] bg-[#262626] flex-wrap shrink-0">
      {/* View mode toggle */}
      <div className="flex items-center gap-0.5 mr-3 bg-[#1a1a1a] rounded-md p-0.5">
        <button
          onClick={() => setViewMode('edit')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${viewMode === 'edit' ? 'bg-[#7c3aed] text-white' : 'text-[#a1a1a1] hover:text-white hover:bg-[#333]'}`}
          title="Edit mode"
        >
          <Edit3 size={13} className="inline mr-1" />
          Edit
        </button>
        <button
          onClick={() => setViewMode('split')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${viewMode === 'split' ? 'bg-[#7c3aed] text-white' : 'text-[#a1a1a1] hover:text-white hover:bg-[#333]'}`}
          title="Split view"
        >
          <Columns size={13} className="inline mr-1" />
          Split
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${viewMode === 'preview' ? 'bg-[#7c3aed] text-white' : 'text-[#a1a1a1] hover:text-white hover:bg-[#333]'}`}
          title="Preview mode"
        >
          <Eye size={13} className="inline mr-1" />
          Preview
        </button>
      </div>
      
      <div className="h-4 w-px bg-[#404040] mx-2" />
      
      {/* Text formatting */}
      <div className="flex items-center gap-0.5">
        {[
          { label: 'B', action: 'bold', title: 'Bold (⌘B)', className: 'font-bold' },
          { label: 'I', action: 'italic', title: 'Italic (⌘I)', className: 'italic' },
          { label: 'S', action: 'strikethrough', title: 'Strikethrough', className: 'line-through' },
          { label: '<>', action: 'inline-code', title: 'Code' },
        ].map(btn => (
          <button
            key={btn.action}
            onClick={() => window.dispatchEvent(new CustomEvent('editor-format', { detail: { action: btn.action } }))}
            className={`w-7 h-7 flex items-center justify-center text-sm text-[#a1a1a1] hover:text-white hover:bg-[#333] rounded transition-colors ${btn.className || ''}`}
            title={btn.title}
          >
            {btn.label}
          </button>
        ))}
      </div>
      
      <div className="h-4 w-px bg-[#404040] mx-2" />
      
      {/* Headings */}
      <div className="flex items-center gap-0.5">
        {[
          { label: 'H1', action: 'h1' },
          { label: 'H2', action: 'h2' },
          { label: 'H3', action: 'h3' },
        ].map(btn => (
          <button
            key={btn.action}
            onClick={() => window.dispatchEvent(new CustomEvent('editor-format', { detail: { action: btn.action } }))}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-[#a1a1a1] hover:text-white hover:bg-[#333] rounded transition-colors"
            title={btn.action.toUpperCase()}
          >
            {btn.label}
          </button>
        ))}
      </div>
      
      <div className="h-4 w-px bg-[#404040] mx-2" />
      
      {/* Lists */}
      <div className="flex items-center gap-0.5">
        {[
          { label: '•', action: 'ul', title: 'Bullet list' },
          { label: '1.', action: 'ol', title: 'Numbered list' },
          { label: '☐', action: 'task', title: 'Task list' },
          { label: '"', action: 'blockquote', title: 'Quote' },
        ].map(btn => (
          <button
            key={btn.action}
            onClick={() => window.dispatchEvent(new CustomEvent('editor-format', { detail: { action: btn.action } }))}
            className="w-7 h-7 flex items-center justify-center text-sm text-[#a1a1a1] hover:text-white hover:bg-[#333] rounded transition-colors"
            title={btn.title}
          >
            {btn.label}
          </button>
        ))}
      </div>
      
      <div className="h-4 w-px bg-[#404040] mx-2" />
      
      {/* Links */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('editor-format', { detail: { action: 'link-file' } }))}
        className="px-2 h-7 flex items-center justify-center text-xs text-[#a1a1a1] hover:text-white hover:bg-[#333] rounded font-mono transition-colors"
        title="Wiki link [[ ]]"
      >
        [[  ]]
      </button>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('editor-format', { detail: { action: 'link-external' } }))}
        className="w-7 h-7 flex items-center justify-center text-[#a1a1a1] hover:text-white hover:bg-[#333] rounded transition-colors"
        title="External link"
      >
        🔗
      </button>
      
      {isTruncated && (
        <>
          <div className="h-4 w-px bg-[#404040] mx-2" />
          <div className="flex items-center gap-1 text-amber-500 text-xs">
            <AlertTriangle size={14} />
            <span>Content truncated (max 500KB)</span>
          </div>
        </>
      )}
    </div>
  ), [viewMode, isTruncated]);

  // Memoized Preview component for performance
  const Preview = useMemo(() => () => (
    <div className="w-full h-full p-8 overflow-auto bg-[#1e1e1e]">
      <div className="max-w-4xl mx-auto prose prose-invert prose-lg
        prose-headings:font-semibold prose-headings:text-[#dcddde] prose-headings:tracking-tight
        prose-h1:text-3xl prose-h1:border-b prose-h1:border-[#404040] prose-h1:pb-3 prose-h1:mb-6
        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
        prose-p:text-[#dcddde] prose-p:leading-relaxed prose-p:my-4
        prose-li:text-[#dcddde] prose-li:my-1
        prose-strong:text-[#e0e0e0] prose-strong:font-semibold
        prose-em:text-[#dcddde]
        prose-pre:bg-[#2d2d2d] prose-pre:border prose-pre:border-[#404040] prose-pre:rounded-lg prose-pre:p-4
        prose-code:bg-[#2d2d2d] prose-code:text-[#e06c75] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal
        prose-code:before:content-none prose-code:after:content-none
        prose-blockquote:border-l-4 prose-blockquote:border-[#7c3aed] prose-blockquote:bg-[#2d2d2d] prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-[#a1a1a1]
        prose-a:text-[#7c3aed] prose-a:no-underline hover:prose-a:underline hover:prose-a:text-[#8b5cf6]
        prose-img:rounded-lg prose-img:shadow-md
        prose-table:border prose-table:border-[#404040]
        prose-th:bg-[#2d2d2d] prose-th:text-[#dcddde] prose-th:p-3 prose-th:border prose-th:border-[#404040]
        prose-td:border prose-td:border-[#404040] prose-td:p-3 prose-td:text-[#dcddde]
        prose-hr:border-[#404040]
      ">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p>{React.Children.map(children, child => 
              typeof child === 'string' ? renderContent(child) : child
            )}</p>,
            li: ({ children, ...props }) => {
              const content = React.Children.toArray(children);
              const firstChild = content[0];
              if (typeof firstChild === 'object' && 'props' in firstChild && (firstChild as any).props?.type === 'checkbox') {
                return <li className="list-none flex items-start gap-2 -ml-6" {...props}>{children}</li>;
              }
              return <li {...props}>{React.Children.map(children, child => 
                typeof child === 'string' ? renderContent(child) : child
              )}</li>;
            },
            input: ({ type, checked, ...props }) => {
              if (type === 'checkbox') {
                return (
                  <input 
                    type="checkbox" 
                    checked={checked} 
                    readOnly 
                    className="mt-1 w-4 h-4 rounded border-[#404040] bg-[#2d2d2d] text-[#7c3aed] focus:ring-[#7c3aed]"
                    {...props}
                  />
                );
              }
              return <input type={type} {...props} />;
            },
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#7c3aed] hover:text-[#8b5cf6] hover:underline">
                {children}
              </a>
            ),
          }}
        >
          {debouncedValue || '*Start writing...*'}
        </ReactMarkdown>
      </div>
    </div>
  ), [debouncedValue, renderContent]);

  return (
    <div 
      ref={editorContainerRef}
      className="w-full h-full flex flex-col bg-[#1e1e1e] overflow-hidden"
      onContextMenu={handleContextMenu}
    >
      {/* File title header */}
      {fileName && (
        <div className="px-6 py-3 border-b border-[#404040] bg-[#1e1e1e] shrink-0">
          <h1 className="text-xl font-semibold text-[#dcddde] truncate">{fileName}</h1>
        </div>
      )}
      
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`relative flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r border-[#404040]' : 'w-full'}`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={`Start writing your note...

Use **bold**, *italic*, and \`code\` formatting.
Create links with [[filename]] syntax.
Make lists with - or 1. 
Add tasks with - [ ] syntax.`}
              className="flex-1 w-full p-6 bg-[#1e1e1e] text-[#dcddde] outline-none resize-none text-base leading-7 placeholder:text-[#666] overflow-auto"
              spellCheck="true"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif' }}
            />
            
            {showAutocomplete && filteredFiles.length > 0 && (
              <div 
                className="absolute z-50 bg-[#2d2d2d] border border-[#404040] rounded-lg shadow-2xl max-h-60 overflow-y-auto min-w-[240px]"
                style={{ top: autocompletePosition.top, left: autocompletePosition.left }}
              >
                <div className="px-3 py-2 text-xs text-[#888] border-b border-[#404040] font-medium">
                  📎 Link to note
                </div>
                {filteredFiles.map((file, idx) => (
                  <div
                    key={file.path}
                    className={`px-3 py-2.5 cursor-pointer text-sm ${idx === selectedIndex ? 'bg-[#7c3aed] text-white' : 'text-[#dcddde] hover:bg-[#333]'}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertAutocomplete(file.name);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="font-medium truncate">{file.name.replace(/\.md$/, '')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-hidden`}>
            <Preview />
          </div>
        )}
      </div>
    </div>
  );
};
