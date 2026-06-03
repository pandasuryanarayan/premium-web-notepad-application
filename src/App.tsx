import { useState, useEffect, useCallback } from 'react';
import { useNotes } from './hooks/useNotes';
import { useLocalStorage } from './hooks/useLocalStorage';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import type { EditorMode, Theme } from './types';

export default function App() {
  const {
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
  } = useNotes();

  const [theme, setTheme] = useLocalStorage<Theme>('noteflow-theme', 'light');
  const [editorMode, setEditorMode] = useLocalStorage<EditorMode>('noteflow-editor-mode', 'edit');
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('noteflow-sidebar-collapsed', false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            handleCreateNote();
            break;
          case 'f':
            if (e.shiftKey) {
              e.preventDefault();
              if (selectedNote) {
                updateNote(selectedNote.id, { favorite: !selectedNote.favorite });
              }
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNote]);

  const handleCreateNote = useCallback(() => {
    createNote();
    setEditorMode('edit');
  }, [createNote, setEditorMode]);

  const handleSelectNote = useCallback((id: string) => {
    setSelectedNoteId(id);
  }, [setSelectedNoteId]);

  const handleUpdateNote = useCallback((id: string, updates: Partial<typeof notes[0]>) => {
    updateNote(id, updates);
  }, [updateNote]);

  return (
    <div className={`h-screen flex overflow-hidden ${focusMode ? '' : ''} ${
      theme === 'dark' ? 'dark' : ''
    }`} style={{ colorScheme: theme }}>
      {/* Background */}
      <div className={`h-screen flex w-full ${
        theme === 'dark' ? 'bg-bg-dark' : 'bg-bg-light'
      }`}>
        {/* Sidebar */}
        <Sidebar
          notes={notes}
          filteredNotes={filteredNotes}
          categories={categories}
          selectedNoteId={selectedNoteId}
          viewFilter={viewFilter}
          filterCategoryId={filterCategoryId}
          searchQuery={searchQuery}
          sortOption={sortOption}
          isCollapsed={sidebarCollapsed}
          theme={theme}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onSetViewFilter={setViewFilter}
          onSetFilterCategoryId={setFilterCategoryId}
          onSetSearchQuery={setSearchQuery}
          onSetSortOption={setSortOption}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          onDeleteNote={viewFilter === 'trash' ? deleteNotePermanently : moveToTrash}
          onRestoreNote={restoreFromTrash}
          onDuplicateNote={duplicateNote}
          onEmptyTrash={emptyTrash}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
        />

        {/* Editor */}
        <Editor
          note={selectedNote}
          categories={categories}
          theme={theme}
          editorMode={editorMode}
          focusMode={focusMode}
          onUpdateNote={handleUpdateNote}
          onCreateNote={handleCreateNote}
          onSetEditorMode={setEditorMode}
          onToggleFocusMode={() => setFocusMode(prev => !prev)}
          onMoveToTrash={moveToTrash}
        />

        {/* Theme Toggle - floating */}
        <button
          onClick={toggleTheme}
          className={`fixed bottom-4 right-4 z-30 p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 no-print ${
            theme === 'dark'
              ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 shadow-slate-900/30'
              : 'bg-white text-slate-600 hover:bg-slate-50 shadow-slate-200/50'
          }`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
