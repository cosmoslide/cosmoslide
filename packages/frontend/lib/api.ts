const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Try to get the error message from the response
    let errorMessage = `API call failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // If we can't parse the error response, use the default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const authApi = {
  sendMagicLink: (email: string) =>
    fetchAPI('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyToken: (token: string, username?: string, displayName?: string) =>
    fetchAPI(`/auth/verify?token=${token}`, {
      method: 'POST',
      body: JSON.stringify({ username, displayName }),
    }),

  getMe: () => fetchAPI('/auth/me'),
};

export const userApi = {
  getProfile: (username: string) => fetchAPI(`/users/${username}`),
  updateProfile: (data: {
    displayName?: string;
    bio?: string;
    email?: string;
    defaultVisibility?: 'public' | 'unlisted' | 'followers' | 'direct';
  }) =>
    fetchAPI('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updatePrivacySettings: (data: { isLocked?: boolean }) =>
    fetchAPI('/users/me/privacy', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateAvatar: (avatarUrl: string) =>
    fetchAPI('/users/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    }),
  getUserNotes: async (username: string, limit = 20, offset = 0) => {
    return fetchAPI(`/users/${username}/notes?limit=${limit}&offset=${offset}`);
  },
  followUser: (username: string) =>
    fetchAPI(`/users/${username}/follow`, {
      method: 'POST',
    }),
  unfollowUser: (username: string) =>
    fetchAPI(`/users/${username}/follow`, {
      method: 'DELETE',
    }),
  getFollowStatus: (
    username: string,
  ): Promise<{ status: 'none' | 'pending' | 'accepted' }> =>
    fetchAPI(`/users/${username}/follow-status`),
  getFollowers: async (username: string, limit = 20, offset = 0) => {
    const items = await fetchAPI(
      `/users/${username}/followers?limit=${limit}&offset=${offset}`,
    );
    return { items: items || [] };
  },
  getFollowing: async (username: string, limit = 20, offset = 0) => {
    const items = await fetchAPI(
      `/users/${username}/following?limit=${limit}&offset=${offset}`,
    );
    return { items: items || [] };
  },
  getUserPresentations: async (username: string) => {
    return fetchAPI(`/users/${username}/presentations`);
  },
};

export const notesApi = {
  getPublicTimeline: (limit = 20, offset = 0) =>
    fetchAPI(`/timeline/public?limit=${limit}&offset=${offset}`),
  getHomeTimeline: (limit = 20, offset = 0) =>
    fetchAPI(`/timeline/home?limit=${limit}&offset=${offset}`),
  getById: (id: string) => fetchAPI(`/notes/${id}`),
  create: (data: {
    content: string;
    contentType?: 'text/plain' | 'text/markdown';
    visibility?: string;
  }) =>
    fetchAPI('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  preview: (content: string): Promise<{ html: string }> =>
    fetchAPI('/notes/preview', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  delete: (id: string) =>
    fetchAPI(`/notes/${id}`, {
      method: 'DELETE',
    }),
};

export const searchApi = {
  search: async (query: string) => {
    const result = await fetchAPI(`/search?q=${encodeURIComponent(query)}`);
    return {
      users: result?.users || [],
      notes: result?.notes || [],
    };
  },
};

export const followRequestApi = {
  getFollowRequests: async (username: string) =>
    fetchAPI(`/users/${username}/follow-requests`),

  acceptFollowRequest: async (username: string, requesterUsername: string) =>
    fetchAPI(`/users/${username}/follow-requests/${requesterUsername}/accept`, {
      method: 'POST',
    }),

  rejectFollowRequest: async (username: string, requesterUsername: string) =>
    fetchAPI(`/users/${username}/follow-requests/${requesterUsername}/reject`, {
      method: 'POST',
    }),
};

export const uploadApi = {
  uploadFile: async (file: File): Promise<{ key: string; url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Upload failed: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Use default message
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return { key: result.key, url: result.url };
  },

  uploadProfileImage: async (
    file: File,
  ): Promise<{ key: string; url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${API_BASE_URL}/upload/profile-image`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Profile image upload failed: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Use default message
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return { key: result.key, url: result.url };
  },

  uploadPresentation: async (
    file: File,
    title: string,
  ): Promise<{
    id: string;
    title: string;
    url: string;
    pdfKey: string;
    noteId: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${API_BASE_URL}/presentations`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Presentation upload failed: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Use default message
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  getFileUrl: async (key: string): Promise<string> => {
    // Use the proxy endpoint which doesn't require auth
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${API_BASE_URL}/upload/view/${key}`;
  },

  deleteFile: async (key: string): Promise<void> => {
    await fetchAPI(`/upload/file/${key}`, {
      method: 'DELETE',
    });
  },

  listFiles: async (): Promise<string[]> => {
    const result = await fetchAPI('/upload/list');
    return result.files || [];
  },

  getPresentation: async (id: string) => {
    return fetchAPI(`/presentations/${id}`);
  },
};
