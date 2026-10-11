import axios, { AxiosError } from "axios";
import { storage } from "./storage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const LOGIN_URL = "/admin/login";

api.interceptors.request.use((config) => {
  const token = storage.get("token");
  if (token && !config.url?.includes(LOGIN_URL)) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (error: AxiosError) => {
    // Token eskirgan yoki login/parol boshqa joyda almashtirilgan
    if (error.response?.status === 401 && !error.config?.url?.includes(LOGIN_URL)) {
      storage.clearAuth();
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

/** Backend javobi: { status_code, data, message } */
export interface ApiResponse<T> {
  status_code: number;
  data: T;
  message: string;
}

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)?.message;
    if (Array.isArray(message)) return String(message[2] ?? message[0] ?? err.message);
    if (typeof message === "string") return message;
    if (!err.response) return "Serverga ulanib bo'lmadi";
    return err.message;
  }
  return err instanceof Error ? err.message : "Noma'lum xatolik";
}

// ─────────────────────────────── Turlar ───────────────────────────────

export interface MetricSummary {
  today: number;
  yesterday: number;
  month: number;
  prev_month: number;
  /** Oy oxirigacha kutilayotgan jami */
  forecast_month: number;
  /** Shundan hali kutilayotgan qismi */
  forecast_remaining: number;
  trend: number;
}

export interface DashboardData {
  generated_at: number;
  today: string;
  month_days: number;
  month_day: number;
  users: MetricSummary & { total: number; premium: number };
  revenue: MetricSummary & { total: number; payments_count: number };
  ai: MetricSummary & { total: number; questions: number; model: string };
  /** Sotuvda tarif yo'q — bot hamma uchun bepul */
  free_mode: boolean;
  plans: PlanStat[];
}

/** Bitta tarifni nechta odam olgani (har bir user bir marta sanaladi) */
export interface PlanStat {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  is_deleted: boolean;
  /** Shu tarifni olganlar (jami) */
  users: number;
  /** Hozir faol obunasi borlar */
  active: number;
  /** To'lab olganlar */
  paid: number;
  /** Admin sovg'a qilganlar */
  gift: number;
}

export type GrowthView = "week" | "month";

export interface GrowthData {
  view: GrowthView;
  start: string;
  end: string;
  prev: string;
  next: string | null;
  base: number;
  added: number;
  points: { date: string; new: number | null; total: number | null }[];
}

export interface Plan {
  id: string;
  name: string;
  /** Botda tarif tagida ko'rsatiladigan tavsif */
  description: string;
  price: number;
  question_limit: number;
  duration_days: number;
  /** Sotuvda (botda ko'rinadi) */
  is_active: boolean;
}

export type PlanInput = Omit<Plan, "id">;

export interface UserSubscription {
  plan_id: string;
  plan_name: string;
  /** Qolgan masalalar soni */
  remaining: number;
  expires_at: number;
  /** Admin paneldan to'lovsiz berilgan */
  gift: boolean;
}

export interface UserRow {
  id: string;
  full_name: string;
  username: string | null;
  telegram_id: string;
  created_at: number;
  last_active_at: number | null;
  /** Bepul sinovdan qolgan masalalar */
  free_remaining: number;
  /** Yuborgan masalalari soni */
  questions: number;
  /** Faol obunalar (eng oldin tugaydigani birinchi) */
  subscriptions: UserSubscription[];
}

export interface UsersPage {
  items: UserRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const adminApi = {
  dashboard: () => api.get<ApiResponse<DashboardData>>("/admin/dashboard").then((r) => r.data.data),
  growth: (view: GrowthView, date?: string) =>
    api.get<ApiResponse<GrowthData>>("/admin/users/growth", { params: { view, date } }).then((r) => r.data.data),
  plans: () => api.get<ApiResponse<Plan[]>>("/admin/plans").then((r) => r.data.data),
  createPlan: (body: PlanInput) => api.post<ApiResponse<Plan>>("/admin/plans", body).then((r) => r.data.data),
  updatePlan: (id: string, body: Partial<PlanInput>) =>
    api.put<ApiResponse<Plan>>(`/admin/plans/${encodeURIComponent(id)}`, body).then((r) => r.data.data),
  deletePlan: (id: string) => api.delete(`/admin/plans/${encodeURIComponent(id)}`).then((r) => r.data),
  users: (params: { page: number; limit: number; search?: string; premium?: string }) =>
    api.get<ApiResponse<UsersPage>>("/admin/users", { params }).then((r) => r.data.data),
  grant: (id: string, body: { plan_id: string; days?: number; question_limit?: number }) =>
    api.post(`/admin/users/${id}/subscription`, body).then((r) => r.data),
  revoke: (id: string) => api.delete(`/admin/users/${id}/subscription`).then((r) => r.data),
  updateCredentials: (body: { current_password: string; username?: string; new_password?: string }) =>
    api.put<ApiResponse<{ token: string; username: string }>>("/admin/credentials", body).then((r) => r.data.data),
};
