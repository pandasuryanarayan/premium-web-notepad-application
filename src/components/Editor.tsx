import { useState, useRef, useCallback, useEffect } from 'react';
import type { Note, EditorMode, NoteColor, Category } from '../types';
import { renderMarkdown, getStats, exportAsMarkdown, exportAsText, exportAsHTML, importFile } from '../utils/notes';

interface EditorProps {
  note: Note | null;
  categories: Category[];
  theme: 'light' | 'dark';
  editorMode: EditorMode;
  focusMode: boolean;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onCreateNote: () => void;
  onSetEditorMode: (mode: EditorMode) => void;
  onToggleFocusMode: () => void;
  onMoveToTrash: (id: string) => void;
}

const NOTE_COLORS: { value: NoteColor; label: string; hex: string }[] = [
  { value: 'default', label: 'None', hex: '#94a3b8' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'yellow', label: 'Yellow', hex: '#eab308' },
  { value: 'green', label: 'Green', hex: '#22c55e' },
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'purple', label: 'Purple', hex: '#a855f7' },
  { value: 'pink', label: 'Pink', hex: '#ec4899' },
];

export default function Editor({
  note,
  categories,
  theme,
  editorMode,
  focusMode,
  onUpdateNote,
  onCreateNote,
  onSetEditorMode,
  onToggleFocusMode,
  onMoveToTrash,
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableHoverRow, setTableHoverRow] = useState(0);
  const [tableHoverCol, setTableHoverCol] = useState(0);
  const [lastSaved, setLastSaved] = useState<string>('');

  // Auto-save debounce
  const [localContent, setLocalContent] = useState(note?.content || '');
  const [localTitle, setLocalTitle] = useState(note?.title || '');

  useEffect(() => {
    if (note) {
      setLocalContent(note.content);
      setLocalTitle(note.title);
      setLastSaved(new Date(note.updatedAt).toLocaleTimeString());
    }
  }, [note?.id]); // Only reset on note change, not every update

  // Auto-save with debounce
  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => {
      if (localContent !== note.content || localTitle !== note.title) {
        onUpdateNote(note.id, { content: localContent, title: localTitle });
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localContent, localTitle, note?.id]);

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string = '', placeholder: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = localContent.substring(start, end);
      const text = selected || placeholder;

      const newContent =
        localContent.substring(0, start) +
        prefix + text + suffix +
        localContent.substring(end);

      setLocalContent(newContent);

      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.focus();
        const newPos = start + prefix.length + (selected ? text.length : 0);
        textarea.setSelectionRange(
          selected ? start + prefix.length : start + prefix.length,
          selected ? newPos + suffix.length : start + prefix.length + placeholder.length
        );
      });
    },
    [localContent]
  );

  const insertAtLineStart = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = localContent.lastIndexOf('\n', start - 1) + 1;

      const newContent =
        localContent.substring(0, lineStart) +
        prefix +
        localContent.substring(lineStart);

      setLocalContent(newContent);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      });
    },
    [localContent]
  );

  const generateTable = useCallback(
    (rows: number, cols: number) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;

      // Build header row
      const headerCells = Array.from({ length: cols }, (_, i) => ` Header ${i + 1} `);
      const separatorCells = Array.from({ length: cols }, () => ' ---------- ');
      const bodyRows = Array.from({ length: rows - 1 }, (_, rowIdx) =>
        Array.from({ length: cols }, (_, colIdx) => ` Cell ${rowIdx + 1}.${colIdx + 1} `)
      );

      const table =
        '\n|' + headerCells.join('|') + '|\n' +
        '|' + separatorCells.join('|') + '|\n' +
        bodyRows.map(row => '|' + row.join('|') + '|').join('\n') +
        '\n';

      const newContent =
        localContent.substring(0, start) +
        table +
        localContent.substring(start);

      setLocalContent(newContent);

      // Position cursor at the first header cell
      requestAnimationFrame(() => {
        textarea.focus();
        const headerStart = start + 2; // skip \n|
        const firstHeaderEnd = headerStart + headerCells[0].length;
        textarea.setSelectionRange(headerStart, firstHeaderEnd);
      });
    },
    [localContent]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab support
      if (e.key === 'Tab') {
        e.preventDefault();
        insertMarkdown('  ');
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            insertMarkdown('**', '**', 'bold text');
            break;
          case 'i':
            e.preventDefault();
            insertMarkdown('*', '*', 'italic text');
            break;
          case 'u':
            e.preventDefault();
            insertMarkdown('<u>', '</u>', 'underlined text');
            break;
          case 'k':
            e.preventDefault();
            insertMarkdown('[', '](url)', 'link text');
            break;
          case 's':
            e.preventDefault();
            if (note) {
              onUpdateNote(note.id, { content: localContent, title: localTitle });
              setLastSaved(new Date().toLocaleTimeString());
            }
            break;
        }
      }
    },
    [insertMarkdown, note, localContent, localTitle, onUpdateNote]
  );

  // Keyboard shortcuts for the editor area
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'e':
            e.preventDefault();
            onSetEditorMode(
              editorMode === 'edit' ? 'split' : editorMode === 'split' ? 'preview' : 'edit'
            );
            break;
          case 'p':
            if (note) {
              e.preventDefault();
              onUpdateNote(note.id, { pinned: !note.pinned });
            }
            break;
          case 'd':
            if (note) {
              e.preventDefault();
              // Duplicate handled by parent
            }
            break;
          case '/':
            e.preventDefault();
            setShowShortcuts(prev => !prev);
            break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editorMode, note, onSetEditorMode, onUpdateNote]);

  const stats = getStats(localContent);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && note) {
      const imported = await importFile(file);
      setLocalContent(imported.content);
      setLocalTitle(imported.title);
    }
    e.target.value = '';
  };

  const addTag = () => {
    if (!note || !tagInput.trim()) return;
    const tag = tagInput.trim().toLowerCase();
    if (!note.tags.includes(tag)) {
      onUpdateNote(note.id, { tags: [...note.tags, tag] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    if (!note) return;
    onUpdateNote(note.id, { tags: note.tags.filter(t => t !== tag) });
  };

  // Empty state
  if (!note) {
    return (
      <div className={`flex-1 flex items-center justify-center ${
        theme === 'dark' ? 'bg-bg-dark' : 'bg-bg-light'
      }`}>
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">✍️</div>
          <h2 className={`text-xl font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>
            Select a note or create a new one
          </h2>
          <p className={`mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Start writing your thoughts, ideas, and notes
          </p>
          <button
            onClick={onCreateNote}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors shadow-md shadow-primary-500/25"
          >
            Create New Note
          </button>
        </div>
      </div>
    );
  }

  const toolbarButtons = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h12M6 12h12M6 20h12" />
        </svg>
      ),
      label: 'Bold',
      shortcut: '⌘B',
      action: () => insertMarkdown('**', '**', 'bold text'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 4h4m-2 0v16" />
        </svg>
      ),
      label: 'Italic',
      shortcut: '⌘I',
      action: () => insertMarkdown('*', '*', 'italic text'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      label: 'Strikethrough',
      shortcut: '',
      action: () => insertMarkdown('~~', '~~', 'text'),
    },
    { type: 'separator' as const },
    {
      icon: <span className="text-xs font-bold">H1</span>,
      label: 'Heading 1',
      shortcut: '',
      action: () => insertAtLineStart('# '),
    },
    {
      icon: <span className="text-xs font-bold">H2</span>,
      label: 'Heading 2',
      shortcut: '',
      action: () => insertAtLineStart('## '),
    },
    {
      icon: <span className="text-xs font-bold">H3</span>,
      label: 'Heading 3',
      shortcut: '',
      action: () => insertAtLineStart('### '),
    },
    { type: 'separator' as const },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      label: 'Unordered List',
      shortcut: '',
      action: () => insertAtLineStart('- '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8M4 18h16" />
        </svg>
      ),
      label: 'Ordered List',
      shortcut: '',
      action: () => insertAtLineStart('1. '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h8M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      ),
      label: 'Task List',
      shortcut: '',
      action: () => insertAtLineStart('- [ ] '),
    },
    { type: 'separator' as const },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: 'Code',
      shortcut: '',
      action: () => insertMarkdown('`', '`', 'code'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      label: 'Link',
      shortcut: '⌘K',
      action: () => insertMarkdown('[', '](url)', 'link text'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      label: 'Blockquote',
      shortcut: '',
      action: () => insertAtLineStart('> '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Horizontal Rule',
      shortcut: '',
      action: () => insertMarkdown('\n---\n'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18M3 3v18M21 3v18" />
        </svg>
      ),
      label: 'Insert Table',
      shortcut: '',
      action: () => setShowTableModal(true),
    },
  ];

  return (
    <div className={`flex-1 flex flex-col ${
      focusMode ? 'fixed inset-0 z-50' : ''
    } ${theme === 'dark' ? 'bg-bg-dark' : 'bg-bg-light'}`}>
      {/* Focus Mode Header */}
      {focusMode && (
        <div className={`flex items-center justify-between px-4 py-2 border-b ${
          theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-surface-light border-border-light'
        }`}>
          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            Focus Mode
          </span>
          <button
            onClick={onToggleFocusMode}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className={`flex items-center gap-0.5 px-3 py-1.5 border-b overflow-x-auto no-print ${
        theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-surface-light border-border-light'
      }`}>
        {/* Formatting buttons */}
        {editorMode !== 'preview' && toolbarButtons.map((btn, i) =>
          btn.type === 'separator' ? (
            <div key={i} className={`w-px h-5 mx-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
          ) : (
            <button
              key={i}
              onClick={(btn as { action: () => void }).action}
              className={`tooltip-container p-1.5 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              data-tooltip={`${(btn as { label: string }).label}${(btn as { shortcut: string }).shortcut ? ` (${(btn as { shortcut: string }).shortcut})` : ''}`}
              title={`${(btn as { label: string }).label}${(btn as { shortcut: string }).shortcut ? ` (${(btn as { shortcut: string }).shortcut})` : ''}`}
            >
              {(btn as { icon: React.ReactNode }).icon}
            </button>
          )
        )}

        <div className={`w-px h-5 mx-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Note Color */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 rounded-lg transition-colors flex items-center gap-1"
            style={{ color: NOTE_COLORS.find(c => c.value === note.color)?.hex }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>
          {showColorPicker && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowColorPicker(false)} />
              <div className={`absolute top-full left-0 mt-1 p-2 rounded-xl shadow-xl z-40 animate-scale-in ${
                theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
              }`}>
                <div className="grid grid-cols-4 gap-1">
                  {NOTE_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => {
                        onUpdateNote(note.id, { color: color.value });
                        setShowColorPicker(false);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        note.color === color.value
                          ? 'ring-2 ring-primary-400 ring-offset-1 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex + '20' }}
                      title={color.label}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.hex }} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Category */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryPicker(!showCategoryPicker)}
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            title="Category"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
          {showCategoryPicker && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowCategoryPicker(false)} />
              <div className={`absolute top-full left-0 mt-1 py-1 rounded-xl shadow-xl z-40 min-w-[160px] animate-scale-in ${
                theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
              }`}>
                <button
                  onClick={() => { onUpdateNote(note.id, { category: '' }); setShowCategoryPicker(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm ${
                    note.category === '' ? 'text-primary-500 font-medium' : ''
                  } ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  No Category
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { onUpdateNote(note.id, { category: cat.id }); setShowCategoryPicker(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                      note.category === cat.id ? 'text-primary-500 font-medium' : ''
                    } ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: cat.color }} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tags */}
        <button
          onClick={() => setShowTagInput(!showTagInput)}
          className={`p-1.5 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title="Tags"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </button>

        <div className={`w-px h-5 mx-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Pin */}
        <button
          onClick={() => onUpdateNote(note.id, { pinned: !note.pinned })}
          className={`p-1.5 rounded-lg transition-colors ${
            note.pinned
              ? 'text-primary-500'
              : theme === 'dark'
                ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title={note.pinned ? 'Unpin' : 'Pin'}
        >
          <svg className="w-4 h-4" fill={note.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        {/* Favorite */}
        <button
          onClick={() => onUpdateNote(note.id, { favorite: !note.favorite })}
          className={`p-1.5 rounded-lg transition-colors ${
            note.favorite
              ? 'text-yellow-500'
              : theme === 'dark'
                ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title={note.favorite ? 'Unfavorite' : 'Favorite'}
        >
          <svg className="w-4 h-4" fill={note.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>

        {/* Archive */}
        <button
          onClick={() => onUpdateNote(note.id, { archived: !note.archived })}
          className={`p-1.5 rounded-lg transition-colors ${
            note.archived
              ? 'text-primary-500'
              : theme === 'dark'
                ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title={note.archived ? 'Unarchive' : 'Archive'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </button>

        <div className="flex-1" />

        {/* View Mode */}
        <div className={`flex p-0.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
          {(['edit', 'split', 'preview'] as EditorMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onSetEditorMode(mode)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                editorMode === mode
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {mode === 'edit' ? 'Edit' : mode === 'split' ? 'Split' : 'Preview'}
            </button>
          ))}
        </div>

        <div className={`w-px h-5 mx-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Import */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-1.5 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title="Import file"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>
        <input ref={fileInputRef} type="file" accept=".md,.txt,.markdown" className="hidden" onChange={handleImport} />

        {/* Export */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            title="Export"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowExportMenu(false)} />
              <div className={`absolute top-full right-0 mt-1 py-1 rounded-xl shadow-xl z-40 min-w-[160px] animate-scale-in ${
                theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
              }`}>
                {[
                  { label: '📄 Export as Markdown', action: () => exportAsMarkdown(note) },
                  { label: '📝 Export as Text', action: () => exportAsText(note) },
                  { label: '🌐 Export as HTML', action: () => exportAsHTML(note) },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { item.action(); setShowExportMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Focus Mode */}
        <button
          onClick={onToggleFocusMode}
          className={`p-1.5 rounded-lg transition-colors ${
            focusMode
              ? 'text-primary-500'
              : theme === 'dark'
                ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title="Focus Mode"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* Shortcuts Help */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className={`p-1.5 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title="Keyboard Shortcuts (Ctrl+/)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={() => onMoveToTrash(note.id)}
          className={`p-1.5 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'text-slate-400 hover:bg-red-900/30 hover:text-red-400'
              : 'text-slate-500 hover:bg-red-50 hover:text-red-500'
          }`}
          title="Move to Trash"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Tags bar */}
      {showTagInput && (
        <div className={`flex items-center gap-2 px-4 py-2 border-b animate-fade-in ${
          theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-surface-light border-border-light'
        }`}>
          <svg className={`w-4 h-4 shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {note.tags.map(tag => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                theme === 'dark'
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-primary-100 text-primary-700'
              }`}
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-red-500 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="Add tag..."
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            className={`flex-1 text-xs py-0.5 bg-transparent focus:outline-none ${
              theme === 'dark' ? 'text-slate-300 placeholder-slate-500' : 'text-slate-700 placeholder-slate-400'
            }`}
            autoFocus
          />
        </div>
      )}

      {/* Title */}
      <div className={`px-6 pt-4 pb-2 ${
        theme === 'dark' ? 'bg-bg-dark' : 'bg-bg-light'
      }`}>
        <input
          type="text"
          value={localTitle}
          onChange={e => setLocalTitle(e.target.value)}
          placeholder="Untitled Note"
          className={`w-full text-2xl font-bold bg-transparent border-none focus:outline-none placeholder-slate-300 dark:placeholder-slate-600 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        />
        <div className="flex items-center gap-3 mt-1">
          {note.category && categories.find(c => c.id === note.category) && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: (categories.find(c => c.id === note.category)?.color || '#6366f1') + '20',
                color: categories.find(c => c.id === note.category)?.color || '#6366f1',
              }}
            >
              {categories.find(c => c.id === note.category)?.icon}{' '}
              {categories.find(c => c.id === note.category)?.name}
            </span>
          )}
          <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            Last edited {lastSaved}
          </span>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className={`flex-1 flex overflow-hidden ${
        theme === 'dark' ? 'bg-bg-dark' : 'bg-bg-light'
      }`}>
        {/* Editor */}
        {(editorMode === 'edit' || editorMode === 'split') && (
          <div className={`flex-1 flex flex-col overflow-hidden ${
            editorMode === 'split' ? `border-r ${theme === 'dark' ? 'border-border-dark' : 'border-border-light'}` : ''
          }`}>
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <textarea
                ref={textareaRef}
                value={localContent}
                onChange={e => setLocalContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start writing... (Markdown supported)"
                className={`editor-textarea w-full h-full min-h-[200px] py-3 bg-transparent focus:outline-none ${
                  theme === 'dark' ? 'text-slate-200 placeholder-slate-600' : 'text-slate-800 placeholder-slate-300'
                }`}
              />
            </div>
          </div>
        )}

        {/* Preview */}
        {(editorMode === 'preview' || editorMode === 'split') && (
          <div className={`flex-1 overflow-y-auto px-6 pb-4 ${
            theme === 'dark' ? 'bg-bg-dark' : 'bg-bg-light'
          }`}>
            <div
              className={`markdown-preview py-3 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(localContent) }}
            />
            {!localContent.trim() && (
              <p className={`py-4 italic ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}>
                Nothing to preview yet. Start writing!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className={`flex items-center justify-between px-4 py-1.5 border-t text-xs no-print ${
        theme === 'dark'
          ? 'bg-surface-dark border-border-dark text-slate-500'
          : 'bg-surface-light border-border-light text-slate-400'
      }`}>
        <div className="flex items-center gap-4">
          <span>{stats.words} words</span>
          <span>{stats.characters} chars</span>
          <span>{stats.lines} lines</span>
          <span>~{stats.readingTime} read</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Auto-saved
          </span>
          <span>Markdown</span>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowShortcuts(false)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl shadow-2xl animate-scale-in ${
            theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  ⌨️ Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className={`p-1 rounded-lg transition-colors ${
                    theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                {[
                  ['Ctrl + B', 'Bold text'],
                  ['Ctrl + I', 'Italic text'],
                  ['Ctrl + K', 'Insert link'],
                  ['Ctrl + S', 'Save note'],
                  ['Ctrl + E', 'Toggle view mode'],
                  ['Ctrl + P', 'Pin/Unpin note'],
                  ['Ctrl + /', 'Show shortcuts'],
                  ['Tab', 'Indent'],
                  ['Ctrl + N', 'New note (in sidebar)'],
                  ['Right-click', 'Context menu on notes'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{desc}</span>
                    <kbd className={`px-2 py-0.5 rounded text-xs font-mono ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Table Insert Modal */}
      {showTableModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setShowTableModal(false); setTableHoverRow(0); setTableHoverCol(0); }} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl shadow-2xl animate-scale-in ${
            theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white'
          }`}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  📊 Insert Table
                </h2>
                <button
                  onClick={() => { setShowTableModal(false); setTableHoverRow(0); setTableHoverCol(0); }}
                  className={`p-1 rounded-lg transition-colors ${
                    theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Visual Grid Picker */}
              <div className="mb-4">
                <div className="grid grid-cols-8 gap-1 justify-items-center">
                  {Array.from({ length: 64 }, (_, idx) => {
                    const row = Math.floor(idx / 8) + 1;
                    const col = (idx % 8) + 1;
                    const isActive = row <= tableHoverRow && col <= tableHoverCol;
                    return (
                      <div
                        key={idx}
                        className={`w-7 h-7 rounded-md cursor-pointer border transition-all duration-75 ${
                          isActive
                            ? theme === 'dark'
                              ? 'bg-primary-500/60 border-primary-400 shadow-sm shadow-primary-500/20'
                              : 'bg-primary-500 border-primary-500 shadow-sm shadow-primary-500/20'
                            : theme === 'dark'
                              ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                              : 'bg-slate-50 border-slate-200 hover:bg-primary-100 hover:border-primary-300'
                        }`}
                        onMouseEnter={() => { setTableHoverRow(row); setTableHoverCol(col); }}
                        onClick={() => {
                          generateTable(row, col);
                          setShowTableModal(false);
                          setTableHoverRow(0);
                          setTableHoverCol(0);
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Size indicator */}
              <div className={`text-center text-sm font-medium mb-4 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {tableHoverRow > 0 && tableHoverCol > 0 ? (
                  <span>
                    {tableHoverRow} × {tableHoverCol} table
                    {tableHoverRow === 1 ? ' (header only)' : ` (${tableHoverRow - 1} data row${tableHoverRow - 1 > 1 ? 's' : ''})`}
                  </span>
                ) : (
                  <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}>
                    Hover to select table size
                  </span>
                )}
              </div>

              {/* Quick presets */}
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}>Quick Presets</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { label: '2 × 2', rows: 2, cols: 2 },
                    { label: '3 × 3', rows: 3, cols: 3 },
                    { label: '4 × 4', rows: 4, cols: 4 },
                    { label: '5 × 5', rows: 5, cols: 5 },
                    { label: '3 × 6', rows: 3, cols: 6 },
                    { label: '6 × 3', rows: 6, cols: 3 },
                    { label: '4 × 8', rows: 4, cols: 8 },
                    { label: '8 × 4', rows: 8, cols: 4 },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        generateTable(preset.rows, preset.cols);
                        setShowTableModal(false);
                        setTableHoverRow(0);
                        setTableHoverCol(0);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-700 text-slate-300 hover:bg-primary-600 hover:text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-primary-500 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info text */}
              <p className={`text-xs mt-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                💡 First row will be the header. You can edit cell contents after insertion.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
