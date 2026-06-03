import { useState, useRef } from 'react';
import type { Note, Category, ViewFilter, SortOption, NoteColor } from '../types';
import { getPreviewText, formatDate } from '../utils/notes';

interface SidebarProps {
  notes: Note[];
  filteredNotes: Note[];
  categories: Category[];
  selectedNoteId: string | null;
  viewFilter: ViewFilter;
  filterCategoryId: string | null;
  searchQuery: string;
  sortOption: SortOption;
  isCollapsed: boolean;
  theme: 'light' | 'dark';
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onSetViewFilter: (filter: ViewFilter) => void;
  onSetFilterCategoryId: (id: string | null) => void;
  onSetSearchQuery: (q: string) => void;
  onSetSortOption: (option: SortOption) => void;
  onToggleCollapse: () => void;
  onDeleteNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  onEmptyTrash: () => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
}

const NOTE_COLORS: { value: NoteColor; label: string; class: string; dot: string }[] = [
  { value: 'default', label: 'None', class: '', dot: 'bg-gray-300 dark:bg-gray-600' },
  { value: 'red', label: 'Red', class: 'note-color-red', dot: 'bg-red-500' },
  { value: 'orange', label: 'Orange', class: 'note-color-orange', dot: 'bg-orange-500' },
  { value: 'yellow', label: 'Yellow', class: 'note-color-yellow', dot: 'bg-yellow-500' },
  { value: 'green', label: 'Green', class: 'note-color-green', dot: 'bg-green-500' },
  { value: 'blue', label: 'Blue', class: 'note-color-blue', dot: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', class: 'note-color-purple', dot: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', class: 'note-color-pink', dot: 'bg-pink-500' },
];

export default function Sidebar({
  filteredNotes,
  categories,
  selectedNoteId,
  viewFilter,
  filterCategoryId,
  searchQuery,
  sortOption,
  isCollapsed,
  theme,
  onSelectNote,
  onCreateNote,
  onSetViewFilter,
  onSetFilterCategoryId,
  onSetSearchQuery,
  onSetSortOption,
  onToggleCollapse,
  onDeleteNote,
  onRestoreNote,
  onDuplicateNote,
  onEmptyTrash,
  onAddCategory,
  onDeleteCategory,
}: SidebarProps) {
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleNewCategory = () => {
    if (newCatName.trim()) {
      onAddCategory({ name: newCatName.trim(), color: newCatColor, icon: newCatIcon });
      setNewCatName('');
      setShowNewCategory(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    setContextMenu({ id: noteId, x: e.clientX, y: e.clientY });
  };

  const filterItems: { key: ViewFilter; label: string; icon: string; count?: number }[] = [
    { key: 'all', label: 'All Notes', icon: '📝' },
    { key: 'favorites', label: 'Favorites', icon: '⭐' },
    { key: 'archived', label: 'Archive', icon: '📦' },
    { key: 'trash', label: 'Trash', icon: '🗑️' },
  ];

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'updatedAt', label: 'Last Modified' },
    { key: 'createdAt', label: 'Date Created' },
    { key: 'title', label: 'Title A-Z' },
  ];

  if (isCollapsed) {
    return (
      <div className={`w-14 flex flex-col items-center py-4 gap-3 border-r no-print transition-all duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <button
          onClick={onToggleCollapse}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={onCreateNote}
          className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          data-tooltip="New Note"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="flex-1 flex flex-col items-center gap-1 mt-2">
          {filterItems.map(item => (
            <button
              key={item.key}
              onClick={() => onSetViewFilter(item.key)}
              className={`p-2 rounded-lg text-sm transition-colors ${
                viewFilter === item.key
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`sidebar-panel w-80 flex flex-col border-r no-print transition-all duration-300 ${
      theme === 'dark' ? 'bg-surface-dark border-border-dark' : 'bg-surface-light border-border-light'
    }`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold shadow-md">
              N
            </div>
            <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              NoteFlow
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => searchRef.current?.focus()}
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => onSetSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm transition-colors ${
              theme === 'dark'
                ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-primary-500'
                : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-primary-400'
            } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
          />
          {searchQuery && (
            <button
              onClick={() => onSetSearchQuery('')}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded ${
                theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* New Note Button */}
        <button
          onClick={onCreateNote}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-medium shadow-md shadow-primary-500/25 transition-all hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Note
        </button>
      </div>

      {/* View Filters */}
      <div className="px-3 py-2">
        <div className="flex gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/50">
          {filterItems.map(item => (
            <button
              key={item.key}
              onClick={() => {
                onSetViewFilter(item.key);
                onSetFilterCategoryId(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewFilter === item.key && !filterCategoryId
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
          }`}>Categories</span>
          <button
            onClick={() => setShowNewCategory(!showNewCategory)}
            className={`p-0.5 rounded transition-colors ${
              theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {showNewCategory && (
          <div className={`p-2 rounded-lg mb-2 space-y-2 animate-fade-in ${
            theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'
          }`}>
            <input
              type="text"
              placeholder="Category name..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNewCategory()}
              className={`w-full px-2 py-1.5 rounded text-sm ${
                theme === 'dark'
                  ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400'
                  : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400'
              } focus:outline-none focus:ring-1 focus:ring-primary-500`}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newCatColor}
                onChange={e => setNewCatColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
              <div className="flex gap-1">
                {['📁', '💼', '👤', '💡', '📔', '🎯', '📚', '🎨', '🎵', '🏠'].map(icon => (
                  <button
                    key={icon}
                    onClick={() => setNewCatIcon(icon)}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${
                      newCatIcon === icon
                        ? 'bg-primary-100 dark:bg-primary-900/30 ring-1 ring-primary-400'
                        : theme === 'dark' ? 'hover:bg-slate-600' : 'hover:bg-slate-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <button
                onClick={handleNewCategory}
                className="ml-auto px-2 py-1 bg-primary-500 text-white text-xs rounded hover:bg-primary-600 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}

        <div className="space-y-0.5 mb-2">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                filterCategoryId === cat.id
                  ? theme === 'dark' ? 'bg-slate-700/50' : 'bg-primary-50'
                  : theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
              }`}
              onClick={() => {
                onSetViewFilter('category');
                onSetFilterCategoryId(cat.id);
              }}
            >
              <span className="text-sm">{cat.icon}</span>
              <span className={`text-sm flex-1 truncate ${
                filterCategoryId === cat.id
                  ? 'text-primary-600 dark:text-primary-400 font-medium'
                  : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>{cat.name}</span>
              <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: cat.color }} />
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteCategory(cat.id);
                }}
                className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all ${
                  theme === 'dark' ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="px-4 py-1 flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${
          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
        </span>
        <select
          value={sortOption}
          onChange={e => onSetSortOption(e.target.value as SortOption)}
          className={`text-xs px-2 py-1 rounded border-0 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-800 text-slate-400'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {sortOptions.map(opt => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {viewFilter === 'trash' && filteredNotes.length > 0 && (
          <button
            onClick={onEmptyTrash}
            className="w-full text-xs text-red-500 hover:text-red-600 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            🗑️ Empty Trash ({filteredNotes.length} notes)
          </button>
        )}

        {filteredNotes.map((note, index) => {
          const colorInfo = NOTE_COLORS.find(c => c.value === note.color);
          return (
            <div
              key={note.id}
              className={`group rounded-xl p-3 cursor-pointer transition-all border-l-[3px] animate-fade-in ${
                colorInfo?.class || 'note-color-default'
              } ${
                selectedNoteId === note.id
                  ? theme === 'dark'
                    ? 'bg-slate-700/70 border-l-primary-400 shadow-md shadow-slate-900/30'
                    : 'bg-primary-50 border-l-primary-500 shadow-md shadow-primary-500/5'
                  : theme === 'dark'
                    ? 'hover:bg-slate-800/70 border-l-transparent hover:border-l-slate-600'
                    : 'hover:bg-slate-50 border-l-transparent hover:border-l-slate-300'
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => onSelectNote(note.id)}
              onContextMenu={e => handleContextMenu(e, note.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-sm font-semibold truncate flex-1 ${
                  selectedNoteId === note.id
                    ? theme === 'dark' ? 'text-white' : 'text-slate-800'
                    : theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  {note.title || 'Untitled Note'}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  {note.pinned && (
                    <span className="text-xs" title="Pinned">📌</span>
                  )}
                  {note.favorite && (
                    <span className="text-xs" title="Favorite">⭐</span>
                  )}
                </div>
              </div>
              {note.content && (
                <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {getPreviewText(note.content, 120)}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {formatDate(note.updatedAt)}
                </span>
                {note.category && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: (categories.find(c => c.id === note.category)?.color || '#6366f1') + '20',
                      color: categories.find(c => c.id === note.category)?.color || '#6366f1',
                    }}
                  >
                    {categories.find(c => c.id === note.category)?.icon}{' '}
                    {categories.find(c => c.id === note.category)?.name}
                  </span>
                )}
                {viewFilter === 'trash' && (
                  <div className="flex gap-1 ml-auto">
                    <button
                      onClick={e => { e.stopPropagation(); onRestoreNote(note.id); }}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                        theme === 'dark' ? 'text-green-400 hover:bg-slate-600' : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      Restore
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteNote(note.id); }}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                        theme === 'dark' ? 'text-red-400 hover:bg-slate-600' : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            <div className="text-3xl mb-2">
              {viewFilter === 'trash' ? '🗑️' : viewFilter === 'favorites' ? '⭐' : viewFilter === 'archived' ? '📦' : '📝'}
            </div>
            <p className="text-sm">
              {searchQuery ? 'No notes match your search' : viewFilter === 'trash' ? 'Trash is empty' : 'No notes yet'}
            </p>
            {!searchQuery && viewFilter === 'all' && (
              <button
                onClick={onCreateNote}
                className="mt-2 text-sm text-primary-500 hover:text-primary-600 transition-colors"
              >
                Create your first note →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className={`fixed z-50 py-1 rounded-xl shadow-xl border animate-scale-in ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200'
            }`}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {[
              { label: '📌 Pin/Unpin', action: () => { /* handled externally */ } },
              { label: '⭐ Favorite/Unfavorite', action: () => {} },
              { label: '📋 Duplicate', action: () => onDuplicateNote(contextMenu.id) },
              { type: 'separator' as const },
              ...(viewFilter === 'trash'
                ? [
                    { label: '↩️ Restore', action: () => onRestoreNote(contextMenu.id) },
                    { label: '🗑️ Delete Permanently', action: () => onDeleteNote(contextMenu.id), danger: true },
                  ]
                : [
                    { label: '📦 Archive', action: () => {} },
                    { label: '🗑️ Move to Trash', action: () => onDeleteNote(contextMenu.id), danger: true },
                  ]
              ),
            ].map((item, i) =>
              item.type === 'separator' ? (
                <div key={i} className={`my-1 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`} />
              ) : (
                <button
                  key={i}
                  onClick={() => {
                    (item as { action: () => void }).action();
                    setContextMenu(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    (item as { danger?: boolean }).danger
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-700'
                        : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
