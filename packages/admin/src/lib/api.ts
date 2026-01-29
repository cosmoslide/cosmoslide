import axios from 'axios';
import { Result, Ok, Err } from './result';
import {
  ApiError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  parseAxiosError,
} from './errors';

// Server-side: use internal Docker network URL, Client-side: use browser-accessible URL
function getApiBaseUrl() {
  if (typeof window === 'undefined') {
    // Server-side rendering - use internal Docker URL or env var
    return (
      process.env.SSR_API_URL ||
      import.meta.env.VITE_API_URL ||
      'http://localhost:3000'
    );
  }
  // Client-side - use browser-accessible URL
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available (only on client-side)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 errors (only on client-side)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Response types
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: string;
  actor?: {
    id: string;
    actorId: string;
    isLocal: boolean;
  };
}

interface Actor {
  id: string;
  actorId: string;
  iri?: string;
  acct?: string;
  preferredUsername: string;
  name: string;
  summary?: string;
  url?: string;
  icon?: { type: string; mediaType?: string; url: string };
  image?: { type: string; mediaType?: string; url: string };
  inboxUrl?: string;
  outboxUrl?: string;
  sharedInboxUrl?: string;
  followersUrl?: string;
  followingUrl?: string;
  manuallyApprovesFollowers: boolean;
  type: string;
  domain: string;
  isLocal: boolean;
  userId: string | null;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  updatedAt: string;
  lastFetchedAt?: string;
  user?: { id: string; username: string; email: string };
}

interface UsersResponse {
  data: User[];
  meta: PaginationMeta;
}

interface ActorsResponse {
  data: Actor[];
  meta: PaginationMeta;
}

interface CreateUserResponse {
  user: User;
  actor: Actor;
  invitations: Array<{
    code: string;
    url: string;
    maxUses: number;
    expiresAt: string;
  }>;
}

interface SyncActorResponse {
  message: string;
  actor: Actor;
}

interface SyncAllResponse {
  message: string;
  synced: number;
  errors: string[];
}

interface FetchActorResponse {
  message: string;
  actor: Actor;
}

interface VerifyMagicLinkResponse {
  access_token: string;
}

interface GetMeResponse {
  id: string;
  username: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

// Auth API with Result types
export const authAPI = {
  requestMagicLink: async (
    email: string,
  ): Promise<
    Result<
      { message: string },
      NetworkError | NotFoundError | UnauthorizedError
    >
  > => {
    try {
      const response = await api.post('/admin/auth/magic-link', { email });
      return Ok(response.data);
    } catch (error) {
      return Err(
        parseAxiosError(error) as
          | NetworkError
          | NotFoundError
          | UnauthorizedError,
      );
    }
  },

  verifyMagicLink: async (
    token: string,
  ): Promise<
    Result<VerifyMagicLinkResponse, NetworkError | UnauthorizedError>
  > => {
    try {
      const response = await api.post(`/auth/verify?token=${token}`);
      return Ok(response.data);
    } catch (error) {
      return Err(parseAxiosError(error) as NetworkError | UnauthorizedError);
    }
  },

  getMe: async (): Promise<
    Result<GetMeResponse, NetworkError | UnauthorizedError>
  > => {
    try {
      const response = await api.get('/auth/me');
      return Ok(response.data);
    } catch (error) {
      return Err(parseAxiosError(error) as NetworkError | UnauthorizedError);
    }
  },
};

// Admin API with Result types
export const adminAPI = {
  getUsers: async (
    page = 1,
    limit = 20,
  ): Promise<Result<UsersResponse, NetworkError | UnauthorizedError>> => {
    try {
      const response = await api.get(
        `/admin/users?page=${page}&limit=${limit}`,
      );
      return Ok(response.data);
    } catch (error) {
      return Err(parseAxiosError(error) as NetworkError | UnauthorizedError);
    }
  },

  createUser: async (data: {
    email: string;
    username: string;
    displayName?: string;
  }): Promise<Result<CreateUserResponse, NetworkError | ConflictError>> => {
    try {
      const response = await api.post('/admin/users', data);
      return Ok(response.data);
    } catch (error) {
      return Err(parseAxiosError(error) as NetworkError | ConflictError);
    }
  },

  toggleAdminStatus: async (
    userId: string,
    isAdmin: boolean,
  ): Promise<Result<User, NetworkError | NotFoundError>> => {
    try {
      const response = await api.patch(`/admin/users/${userId}/admin`, {
        isAdmin,
      });
      return Ok(response.data);
    } catch (error) {
      return Err(parseAxiosError(error) as NetworkError | NotFoundError);
    }
  },

  getActors: async (
    page = 1,
    limit = 20,
    isLocal?: boolean,
  ): Promise<Result<ActorsResponse, NetworkError | UnauthorizedError>> => {
    try {
      let url = `/admin/actors?page=${page}&limit=${limit}`;
      if (isLocal !== undefined) {
        url += `&isLocal=${isLocal}`;
      }
      const response = await api.get(url);
      return Ok(response.data);
    } catch (error) {
      return Err(parseAxiosError(error) as NetworkError | UnauthorizedError);
    }
  },

  syncActor: async (
    actorId: string,
  ): Promise<Result<SyncActorResponse, NetworkError | NotFoundError>> => {
    try {
      const response = await api.post(`/admin/actors/${actorId}/sync`);
      return Ok(response.data);
    } catch (error) {
      return Err(parseAxiosError(error) as NetworkError | NotFoundError);
    }
  },

  syncAllLocalActors: async (): Promise<
    Result<SyncAllResponse, NetworkError>
  > => {
    try {
      const response = await api.post('/admin/actors/sync-all');
      return Ok(response.data);
    } catch (error) {
      return Err(parseAxiosError(error) as NetworkError);
    }
  },

  fetchAndPersistActor: async (
    actorUrl: string,
  ): Promise<Result<FetchActorResponse, ApiError>> => {
    try {
      const response = await api.post('/admin/actors/fetch', { actorUrl });
      return Ok(response.data);
    } catch (error) {
      return Err(parseAxiosError(error));
    }
  },
};

// Re-export types for use in components
export type { User, Actor, UsersResponse, ActorsResponse };
