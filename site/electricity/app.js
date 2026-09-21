(function () {
  "use strict";

  var STORAGE_KEY = "denki-sim-state-v1";

  var PERIOD_DAYS = { day: 1, week: 7, month: 30 };
  var PERIOD_HERO_LABEL = {
    day: "1日分の電気代合計",
    week: "1週間分の電気代合計",
    month: "1ヶ月分の電気代合計",
  };
  var PERIOD_CHART_NOTE = {
    day: "1日あたり・金額が高い順",
    week: "1週間（7日）あたり・金額が高い順",
    month: "1ヶ月（30日換算）あたり・金額が高い順",
  };

  var yenFormatter = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  });

  var state = {
    price: 31,
    period: "day",
    hours: {},
  };

  var appliances = [];

  function loadSavedState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && typeof saved === "object") {
        if (typeof saved.price === "number" && saved.price > 0) {
          state.price = saved.price;
        }
        if (saved.period === "day" || saved.period === "week" || saved.period === "month") {
          state.period = saved.period;
        }
        if (saved.hours && typeof saved.hours === "object") {
          state.hours = saved.hours;
        }
      }
    } catch (err) {
      /* private browsing / blocked storage - fall back to defaults */
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* ignore - per-viewer convenience only */
    }
  }

  function hoursFor(appliance) {
    var saved = state.hours[appliance.id];
    return typeof saved === "number" ? saved : appliance.hoursPerDay;
  }

  function formatYen(value) {
    return yenFormatter.format(Math.round(value));
  }

  function formatKwh(value) {
    return (value >= 10 ? value.toFixed(1) : value.toFixed(2)) + " kWh";
  }

  function formatHours(value) {
    return value.toFixed(1) + "h";
  }

  function computeRows() {
    var periodDays = PERIOD_DAYS[state.period];
    var rows = appliances.map(function (appliance) {
      var hours = hoursFor(appliance);
      var dailyKwh = (appliance.watt / 1000) * hours;
      var dailyCost = dailyKwh * state.price;
      return {
        appliance: appliance,
        hours: hours,
        dailyKwh: dailyKwh,
        periodKwh: dailyKwh * periodDays,
        periodCost: dailyCost * periodDays,
      };
    });
    rows.sort(function (a, b) {
      return b.periodCost - a.periodCost;
    });
    return rows;
  }

  function renderStats(rows) {
    var totalCost = rows.reduce(function (sum, r) { return sum + r.periodCost; }, 0);
    var totalKwh = rows.reduce(function (sum, r) { return sum + r.periodKwh; }, 0);

    document.getElementById("stat-hero-label").textContent = PERIOD_HERO_LABEL[state.period];
    document.getElementById("total-cost").textContent = formatYen(totalCost);
    document.getElementById("total-kwh").textContent = formatKwh(totalKwh);
    document.getElementById("appliance-count").textContent = rows.length + "台";

    if (rows.length > 0) {
      var top = rows[0];
      document.getElementById("top-appliance").textContent = top.appliance.icon + " " + top.appliance.name;
      document.getElementById("top-appliance-cost").textContent =
        formatYen(top.periodCost) + "（" + PERIOD_HERO_LABEL[state.period].replace("の電気代合計", "") + "）";
    }
  }

  function renderBarChart(rows) {
    document.getElementById("chart-period-note").textContent = PERIOD_CHART_NOTE[state.period];

    var container = document.getElementById("bar-chart");
    var maxCost = rows.length > 0 ? rows[0].periodCost : 0;

    container.innerHTML = "";
    rows.forEach(function (row) {
      var pct = maxCost > 0 ? (row.periodCost / maxCost) * 100 : 0;
      var labelInside = pct >= 30;

      var rowEl = document.createElement("div");
      rowEl.className = "bar-row";

      var labelEl = document.createElement("div");
      labelEl.className = "bar-row-label";
      labelEl.innerHTML =
        '<span class="icon" aria-hidden="true">' + row.appliance.icon + "</span>" +
        '<span class="name">' + row.appliance.name + "</span>";

      var trackEl = document.createElement("div");
      trackEl.className = "bar-track";

      var fillEl = document.createElement("div");
      fillEl.className = "bar-fill";
      fillEl.style.width = Math.max(pct, 1) + "%";
      fillEl.title = row.appliance.name + "：" + formatYen(row.periodCost);

      var valueEl = document.createElement("span");
      valueEl.className = "bar-value" + (labelInside ? " is-inside" : "");
      valueEl.style.setProperty("--fill-pct", pct + "%");
      valueEl.textContent = formatYen(row.periodCost);

      trackEl.appendChild(fillEl);
      trackEl.appendChild(valueEl);
      rowEl.appendChild(labelEl);
      rowEl.appendChild(trackEl);
      container.appendChild(rowEl);
    });
  }

  function renderTable(rows) {
    var container = document.getElementById("appliance-rows");
    container.innerHTML = "";

    rows.forEach(function (row) {
      var appliance = row.appliance;
      var rowEl = document.createElement("div");
      rowEl.className = "appliance-row";
      rowEl.setAttribute("role", "row");

      var nameCol = document.createElement("div");
      nameCol.className = "col col-name";
      nameCol.innerHTML =
        '<span class="icon" aria-hidden="true">' + appliance.icon + "</span>" +
        '<span class="col-name-text">' +
        '<span class="name">' + appliance.name + "</span>" +
        '<span class="category">' + appliance.category + "</span>" +
        "</span>";

      var wattCol = document.createElement("div");
      wattCol.className = "col col-watt";
      wattCol.textContent = appliance.watt.toLocaleString("ja-JP") + " W";

      var hoursCol = document.createElement("div");
      hoursCol.className = "col col-hours";

      var slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "24";
      slider.step = "0.1";
      slider.value = String(row.hours);
      slider.setAttribute("aria-label", appliance.name + "の1日の使用時間");

      var hoursValue = document.createElement("span");
      hoursValue.className = "hours-value";
      hoursValue.textContent = formatHours(row.hours);

      slider.addEventListener("input", function () {
        var value = parseFloat(slider.value);
        state.hours[appliance.id] = value;
        hoursValue.textContent = formatHours(value);
        saveState();
        update();
      });

      hoursCol.appendChild(slider);
      hoursCol.appendChild(hoursValue);

      var kwhCol = document.createElement("div");
      kwhCol.className = "col col-kwh";
      kwhCol.textContent = formatKwh(row.dailyKwh);

      var costCol = document.createElement("div");
      costCol.className = "col col-cost";
      costCol.textContent = formatYen(row.periodCost);

      rowEl.appendChild(nameCol);
      rowEl.appendChild(wattCol);
      rowEl.appendChild(hoursCol);
      rowEl.appendChild(kwhCol);
      rowEl.appendChild(costCol);
      container.appendChild(rowEl);
    });
  }

  function update() {
    var rows = computeRows();
    renderStats(rows);
    renderBarChart(rows);
    renderTable(rows);
  }

  function setPeriod(period) {
    state.period = period;
    saveState();

    document.querySelectorAll(".period-tab").forEach(function (btn) {
      var isActive = btn.getAttribute("data-period") === period;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    update();
  }

  function initControls() {
    var priceInput = document.getElementById("price-input");
    priceInput.value = String(state.price);
    priceInput.addEventListener("input", function () {
      var value = parseFloat(priceInput.value);
      if (!isNaN(value) && value > 0) {
        state.price = value;
        saveState();
        update();
      }
    });

    document.querySelectorAll(".period-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setPeriod(btn.getAttribute("data-period"));
      });
    });

    document.querySelectorAll(".period-tab").forEach(function (btn) {
      var isActive = btn.getAttribute("data-period") === state.period;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function init() {
    loadSavedState();
    initControls();

    fetch("appliances.json")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        appliances = data;
        update();
      })
      .catch(function () {
        document.getElementById("bar-chart").textContent =
          "家電データの読み込みに失敗しました。ページを再読み込みしてください。";
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
