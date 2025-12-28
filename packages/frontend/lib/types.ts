// Common types for the frontend

export interface Actor {
  id: string;
  actorId?: string;
  iri?: string;
  acct?: string;
  preferredUsername: string;
  name?: string;
  summary?: string;
  url?: string;
  icon?: { type: string; mediaType?: string; url: string };
  image?: { type: string; mediaType?: string; url: string };
  inboxUrl?: string;
  outboxUrl?: string;
  sharedInboxUrl?: string;
  followersUrl?: string;
  followingUrl?: string;
  manuallyApprovesFollowers?: boolean;
  type: string;
  domain?: string;
  isLocal?: boolean;
  userId?: string | null;
  followersCount?: number;
  followingCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  isLocked?: boolean;
  defaultVisibility?: NoteVisibility;
  isAdmin?: boolean;
  createdAt?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  domain?: string;
  actor?: Actor;
  icon?: { type: string; mediaType?: string; url: string };
  manuallyApprovesFollowers?: boolean;
}

export type NoteVisibility = 'public' | 'unlisted' | 'followers' | 'direct';

export interface NoteAttachment {
  type: string;
  url: string;
  mediaType?: string;
  name?: string;
}

export interface Note {
  id: string;
  content: string;
  source?: string;
  mediaType?: string;
  visibility: NoteVisibility;
  author: Actor;
  attachments?: NoteAttachment[];
  createdAt: string;
  updatedAt?: string;
  repliesCount?: number;
  renotesCount?: number;
  reactionsCount?: number;
}

export interface Presentation {
  id: string;
  title: string;
  url: string;
  pdfKey: string;
  noteId?: string;
  userId: string;
  createdAt: string;
}

export interface SearchResult {
  users: User[];
  notes: Note[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  hasMore?: boolean;
}
