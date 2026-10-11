import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { adminApi, extractError, Plan, UserRow } from "../lib/api";
import { formatDate, formatNumber } from "../lib/format";
import Pagination from "../components/Pagination";

type Action =
  | { kind: "grant"; id: string; plan_id: string; days: number; question_limit: number }
  | { kind: "revoke"; id: string };

export default function Users() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  const page = Math.max(1, Number(params.get("page")) || 1);
  const premium = params.get("premium") || "";
  const search = params.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  // Qidiruv: yozishdan to'xtagach 300 ms o'tib so'rov yuboriladi
  useEffect(() => {
    const value = searchInput.trim();
    if (value === search) return;
    const timer = setTimeout(() => updateParam("search", value), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const query = useQuery({
    queryKey: ["users", page, premium, search],
    queryFn: () => adminApi.users({ page, limit: 20, search: search || undefined, premium: premium || undefined }),
    placeholderData: keepPreviousData,
  });
  const plansQuery = useQuery({ queryKey: ["plans"], queryFn: adminApi.plans, staleTime: Infinity });

  const mutation = useMutation({
    mutationFn: (a: Action) =>
      a.kind === "grant"
        ? adminApi.grant(a.id, { plan_id: a.plan_id, days: a.days, question_limit: a.question_limit })
        : adminApi.revoke(a.id),
    onSuccess: (_, a) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      Swal.fire({
        icon: "success",
        title: a.kind === "grant" ? "Obuna berildi" : "Obuna o'chirildi",
        timer: 1600,
        showConfirmButton: false,
      });
    },
    onError: (err) => Swal.fire({ icon: "error", title: "Xatolik", text: extractError(err) }),
  });

  const grant = async (u: UserRow) => {
    const plans = plansQuery.data;
    if (!plans?.length) {
      Swal.fire({ icon: "error", title: "Tariflar yuklanmadi", text: "Sahifani yangilab qayta urinib ko'ring" });
      return;
    }
    const result = await Swal.fire({
      title: "Obuna berish",
      html: grantFormHtml(u, plans),
      showCancelButton: true,
      confirmButtonText: "Berish",
      cancelButtonText: "Bekor qilish",
      focusConfirm: false,
      didOpen: (popup) => {
        const plan = popup.querySelector<HTMLSelectElement>("#grant-plan")!;
        const days = popup.querySelector<HTMLInputElement>("#grant-days")!;
        const limit = popup.querySelector<HTMLInputElement>("#grant-limit")!;
        // Tarif almashganda muddat va masalalar soni o'sha tarifnikiga qaytadi
        plan.addEventListener("change", () => {
          const selected = plans.find((p) => p.id === plan.value)!;
          days.value = String(selected.duration_days);
          limit.value = String(selected.question_limit);
        });
      },
      preConfirm: () => {
        const popup = Swal.getPopup()!;
        const plan_id = popup.querySelector<HTMLSelectElement>("#grant-plan")!.value;
        const days = Number(popup.querySelector<HTMLInputElement>("#grant-days")!.value);
        const question_limit = Number(popup.querySelector<HTMLInputElement>("#grant-limit")!.value);
        if (!Number.isInteger(days) || days < 1 || days > 3650) {
          Swal.showValidationMessage("Muddat 1 dan 3650 kungacha butun son bo'lishi kerak");
          return false;
        }
        if (!Number.isInteger(question_limit) || question_limit < 1 || question_limit > 100000) {
          Swal.showValidationMessage("Masalalar soni 1 dan 100 000 gacha butun son bo'lishi kerak");
          return false;
        }
        return { plan_id, days, question_limit };
      },
    });
    if (result.isConfirmed && result.value) mutation.mutate({ kind: "grant", id: u.id, ...result.value });
  };

  const revoke = async (u: UserRow) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Obunani o'chirasizmi?",
      text: `${u.full_name || "User"}ning barcha faol obunalari (${u.subscriptions.length} ta) o'chiriladi. To'lab olingan obuna ham o'chadi.`,
      showCancelButton: true,
      confirmButtonText: "O'chirish",
      cancelButtonText: "Bekor qilish",
      confirmButtonColor: "#f46a6a",
    });
    if (result.isConfirmed) mutation.mutate({ kind: "revoke", id: u.id });
  };

  const data = query.data;

  return (
    <>
      <div className="page-title-box d-sm-flex align-items-center justify-content-between">
        <h4 className="mb-sm-0 font-size-18">Foydalanuvchilar</h4>
        {data && <div className="text-muted small">Jami: {formatNumber(data.pagination.total)} ta</div>}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-5">
              <input
                className="form-control"
                placeholder="Ism, username yoki Telegram ID bo'yicha qidirish"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Qidirish"
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={premium}
                onChange={(e) => updateParam("premium", e.target.value)}
                aria-label="Obuna filtri"
              >
                <option value="">Barcha userlar</option>
                <option value="premium">Faol obunasi bor</option>
                <option value="free">Obunasiz</option>
              </select>
            </div>
          </div>

          {query.isLoading && <div className="text-muted">Yuklanmoqda…</div>}
          {query.isError && <div className="alert alert-danger">{extractError(query.error)}</div>}

          {data && (
            <div className="table-responsive" style={{ opacity: query.isPlaceholderData ? 0.6 : 1 }}>
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Ism</th>
                    <th>Telegram</th>
                    <th>Obuna</th>
                    <th className="text-end">Masalalar</th>
                    <th>Ro'yxatdan o'tgan</th>
                    <th>Oxirgi faollik</th>
                    <th className="text-end">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => (
                    <tr key={u.id}>
                      <td>{u.full_name || "—"}</td>
                      <td>
                        {u.username ? (
                          <a href={`https://t.me/${u.username}`} target="_blank" rel="noreferrer">
                            @{u.username}
                          </a>
                        ) : (
                          "—"
                        )}
                        <div className="text-muted small">{u.telegram_id}</div>
                      </td>
                      <td>
                        {u.subscriptions.length === 0 ? (
                          <>
                            <span className="badge bg-secondary">Yo'q</span>
                            <div className="text-muted small">Bepul: {u.free_remaining} ta masala</div>
                          </>
                        ) : (
                          u.subscriptions.map((s, i) => (
                            <div key={i} className={i ? "mt-1" : ""}>
                              <span className="badge bg-success">{s.plan_name}</span>
                              {s.gift && <span className="badge bg-info ms-1">Sovg'a</span>}
                              <div className="text-muted small">
                                {s.remaining} ta masala · {formatDate(s.expires_at)} gacha
                              </div>
                            </div>
                          ))
                        )}
                      </td>
                      <td className="text-end">{formatNumber(u.questions)}</td>
                      <td>{formatDate(u.created_at)}</td>
                      <td>{u.last_active_at ? formatDate(u.last_active_at) : "—"}</td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={mutation.isPending}
                          onClick={() => grant(u)}
                        >
                          Obuna berish
                        </button>
                        {u.subscriptions.length > 0 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-1"
                            disabled={mutation.isPending}
                            onClick={() => revoke(u)}
                          >
                            O'chirish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data.items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        Foydalanuvchilar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Pagination
                page={data.pagination.page}
                pages={data.pagination.pages}
                total={data.pagination.total}
                onPageChange={(p) => updateParam("page", String(p))}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function grantFormHtml(u: UserRow, plans: Plan[]): string {
  const first = plans[0];
  const existing = u.subscriptions.length
    ? `<div class="alert alert-warning py-2 small">Userda ${u.subscriptions.length} ta faol obuna bor. Yangisi ularga qo'shimcha bo'ladi (avval tugaydigani birinchi ishlatiladi).</div>`
    : "";
  return `
    <div class="text-start">
      <div class="mb-2"><b>${escapeHtml(u.full_name || "—")}</b></div>
      ${existing}
      <label class="form-label small" for="grant-plan">Tarif</label>
      <select id="grant-plan" class="form-select mb-2">
        ${plans
          .map(
            (p) =>
              `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} — ${p.question_limit} ta masala, ${p.duration_days} kun</option>`,
          )
          .join("")}
      </select>
      <div class="row g-2">
        <div class="col-6">
          <label class="form-label small" for="grant-days">Muddat (kun)</label>
          <input id="grant-days" type="number" min="1" max="3650" step="1" value="${first.duration_days}" class="form-control" />
        </div>
        <div class="col-6">
          <label class="form-label small" for="grant-limit">Masalalar soni</label>
          <input id="grant-limit" type="number" min="1" max="100000" step="1" value="${first.question_limit}" class="form-control" />
        </div>
      </div>
      <div class="small text-muted mt-2">To'lovsiz beriladi. Userga Telegram orqali xabar yuboriladi.</div>
    </div>`;
}

/** Swal html ichiga qo'yiladigan matn — user ismi ixtiyoriy belgilardan iborat bo'lishi mumkin */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
