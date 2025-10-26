import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  requestMagicLink: (email: string) => api.post("/admin/auth/magic-link", { email }),

  verifyMagicLink: (token: string) => api.post(`/auth/verify?token=${token}`),

  getMe: () => api.get("/auth/me"),
};

// Admin API
export const adminAPI = {
  getUsers: (page = 1, limit = 20) =>
    api.get(`/admin/users?page=${page}&limit=${limit}`),

  createUser: (
    data: { email: string; username: string; displayName?: string },
  ) => api.post("/admin/users", data),

  toggleAdminStatus: (userId: string, isAdmin: boolean) =>
    api.patch(`/admin/users/${userId}/admin`, { isAdmin }),

  getActors: (page = 1, limit = 20, isLocal?: boolean) => {
    let url = `/admin/actors?page=${page}&limit=${limit}`;
    if (isLocal !== undefined) {
      url += `&isLocal=${isLocal}`;
    }
    return api.get(url);
  },

  syncActor: (actorId: string) =>
    api.post(`/admin/actors/${actorId}/sync`),

  syncAllLocalActors: () => api.post("/admin/actors/sync-all"),
};
