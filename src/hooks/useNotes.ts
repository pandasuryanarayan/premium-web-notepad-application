import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Note, Category, ViewFilter, SortOption } from '../types';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'personal', name: 'Personal', color: '#6366f1', icon: '👤' },
  { id: 'work', name: 'Work', color: '#f59e0b', icon: '💼' },
  { id: 'ideas', name: 'Ideas', color: '#10b981', icon: '💡' },
  { id: 'journal', name: 'Journal', color: '#ec4899', icon: '📔' },
];

const WELCOME_NOTE: Note = {
  id: 'welcome',
  title: 'Welcome to NoteFlow ✨',
  content: `# Welcome to NoteFlow! 🎉

Your **premium** notepad with powerful features.

## ✨ Features

- **Markdown Editing** — Write in markdown with live preview
- **Categories** — Organize notes into custom categories
- **Pinning** — Pin important notes to the top
- **Favorites** — Star your most important notes
- **Search** — Find any note instantly
- **Themes** — Beautiful light and dark modes
- **Export** — Export as Markdown, HTML, or plain text
- **Import** — Import .md and .txt files
- **Auto-save** — Never lose your work
- **Keyboard Shortcuts** — Work faster with shortcuts
- **Focus Mode** — Distraction-free writing
- **Word Count** — Track your writing stats

## 📝 Markdown Syntax

You can use all standard markdown:

- **Bold text** with \`**bold**\`
- *Italic text* with \`*italic*\`
- ~~Strikethrough~~ with \`~~text~~\`
- \`Inline code\` with backticks
- [Links](https://example.com) with \`[text](url)\`

### Code Blocks

\`\`\`javascript
function hello() {
  console.log("Hello, NoteFlow!");
}
\`\`\`

### Lists

1. First item
2. Second item
3. Third item

> "The best way to predict the future is to create it." — Abraham Lincoln

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| \`Ctrl+N\` | New note |
| \`Ctrl+S\` | Save note |
| \`Ctrl+F\` | Search |
| \`Ctrl+E\` | Toggle preview |
| \`Ctrl+P\` | Pin note |
| \`Ctrl+D\` | Duplicate note |
| \`Ctrl+Shift+F\` | Toggle favorite |

---

*Start writing by creating a new note or editing this one!*`,
  category: 'personal',
  tags: ['welcome', 'getting-started'],
  color: 'blue',
  pinned: true,
  favorite: true,
  archived: false,
  trashed: false,
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now(),
};

export function useNotes() {
  const [notes, setNotes] = useLocalStorage<Note[]>('noteflow-notes', [WELCOME_NOTE]);
  const [categories, setCategories] = useLocalStorage<Category[]>('noteflow-categories', DEFAULT_CATEGORIES);
  const [selectedNoteId, setSelectedNoteId] = useLocalStorage<string | null>('noteflow-selected', 'welcome');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('updatedAt');

  const selectedNote = useMemo(
    () => notes.find(n => n.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Apply view filter
    switch (viewFilter) {
      case 'favorites':
        result = result.filter(n => n.favorite && !n.trashed && !n.archived);
        break;
      case 'archived':
        result = result.filter(n => n.archived && !n.trashed);
        break;
      case 'trash':
        result = result.filter(n => n.trashed);
        break;
      case 'category':
        result = result.filter(n => n.category === filterCategoryId && !n.trashed && !n.archived);
        break;
      default: // 'all'
        result = result.filter(n => !n.trashed && !n.archived);
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort: pinned first, then by sort option
    result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      switch (sortOption) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'createdAt':
          return b.createdAt - a.createdAt;
        case 'updatedAt':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

    return result;
  }, [notes, viewFilter, filterCategoryId, searchQuery, sortOption]);

  const createNote = useCallback(
    (partial?: Partial<Note>): Note => {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: 'Untitled Note',
        content: '',
        category: filterCategoryId || '',
        tags: [],
        color: 'default',
        pinned: false,
        favorite: false,
        archived: false,
        trashed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...partial,
      };
      setNotes(prev => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      return newNote;
    },
    [setNotes, setSelectedNoteId, filterCategoryId]
  );

  const updateNote = useCallback(
    (id: string, updates: Partial<Note>) => {
      setNotes(prev =>
        prev.map(n =>
          n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
        )
      );
    },
    [setNotes]
  );

  const deleteNotePermanently = useCallback(
    (id: string) => {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
    },
    [setNotes, selectedNoteId, setSelectedNoteId]
  );

  const moveToTrash = useCallback(
    (id: string) => {
      updateNote(id, { trashed: true, pinned: false });
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
    },
    [updateNote, selectedNoteId, setSelectedNoteId]
  );

  const restoreFromTrash = useCallback(
    (id: string) => {
      updateNote(id, { trashed: false });
    },
    [updateNote]
  );

  const emptyTrash = useCallback(() => {
    setNotes(prev => prev.filter(n => !n.trashed));
  }, [setNotes]);

  const duplicateNote = useCallback(
    (id: string) => {
      const original = notes.find(n => n.id === id);
      if (!original) return;
      createNote({
        title: `${original.title} (Copy)`,
        content: original.content,
        category: original.category,
        tags: [...original.tags],
        color: original.color,
        pinned: false,
        favorite: false,
      });
    },
    [notes, createNote]
  );

  const addCategory = useCallback(
    (category: Omit<Category, 'id'>) => {
      const newCat: Category = { ...category, id: crypto.randomUUID() };
      setCategories(prev => [...prev, newCat]);
    },
    [setCategories]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
      setNotes(prev => prev.map(n => (n.category === id ? { ...n, category: '' } : n)));
      if (filterCategoryId === id) {
        setViewFilter('all');
        setFilterCategoryId(null);
      }
    },
    [setCategories, setNotes, filterCategoryId]
  );

  return {
    notes,
    filteredNotes,
    selectedNote,
    selectedNoteId,
    categories,
    viewFilter,
    filterCategoryId,
    searchQuery,
    sortOption,
    setSelectedNoteId,
    setViewFilter,
    setFilterCategoryId,
    setSearchQuery,
    setSortOption,
    createNote,
    updateNote,
    deleteNotePermanently,
    moveToTrash,
    restoreFromTrash,
    emptyTrash,
    duplicateNote,
    addCategory,
    deleteCategory,
  };
}


