import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { adminApi, extractError, Plan, PlanInput } from "../lib/api";
import { formatNumber, formatSom } from "../lib/format";

type Action =
  | { kind: "create"; body: PlanInput }
  | { kind: "update"; id: string; body: Partial<PlanInput> }
  | { kind: "delete"; id: string };

const DONE: Record<Action["kind"], string> = {
  create: "Tarif qo'shildi",
  update: "Saqlandi",
  delete: "Tarif o'chirildi",
};

export default function Plans() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["plans"], queryFn: adminApi.plans });

  const mutation = useMutation({
    mutationFn: (a: Action) => {
      if (a.kind === "create") return adminApi.createPlan(a.body);
      if (a.kind === "update") return adminApi.updatePlan(a.id, a.body);
      return adminApi.deletePlan(a.id);
    },
    onSuccess: (_, a) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      Swal.fire({ icon: "success", title: DONE[a.kind], timer: 1500, showConfirmButton: false });
    },
    onError: (err) => Swal.fire({ icon: "error", title: "Xatolik", text: extractError(err) }),
  });

  const openForm = async (plan?: Plan) => {
    const result = await Swal.fire({
      title: plan ? "Tarifni tahrirlash" : "Tarif qo'shish",
      html: planFormHtml(plan),
      showCancelButton: true,
      confirmButtonText: plan ? "Saqlash" : "Qo'shish",
      cancelButtonText: "Bekor qilish",
      focusConfirm: false,
      preConfirm: () => {
        const popup = Swal.getPopup()!;
        const value = (id: string) =>
          popup.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!.value.trim();
        const name = value("plan-name");
        const description = value("plan-description");
        const price = Number(value("plan-price"));
        const question_limit = Number(value("plan-limit"));
        const duration_days = Number(value("plan-days"));
        const is_active = popup.querySelector<HTMLInputElement>("#plan-active")!.checked;

        if (!name || name.length > 40) {
          Swal.showValidationMessage("Nom 1 dan 40 belgigacha bo'lishi kerak");
          return false;
        }
        if (description.length > 300) {
          Swal.showValidationMessage("Tavsif 300 belgidan oshmasin");
          return false;
        }
        if (!Number.isInteger(price) || price < 1000 || price > 1_000_000) {
          Swal.showValidationMessage("Narx 1 000 dan 1 000 000 so'mgacha butun son bo'lishi kerak");
          return false;
        }
        if (!Number.isInteger(question_limit) || question_limit < 1 || question_limit > 100000) {
          Swal.showValidationMessage("Masalalar soni 1 dan 100 000 gacha butun son bo'lishi kerak");
          return false;
        }
        if (!Number.isInteger(duration_days) || duration_days < 1 || duration_days > 3650) {
          Swal.showValidationMessage("Muddat 1 dan 3650 kungacha butun son bo'lishi kerak");
          return false;
        }
        return { name, description, price, question_limit, duration_days, is_active } satisfies PlanInput;
      },
    });
    if (!result.isConfirmed || !result.value) return;
    mutation.mutate(
      plan ? { kind: "update", id: plan.id, body: result.value } : { kind: "create", body: result.value },
    );
  };

  const toggle = (plan: Plan) =>
    mutation.mutate({ kind: "update", id: plan.id, body: { is_active: !plan.is_active } });

  const remove = async (plan: Plan) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Tarifni o'chirasizmi?",
      text: `"${plan.name}" botdan olib tashlanadi. Uni allaqachon sotib olganlarning obunasi muddati tugaguncha ishlayveradi.`,
      showCancelButton: true,
      confirmButtonText: "O'chirish",
      cancelButtonText: "Bekor qilish",
      confirmButtonColor: "#f46a6a",
    });
    if (result.isConfirmed) mutation.mutate({ kind: "delete", id: plan.id });
  };

  const plans = query.data;
  const freeMode = !!plans && !plans.some((p) => p.is_active);

  return (
    <>
      <div className="page-title-box d-sm-flex align-items-center justify-content-between">
        <h4 className="mb-sm-0 font-size-18">Tariflar</h4>
        <button type="button" className="btn btn-primary" disabled={mutation.isPending} onClick={() => openForm()}>
          <i className="bx bx-plus me-1" />
          Tarif qo'shish
        </button>
      </div>

      {freeMode && (
        <div className="alert alert-warning" role="status">
          <b>Bot hozir hamma uchun bepul.</b> Sotuvda birorta ham tarif yo'q, shuning uchun masalalar cheklovsiz
          yechiladi. Pullik rejimga qaytish uchun kamida bitta tarifni yoqing.
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <p className="text-muted small">
            Narx yoki limitni o'zgartirish faqat yangi xaridlarga ta'sir qiladi. Barcha tariflar o'chirilsa, bot
            hamma uchun bepul bo'ladi.
          </p>

          {query.isLoading && <div className="text-muted">Yuklanmoqda…</div>}
          {query.isError && <div className="alert alert-danger">{extractError(query.error)}</div>}

          {plans && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Tarif</th>
                    <th className="text-end">Narx</th>
                    <th className="text-end">Masalalar</th>
                    <th className="text-end">Muddat</th>
                    <th>Sotuvda</th>
                    <th className="text-end">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <td style={{ maxWidth: 420 }}>
                        <div className="fw-semibold">{plan.name}</div>
                        <div className="text-muted small text-break">{plan.description || "Tavsif yo'q"}</div>
                      </td>
                      <td className="text-end text-nowrap">{formatSom(plan.price)}</td>
                      <td className="text-end">{formatNumber(plan.question_limit)}</td>
                      <td className="text-end text-nowrap">{plan.duration_days} kun</td>
                      <td>
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`plan-switch-${plan.id}`}
                            checked={plan.is_active}
                            disabled={mutation.isPending}
                            onChange={() => toggle(plan)}
                          />
                          <label className="form-check-label small" htmlFor={`plan-switch-${plan.id}`}>
                            {plan.is_active ? "Ha" : "Yo'q"}
                          </label>
                        </div>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={mutation.isPending}
                          onClick={() => openForm(plan)}
                        >
                          Tahrirlash
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger ms-1"
                          disabled={mutation.isPending}
                          onClick={() => remove(plan)}
                        >
                          O'chirish
                        </button>
                      </td>
                    </tr>
                  ))}
                  {plans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        Tariflar yo'q. Pullik rejim uchun tarif qo'shing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function planFormHtml(plan?: Plan): string {
  return `
    <div class="text-start">
      <label class="form-label small" for="plan-name">Nom</label>
      <input id="plan-name" class="form-control mb-2" maxlength="40" value="${escapeHtml(plan?.name ?? "")}" />
      <label class="form-label small" for="plan-description">Tavsif</label>
      <textarea id="plan-description" class="form-control mb-2" rows="3" maxlength="300"
        placeholder="Botda tarif tagida ko'rsatiladi">${escapeHtml(plan?.description ?? "")}</textarea>
      <div class="row g-2">
        <div class="col-12">
          <label class="form-label small" for="plan-price">Narx (so'm)</label>
          <input id="plan-price" type="number" min="1000" max="1000000" step="1000" value="${plan?.price ?? ""}" class="form-control" />
        </div>
        <div class="col-6">
          <label class="form-label small" for="plan-limit">Masalalar soni</label>
          <input id="plan-limit" type="number" min="1" max="100000" step="1" value="${plan?.question_limit ?? ""}" class="form-control" />
        </div>
        <div class="col-6">
          <label class="form-label small" for="plan-days">Muddat (kun)</label>
          <input id="plan-days" type="number" min="1" max="3650" step="1" value="${plan?.duration_days ?? 30}" class="form-control" />
        </div>
      </div>
      <div class="form-check form-switch mt-3">
        <input class="form-check-input" type="checkbox" role="switch" id="plan-active" ${plan?.is_active === false ? "" : "checked"} />
        <label class="form-check-label" for="plan-active">Sotuvda (botda ko'rinadi)</label>
      </div>
    </div>`;
}

/** Swal html ichiga qo'yiladigan matn — ixtiyoriy belgilardan iborat bo'lishi mumkin */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
