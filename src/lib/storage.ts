const KEYS = {
  token: "bioarifmetika_admin_token",
  username: "bioarifmetika_admin_username",
} as const;

type Key = keyof typeof KEYS;

export const storage = {
  get(key: Key): string | null {
    return localStorage.getItem(KEYS[key]);
  },
  set(key: Key, value: string) {
    localStorage.setItem(KEYS[key], value);
  },
  clearAuth() {
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.username);
  },
};
