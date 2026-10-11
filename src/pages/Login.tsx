import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { extractError } from "../lib/api";
import logoSm from "../assets/images/logo-sm.svg";
import authBg from "../assets/images/auth-bg.jpg";

export default function Login() {
  const navigate = useNavigate();
  const { token, login } = useAuthStore();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(loginValue.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container-fluid p-0">
        <div className="row g-0">
          <div className="col-xxl-3 col-lg-4 col-md-5">
            <div className="auth-full-page-content d-flex p-sm-5 p-4">
              <div className="w-100">
                <div className="d-flex flex-column h-100">
                  <div className="mb-4 mb-md-5 text-center">
                    <a href="/" className="d-block auth-logo">
                      <img src={logoSm} alt="logo" height="28" />
                      <span className="logo-txt ms-2 fw-bold fs-5">
                        Bioarifmetika
                      </span>
                    </a>
                  </div>
                  <div className="auth-content my-auto">
                    <div className="text-center">
                      <h5 className="mb-0">Xush kelibsiz</h5>
                      <p className="text-muted mt-2">
                        Boshqaruv paneliga kirish uchun login va parolni kiriting.
                      </p>
                    </div>

                    {error && (
                      <div
                        className="alert alert-danger mt-3 mb-0"
                        role="alert"
                      >
                        {error}
                      </div>
                    )}

                    <form className="mt-4 pt-2" onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label htmlFor="login" className="form-label">
                          Login
                        </label>
                        <input
                          id="login"
                          type="text"
                          className="form-control"
                          placeholder="admin"
                          required
                          minLength={3}
                          autoComplete="username"
                          autoFocus
                          value={loginValue}
                          onChange={(e) => setLoginValue(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                          Parol
                        </label>
                        <input
                          id="password"
                          type="password"
                          className="form-control"
                          placeholder="••••••••"
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <button
                          type="submit"
                          className="btn btn-primary w-100 waves-effect waves-light"
                          disabled={submitting}
                        >
                          {submitting ? "Kirilmoqda…" : "Kirish"}
                        </button>
                      </div>
                    </form>
                  </div>
                  <div className="mt-4 mt-md-5 text-center">
                    <p className="mb-0">
                      © {new Date().getFullYear()} Bioarifmetika Admin
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-9 col-lg-8 col-md-7">
            <div
              className="auth-bg pt-md-5 p-4 d-flex"
              style={{
                backgroundImage: `url(${authBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "100vh",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
