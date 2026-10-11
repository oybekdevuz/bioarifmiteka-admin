import { create } from "zustand";
import { api, ApiResponse } from "../lib/api";
import { storage } from "../lib/storage";

interface AuthState {
  token: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  /** Login/parol almashtirilgandan keyin backend bergan yangi token */
  setSession: (token: string, username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: storage.get("token"),
  username: storage.get("username"),

  login: async (username, password) => {
    const resp = await api.post<ApiResponse<{ token: string; username: string }>>("/admin/login", {
      username,
      password,
    });
    const data = resp.data.data;
    storage.set("token", data.token);
    storage.set("username", data.username);
    set({ token: data.token, username: data.username });
  },

  setSession: (token, username) => {
    storage.set("token", token);
    storage.set("username", username);
    set({ token, username });
  },

  logout: () => {
    storage.clearAuth();
    set({ token: null, username: null });
  },
}));
