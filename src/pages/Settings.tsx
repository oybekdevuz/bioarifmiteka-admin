import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { adminApi, extractError } from "../lib/api";
import { useAuthStore } from "../store/auth";

export default function Settings() {
  const { username, setSession } = useAuthStore();
  const [login, setLogin] = useState(username ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [current, setCurrent] = useState("");

  const mutation = useMutation({
    mutationFn: adminApi.updateCredentials,
    onSuccess: (data) => {
      // Eski token yaroqsiz bo'ldi — backend bergan yangisi bilan davom etamiz
      setSession(data.token, data.username);
      setLogin(data.username);
      setNewPassword("");
      setConfirm("");
      setCurrent("");
      Swal.fire({ icon: "success", title: "Saqlandi", timer: 1500, showConfirmButton: false });
    },
    onError: (err) => Swal.fire({ icon: "error", title: "Xatolik", text: extractError(err) }),
  });

  const nextLogin = login.trim();
  const loginChanged = nextLogin !== (username ?? "");
  const warn = (title: string, text: string) => Swal.fire({ icon: "warning", title, text });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!loginChanged && !newPassword) {
      warn("O'zgarish yo'q", "Yangi login yoki yangi parol kiriting");
      return;
    }
    if (loginChanged && !/^[a-zA-Z0-9_.-]{3,32}$/.test(nextLogin)) {
      warn("Login noto'g'ri", "3–32 belgi: lotin harflari, raqam, _ . -");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      warn("Parol juda qisqa", "Kamida 8 ta belgidan iborat bo'lsin");
      return;
    }
    if (newPassword !== confirm) {
      warn("Parollar mos kelmadi", "Yangi parol va uning tasdig'i bir xil bo'lishi kerak");
      return;
    }
    mutation.mutate({
      current_password: current,
      username: loginChanged ? nextLogin : undefined,
      new_password: newPassword || undefined,
    });
  };

  return (
    <>
      <div className="page-title-box d-sm-flex align-items-center justify-content-between">
        <h4 className="mb-sm-0 font-size-18">Sozlamalar</h4>
      </div>

      <div className="row">
        <div className="col-xl-5 col-lg-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-1">Login va parol</h5>
              <p className="text-muted small">
                O'zgarish saqlangach, boshqa qurilmalardagi sessiyalar yopiladi.
              </p>

              <form onSubmit={submit}>
                <div className="mb-3">
                  <label htmlFor="login" className="form-label">
                    Login
                  </label>
                  <input
                    id="login"
                    className="form-control"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="new-password" className="form-label">
                    Yangi parol
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    className="form-control"
                    placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <div className="form-text">Kamida 8 ta belgi</div>
                </div>
                <div className="mb-3">
                  <label htmlFor="confirm-password" className="form-label">
                    Yangi parolni takrorlang
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="form-control"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    disabled={!newPassword}
                  />
                </div>
                <hr />
                <div className="mb-3">
                  <label htmlFor="current-password" className="form-label">
                    Joriy parol
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    className="form-control"
                    placeholder="Tasdiqlash uchun"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saqlanmoqda…" : "Saqlash"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
