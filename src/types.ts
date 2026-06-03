export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  color: NoteColor;
  pinned: boolean;
  favorite: boolean;
  archived: boolean;
  trashed: boolean;
  createdAt: number;
  updatedAt: number;
}

export type NoteColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export type ViewFilter = 'all' | 'favorites' | 'archived' | 'trash' | 'category';

export type EditorMode = 'edit' | 'split' | 'preview';

export type SortOption = 'updatedAt' | 'createdAt' | 'title';

export type Theme = 'light' | 'dark';
