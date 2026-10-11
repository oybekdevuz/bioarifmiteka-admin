import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminApi, extractError, GrowthView } from "../lib/api";
import { formatDay, formatMonth, formatNumber, formatWeekday } from "../lib/format";

const PRIMARY = "#5156be";
const SUCCESS = "#34c38f";

interface TipProps {
  active?: boolean;
  payload?: { payload: { date: string; new: number | null; total: number | null } }[];
}

function Tip({ active, payload }: TipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point || point.total === null) return null;
  return (
    <div className="bg-white border rounded shadow-sm px-3 py-2 small">
      <div className="fw-semibold mb-1">
        {formatDay(point.date)}, {formatWeekday(point.date)}
      </div>
      <div>
        Jami: <b>{formatNumber(point.total)}</b>
      </div>
      <div style={{ color: SUCCESS }}>
        Yangi: <b>+{formatNumber(point.new ?? 0)}</b>
      </div>
    </div>
  );
}

/** Userlar o'sishi: jami userlar (o'sib boruvchi chiziq) va kunlik yangi userlar (ustunlar) */
export default function GrowthChart() {
  const [view, setView] = useState<GrowthView>("week");
  // Bo'sh — joriy hafta/oy; aks holda davr ichidagi kun
  const [date, setDate] = useState<string | undefined>();

  const query = useQuery({
    queryKey: ["growth", view, date],
    queryFn: () => adminApi.growth(view, date),
    placeholderData: keepPreviousData,
  });
  const data = query.data;

  const switchView = (next: GrowthView) => {
    if (next === view) return;
    setView(next);
    setDate(undefined);
  };

  const title = data
    ? data.view === "month"
      ? formatMonth(data.start)
      : `${formatDay(data.start)} – ${formatDay(data.end)}`
    : "";

  // O'sish ko'rinishi uchun o'q noldan emas, davr boshidagi qiymat atrofidan boshlanadi
  const totals = (data?.points ?? []).map((p) => p.total).filter((v): v is number => v !== null);
  const min = totals.length ? Math.min(...totals, data!.base) : 0;
  const max = totals.length ? Math.max(...totals) : 0;
  const pad = Math.max(1, Math.ceil((max - min) * 0.15));

  return (
    <div className="card h-100 mb-0">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h5 className="card-title mb-1">Userlar o'sishi</h5>
            <div className="text-muted small">
              {data ? (
                <>
                  Shu davrda <b style={{ color: SUCCESS }}>+{formatNumber(data.added)}</b> ta yangi user
                </>
              ) : (
                " "
              )}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="btn-group btn-group-sm" role="group" aria-label="Ko'rinish">
              <button
                type="button"
                className={`btn ${view === "week" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => switchView("week")}
              >
                Hafta
              </button>
              <button
                type="button"
                className={`btn ${view === "month" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => switchView("month")}
              >
                Oy
              </button>
            </div>
            <div className="btn-group btn-group-sm" role="group" aria-label="Davr">
              <button
                type="button"
                className="btn btn-light"
                disabled={!data}
                onClick={() => data && setDate(data.prev)}
                aria-label={view === "month" ? "Oldingi oy" : "Oldingi hafta"}
              >
                <i className="bx bx-chevron-left" />
              </button>
              <span className="btn btn-light disabled text-dark fw-semibold" style={{ minWidth: 170, opacity: 1 }}>
                {title}
              </span>
              <button
                type="button"
                className="btn btn-light"
                disabled={!data?.next}
                onClick={() => data?.next && setDate(data.next)}
                aria-label={view === "month" ? "Keyingi oy" : "Keyingi hafta"}
              >
                <i className="bx bx-chevron-right" />
              </button>
            </div>
          </div>
        </div>

        {query.isError && <div className="alert alert-danger mb-0">{extractError(query.error)}</div>}
        {query.isLoading && (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 320 }}>
            <div className="spinner-border text-primary" role="status" />
          </div>
        )}

        {data && (
          <div style={{ height: 320, opacity: query.isPlaceholderData ? 0.5 : 1, transition: "opacity .15s" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9e9ef" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#74788d" }}
                  interval={data.view === "month" ? 2 : 0}
                  tickFormatter={(d: string) =>
                    data.view === "month" ? String(Number(d.slice(8))) : `${formatWeekday(d)} ${Number(d.slice(8))}`
                  }
                />
                <YAxis
                  yAxisId="total"
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  allowDecimals={false}
                  domain={[Math.max(0, min - pad), max + pad]}
                  tick={{ fontSize: 12, fill: "#74788d" }}
                  tickFormatter={(v: number) => formatNumber(v)}
                />
                <YAxis yAxisId="new" orientation="right" hide domain={[0, (dataMax: number) => Math.max(4, dataMax * 3)]} />
                <Tooltip content={<Tip />} cursor={{ stroke: "#ced4da" }} />
                <Bar yAxisId="new" dataKey="new" fill={SUCCESS} fillOpacity={0.55} radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Area
                  yAxisId="total"
                  type="monotone"
                  dataKey="total"
                  stroke={PRIMARY}
                  strokeWidth={2.5}
                  fill="url(#growthFill)"
                  dot={data.view === "week" ? { r: 3, fill: PRIMARY } : false}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="d-flex gap-3 mt-2 small text-muted">
          <span>
            <span className="d-inline-block rounded-circle me-1" style={{ width: 8, height: 8, background: PRIMARY }} />
            Jami userlar
          </span>
          <span>
            <span className="d-inline-block me-1" style={{ width: 8, height: 8, background: SUCCESS, opacity: 0.6 }} />
            Kunlik yangi userlar
          </span>
        </div>
      </div>
    </div>
  );
}
