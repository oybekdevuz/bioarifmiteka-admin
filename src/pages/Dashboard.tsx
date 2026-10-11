import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adminApi, extractError, MetricSummary, PlanStat } from "../lib/api";
import { formatNumber, formatSom, formatUsd } from "../lib/format";
import GrowthChart from "../components/GrowthChart";

const TONE = {
  primary: "#5156be",
  success: "#34c38f",
  info: "#50a5f1",
  warning: "#f1b44c",
};

interface StatProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  hint?: ReactNode;
  children?: ReactNode;
}

function Stat({ label, value, icon, color, hint, children }: StatProps) {
  return (
    <div className="card stat-card h-100 mb-0">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-start justify-content-between">
          <div>
            <div className="stat-label">{label}</div>
            <div className="stat-number">{value}</div>
            {hint && <div className="text-muted small mt-1">{hint}</div>}
          </div>
          <div className="stat-icon flex-shrink-0" style={{ background: `${color}1a`, color }}>
            <i className={`bx ${icon}`} />
          </div>
        </div>
        {children && <div className="mt-auto pt-3">{children}</div>}
      </div>
    </div>
  );
}

interface ForecastProps {
  metric: MetricSummary;
  format: (v: number) => string;
  color: string;
}

/** Oy oxirigacha prognoz: hozirgacha bo'lgani + qolgan kunlarga kutilayotgani */
function Forecast({ metric, format, color }: ForecastProps) {
  const done = metric.forecast_month > 0 ? Math.min(100, (metric.month / metric.forecast_month) * 100) : 0;
  return (
    <div className="rounded p-2" style={{ background: `${color}12` }}>
      <div className="d-flex align-items-baseline justify-content-between">
        <span className="small text-muted">Oy oxirigacha prognoz</span>
        <span className="fw-bold" style={{ color }}>
          ≈ {format(metric.forecast_month)}
        </span>
      </div>
      <div className="progress my-2" style={{ height: 5 }} role="presentation">
        <div className="progress-bar" style={{ width: `${done}%`, background: color }} />
      </div>
      <div className="d-flex justify-content-between small text-muted">
        <span>Shu oyda: {format(metric.month)}</span>
        <span>O'tgan oy: {format(metric.prev_month)}</span>
      </div>
    </div>
  );
}

/** Har bir tarifni nechta odam olgani */
function PlanStats({ plans, freeMode }: { plans: PlanStat[]; freeMode: boolean }) {
  const count = (v: number) => formatNumber(v);
  return (
    <div className="card mt-3 mb-0">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
          <h5 className="card-title mb-0">Tariflar bo'yicha obunachilar</h5>
          <Link to="/plans" className="small">
            Tariflarni boshqarish
          </Link>
        </div>
        <p className="text-muted small">
          Har bir user tarif bo'yicha bir marta sanaladi. Bir user ham to'lab, ham sovg'a tarzida olgan bo'lishi
          mumkin.
        </p>
        {freeMode && (
          <div className="alert alert-warning py-2 small" role="status">
            Sotuvda tarif yo'q — bot hozir hamma uchun bepul.
          </div>
        )}
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Tarif</th>
                <th className="text-end">Narx</th>
                <th className="text-end">Olganlar</th>
                <th className="text-end">Hozir faol</th>
                <th className="text-end">To'lab olgan</th>
                <th className="text-end">Sovg'a</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.name}
                    {p.is_deleted ? (
                      <span className="badge bg-secondary ms-2">O'chirilgan</span>
                    ) : (
                      !p.is_active && <span className="badge bg-secondary ms-2">Sotuvda emas</span>
                    )}
                  </td>
                  <td className="text-end text-nowrap">{p.price ? formatSom(p.price) : "—"}</td>
                  <td className="text-end fw-bold">{count(p.users)}</td>
                  <td className="text-end">{count(p.active)}</td>
                  <td className="text-end">{count(p.paid)}</td>
                  <td className="text-end">{count(p.gift)}</td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-3">
                    Tariflar yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: adminApi.dashboard,
    refetchInterval: 60_000,
  });

  if (query.isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }
  if (query.isError) return <div className="alert alert-danger">{extractError(query.error)}</div>;

  const d = query.data!;
  const count = (v: number) => formatNumber(v);

  return (
    <>
      <div className="page-title-box d-sm-flex align-items-center justify-content-between">
        <h4 className="mb-sm-0 font-size-18">Bosh sahifa</h4>
        <div className="text-muted small">
          Oyning {d.month_day}-kuni ({d.month_days} kundan) · har daqiqada yangilanadi
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-xl-3 col-md-6">
          <Stat
            label="Bugun qo'shilgan userlar"
            value={`+${count(d.users.today)}`}
            icon="bx-user-plus"
            color={TONE.primary}
            hint={<>Kecha: +{count(d.users.yesterday)}</>}
          >
            <Forecast metric={d.users} format={count} color={TONE.primary} />
          </Stat>
        </div>
        <div className="col-xl-3 col-md-6">
          <Stat
            label="Jami userlar"
            value={count(d.users.total)}
            icon="bx-group"
            color={TONE.info}
            hint={<>Faol obunasi bor: {count(d.users.premium)} ta</>}
          >
            <div className="small text-muted">
              Oy oxirida kutilayotgan jami:{" "}
              <b className="text-dark">≈ {count(d.users.total + d.users.forecast_remaining)}</b>
            </div>
          </Stat>
        </div>
        <div className="col-xl-3 col-md-6">
          <Stat
            label="Bugun to'langan"
            value={formatSom(d.revenue.today)}
            icon="bx-wallet"
            color={TONE.success}
            hint={<>Kecha: {formatSom(d.revenue.yesterday)}</>}
          >
            <Forecast metric={d.revenue} format={formatSom} color={TONE.success} />
          </Stat>
        </div>
        <div className="col-xl-3 col-md-6">
          <Stat
            label="Jami to'langan"
            value={formatSom(d.revenue.total)}
            icon="bx-money"
            color={TONE.success}
            hint={<>{count(d.revenue.payments_count)} ta to'lov</>}
          >
            <div className="small text-muted">
              Oy oxirida kutilayotgan jami:{" "}
              <b className="text-dark">≈ {formatSom(d.revenue.total + d.revenue.forecast_remaining)}</b>
            </div>
          </Stat>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-xl-8">
          <GrowthChart />
        </div>
        <div className="col-xl-4">
          <Stat
            label="AI xarajati (jami)"
            value={formatUsd(d.ai.total)}
            icon="bx-bot"
            color={TONE.warning}
            hint={<>{count(d.ai.questions)} ta masala · {d.ai.model}</>}
          >
            <div className="d-flex justify-content-between small mb-2">
              <span className="text-muted">Bugun</span>
              <b>{formatUsd(d.ai.today)}</b>
            </div>
            <Forecast metric={d.ai} format={formatUsd} color={TONE.warning} />
            <p className="small text-muted mt-3 mb-0">
              Har bir masalaga sarflangan tokenlar (xato urinishlar ham) model narxiga ko'paytiriladi. Narx
              serverdagi OPENAI_INPUT_USD_PER_1M va OPENAI_OUTPUT_USD_PER_1M sozlamalaridan olinadi.
            </p>
          </Stat>
        </div>
      </div>

      <p className="small text-muted mt-3 mb-0">
        Prognoz: har bir hafta kuni uchun oxirgi 4 haftaning vaznli o'rtachasi (yaqin haftalar ko'proq hisobga
        olinadi) va oxirgi 7 kunlik trend asosida oyning qolgan kunlari hisoblanadi.
      </p>

      <PlanStats plans={d.plans} freeMode={d.free_mode} />
    </>
  );
}
