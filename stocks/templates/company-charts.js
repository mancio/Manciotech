  const chartColors = {
    blue: "#2563eb", teal: "#0e7490", orange: "#b45309",
    green: "#15803d", red: "#be123c", gray: "#64748b", purple: "#7c3aed"
  };
  const numeric = Number.isFinite;

  function chartSeries(key, label, color, kind = "bar", format = fmtMoney) {
    return { key, label, color, kind, format };
  }

  function exact(value, unit) {
    return numeric(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 6 }) + (unit ? " " + unit : "") : "—";
  }

  function money(unit) {
    return value => exact(value, unit);
  }

  function scalar(value) {
    return numeric(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";
  }

  function ratio(value) {
    return scalar(value) + "×";
  }

  function axisMoney(value) {
    return fmtMoney(value).replace(/\.00(?=[KMBT]|$)/, "");
  }

  function margin(value) {
    return scalar(value) + "%";
  }

  function svgEl(tag, attrs, content) {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([name, value]) => n.setAttribute(name, value));
    if (content !== undefined) n.textContent = content;
    return n;
  }

  function axisScale(values) {
    const low = Math.min(0, ...values);
    const high = Math.max(0, ...values);
    const step = (high - low) / 4 || 1;
    const power = Math.pow(10, Math.floor(Math.log10(step)));
    const interval = ([1, 2, 2.5, 5, 10].find(size => size * power >= step) || 10) * power;
    const start = Math.floor(low / interval);
    const end = Math.max(Math.ceil(high / interval), start + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => (i + start) * interval);
  }

  function titleMark(mark, text) {
    mark.appendChild(svgEl("title", {}, text));
    return mark;
  }

  function gridLines(svg, ticks, toY, x1, x2, format) {
    ticks.forEach(value => {
      const y = toY(value);
      svg.appendChild(svgEl("line", { x1, x2, y1: y, y2: y, class: value ? "company-axis" : "company-zero" }));
      svg.appendChild(svgEl("text", { x: x1 - 6, y: y + 4, "text-anchor": "end" }, format(value)));
    });
  }

  function chartPlot(rows, series, axisLabels, axisFormat) {
    const width = 450, top = 13, bottom = 141, left = 52;
    const primary = series.filter(s => !s.secondary);
    const secondary = series.filter(s => s.secondary);
    const right = secondary.length ? width - 54 : width - (axisLabels ? 25 : 10);
    const scale = rows.length ? (right - left) / rows.length : 0;
    const x = idx => left + scale * (idx + 0.5);
    const svg = svgEl("svg", { class: "company-plot", viewBox: "0 0 450 170", "aria-hidden": "true" });
    const axis = primary.length ? primary : secondary;
    const axisValues = list => rows.flatMap(row => list.map(s => row[s.key]).filter(numeric));
    const ticks = axisScale(axisValues(axis));
    const yFor = t => v => bottom - (v - t[0]) * (bottom - top) / (t[t.length - 1] - t[0]);
    const primaryY = yFor(ticks);
    gridLines(svg, ticks, primaryY, left, right, primary.length ? axisFormat : margin);
    const secondaryTicks = axisScale(axisValues(secondary));
    const secondaryY = yFor(secondaryTicks);
    if (primary.length && secondary.length) {
      secondaryTicks.forEach(value => {
        svg.appendChild(svgEl("text", { x: right + 6, y: secondaryY(value) + 4 }, margin(value)));
      });
    }

    const bars = series.filter(s => s.kind === "bar");
    const barWidth = Math.min(28, scale * 0.73 / Math.max(1, bars.length));
    series.forEach(s => {
      const y = s.secondary && primary.length ? secondaryY : primaryY;
      const barIndex = bars.indexOf(s);
      let previous = null;
      rows.forEach((row, i) => {
        const value = row[s.key];
        if (!numeric(value)) {
          previous = null;
          return;
        }
        const point = { x: x(i), y: y(value) };
        const title = row.label + " · " + s.label + " " + s.format(value);
        if (s.kind === "bar") {
          svg.appendChild(titleMark(svgEl("rect", {
            x: point.x + (barIndex - bars.length / 2) * barWidth + 1,
            y: Math.min(point.y, y(0)), width: Math.max(1, barWidth - 2),
            height: Math.max(1, Math.abs(y(0) - point.y)), rx: 2, fill: s.color
          }), title));
        } else {
          if (previous && s.kind === "line") {
            svg.appendChild(svgEl("line", {
              x1: previous.x, y1: previous.y, x2: point.x, y2: point.y,
              stroke: s.color, "stroke-width": 2
            }));
          }
          const hollow = s.kind === "estimate";
          const offset = s.kind === "actual" ? -3 : hollow ? 3 : 0;
          if (s.kind !== "line" || rows.length <= 15 || i === rows.length - 1) {
            svg.appendChild(titleMark(svgEl("circle", {
              cx: point.x + offset, cy: point.y, r: s.kind === "line" ? 3 : 5,
              fill: hollow ? "#fff" : s.color, stroke: s.color, "stroke-width": 2
            }), title));
          }
        }
        previous = point;
      });
    });

    rows.forEach((row, i) => {
      const label = axisLabels ? axisLabels[i] : row.axisLabel || row.label;
      if (label) svg.appendChild(svgEl("text", { x: x(i), y: bottom + 20, "text-anchor": "middle" }, label));
    });
    return svg;
  }

  function chartLegend(series) {
    const legend = el("ul", "company-legend");
    series.forEach(s => {
      const item = el("li");
      const swatch = el("i");
      swatch.style.backgroundColor = s.kind === "estimate" ? "#fff" : s.color;
      if (s.kind === "estimate") swatch.style.border = "2px solid " + s.color;
      swatch.setAttribute("aria-hidden", "true");
      item.append(swatch, el("span", null, s.label));
      legend.append(item);
    });
    return legend;
  }

  function chartTable(title, headings, rows) {
    const details = el("details", "company-values");
    details.append(el("summary", null, title));
    const wrap = el("div", "company-values-wrap");
    const table = el("table", "company-data");
    table.setAttribute("aria-label", title);
    const header = el("tr");
    headings.forEach(name => {
      const cell = el("th", null, name);
      cell.scope = "col";
      header.append(cell);
    });
    const thead = el("thead");
    thead.append(header);
    const tbody = el("tbody");
    rows.forEach(row => {
      const tr = el("tr");
      row.forEach((content, i) => {
        const cell = el(i === 0 ? "th" : "td", null, content);
        if (i === 0) cell.scope = "row";
        tr.append(cell);
      });
      tbody.append(tr);
    });
    table.append(thead, tbody);
    wrap.append(table);
    details.append(wrap);
    return details;
  }

  function chartCard(title, wide) {
    const card = el("article", wide ? "company-card wide" : "company-card");
    const heading = el("header");
    heading.append(el("h4", null, title));
    card.append(heading);
    return card;
  }

  function periodCard(title, options, draw, interimLabel = "Quarterly") {
    const periods = ["annual", "quarterly"].filter(period => options[period]);
    if (!periods.length) return null;
    const card = chartCard(title);
    const content = el("div");
    const controls = el("div", "company-periods");
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", title + " period");
    const buttons = periods.map(period => {
      const button = el("button", null, period === "annual" ? "Annual" : interimLabel);
      button.type = "button";
      button.addEventListener("click", () => show(period));
      controls.append(button);
      return button;
    });

    function show(period) {
      buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(periods[i] === period)));
      content.replaceChildren(draw(options[period]));
    }
    if (periods.length > 1) card.firstChild.append(controls);
    else card.firstChild.append(el("span", "company-note", buttons[0].textContent));
    card.append(content);
    show(periods[0]);
    return card;
  }

  function plottedValues(rows, series, axisFormat = axisMoney, unit, axisLabels) {
    const content = document.createDocumentFragment();
    content.append(chartPlot(rows, series, axisLabels, axisFormat), chartLegend(series));
    if (unit) content.append(el("p", "company-note", unit));
    content.append(chartTable("Chart values", ["Period", ...series.map(s => s.label)],
      rows.map(row => [row.label, ...series.map(s => numeric(row[s.key]) ? s.format(row[s.key]) : "—")])));
    return content;
  }

  function datedRows(periods, period) {
    return (periods || []).map(row => ({
      ...(row.values || row),
      label: row.date,
      axisLabel: period === "annual" ? row.date.slice(0, 4) : row.date.slice(0, 7)
    })).sort((a, b) => a.label.localeCompare(b.label));
  }

  function historicalCard(title, data, definitions, getRows, axisFormat, unit, interimLabel) {
    const options = {};
    ["annual", "quarterly"].forEach(period => {
      const visible = getRows(data[period], period);
      const rows = visible.filter(row => definitions.some(s => numeric(row[s.key]))).slice(-5);
      if (!rows.length) return;
      const series = definitions.filter(s => rows.some(row => numeric(row[s.key])));
      options[period] = { rows, series };
    });
    return periodCard(title, options, ({ rows, series }) => plottedValues(rows, series, axisFormat, unit), interimLabel);
  }

  function waterfall(rows) {
    const svg = svgEl("svg", { class: "company-plot", viewBox: "0 0 450 170", "aria-hidden": "true" });
    const top = 13, bottom = 141, left = 52, right = 440;
    const ticks = axisScale(rows.flatMap(row => [row.start, row.end]));
    const y = v => bottom - (v - ticks[0]) * (bottom - top) / (ticks[ticks.length - 1] - ticks[0]);
    const slot = (right - left) / rows.length;
    const width = Math.min(slot * 0.62, 42);
    gridLines(svg, ticks, y, left, right, axisMoney);
    rows.forEach((row, index) => {
      const x = left + (index + 0.5) * slot;
      const next = rows[index + 1];
      if (next && !(row.breakAfter || next.breakBefore)) {
        svg.appendChild(svgEl("line", {
          x1: x + width / 2, y1: y(row.end), x2: x + slot - width / 2, y2: y(row.end),
          stroke: chartColors.gray, "stroke-dasharray": "3 3"
        }));
      }
      svg.appendChild(titleMark(svgEl("rect", {
        x: x - width / 2, y: Math.min(y(row.start), y(row.end)),
        width, height: Math.max(1, Math.abs(y(row.start) - y(row.end))), fill: row.color, rx: 1
      }), row.label + " " + fmtMoney(row.value)));
      svg.appendChild(svgEl("text", { x, y: bottom + 20, "text-anchor": "middle" }, row.short));
    });
    return svg;
  }

  function waterfallStep(label, short, start, end, color, value = end - start) {
    return { label, short, start, end, color, value };
  }

  function capitalCard(data) {
    if (!data) return null;
    const definitions = [
      ["market_cap", "Market cap", chartColors.blue],
      ["debt", "Total debt", chartColors.orange],
      ["cash", "Cash & equivalents", chartColors.teal],
      ["enterprise_value", "Enterprise value", chartColors.purple]
    ];
    const series = definitions.filter(([key]) => numeric(data[key]));
    if (!series.length) return null;
    const card = chartCard("Capital structure");
    const display = el("dl", "company-metrics");
    series.forEach(([key, label]) => {
      const wrapper = el("div");
      wrapper.append(el("dt", null, label), el("dd", null, fmtMoney(data[key]) + (data.currency ? " " + data.currency : "")));
      display.append(wrapper);
    });
    card.append(display);
    const { market_cap: cap, debt, cash, enterprise_value: ev } = data;
    if ([cap, debt, cash, ev].every(numeric)) {
      const adjusted = Math.abs(cap + debt - cash - ev) > Math.abs(ev) * 0.005;
      const rows = [
        waterfallStep("Market cap", "Cap", 0, cap, chartColors.blue),
        waterfallStep("Total debt", "Debt", cap, cap + debt, chartColors.orange),
        { ...waterfallStep("Less cash & equivalents", "Cash", cap + debt, cap + debt - cash, chartColors.teal, cash), breakAfter: adjusted },
        waterfallStep("Enterprise value", "EV", 0, ev, chartColors.purple)
      ];
      card.append(waterfall(rows));
      if (adjusted) card.append(el("p", "company-note", "Yahoo Finance reports enterprise value separately. It can reflect additional adjustments."));
    }
    if (data.balance_date) {
      card.append(el("p", "company-note", "Debt and cash as of " + data.balance_date));
    }
    card.append(chartTable("Capital structure values", ["Metric", "Value"],
      series.map(([key, label]) => [label, exact(data[key], data.currency)])));
    return card;
  }

  function profitCard(data) {
    const options = {};
    ["annual", "quarterly"].forEach(period => {
      const latest = datedRows(data[period], period).reverse().find(row =>
        ["revenue", "cost_of_revenue", "gross_profit", "operating_expenses", "operating_income",
          "non_operating_income", "taxes_and_other", "net_income"].every(key => numeric(row[key]))
      );
      if (latest) options[period] = latest;
    });
    return periodCard("Revenue to profit", options, row => {
      const beforeTaxes = row.operating_income + row.non_operating_income;
      const rows = [
        waterfallStep("Revenue", "Sales", 0, row.revenue, chartColors.blue),
        waterfallStep("Cost of revenue", "Cost", row.revenue, row.gross_profit, chartColors.red, -row.cost_of_revenue),
        waterfallStep("Gross profit", "Gross", 0, row.gross_profit, chartColors.blue),
        waterfallStep("Operating costs & adjustments", "Op cost", row.gross_profit, row.operating_income, chartColors.red, -row.operating_expenses),
        waterfallStep("Operating income", "Op. inc.", 0, row.operating_income, chartColors.blue),
        waterfallStep("Non-operating income / expense", "Non-op.", row.operating_income, beforeTaxes,
          row.non_operating_income >= 0 ? chartColors.green : chartColors.red),
        waterfallStep("Taxes and other items", "Tax etc.", beforeTaxes, row.net_income,
          row.taxes_and_other <= 0 ? chartColors.green : chartColors.red, -row.taxes_and_other),
        waterfallStep("Net income", "Net", 0, row.net_income, chartColors.blue)
      ];
      const content = document.createDocumentFragment();
      content.append(waterfall(rows), el("p", "company-note", "Period ended " + row.label + (data.currency ? " · " + data.currency : "")));
      content.append(chartTable("Chart values", ["Line item", "Value"],
        rows.map(step => [step.label, exact(step.value, data.currency)])));
      return content;
    }, "Quarterly / interim");
  }

  function financialPositionCard(data) {
    const options = {};
    ["annual", "quarterly"].forEach(period => {
      const row = datedRows(data[period], period).reverse().find(row =>
        ["current_assets", "current_liabilities", "non_current_assets", "non_current_liabilities"].some(key => numeric(row[key]))
      );
      if (!row) return;
      options[period] = { date: row.label, rows: [
        { label: "Short term", assets: row.current_assets, liabilities: row.current_liabilities },
        { label: "Long term", assets: row.non_current_assets, liabilities: row.non_current_liabilities }
      ].filter(r => numeric(r.assets) || numeric(r.liabilities)) };
    });
    const definitions = [
      chartSeries("assets", "Assets", chartColors.blue, "bar", money(data.currency)),
      chartSeries("liabilities", "Liabilities", chartColors.teal, "bar", money(data.currency))
    ];
    return periodCard("Assets and liabilities", options, ({ date, rows }) =>
      plottedValues(rows, definitions.filter(s => rows.some(row => numeric(row[s.key]))),
        axisMoney, "Period ended " + date + (data.currency ? " · " + data.currency : "")), "Quarterly / interim");
  }

  function earningsCard(data, metric, title) {
    const unit = data[metric + "_currency"];
    const kind = metric === "eps" ? " per share" : "";
    const definitions = [
      chartSeries(metric + "_actual", "Actual", chartColors.teal, "actual", money(unit)),
      chartSeries(metric + "_estimate", "Estimate", chartColors.purple, "estimate", money(unit))
    ];
    const forecastLabels = {
      "Current quarter": "This quarter", "Next quarter": "Next quarter",
      "Current FY": "This FY", "Next FY": "Next FY"
    };
    const rows = (items, period) => (items || []).map(item => ({
      ...item,
      label: item.label || item.date,
      axisLabel: forecastLabels[item.label] ||
        (item.date ? item.date.slice(0, period === "annual" ? 4 : 7) : item.label)
    }));
    const card = historicalCard(title, data, definitions, rows,
      metric === "eps" ? scalar : axisMoney, unit ? unit + kind : "");
    if (card && metric === "eps") {
      if (data.eps_methodology) {
        card.append(el("p", "company-note", "EPS basis: " + data.eps_methodology));
      }
      if (data.next_date) {
        card.append(el("p", "company-note", "Next earnings date from Yahoo Finance (may be estimated): " + data.next_date));
      }
    }
    return card;
  }

  function priceTargetCard(data, history) {
    if (!data || !numeric(data.mean)) return null;
    const card = chartCard("Analyst price targets", true);
    const unit = data.currency || "";
    const metrics = el("dl", "company-metrics");
    const values = [
      ["Average target", data.mean, chartColors.purple],
      ["Low target", data.low, chartColors.orange],
      ["High target", data.high, chartColors.green],
      ["Current quote", data.current, chartColors.blue]
    ].filter(([, value]) => numeric(value));
    values.forEach(([label, value]) => {
      const item = el("div");
      item.append(el("dt", null, label), el("dd", null, exact(value, unit)));
      metrics.append(item);
    });
    if (data.history_compatible && numeric(data.current) && data.current > 0) {
      const change = (data.mean / data.current - 1) * 100;
      const item = el("div");
      item.append(el("dt", null, "Average target vs. quote"),
        el("dd", change < 0 ? "company-negative" : "company-positive", (change > 0 ? "+" : "") + margin(change)));
      metrics.append(item);
    }
    card.append(metrics);
    if (data.history_compatible && Array.isArray(history) && history.length >= 2) {
      const points = history.filter(row => numeric(row.close) && row.date);
      if (points.length >= 2) {
        const rows = points.map(row => ({ label: row.date, close: row.close }));
        const last = rows.length - 1;
        const interval = Math.ceil(last / 4);
        const labels = rows.map((row, i) => (i === last || (i % interval === 0 && last - i >= interval / 2)) ? row.label.slice(0, 7) : "");
        for (let i = 0; i < Math.max(4, Math.ceil(rows.length / 5)); i++) {
          rows.push({});
          labels.push("");
        }
        rows.push({ label: "Targets", mean: data.mean, low: data.low, high: data.high }, {}, {});
        labels.push("Targets", "", "");
        const series = [
          chartSeries("close", "Past-year close", chartColors.blue, "line", money(unit)),
          chartSeries("mean", "Average target", chartColors.purple, "estimate", money(unit)),
          chartSeries("low", "Low target", chartColors.orange, "estimate", money(unit)),
          chartSeries("high", "High target", chartColors.green, "estimate", money(unit))
        ].filter(s => rows.some(row => numeric(row[s.key])));
        card.append(chartPlot(rows, series, labels, scalar), chartLegend(series));
        card.append(el("p", "company-note", "Weekly closes and analyst target estimates" + (unit ? " · " + unit : "")));
        card.append(chartTable("Historical closes shown", ["Date", "Close"],
          points.map(row => [row.date, exact(row.close, unit)])));
      }
    }
    return card;
  }

  function analystActionsCard(actions) {
    if (!Array.isArray(actions) || !actions.length) return null;
    const card = chartCard("Recent analyst actions", true);
    const records = actions.slice(0, 12);
    const table = chartTable("Analyst actions", ["Date", "Firm", "Action", "Previous rating", "Updated rating"],
      records.map(row => [row.date, row.firm, row.action || "—", row.from_grade || "—", row.to_grade || "—"]));
    table.open = true;
    card.append(table);
    return card;
  }

  function companyGroup(title, cards) {
    const present = cards.filter(Boolean);
    if (!present.length) return null;
    const group = section(title);
    group.classList.add("company-group");
    const grid = el("div", "company-grid");
    grid.append(...present);
    group.append(grid);
    return group;
  }

  function valuationCard(data) {
    const definitions = [
      chartSeries("pe", "P/E", chartColors.orange, "line", ratio),
      chartSeries("ps", "P/S", chartColors.blue, "line", ratio)
    ];
    const current = data.current || {};
    const snapshot = definitions.filter(s => numeric(current[s.key]));
    const historical = historicalCard("Valuation ratios", data, definitions, datedRows, ratio);
    if (!snapshot.length) return historical;
    const card = historical || chartCard("Valuation ratios");
    const metrics = el("dl", "company-metrics");
    snapshot.forEach(s => {
      const item = el("div");
      item.append(el("dt", null, "Current " + s.label), el("dd", null, s.format(current[s.key])));
      metrics.append(item);
    });
    card.firstChild.after(metrics);
    return card;
  }

  function companyCharts(data) {
    const finance = data.finance || {};
    const statements = finance.statements || {};
    const market = finance.market || {};
    const earnings = market.earnings || {};
    const stockCurrency = statements.currency;
    const statementMoney = money(stockCurrency);
    const periodUnit = stockCurrency ? "Financial statement currency " + stockCurrency : "";
    const netMargin = chartSeries("net_margin_pct", "Net margin", chartColors.orange, "line", margin);
    netMargin.secondary = true;
    const performance = historicalCard("Performance", statements, [
      chartSeries("revenue", "Revenue", chartColors.blue, "bar", statementMoney),
      chartSeries("net_income", "Net income", chartColors.teal, "bar", statementMoney),
      netMargin
    ], datedRows, axisMoney, periodUnit, "Quarterly / interim");
    const coverage = historicalCard("Debt and cash flow", statements, [
      chartSeries("total_debt", "Total debt", chartColors.orange, "bar", statementMoney),
      chartSeries("free_cash_flow", "Free cash flow", chartColors.teal, "bar", statementMoney),
      chartSeries("cash", "Cash & equivalents", chartColors.blue, "bar", statementMoney)
    ], datedRows, axisMoney, periodUnit, "Quarterly / interim");
    return [
      companyGroup("Valuation", [capitalCard(market.capital_structure), valuationCard(market.valuation || {})]),
      companyGroup("Growth and profitability", [performance, profitCard(statements)]),
      companyGroup("Earnings", [earningsCard(earnings, "revenue", "Revenue"), earningsCard(earnings, "eps", "Earnings per share")]),
      companyGroup("Financial health", [coverage, financialPositionCard(statements)]),
      companyGroup("Analyst targets and actions", [priceTargetCard(market.price_target, finance.price_history),
        analystActionsCard(market.analyst_actions)])
    ].filter(Boolean);
  }
