import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen, Calculator, LineChart as LineChartIcon, ShieldCheck } from "lucide-react";
import "./styles.css";

type Bond = {
  name: string;
  issuer: string;
  face_value: number;
  coupon_rate: number;
  frequency: number;
  maturity_years: number;
  market_price: number;
  benchmark_yield: number;
  rating: string;
  settlement_period_fraction: number;
};

type CurvePoint = { tenor: number; yield_rate: number };
type Analysis = any;

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const fallbackCurve: CurvePoint[] = [
  { tenor: 1, yield_rate: 0.062 },
  { tenor: 2, yield_rate: 0.064 },
  { tenor: 3, yield_rate: 0.065 },
  { tenor: 5, yield_rate: 0.067 },
  { tenor: 7, yield_rate: 0.068 },
  { tenor: 10, yield_rate: 0.069 },
];

const fallbackBonds: Bond[] = [
  { name: "Aurora Utilities 2029", issuer: "Aurora Utilities", face_value: 1000, coupon_rate: 0.078, frequency: 2, maturity_years: 3, market_price: 1022.5, benchmark_yield: 0.065, rating: "AAA", settlement_period_fraction: 0 },
  { name: "Northbridge Manufacturing 2031", issuer: "Northbridge Manufacturing", face_value: 1000, coupon_rate: 0.074, frequency: 2, maturity_years: 5, market_price: 958.4, benchmark_yield: 0.067, rating: "AA", settlement_period_fraction: 0 },
  { name: "Cedar Retail Holdings 2033", issuer: "Cedar Retail Holdings", face_value: 1000, coupon_rate: 0.091, frequency: 2, maturity_years: 7, market_price: 984.1, benchmark_yield: 0.068, rating: "A", settlement_period_fraction: 0 },
  { name: "Harbor Telecom 2028", issuer: "Harbor Telecom", face_value: 1000, coupon_rate: 0.052, frequency: 2, maturity_years: 2, market_price: 943.2, benchmark_yield: 0.064, rating: "BBB", settlement_period_fraction: 0 },
];

function pct(value: number, digits = 2) {
  return `${(value * 100).toFixed(digits)}%`;
}

function money(value: number) {
  return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function num(value: number, digits = 2) {
  return Number(value).toFixed(digits);
}

function Field({ label, value, onChange, type = "number" }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function App() {
  const [bonds, setBonds] = useState<Bond[]>(fallbackBonds);
  const [curve, setCurve] = useState<CurvePoint[]>(fallbackCurve);
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [portfolio, setPortfolio] = useState<any | null>(null);
  const [error, setError] = useState("");

  const selectedBond = bonds[selectedIndex] ?? bonds[0];

  useEffect(() => {
    fetch(`${API}/sample-data`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Sample data unavailable"))))
      .then((data) => {
        setBonds(data.bonds);
        setCurve(data.curve);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    async function run() {
      try {
        setError("");
        const [single, group] = await Promise.all([
          fetch(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bond: selectedBond, curve }) }),
          fetch(`${API}/portfolio`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bonds, curve }) }),
        ]);
        if (!single.ok) throw new Error((await single.json()).detail ?? "Bond analysis failed");
        if (!group.ok) throw new Error((await group.json()).detail ?? "Portfolio analysis failed");
        setAnalysis(await single.json());
        setPortfolio(await group.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      }
    }
    run();
  }, [selectedBond, curve, bonds]);

  const chartCashFlows = useMemo(() => analysis?.cash_flows?.map((row: any) => ({ period: row.period, coupon: row.coupon, principal: row.principal, pv: row.present_value })) ?? [], [analysis]);

  function updateBond<K extends keyof Bond>(key: K, value: string) {
    const numeric = ["face_value", "coupon_rate", "frequency", "maturity_years", "market_price", "benchmark_yield", "settlement_period_fraction"].includes(key);
    setBonds((current) => current.map((bond, index) => (index === selectedIndex ? { ...bond, [key]: numeric ? Number(value) : value } : bond)));
  }

  function updateCurve(index: number, key: keyof CurvePoint, value: string) {
    setCurve((current) => current.map((point, idx) => (idx === index ? { ...point, [key]: Number(value) } : point)));
  }

  return (
    <main>
      <aside>
        <div className="brand">
          <ShieldCheck size={22} />
          <div>
            <strong>Fixed Income Workbook</strong>
            <span>Illustrative Data - Not Live Market Data</span>
          </div>
        </div>
        {["Overview", "Bond Valuation", "Cash Flows", "Interest Rate Risk", "Credit Analysis", "Yield Curve", "OAS", "Relative Value", "Investment View"].map((item) => (
          <a href={`#${item.toLowerCase().replaceAll(" ", "-")}`} key={item}>{item}</a>
        ))}
      </aside>

      <div className="content">
        <header>
          <div>
            <p className="eyebrow">Undergraduate fixed-income analysis project</p>
            <h1>Is this bond fairly valued, and is the yield adequate for rate and credit risk?</h1>
          </div>
          <div className="header-icons">
            <Calculator />
            <LineChartIcon />
            <BookOpen />
          </div>
        </header>

        {error ? <div className="error">{error}</div> : null}

        <Section id="overview" title="Overview">
          <div className="toolbar">
            <label>
              Select bond
              <select value={selectedIndex} onChange={(event) => setSelectedIndex(Number(event.target.value))}>
                {bonds.map((bond, index) => <option value={index} key={bond.name}>{bond.name}</option>)}
              </select>
            </label>
          </div>
          <div className="metrics">
            <Metric label="Market price" value={analysis ? money(analysis.bond.market_price) : "-"} />
            <Metric label="Model price" value={analysis ? money(analysis.model_price) : "-"} note="Benchmark-yield valuation" />
            <Metric label="YTM" value={analysis ? pct(analysis.ytm) : "-"} />
            <Metric label="Credit spread" value={analysis ? `${num(analysis.credit_spread.basis_points, 0)} bps` : "-"} />
            <Metric label="Modified duration" value={analysis ? num(analysis.modified_duration) : "-"} />
            <Metric label="View" value={analysis?.investment_view?.view ?? "-"} />
          </div>
          <p className="interpretation">{analysis?.interpretation?.price_yield}</p>
        </Section>

        <Section id="bond-valuation" title="Bond Valuation">
          <div className="grid two">
            <div className="panel">
              <h3>Bond Inputs</h3>
              <div className="formgrid">
                <Field label="Bond name" type="text" value={selectedBond.name} onChange={(v) => updateBond("name", v)} />
                <Field label="Issuer" type="text" value={selectedBond.issuer} onChange={(v) => updateBond("issuer", v)} />
                <Field label="Face value" value={selectedBond.face_value} onChange={(v) => updateBond("face_value", v)} />
                <Field label="Coupon rate" value={selectedBond.coupon_rate} onChange={(v) => updateBond("coupon_rate", v)} />
                <Field label="Frequency" value={selectedBond.frequency} onChange={(v) => updateBond("frequency", v)} />
                <Field label="Maturity years" value={selectedBond.maturity_years} onChange={(v) => updateBond("maturity_years", v)} />
                <Field label="Market price" value={selectedBond.market_price} onChange={(v) => updateBond("market_price", v)} />
                <Field label="Rating" type="text" value={selectedBond.rating} onChange={(v) => updateBond("rating", v)} />
              </div>
            </div>
            <div className="panel">
              <h3>Price vs Yield</h3>
              <ResponsiveContainer width="100%" height={270}>
                <LineChart data={analysis?.price_yield ?? []}>
                  <CartesianGrid stroke="#dfe4dc" />
                  <XAxis dataKey="ytm" tickFormatter={(v) => pct(v, 1)} />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v: number) => money(v)} labelFormatter={(v) => `YTM ${pct(Number(v))}`} />
                  <Line type="monotone" dataKey="price" stroke="#245f9f" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="interpretation">Price up means yield down; price down means yield up because fixed cash flows are discounted at the investor's required return.</p>
            </div>
          </div>
        </Section>

        <Section id="cash-flows" title="Cash Flows">
          <div className="panel">
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={chartCashFlows}>
                <CartesianGrid stroke="#dfe4dc" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Bar dataKey="coupon" stackId="a" fill="#2e7356" />
                <Bar dataKey="principal" stackId="a" fill="#245f9f" />
                <Line dataKey="pv" stroke="#9a6a18" />
              </ComposedChart>
            </ResponsiveContainer>
            <DataTable rows={analysis?.cash_flows ?? []} columns={["period", "coupon", "principal", "cash_flow", "discount_factor", "present_value"]} />
          </div>
        </Section>

        <Section id="interest-rate-risk" title="Interest Rate Risk">
          <div className="metrics">
            <Metric label="Macaulay duration" value={analysis ? num(analysis.macaulay_duration) : "-"} />
            <Metric label="Modified duration" value={analysis ? num(analysis.modified_duration) : "-"} />
            <Metric label="Convexity" value={analysis ? num(analysis.convexity) : "-"} />
          </div>
          <p className="interpretation">{analysis?.interpretation?.duration}</p>
          <div className="panel">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={analysis?.rate_stress ?? []}>
                <CartesianGrid stroke="#dfe4dc" />
                <XAxis dataKey="shock_bps" />
                <YAxis />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Line dataKey="repriced_value" stroke="#245f9f" strokeWidth={2} />
                <Line dataKey="duration_only" stroke="#9a6a18" />
                <Line dataKey="duration_convexity" stroke="#2e7356" />
              </ComposedChart>
            </ResponsiveContainer>
            <DataTable rows={analysis?.rate_stress ?? []} columns={["shock_bps", "repriced_value", "price_change", "percent_change", "duration_only", "duration_convexity", "approximation_error"]} />
          </div>
        </Section>

        <Section id="credit-analysis" title="Credit Analysis">
          <div className="metrics">
            <Metric label="Benchmark yield" value={analysis ? pct(analysis.benchmark_yield) : "-"} />
            <Metric label="Corporate YTM" value={analysis ? pct(analysis.ytm) : "-"} />
            <Metric label="Credit spread" value={analysis ? `${num(analysis.credit_spread.percentage_points)} pts / ${num(analysis.credit_spread.basis_points, 0)} bps` : "-"} />
          </div>
          <p className="interpretation">{analysis?.interpretation?.credit}</p>
          <DataTable rows={analysis?.credit_stress ?? []} columns={["shock_bps", "repriced_value", "price_change", "percent_change"]} />
        </Section>

        <Section id="yield-curve" title="Yield Curve">
          <div className="grid two">
            <div className="panel">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={curve}>
                  <CartesianGrid stroke="#dfe4dc" />
                  <XAxis dataKey="tenor" />
                  <YAxis tickFormatter={(v) => pct(v, 1)} />
                  <Tooltip formatter={(v: number) => pct(v)} />
                  <Area dataKey="yield_rate" fill="#d8e8d7" stroke="#2e7356" />
                </AreaChart>
              </ResponsiveContainer>
              <p className="interpretation">{analysis?.curve?.classification}: {analysis?.curve?.implication}</p>
            </div>
            <div className="panel">
              <h3>Editable Benchmark Curve</h3>
              {curve.map((point, index) => (
                <div className="curve-row" key={point.tenor}>
                  <Field label="Tenor" value={point.tenor} onChange={(v) => updateCurve(index, "tenor", v)} />
                  <Field label="Yield" value={point.yield_rate} onChange={(v) => updateCurve(index, "yield_rate", v)} />
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="oas" title="OAS">
          <div className="panel">
            <div className="metrics">
              <Metric label="Simplified OAS" value={analysis ? `${num(analysis.oas.basis_points, 0)} bps` : "-"} />
              <Metric label="Model" value={analysis?.oas?.model ?? "-"} />
            </div>
            <p className="interpretation">{analysis?.oas?.methodology} This is not Bloomberg-level institutional OAS. Embedded options, stochastic rates, liquidity, taxes, recovery, and exact day-count conventions are outside this educational model.</p>
            <p className="interpretation">{analysis?.interpretation?.oas}</p>
          </div>
        </Section>

        <Section id="relative-value" title="Relative Value">
          <div className="panel">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={portfolio?.comparison ?? []}>
                <CartesianGrid stroke="#dfe4dc" />
                <XAxis dataKey="name" hide />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(v: number) => num(v)} />
                <Legend />
                <Bar yAxisId="left" dataKey="credit_spread_bps" fill="#245f9f" />
                <Line yAxisId="right" dataKey="duration" stroke="#9a6a18" />
              </ComposedChart>
            </ResponsiveContainer>
            <DataTable rows={portfolio?.comparison ?? []} columns={["issuer", "rating", "maturity_years", "coupon_rate", "market_price", "ytm", "benchmark_yield", "credit_spread_bps", "duration", "convexity"]} />
            <ul className="observations">{portfolio?.observations?.map((item: string) => <li key={item}>{item}</li>)}</ul>
          </div>
        </Section>

        <Section id="investment-view" title="Investment View">
          <div className="panel view">
            <strong>{analysis?.investment_view?.view}</strong>
            <DataTable rows={[{
              market_price: analysis?.bond?.market_price,
              model_price: analysis?.model_price,
              ytm: analysis?.ytm,
              benchmark_yield: analysis?.benchmark_yield,
              credit_spread_bps: analysis?.credit_spread?.basis_points,
              modified_duration: analysis?.modified_duration,
              convexity: analysis?.convexity,
            }]} columns={["market_price", "model_price", "ytm", "benchmark_yield", "credit_spread_bps", "modified_duration", "convexity"]} />
            <h3>Supporting Reasons</h3>
            <ul className="observations">{analysis?.investment_view?.reasons?.map((item: string) => <li key={item}>{item}</li>)}</ul>
            <h3>Key Risks</h3>
            <ul className="observations">{analysis?.investment_view?.key_risks?.map((item: string) => <li key={item}>{item}</li>)}</ul>
            <p className="disclaimer">Educational analysis only. This is not financial advice.</p>
          </div>
        </Section>
      </div>
    </main>
  );
}

function DataTable({ rows, columns }: { rows: Record<string, any>[]; columns: string[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column.replaceAll("_", " ")}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => {
                const value = row[column];
                const shown = typeof value === "number" ? (column.includes("yield") || column.includes("rate") ? pct(value) : num(value)) : value;
                return <td key={column}>{shown ?? "-"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
