# ✨ NoteFlow — Premium Web Notepad

> A beautifully crafted, feature-rich web notepad built with React, TypeScript, and Tailwind CSS. Write in Markdown, organize with categories & tags, and customize your workspace — all with a premium feel.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🖼️ Features at a Glance

### 📝 Rich Markdown Editing
- Full **GitHub-Flavored Markdown (GFM)** support via `marked`
- Formatting toolbar with one-click buttons for **bold**, *italic*, ~~strikethrough~~, headings, lists, code blocks, links, blockquotes, and more
- **📊 Table Insertion** — Visual grid picker (hover to select rows × columns) plus quick presets for instantly inserting Markdown tables
- **Three view modes**: Edit only, Split (side-by-side live preview), and Preview only
- Tab indentation support inside the editor
- Monospace font for comfortable code/Markdown writing

### 🗂️ Organization & Management
- **Custom Categories** — Create categories with names, colors, and emoji icons (Personal, Work, Ideas, Journal, and more)
- **Tags** — Add and remove tags on any note for fine-grained organization
- **Pin Notes** — Pin important notes to the top of the list
- **Favorite/Star** — Mark your most important notes for quick access
- **Archive** — Archive notes you want to keep but not see every day
- **Trash** — Soft-delete notes with the ability to restore or permanently delete
- **Color-Coded Notes** — 8 color options (red, orange, yellow, green, blue, purple, pink) for visual sorting
- **Sorting** — Sort notes by last modified, date created, or title (A-Z)

### 🔍 Search & Filtering
- **Full-text search** across note titles, content, and tags
- **View filters**: All Notes, Favorites, Archive, Trash, and per-Category
- Real-time filtering with instant results

### 📤 Import & Export
- **Export** notes as:
  - Markdown (`.md`)
  - Plain Text (`.txt`)
  - Standalone HTML (`.html`) with embedded styles
- **Import** `.md` and `.txt` files directly into any note

### 🎨 Theming & UI
- **Light & Dark themes** with smooth, animated transitions
- **Focus Mode** — Distraction-free fullscreen writing experience
- **Collapsible sidebar** for maximum editing space
- **Right-click context menus** on notes (pin, favorite, duplicate, archive, trash)
- Smooth **fade/slide animations** throughout the UI
- Custom **scrollbar styling** for both themes
- **Responsive design** that adapts to any screen size

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Create new note |
| `Ctrl + S` | Save note |
| `Ctrl + B` | Bold text |
| `Ctrl + I` | Italic text |
| `Ctrl + K` | Insert link |
| `Ctrl + E` | Cycle view mode (Edit → Split → Preview) |
| `Ctrl + P` | Pin / Unpin note |
| `Ctrl + Shift + F` | Toggle favorite |
| `Ctrl + /` | Show keyboard shortcuts |
| `Tab` | Indent in editor |
| Right-click | Context menu |

### 📊 Table Insertion
- Click the **table icon** in the toolbar to open the table picker
- **Visual Grid Picker** — Hover over the 8×8 grid to highlight your desired size (up to 8 rows × 8 columns)
- **Quick Presets** — One-click buttons for common sizes: 2×2, 3×3, 4×4, 5×5, 3×6, 6×3, 4×8, 8×4
- First row is automatically generated as the **header row** with separator
- All cells come pre-filled with placeholder text (e.g., `Header 1`, `Cell 1.1`) for easy editing
- Cursor is automatically placed at the first header cell after insertion

### 📊 Status Bar
- Real-time **word count**, **character count**, **line count**, and **reading time** estimate
- Auto-save indicator with last-edited timestamp

### 💾 Persistence
- All data persisted in **localStorage** — your notes survive page refreshes and browser restarts
- Auto-save with 500ms debounce for a seamless writing experience

---

## 🏗️ Project Structure

```
src/
├── App.tsx                  # Main app component — layout, theme, keyboard shortcuts
├── main.tsx                 # React DOM entry point
├── index.css                # Tailwind imports + custom Markdown preview styles
├── types.ts                 # TypeScript type definitions (Note, Category, Theme, etc.)
├── components/
│   ├── Sidebar.tsx          # Note list, search, categories, filters, context menus
│   └── Editor.tsx           # Markdown editor, toolbar, preview, tags, export/import
├── hooks/
│   ├── useNotes.ts          # Core notes state management (CRUD, filtering, sorting)
│   └── useLocalStorage.ts   # Generic localStorage hook + debounce utility
└── utils/
    ├── notes.ts             # Markdown rendering, stats, export/import, formatting
    └── cn.ts                # Class name utility (clsx + tailwind-merge)
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI component library |
| **TypeScript** | Type-safe development |
| **Vite 7** | Lightning-fast build tool |
| **Tailwind CSS 4** | Utility-first styling |
| **marked** | Markdown → HTML parsing |
| **localStorage** | Client-side data persistence |
| **vite-plugin-singlefile** | Single-file production build |

---

## 📐 Architecture Decisions

- **No backend required** — everything runs client-side in the browser using localStorage for persistence
- **Custom hooks pattern** (`useNotes`, `useLocalStorage`) for clean separation of state logic from UI
- **Optimistic auto-save** — notes save automatically with a debounce, no manual save needed (though `Ctrl+S` is supported)
- **Single-file build output** — the entire app compiles to one `dist/index.html` for easy deployment
- **Theme-aware components** — every component accepts a `theme` prop for light/dark mode rendering

---

## 📝 Note Data Model

```typescript
interface Note {
  id: string;           // UUID
  title: string;
  content: string;      // Markdown content
  category: string;     // Category ID
  tags: string[];       // Array of lowercase tag strings
  color: NoteColor;     // 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'
  pinned: boolean;
  favorite: boolean;
  archived: boolean;
  trashed: boolean;
  createdAt: number;    // Unix timestamp
  updatedAt: number;    // Unix timestamp
}
```

---

## 🎯 Default Categories

The app ships with 4 preset categories to get you started:

| Category | Color | Icon |
|----------|-------|------|
| Personal | Indigo | 👤 |
| Work | Amber | 💼 |
| Ideas | Emerald | 💡 |
| Journal | Pink | 🔔 |

You can add unlimited custom categories with your own names, colors, and emoji icons.

---

## 📄 License

This project is open source and available for personal and commercial use.

---

<p align="center">
  Built with ❤️ using React, TypeScript & Tailwind CSS
</p>
