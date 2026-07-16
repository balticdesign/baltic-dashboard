"use client";

import { useEffect, useMemo, useState } from "react";

type Scope = "personal" | "business";

function fmtGBP(n: number | null | undefined) {
  const v = Number(n || 0);
  return v.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function shiftMonth(dateStr: string, delta: number) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + delta);
  return d.toISOString().slice(0, 7) + "-01";
}

export default function DashboardPage() {
  const [scope, setScope] = useState<Scope>("personal");
  const [month, setMonth] = useState<string>(
    () => new Date().toISOString().slice(0, 7) + "-01"
  );
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/dashboard?month=${month}&scope=${scope}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.message || "Failed to load");
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [month, scope]);

  const summary = data?.summary;
  const spent = Number(summary?.spent || 0);
  const expected = Number(summary?.expected_income || 0);
  const pct = expected > 0 ? Math.min(spent / expected, 1) : 0;

  const budgetByBucket = useMemo(() => {
    const out: Record<string, { actual: number; target: number }> = {};
    (data?.budget || []).forEach((row: any) => {
      out[row.budget_bucket] = {
        actual: Number(row.actual_spend),
        target: Number(row.target_amount || 0),
      };
    });
    return out;
  }, [data]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Baltic <span className="text-personal">Dashboard</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-surfaceborder">
            <button
              onClick={() => setScope("personal")}
              className={`px-4 py-1.5 text-sm font-medium ${
                scope === "personal"
                  ? "bg-personal text-bg"
                  : "bg-surface text-muted"
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setScope("business")}
              className={`px-4 py-1.5 text-sm font-medium ${
                scope === "business"
                  ? "bg-business text-bg"
                  : "bg-surface text-muted"
              }`}
            >
              Business
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="px-2 py-1 rounded border border-surfaceborder text-muted hover:text-gray-100"
            >
              ‹
            </button>
            <span className="font-mono w-32 text-center">{monthLabel(month)}</span>
            <button
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              className="px-2 py-1 rounded border border-surfaceborder text-muted hover:text-gray-100"
            >
              ›
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-over/40 bg-over/10 p-4 text-sm text-over">
          <p className="font-medium mb-1">Can't reach the finance data.</p>
          <p className="text-over/80">{error}</p>
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard label="Expected income" value={fmtGBP(expected)} accent="income" />
        <KpiCard
          label="Spent"
          value={fmtGBP(spent)}
          accent={scope === "personal" ? "personal" : "business"}
        />
        <KpiCard
          label="Remaining"
          value={fmtGBP(summary?.remaining)}
          accent={Number(summary?.remaining) < 0 ? "over" : "income"}
        />
        <KpiCard label="Daily average" value={fmtGBP(summary?.daily_average)} accent="muted" />
        <KpiCard
          label="Projected month"
          value={fmtGBP(summary?.projected_month_spend)}
          accent={
            Number(summary?.projected_month_spend) > expected ? "over" : "income"
          }
        />
      </section>

      <section className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-surfaceborder bg-surface p-6">
          <h2 className="font-display text-sm font-medium text-muted mb-4">
            Spending pace
          </h2>
          <PaceGauge pct={pct} />
          <p className="text-center text-sm text-muted mt-2">
            {fmtGBP(spent)} of {fmtGBP(expected)} expected income spent
          </p>
        </div>
        <div className="rounded-xl border border-surfaceborder bg-surface p-6">
          <h2 className="font-display text-sm font-medium text-muted mb-4">
            Budget tracker (50/30/20)
          </h2>
          <BudgetBar
            label="Needs"
            color="needs"
            actual={budgetByBucket.needs?.actual}
            target={budgetByBucket.needs?.target}
          />
          <BudgetBar
            label="Wants"
            color="wants"
            actual={budgetByBucket.wants?.actual}
            target={budgetByBucket.wants?.target}
          />
          <BudgetBar
            label="Savings"
            color="savings"
            actual={budgetByBucket.savings?.actual}
            target={budgetByBucket.savings?.target}
          />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-surfaceborder bg-surface p-6">
          <h2 className="font-display text-sm font-medium text-muted mb-4">Categories</h2>
          <ul className="space-y-2">
            {(data?.categories || []).map((c: any) => (
              <li
                key={c.display_category}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-300">{c.display_category}</span>
                <span className="font-mono tabular text-gray-100">{fmtGBP(c.spent)}</span>
              </li>
            ))}
            {!loading && (!data?.categories || data.categories.length === 0) && (
              <li className="text-sm text-muted">No spending recorded this month.</li>
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-surfaceborder bg-surface p-6">
          <h2 className="font-display text-sm font-medium text-muted mb-4">Daily spend</h2>
          <HeatmapGrid days={data?.heatmap || []} month={month} />
        </div>
      </section>
    </main>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  const accentClass: Record<string, string> = {
    income: "border-t-income",
    personal: "border-t-personal",
    business: "border-t-business",
    over: "border-t-over",
    muted: "border-t-surfaceborder",
  };
  return (
    <div
      className={`rounded-xl border border-surfaceborder ${
        accentClass[accent] || ""
      } border-t-2 bg-surface p-4`}
    >
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="font-mono tabular text-lg font-semibold">{value}</p>
    </div>
  );
}

function PaceGauge({ pct }: { pct: number }) {
  const angle = pct * 180;
  const color = pct < 0.7 ? "#34D399" : pct < 1 ? "#FBBF24" : "#F87171";
  const r = 80,
    cx = 100,
    cy = 100;
  const rad = (Math.PI / 180) * (180 - angle);
  const x = cx - r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      <path
        d={`M 20 100 A 80 80 0 0 1 180 100`}
        fill="none"
        stroke="#1F2937"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d={`M 20 100 A 80 80 0 ${largeArc} 1 ${x} ${y}`}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <text
        x="100"
        y="90"
        textAnchor="middle"
        className="fill-gray-100"
        style={{ font: "600 22px var(--font-space-grotesk)" }}
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

function BudgetBar({
  label,
  color,
  actual,
  target,
}: {
  label: string;
  color: string;
  actual?: number;
  target?: number;
}) {
  const a = actual || 0,
    t = target || 0;
  const pct = t > 0 ? Math.min(a / t, 1) : 0;
  const barColor: Record<string, string> = {
    needs: "bg-needs",
    wants: "bg-wants",
    savings: "bg-savings",
  };
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="font-mono tabular text-muted">
          {fmtGBP(a)} / {fmtGBP(t)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-bg overflow-hidden">
        <div
          className={`h-full ${barColor[color]}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

function HeatmapGrid({ days, month }: { days: any[]; month: string }) {
  const start = new Date(month);
  const daysInMonth = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    0
  ).getDate();
  const spendByDay: Record<string, number> = {};
  days.forEach((d) => {
    spendByDay[d.dated_on] = Number(d.spent);
  });
  const max = Math.max(1, ...Object.values(spendByDay));

  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const dateStr = new Date(
      start.getFullYear(),
      start.getMonth(),
      i + 1
    )
      .toISOString()
      .slice(0, 10);
    const spend = spendByDay[dateStr] || 0;
    const intensity = spend / max;
    return { day: i + 1, spend, intensity };
  });

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {cells.map((c) => (
        <div
          key={c.day}
          title={`Day ${c.day}: ${fmtGBP(c.spend)}`}
          className="aspect-square rounded flex items-center justify-center text-[10px] font-mono text-muted"
          style={{
            backgroundColor:
              c.spend > 0
                ? `rgba(96, 165, 250, ${0.15 + c.intensity * 0.6})`
                : "#161C2A",
          }}
        >
          {c.day}
        </div>
      ))}
    </div>
  );
}
