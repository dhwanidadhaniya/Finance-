/* =========================================================================
   THE RATIO LEDGER — app.js
   Vanilla JS, no build step. Talks to the Flask API in backend/server.py
   (same origin by default — see API_BASE below) and renders everything
   client-side. Charts are instantiated lazily, only when a card is opened,
   per the "charts as and when the user wants them" brief.
   ========================================================================= */

const API_BASE = ""; // same-origin; override e.g. "http://localhost:5000" if serving frontend separately

const state = {
  mode: "single",          // "single" | "compare"
  activeTab: "overview",
  data: null,               // single-ticker bundle
  compareData: null,        // { tickers, results, errors }
  charts: new Map(),        // canvas -> Chart.js instance, so re-renders can destroy cleanly
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheEls();
  wireControls();
  syncPeriodsLabel();
  checkChartLibLoaded();
});

function checkChartLibLoaded() {
  if (typeof Chart !== "undefined") return;
  // Chart.js failed to load from both the primary and fallback CDN — most
  // likely a network/firewall block. Say so loudly instead of leaving every
  // "reveal chart" button silently doing nothing.
  const banner = document.createElement("div");
  banner.className = "error-banner";
  banner.style.margin = "16px 24px";
  banner.textContent =
    "Charting library (Chart.js) failed to load from the CDN — tables and figures will still work, " +
    "but charts won't render. This usually means your network/firewall is blocking cdn.jsdelivr.net " +
    "and cdnjs.cloudflare.com. Try a different network, or open the browser console (F12) for the exact error.";
  document.body.insertBefore(banner, document.body.firstChild);
}

function cacheEls() {
  els.form = document.getElementById("controls");
  els.modeToggle = document.getElementById("mode-toggle");
  els.singleField = document.getElementById("single-ticker-field");
  els.compareField = document.getElementById("compare-ticker-field");
  els.tickerInput = document.getElementById("ticker-input");
  els.tickersInput = document.getElementById("tickers-input");
  els.frequency = document.getElementById("frequency-select");
  els.periodsInput = document.getElementById("periods-input");
  els.periodsValue = document.getElementById("periods-value");
  els.submitBtn = document.getElementById("submit-btn");
  els.status = document.getElementById("status-panel");
  els.emptyState = document.getElementById("empty-state");
  els.sheetContent = document.getElementById("sheet-content");
  els.sheetTitle = document.getElementById("sheet-title");
  els.sheetSubtitle = document.getElementById("sheet-subtitle");
  els.stampRing = document.getElementById("identity-stamp").querySelector(".stamp__ring");
  els.stampCenter = document.getElementById("stamp-center");
  els.tabs = document.getElementById("section-tabs");
  els.panels = document.getElementById("section-panels");
  els.chartCardTpl = document.getElementById("tpl-chart-card");
}

function wireControls() {
  els.modeToggle.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });
  els.periodsInput.addEventListener("input", syncPeriodsLabel);
  els.form.addEventListener("submit", onSubmit);
}

function syncPeriodsLabel() {
  els.periodsValue.textContent = els.periodsInput.value;
}

function setMode(mode) {
  state.mode = mode;
  els.modeToggle.querySelectorAll(".toggle-btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.mode === mode);
  });
  els.singleField.classList.toggle("is-hidden", mode !== "single");
  els.compareField.classList.toggle("is-hidden", mode !== "compare");
}

async function onSubmit(e) {
  e.preventDefault();
  const frequency = els.frequency.value;
  const periods = els.periodsInput.value;

  setStatus("Fetching statements…", "loading");
  els.submitBtn.disabled = true;

  try {
    if (state.mode === "single") {
      const ticker = els.tickerInput.value.trim().toUpperCase();
      if (!ticker) throw new Error("Enter a ticker.");
      const bundle = await fetchBundle(ticker, frequency, periods);
      state.data = bundle;
      state.compareData = null;
      renderSingle(bundle);
      setStatus(`Posted ${ticker} — ${bundle.periods.length} periods.`, "");
    } else {
      const raw = els.tickersInput.value;
      const tickers = [...new Set(raw.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean))].slice(0, 3);
      if (tickers.length < 2) throw new Error("Enter at least 2 tickers to compare.");
      const compare = await fetchCompare(tickers, frequency, periods);
      state.compareData = compare;
      state.data = null;
      renderCompare(compare);
      const ok = Object.keys(compare.results).length;
      setStatus(`Posted ${ok}/${tickers.length} tickers.`, ok < tickers.length ? "warning" : "");
    }
  } catch (err) {
    setStatus(err.message || "Something went wrong.", "error");
  } finally {
    els.submitBtn.disabled = false;
  }
}

function setStatus(msg, kind) {
  els.status.textContent = msg;
  els.status.className = "index-card__status" + (kind ? ` is-${kind}` : "");
}

async function fetchJSON(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

function fetchBundle(ticker, frequency, periods) {
  const url = `${API_BASE}/api/bundle?ticker=${encodeURIComponent(ticker)}&frequency=${frequency}&periods=${periods}`;
  return fetchJSON(url);
}

function fetchCompare(tickers, frequency, periods) {
  const url = `${API_BASE}/api/compare?tickers=${encodeURIComponent(tickers.join(","))}&frequency=${frequency}&periods=${periods}`;
  return fetchJSON(url);
}

/* ------------------------------------------------------------------------
   Formatting helpers
   ------------------------------------------------------------------------ */
function fmt(v, { pct = false, money = false, digits } = {}) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  if (pct) return (v * 100).toFixed(digits ?? 1) + "%";
  if (money) return "$" + Math.round(v).toLocaleString("en-US");
  return v.toFixed(digits ?? 2);
}
function fmtRatio(v, digits = 2) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toFixed(digits);
}
function titleCase(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function destroyChart(canvas) {
  const existing = state.charts.get(canvas);
  if (existing) { existing.destroy(); state.charts.delete(canvas); }
}

const CHART_PALETTE = ["#24593F", "#A9791F", "#9A3324", "#4B5B47", "#5E8B72"];

function baseChartOptions(pct) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "bottom", labels: { font: { family: "Inter", size: 11 }, color: "#4B5B47", boxWidth: 12 } },
      tooltip: {
        backgroundColor: "#17261C",
        titleFont: { family: "IBM Plex Mono", size: 11 },
        bodyFont: { family: "IBM Plex Mono", size: 11 },
        callbacks: pct ? { label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y * 100).toFixed(1)}%` } : undefined,
      },
    },
    scales: {
      x: { grid: { color: "#DDE6D4" }, ticks: { font: { family: "IBM Plex Mono", size: 10 }, color: "#4B5B47" } },
      y: {
        grid: { color: "#DDE6D4" },
        ticks: {
          font: { family: "IBM Plex Mono", size: 10 }, color: "#4B5B47",
          callback: pct ? (v) => (v * 100).toFixed(0) + "%" : undefined,
        },
      },
    },
  };
}

function makeLineChart(canvas, labels, series, { pct = false } = {}) {
  destroyChart(canvas);
  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: series.map((s, i) => ({
        label: s.label,
        data: s.data,
        borderColor: CHART_PALETTE[i % CHART_PALETTE.length],
        backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] + "22",
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.25,
        spanGaps: true,
        fill: series.length === 1,
      })),
    },
    options: baseChartOptions(pct),
  });
  state.charts.set(canvas, chart);
}

function makeBarChart(canvas, labels, data, { pct = false, highlightLast = false, label = "" } = {}) {
  destroyChart(canvas);
  const colors = labels.map((_, i) =>
    highlightLast && i === labels.length - 1 ? "#A9791F" : CHART_PALETTE[i % CHART_PALETTE.length]
  );
  const chart = new Chart(canvas, {
    type: "bar",
    data: { labels, datasets: [{ label, data, backgroundColor: colors, borderRadius: 4, maxBarThickness: 56 }] },
    options: { ...baseChartOptions(pct), plugins: { ...baseChartOptions(pct).plugins, legend: { display: false } } },
  });
  state.charts.set(canvas, chart);
}

function makeGroupedBarChart(canvas, labels, series, { pct = false } = {}) {
  destroyChart(canvas);
  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: series.map((s, i) => ({
        label: s.label,
        data: s.data,
        backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length],
        borderRadius: 3,
      })),
    },
    options: baseChartOptions(pct),
  });
  state.charts.set(canvas, chart);
}

/* ------------------------------------------------------------------------
   Chart-card builder (reveal-on-demand)
   ------------------------------------------------------------------------ */
function buildChartCard(title, renderFn) {
  const node = els.chartCardTpl.content.cloneNode(true);
  const card = node.querySelector(".chart-card");
  const toggle = node.querySelector(".chart-card__toggle");
  const titleEl = node.querySelector(".chart-card__title");
  const hint = node.querySelector(".chart-card__hint");
  const body = node.querySelector(".chart-card__body");
  const canvas = node.querySelector("canvas");
  titleEl.textContent = title;

  let rendered = false;
  const renderNow = () => {
    if (rendered) return;
    try {
      renderFn(canvas);
      rendered = true;
    } catch (err) {
      console.error("Chart render failed:", title, err);
      const wrap = canvas.closest(".chart-card__canvas-wrap");
      wrap.innerHTML = `<p style="font-family:var(--mono);font-size:12px;color:var(--brick);padding:8px;">
        Couldn't draw this chart (${(err && err.message) || "unknown error"}). Check the browser console (F12) for details.</p>`;
      rendered = true; // don't keep retrying into the same broken state
    }
  };

  toggle.addEventListener("click", () => {
    const open = card.classList.toggle("is-open");
    hint.textContent = open ? "hide chart" : "reveal chart";
    if (!open) return;
    if (rendered) {
      // card was opened before and the chart already exists — just make
      // sure Chart.js re-measures now that its box is full height again.
      const c = state.charts.get(canvas);
      if (c) requestAnimationFrame(() => c.resize());
      return;
    }
    // First open: wait for the expand transition to finish (or a safety
    // timeout, in case the transitionend event never fires) before
    // measuring the canvas — otherwise Chart.js sizes itself against a
    // box that's still mid-animation and ends up 0px tall.
    let settled = false;
    const onDone = () => {
      if (settled) return;
      settled = true;
      body.removeEventListener("transitionend", onDone);
      renderNow();
    };
    body.addEventListener("transitionend", onDone);
    setTimeout(onDone, 350);
  });
  return card;
}

/* ------------------------------------------------------------------------
   Tables
   ------------------------------------------------------------------------ */
function buildTable({ caption, periods, rows, pctRows = new Set() }) {
  const wrap = document.createElement("div");
  wrap.className = "ledger-table-wrap";
  const table = document.createElement("table");
  table.className = "ledger-table";

  if (caption) {
    const cap = document.createElement("caption");
    cap.textContent = caption;
    table.appendChild(cap);
  }

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.appendChild(document.createElement("th"));
  periods.forEach((p) => {
    const th = document.createElement("th");
    th.textContent = p;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach(({ label, key, values }) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    th.style.textAlign = "left";
    th.style.fontWeight = "600";
    th.style.color = "var(--ink)";
    th.textContent = label;
    tr.appendChild(th);

    values.forEach((v, i) => {
      const td = document.createElement("td");
      if (v === null || v === undefined || Number.isNaN(v)) {
        td.textContent = "—";
        td.classList.add("na");
      } else {
        td.textContent = pctRows.has(key) ? fmt(v, { pct: true }) : fmtRatio(v);
        // `values` is ordered oldest -> newest (left to right), matching the
        // period columns, so the "prior period" for column i is column i-1.
        const prev = values[i - 1];
        if (typeof prev === "number" && !Number.isNaN(prev)) {
          if (v > prev) td.classList.add("delta-up");
          else if (v < prev) td.classList.add("delta-down");
        }
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

/* ------------------------------------------------------------------------
   Tabs
   ------------------------------------------------------------------------ */
function setTabs(defs) {
  els.tabs.innerHTML = "";
  els.panels.innerHTML = "";
  defs.forEach((def, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab-btn" + (i === 0 ? " is-active" : "");
    btn.textContent = def.label;
    btn.addEventListener("click", () => activateTab(def.id));
    btn.dataset.tabId = def.id;
    els.tabs.appendChild(btn);

    const panel = document.createElement("section");
    panel.className = "section-panel" + (i === 0 ? " is-active" : "");
    panel.id = `panel-${def.id}`;
    panel.appendChild(def.render());
    els.panels.appendChild(panel);
  });
  state.activeTab = defs[0]?.id;
}
function activateTab(id) {
  state.activeTab = id;
  els.tabs.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tabId === id));
  els.panels.querySelectorAll(".section-panel").forEach((p) => p.classList.toggle("is-active", p.id === `panel-${id}`));
}

/* ------------------------------------------------------------------------
   SINGLE TICKER rendering
   ------------------------------------------------------------------------ */
function renderSingle(bundle) {
  els.emptyState.classList.add("is-hidden");
  els.sheetContent.classList.remove("is-hidden");

  els.sheetTitle.textContent = bundle.ticker;
  const missing = Object.entries(bundle.quality).filter(([, ok]) => !ok).map(([k]) => titleCase(k));
  els.sheetSubtitle.innerHTML = `${bundle.frequency} · ${bundle.periods[0]} &rarr; ${bundle.periods[bundle.periods.length - 1]}` +
    (missing.length ? ` · <span class="flag">${missing.length} line item${missing.length > 1 ? "s" : ""} not reported</span>` : "");

  const latest = bundle.latest;
  const roeDirect = latest?.ratios?.roe;
  const roe3 = latest?.dupont?.roe_3step;
  const roe5 = latest?.dupont?.roe_5step;
  const reconciles = [roeDirect, roe3, roe5].every((v) => typeof v === "number") &&
    Math.abs(roeDirect - roe3) < 0.005 && Math.abs(roeDirect - roe5) < 0.005;
  els.stampRing.classList.toggle("is-unverified", !reconciles);
  els.stampCenter.textContent = typeof roeDirect === "number" ? fmt(roeDirect, { pct: true }) : "N/A";

  setTabs([
    { id: "overview", label: "Overview", render: () => renderOverviewPanel(bundle) },
    { id: "liquidity", label: "Liquidity", render: () => renderRatioGroupPanel(bundle, "Current ratio and quick ratio — can the company cover short-term obligations?", [
        { key: "current_ratio", label: "Current Ratio" },
        { key: "quick_ratio", label: "Quick Ratio" },
      ]) },
    { id: "profitability", label: "Profitability & Returns", render: () => renderRatioGroupPanel(bundle, "Margins and returns — how much profit per rupee/dollar of sales and capital.", [
        { key: "gross_margin", label: "Gross Margin", pct: true },
        { key: "net_margin", label: "Net Margin", pct: true },
        { key: "roa", label: "Return on Assets", pct: true },
        { key: "roe", label: "Return on Equity", pct: true },
      ]) },
    { id: "leverage", label: "Leverage", render: () => renderRatioGroupPanel(bundle, "Debt load and the cushion available to service it.", [
        { key: "debt_to_equity", label: "Debt to Equity" },
        { key: "interest_coverage", label: "Interest Coverage" },
      ]) },
    { id: "efficiency", label: "Efficiency", render: () => renderRatioGroupPanel(bundle, "How hard the asset base and inventory are working.", [
        { key: "asset_turnover", label: "Asset Turnover" },
        { key: "inventory_turnover", label: "Inventory Turnover" },
      ]) },
    { id: "dupont3", label: "DuPont · 3-Step", render: () => renderDupontPanel(bundle, 3) },
    { id: "dupont5", label: "DuPont · 5-Step", render: () => renderDupontPanel(bundle, 5) },
    { id: "raw", label: "Raw Financials", render: () => renderRawPanel(bundle) },
  ]);
}

function renderOverviewPanel(bundle) {
  const wrap = document.createElement("div");

  const missing = Object.entries(bundle.quality).filter(([, ok]) => !ok).map(([k]) => titleCase(k));
  if (missing.length) {
    const note = document.createElement("p");
    note.className = "quality-note";
    note.textContent = `Not reported for ${bundle.ticker}: ${missing.join(", ")} — related ratios show blank rather than a guessed number.`;
    wrap.appendChild(note);
  }

  const intro = document.createElement("p");
  intro.className = "panel-intro";
  intro.textContent = `Most recent period: ${bundle.latest.period}. Open a card below to chart it across all ${bundle.periods.length} periods on file.`;
  wrap.appendChild(intro);

  const grid = document.createElement("div");
  grid.className = "chart-grid";
  const overviewMetrics = [
    { key: "roe", label: "Return on Equity", pct: true },
    { key: "roa", label: "Return on Assets", pct: true },
    { key: "net_margin", label: "Net Margin", pct: true },
    { key: "current_ratio", label: "Current Ratio", pct: false },
    { key: "debt_to_equity", label: "Debt to Equity", pct: false },
    { key: "asset_turnover", label: "Asset Turnover", pct: false },
  ];
  overviewMetrics.forEach((m) => {
    grid.appendChild(buildChartCard(m.label, (canvas) =>
      makeLineChart(canvas, bundle.periods, [{ label: m.label, data: bundle.ratios[m.key] }], { pct: m.pct })
    ));
  });
  wrap.appendChild(grid);
  return wrap;
}

function renderRatioGroupPanel(bundle, introText, metrics) {
  const wrap = document.createElement("div");
  const intro = document.createElement("p");
  intro.className = "panel-intro";
  intro.textContent = introText;
  wrap.appendChild(intro);

  const grid = document.createElement("div");
  grid.className = "chart-grid";
  metrics.forEach((m) => {
    grid.appendChild(buildChartCard(m.label, (canvas) =>
      makeLineChart(canvas, bundle.periods, [{ label: m.label, data: bundle.ratios[m.key] }], { pct: !!m.pct })
    ));
  });
  wrap.appendChild(grid);

  const pctKeys = new Set(metrics.filter((m) => m.pct).map((m) => m.key));
  wrap.appendChild(buildTable({
    caption: `${bundle.ticker} — ${metrics.map((m) => m.label).join(" / ")}`,
    periods: bundle.periods,
    rows: metrics.map((m) => ({ label: m.label, key: m.key, values: bundle.ratios[m.key] })),
    pctRows: pctKeys,
  }));
  return wrap;
}

function renderDupontPanel(bundle, step) {
  const wrap = document.createElement("div");
  const isThree = step === 3;

  const intro = document.createElement("p");
  intro.className = "panel-intro";
  intro.textContent = isThree
    ? "ROE = Net Margin × Asset Turnover × Equity Multiplier — the classic three-lever breakdown."
    : "ROE = Tax Burden × Interest Burden × Operating Margin × Asset Turnover × Equity Multiplier — splits margin into tax, interest and operating effects.";
  wrap.appendChild(intro);

  const latest = bundle.latest.dupont;
  const compKeys = isThree
    ? ["net_margin", "asset_turnover_3s", "equity_multiplier_3s"]
    : ["tax_burden", "interest_burden", "operating_margin", "asset_turnover_5s", "equity_multiplier_5s"];
  const roeKey = isThree ? "roe_3step" : "roe_5step";

  const identity = document.createElement("div");
  identity.className = "identity-line";
  const parts = compKeys.map((k) => `<b>${fmtRatio(latest[k], 3)}</b> <i>(${titleCase(k).replace(" 3s", "").replace(" 5s", "")})</i>`);
  identity.innerHTML = parts.join('<span class="op">&times;</span>') + `<span class="eq">=</span><b>${fmtRatio(latest[roeKey], 3)} ROE</b>`;
  wrap.appendChild(identity);

  const grid = document.createElement("div");
  grid.className = "chart-grid";
  grid.appendChild(buildChartCard(`Component values — ${bundle.latest.period}`, (canvas) =>
    makeBarChart(
      canvas,
      [...compKeys.map((k) => titleCase(k).replace(" 3s", "").replace(" 5s", "")), "ROE"],
      [...compKeys.map((k) => latest[k]), latest[roeKey]],
      { highlightLast: true, label: "value" }
    )
  ));
  grid.appendChild(buildChartCard("ROE over time", (canvas) =>
    makeLineChart(canvas, bundle.periods, [{ label: "ROE", data: bundle.dupont[roeKey] }], { pct: false })
  ));
  wrap.appendChild(grid);

  wrap.appendChild(buildTable({
    caption: `${bundle.ticker} — DuPont ${step}-Step components`,
    periods: bundle.periods,
    rows: [...compKeys, roeKey].map((k) => ({ label: titleCase(k).replace(" 3s", "").replace(" 5s", ""), key: k, values: bundle.dupont[k] })),
  }));
  return wrap;
}

function renderRawPanel(bundle) {
  const wrap = document.createElement("div");
  const intro = document.createElement("p");
  intro.className = "panel-intro";
  intro.textContent = "Normalized line items as pulled from the statements. Blank = not reported by this company, not zero.";
  wrap.appendChild(intro);

  const fields = Object.keys(bundle.financials);
  wrap.appendChild(buildTable({
    caption: `${bundle.ticker} — normalized financials ($ millions/thousands as reported)`,
    periods: bundle.periods,
    rows: fields.map((f) => ({ label: titleCase(f), key: f, values: bundle.financials[f] })),
  }));
  return wrap;
}

/* ------------------------------------------------------------------------
   COMPARE rendering
   ------------------------------------------------------------------------ */
function renderCompare(compare) {
  els.emptyState.classList.add("is-hidden");
  els.sheetContent.classList.remove("is-hidden");

  const ok = Object.keys(compare.results);
  els.sheetTitle.textContent = ok.join(" · ") || "No data";
  els.sheetSubtitle.textContent = `Compare mode · ${ok.length} of ${compare.tickers.length} tickers returned data`;
  els.stampRing.classList.add("is-unverified");
  els.stampCenter.textContent = String(ok.length);

  setTabs([
    { id: "compare-overview", label: "Peer Comparison", render: () => renderCompareOverview(compare) },
    { id: "compare-dupont", label: "DuPont Side-by-Side", render: () => renderCompareDupont(compare) },
  ]);
}

function renderCompareOverview(compare) {
  const wrap = document.createElement("div");
  const ok = Object.entries(compare.results);

  Object.entries(compare.errors).forEach(([ticker, msg]) => {
    const b = document.createElement("div");
    b.className = "error-banner";
    b.textContent = `${ticker}: ${msg}`;
    wrap.appendChild(b);
  });

  const cards = document.createElement("div");
  cards.className = "compare-cards";
  ok.forEach(([ticker, bundle]) => {
    const card = document.createElement("div");
    card.className = "compare-card";
    const latest = bundle.latest?.ratios || {};
    card.innerHTML = `<h4>${ticker}</h4><dl>
      <dt>ROE</dt><dd>${fmt(latest.roe, { pct: true })}</dd>
      <dt>ROA</dt><dd>${fmt(latest.roa, { pct: true })}</dd>
      <dt>Net Margin</dt><dd>${fmt(latest.net_margin, { pct: true })}</dd>
      <dt>Current Ratio</dt><dd>${fmtRatio(latest.current_ratio)}</dd>
      <dt>Debt / Equity</dt><dd>${fmtRatio(latest.debt_to_equity)}</dd>
    </dl>`;
    cards.appendChild(card);
  });
  wrap.appendChild(cards);

  const ratioChoices = [
    ["roe", "Return on Equity", true], ["roa", "Return on Assets", true],
    ["net_margin", "Net Margin", true], ["current_ratio", "Current Ratio", false],
    ["debt_to_equity", "Debt to Equity", false], ["asset_turnover", "Asset Turnover", false],
  ];
  const grid = document.createElement("div");
  grid.className = "chart-grid";
  ratioChoices.forEach(([key, label, pct]) => {
    grid.appendChild(buildChartCard(`${label} — latest period, by ticker`, (canvas) =>
      makeBarChart(canvas, ok.map(([t]) => t), ok.map(([, b]) => b.latest?.ratios?.[key] ?? null), { pct, label })
    ));
  });
  wrap.appendChild(grid);

  ratioChoices.slice(0, 4).forEach(([key, label, pct]) => {
    const card = buildChartCard(`${label} — trend, all tickers`, (canvas) => {
      const longest = ok.reduce((a, b) => (a[1].periods.length > b[1].periods.length ? a : b));
      makeLineChart(canvas, longest[1].periods, ok.map(([t, b]) => ({ label: t, data: b.ratios[key] })), { pct });
    });
    wrap.appendChild(card);
  });

  return wrap;
}

function renderCompareDupont(compare) {
  const wrap = document.createElement("div");
  const ok = Object.entries(compare.results);
  const intro = document.createElement("p");
  intro.className = "panel-intro";
  intro.textContent = "3-step DuPont components for the most recent period, side by side.";
  wrap.appendChild(intro);

  const grid = document.createElement("div");
  grid.className = "chart-grid";
  grid.appendChild(buildChartCard("Net Margin, Asset Turnover, Equity Multiplier by ticker", (canvas) =>
    makeGroupedBarChart(
      canvas, ok.map(([t]) => t),
      [
        { label: "Net Margin", data: ok.map(([, b]) => b.latest?.dupont?.net_margin ?? null) },
        { label: "Asset Turnover", data: ok.map(([, b]) => b.latest?.dupont?.asset_turnover_3s ?? null) },
        { label: "Equity Multiplier", data: ok.map(([, b]) => b.latest?.dupont?.equity_multiplier_3s ?? null) },
      ]
    )
  ));
  grid.appendChild(buildChartCard("ROE by ticker (3-step reconstruction)", (canvas) =>
    makeBarChart(canvas, ok.map(([t]) => t), ok.map(([, b]) => b.latest?.dupont?.roe_3step ?? null), { label: "ROE" })
  ));
  wrap.appendChild(grid);
  return wrap;
}
