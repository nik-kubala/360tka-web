"use strict";

const mobileGate = document.querySelector("[data-mobile-gate]");
const topicTabs = document.querySelectorAll(".topic-tab");
const topicPanels = document.querySelectorAll(".topic-panel");
const MOBILE_GATE_QUERY = window.matchMedia(
  "(max-width: 900px), (hover: none) and (pointer: coarse) and (max-width: 1180px)",
);

function isMobileView() {
  const userAgent = navigator.userAgent ?? "";
  const userAgentDataMobile = navigator.userAgentData?.mobile === true;
  const touchDevicePattern =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  return (
    MOBILE_GATE_QUERY.matches ||
    userAgentDataMobile ||
    touchDevicePattern.test(userAgent)
  );
}

function syncMobileGate() {
  if (!mobileGate) {
    return;
  }

  const shouldBlockMobile = isMobileView();

  mobileGate.hidden = !shouldBlockMobile;
  mobileGate.setAttribute("aria-hidden", String(!shouldBlockMobile));
  document.body.classList.toggle("mobile-gate-active", shouldBlockMobile);
}

function resetScrollPosition() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

window.addEventListener("pageshow", () => {
  requestAnimationFrame(() => {
    resetScrollPosition();
    syncMobileGate();
  });
});

window.addEventListener("resize", syncMobileGate);
window.addEventListener("orientationchange", syncMobileGate);

function setActivePanel(targetId) {
  topicTabs.forEach((button) => {
    const isActive = button.dataset.target === targetId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  topicPanels.forEach((panel) => {
    const isActive = panel.id === targetId;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });

  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"));
    syncPanelCharts(targetId);
  });
}

topicTabs.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (button.classList.contains("active")) {
      if (event.detail > 0) {
        button.blur();
      }

      return;
    }

    setActivePanel(button.dataset.target);

    if (event.detail > 0) {
      button.blur();
    }
  });
});

const styles = getComputedStyle(document.documentElement);

const COLORS = {
  accent: styles.getPropertyValue("--accent").trim(),
  accentStrong: styles.getPropertyValue("--accent-strong").trim(),
  accentSoft: styles.getPropertyValue("--accent-soft").trim(),
  text: styles.getPropertyValue("--text").trim(),
  muted: styles.getPropertyValue("--muted").trim(),
  mutedStrong: styles.getPropertyValue("--muted-strong").trim(),
  line: styles.getPropertyValue("--line-strong").trim(),
  electric: "#71b7ff",
  softBlue: "#95a8d6",
  whiteSoft: "rgba(255, 255, 255, 0.42)",
  paper: "#ffffff",
};

const TOOLTIP_PROXIMITY_PX = 38;

Chart.defaults.font.family = "'Manrope', 'Segoe UI', sans-serif";
Chart.defaults.color = COLORS.mutedStrong;
Chart.defaults.borderColor = COLORS.line;

function basePluginConfig() {
  return {
    legend: {
      position: "top",
      labels: {
        color: COLORS.mutedStrong,
        usePointStyle: true,
        pointStyle: "circle",
        padding: 16,
        boxWidth: 10,
        boxHeight: 10,
        font: {
          size: 12,
          weight: "700",
        },
      },
    },
    tooltip: {
      backgroundColor: "rgba(4, 9, 20, 0.96)",
      titleColor: "#ffffff",
      bodyColor: "#f5f7ff",
      borderColor: "rgba(62, 140, 255, 0.36)",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 14,
      displayColors: true,
    },
  };
}

function commonScale(title) {
  return {
    title: {
      display: Boolean(title),
      text: title,
      color: COLORS.muted,
      font: {
        size: 12,
        weight: "700",
      },
    },
    ticks: {
      color: COLORS.mutedStrong,
      padding: 8,
      font: {
        size: 11,
      },
    },
    grid: {
      color: COLORS.line,
      drawBorder: false,
    },
  };
}

function getDistanceToRect(point, rect) {
  const dx =
    point.x < rect.left
      ? rect.left - point.x
      : point.x > rect.right
        ? point.x - rect.right
        : 0;
  const dy =
    point.y < rect.top
      ? rect.top - point.y
      : point.y > rect.bottom
        ? point.y - rect.bottom
        : 0;

  return Math.hypot(dx, dy);
}

function getBarElementRect(element) {
  const { x, y, base, width, height, horizontal } = element.getProps(
    ["x", "y", "base", "width", "height", "horizontal"],
    true,
  );

  if (horizontal) {
    return {
      left: Math.min(base, x),
      right: Math.max(base, x),
      top: y - height / 2,
      bottom: y + height / 2,
    };
  }

  return {
    left: x - width / 2,
    right: x + width / 2,
    top: Math.min(y, base),
    bottom: Math.max(y, base),
  };
}

function clearChartTooltip(chart) {
  chart.setActiveElements([]);
  chart.tooltip.setActiveElements([], { x: 0, y: 0 });
}

function createTooltipProximityPlugin(thresholdPx = TOOLTIP_PROXIMITY_PX) {
  return {
    id: `tooltipProximity-${thresholdPx}`,
    afterEvent(chart, args) {
      const event = args.event;

      if (!event) {
        return;
      }

      if (event.type === "mouseout") {
        clearChartTooltip(chart);
        chart.update("none");
        return;
      }

      const activeElements = chart.getActiveElements();

      if (!activeElements.length) {
        return;
      }

      const cursor = { x: event.x, y: event.y };
      const minDistance = activeElements.reduce((closestDistance, item) => {
        const element = chart.getDatasetMeta(item.datasetIndex)?.data?.[
          item.index
        ];

        if (!element) {
          return closestDistance;
        }

        const distance = getDistanceToRect(cursor, getBarElementRect(element));

        return Math.min(closestDistance, distance);
      }, Number.POSITIVE_INFINITY);

      if (minDistance <= thresholdPx) {
        return;
      }

      clearChartTooltip(chart);
      chart.update("none");
    },
  };
}

const NUMBER_FORMATTER = new Intl.NumberFormat("sk-SK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INTEGER_FORMATTER = new Intl.NumberFormat("sk-SK", {
  maximumFractionDigits: 0,
});

const ONE_DECIMAL_FORMATTER = new Intl.NumberFormat("sk-SK", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const DEFAULT_PARTY_KEY = "SMER";
const ELECTION_SCOPE_LABEL = "okresy SR";
const ELECTION_DATA_URL =
  "data/Voľby vs. Nezamestnanosť/volby_nrsr2023_nezamestnanost_sep2023.json";
const SOCIAL_DATA_URL =
  "data/Sila na sociálnych sieťach/facebook_prispevky_2026-03-01_2026-03-05.json";
const ACTIVITY_DATA_URL =
  "data/Aktivita politikov/nrsr_aktivita_poslancov.json";

const PARTY_VISUALS = {
  HLAS: {
    label: "HLAS-SD",
    buttonLabel: "HLAS",
    accent: "#ff0f7b",
    accentStrong: "#870841",
    trendColor: "#870841",
    logoSrc: "obrazky/hlas.png",
    logoBackground: "#ffffff",
  },
  KDH: {
    label: "KDH",
    buttonLabel: "KDH",
    accent: "#234887",
    accentStrong: "#ff2a31",
    trendColor: "#ff2a31",
    logoSrc: "obrazky/kdh.png",
    logoBackground: "#ffffff",
  },
  OLaNO: {
    label: "SLOVENSKO",
    buttonLabel: "SLOVENSKO",
    accent: "#eef1f4",
    accentStrong: "#6b7280",
    trendColor: "#9aa3af",
    logoSrc: "obrazky/slovensko.png",
    logoBackground: "#ffffff",
    logoScale: 1.2,
  },
  PS: {
    label: "PS",
    buttonLabel: "PS",
    accent: "#1fb9f3",
    accentStrong: "#0f8fdd",
    trendColor: "#0f8fdd",
    logoSrc: "obrazky/ps.png",
    logoBackground: "#ffffff",
    logoScale: 1.4,
  },
  REPUBLIKA: {
    label: "REPUBLIKA",
    buttonLabel: "REPUBLIKA",
    accent: "#de2630",
    accentStrong: "#1f4aa4",
    trendColor: "#1f4aa4",
    logoSrc: "obrazky/republika.png",
    logoBackground: "#ffffff",
  },
  SMER: {
    label: "SMER-SD",
    buttonLabel: "SMER",
    accent: "#e61919",
    accentStrong: "#630000",
    trendColor: "#630000",
    logoSrc: "obrazky/smer.png",
    logoBackground: "#ffffff",
  },
  SaS: {
    label: "SaS",
    buttonLabel: "SaS",
    accent: "#a6ca16",
    accentStrong: "#0b3d6f",
    trendColor: "#0b3d6f",
    logoSrc: "obrazky/sas.png",
    logoBackground: "#ffffff",
  },
  SNS: {
    label: "SNS",
    buttonLabel: "SNS",
    accent: "#11376a",
    accentStrong: "#2f6fc2",
    trendColor: "#2f6fc2",
    logoSrc: "obrazky/sns.jpg",
    logoBackground: "#ffffff",
    logoBorder: "rgba(95, 163, 255, 0.62)",
    logoShadow:
      "0 0 0 1px rgba(95, 163, 255, 0.18), 0 10px 22px rgba(95, 163, 255, 0.16)",
  },
  SZÖVETSÉG: {
    label: "SZÖVETSÉG",
    buttonLabel: "SZÖVETSÉG",
    accent: "#73b72d",
    accentStrong: "#f39b16",
    trendColor: "#f39b16",
    logoSrc: "obrazky/szovesteg.png",
    logoBackground: "#ffffff",
    logoScale: 1.32,
  },
};

const PARTY_LABELS = Object.fromEntries(
  Object.entries(PARTY_VISUALS).map(([key, config]) => [key, config.label]),
);

const PARTY_BUTTON_LABELS = Object.fromEntries(
  Object.entries(PARTY_VISUALS).map(([key, config]) => [
    key,
    config.buttonLabel,
  ]),
);

const PARTY_VISUALS_BY_LABEL = Object.fromEntries(
  Object.values(PARTY_VISUALS).map((config) => [config.label, config]),
);

const electionSection = {
  title: document.getElementById("volbyRegionTitle"),
  description: document.getElementById("volbyRegionDescription"),
  note: document.getElementById("volbyRegionNote"),
  partySwitcher: document.getElementById("partySwitcher"),
  districtSearch: document.getElementById("districtSearch"),
  districtSearchToggle: document.getElementById("districtSearchToggle"),
  districtSearchPanel: document.getElementById("districtSearchPanel"),
  districtSearchValue: document.getElementById("districtSearchValue"),
  districtSearchHint: document.getElementById("districtSearchHint"),
  districtSearchInput: document.getElementById("districtSearchInput"),
  districtSearchResults: document.getElementById("districtSearchResults"),
  correlationValue: document.getElementById("volbyCorrelationValue"),
  correlationText: document.getElementById("volbyCorrelationText"),
  trendValue: document.getElementById("volbyTrendValue"),
  trendText: document.getElementById("volbyTrendText"),
  assessmentValue: document.getElementById("volbyAssessmentValue"),
  assessmentText: document.getElementById("volbyAssessmentText"),
  footnote: document.getElementById("volbyFootnote"),
  card: document.querySelector(".visual-card--election"),
  chartFrame: document.querySelector(".chart-frame--election"),
};

const electionState = {
  chart: null,
  context: null,
  payload: null,
  partyOptions: [],
  selectedPartyKey: DEFAULT_PARTY_KEY,
  selectedDistrictLabel: "",
  districtQuery: "",
  districtSearchReady: false,
};

const SOCIAL_TYPE_LABELS = {
  reels: "Reels",
  post: "Príspevok",
  event: "Udalosť",
};

const SOCIAL_TYPE_ORDER = ["reels", "post", "event"];

const SOCIAL_TYPE_COLORS = {
  reels: "#59bbff",
  post: "#9fafd9",
  event: "#e5a047",
};

const SOCIAL_PROFILES = [
  {
    label: "Robert Fico",
    shortLabel: "Fico",
    color: "#630000",
    highlight: "#e61919",
    posts: [
      {
        likes: 7000,
        comments: 850,
        shares: 1100,
        views: 120000,
        type: "reels",
      },
      { likes: 2600, comments: 298, shares: 161, views: 52000, type: "reels" },
      { likes: 2800, comments: 582, shares: 109, views: 0, type: "post" },
      { likes: 4800, comments: 652, shares: 423, views: 128000, type: "reels" },
      {
        likes: 34000,
        comments: 2228,
        shares: 3200,
        views: 714000,
        type: "reels",
      },
      {
        likes: 4700,
        comments: 1000,
        shares: 157,
        views: 115000,
        type: "reels",
      },
      {
        likes: 29000,
        comments: 1900,
        shares: 3200,
        views: 702000,
        type: "reels",
      },
      { likes: 3300, comments: 361, shares: 140, views: 82000, type: "reels" },
      { likes: 2600, comments: 258, shares: 99, views: 0, type: "post" },
      { likes: 3300, comments: 312, shares: 125, views: 0, type: "post" },
      { likes: 7500, comments: 2332, shares: 149, views: 0, type: "post" },
      { likes: 5100, comments: 655, shares: 324, views: 190000, type: "reels" },
      {
        likes: 17000,
        comments: 1600,
        shares: 1700,
        views: 425000,
        type: "reels",
      },
      { likes: 6600, comments: 698, shares: 344, views: 163000, type: "reels" },
    ],
  },
  {
    label: "Michal Šimečka",
    shortLabel: "Šimečka",
    color: "#0f8fdd",
    highlight: "#1fb9f3",
    posts: [
      { likes: 2300, comments: 86, shares: 70, views: 50000, type: "reels" },
      { likes: 2300, comments: 97, shares: 97, views: 0, type: "post" },
      { likes: 2000, comments: 26, shares: 33, views: 0, type: "post" },
      { likes: 665, comments: 63, shares: 23, views: 0, type: "post" },
      { likes: 330, comments: 22, shares: 34, views: 0, type: "post" },
      { likes: 1300, comments: 59, shares: 34, views: 24000, type: "reels" },
      { likes: 2500, comments: 89, shares: 74, views: 0, type: "post" },
      { likes: 305, comments: 35, shares: 3, views: 6300, type: "reels" },
      { likes: 1500, comments: 45, shares: 44, views: 0, type: "post" },
      { likes: 957, comments: 58, shares: 69, views: 0, type: "post" },
      { likes: 2400, comments: 85, shares: 105, views: 35000, type: "reels" },
      { likes: 118, comments: 23, shares: 0, views: 0, type: "event" },
      { likes: 3600, comments: 138, shares: 177, views: 47000, type: "reels" },
      { likes: 665, comments: 92, shares: 21, views: 16000, type: "reels" },
      { likes: 1300, comments: 124, shares: 41, views: 0, type: "post" },
      { likes: 800, comments: 49, shares: 13, views: 43, type: "reels" },
      { likes: 7600, comments: 454, shares: 146, views: 0, type: "post" },
      { likes: 174, comments: 43, shares: 0, views: 0, type: "event" },
      { likes: 2000, comments: 71, shares: 24, views: 0, type: "post" },
      { likes: 432, comments: 23, shares: 1, views: 9700, type: "reels" },
      { likes: 298, comments: 29, shares: 6, views: 7800, type: "reels" },
      { likes: 1900, comments: 96, shares: 80, views: 59000, type: "reels" },
      { likes: 2900, comments: 141, shares: 113, views: 48000, type: "reels" },
      { likes: 7700, comments: 1500, shares: 333, views: 0, type: "post" },
      { likes: 294, comments: 20, shares: 11, views: 0, type: "post" },
      { likes: 668, comments: 140, shares: 17, views: 17000, type: "reels" },
    ],
  },
  {
    label: "Milan Uhrík",
    shortLabel: "Uhrík",
    color: "#1f4aa4",
    highlight: "#de2630",
    posts: [
      { likes: 1800, comments: 259, shares: 163, views: 0, type: "post" },
      { likes: 2700, comments: 130, shares: 184, views: 43000, type: "reels" },
      { likes: 710, comments: 19, shares: 115, views: 0, type: "post" },
      {
        likes: 22000,
        comments: 681,
        shares: 5000,
        views: 502000,
        type: "reels",
      },
    ],
  },
  {
    label: "Igor Matovič",
    shortLabel: "Matovič",
    color: "#6b7280",
    highlight: "#eef1f4",
    posts: [
      { likes: 1000, comments: 276, shares: 45, views: 0, type: "post" },
      { likes: 1300, comments: 325, shares: 486, views: 39000, type: "reels" },
      { likes: 562, comments: 220, shares: 56, views: 0, type: "post" },
      { likes: 493, comments: 179, shares: 42, views: 0, type: "post" },
      { likes: 1100, comments: 278, shares: 308, views: 33000, type: "reels" },
      { likes: 2000, comments: 498, shares: 383, views: 70000, type: "reels" },
      { likes: 2100, comments: 455, shares: 378, views: 0, type: "post" },
      { likes: 2300, comments: 454, shares: 183, views: 96000, type: "reels" },
      { likes: 461, comments: 252, shares: 26, views: 0, type: "post" },
      { likes: 2200, comments: 497, shares: 436, views: 102000, type: "reels" },
      { likes: 459, comments: 135, shares: 36, views: 0, type: "post" },
      { likes: 2500, comments: 101, shares: 235, views: 150000, type: "reels" },
      { likes: 2300, comments: 1400, shares: 476, views: 80000, type: "reels" },
      { likes: 756, comments: 463, shares: 79, views: 0, type: "post" },
      { likes: 1100, comments: 262, shares: 201, views: 42000, type: "reels" },
      { likes: 3700, comments: 996, shares: 231, views: 224000, type: "reels" },
      { likes: 2200, comments: 655, shares: 274, views: 104000, type: "reels" },
    ],
  },
];

const socialSection = {
  profilesCount: document.getElementById("socialProfilesCount"),
  postsCount: document.getElementById("socialPostsCount"),
  interactionsCount: document.getElementById("socialInteractionsCount"),
  reelsCount: document.getElementById("socialReelsCount"),
};

const socialState = {
  impactChart: null,
  strategyChart: null,
  totalChart: null,
  formatsChart: null,
  profiles: [],
  payload: null,
  loadingPromise: null,
};

const activityState = {
  topActiveChart: null,
  topInactiveChart: null,
  partyChart: null,
  speechesChart: null,
  lawsChart: null,
  payload: null,
  loadingPromise: null,
};

function formatNumber(value) {
  return NUMBER_FORMATTER.format(value);
}

function formatPercent(value) {
  return `${formatNumber(value)} %`;
}

function formatInteger(value) {
  return INTEGER_FORMATTER.format(Math.round(value));
}

function formatOneDecimal(value) {
  return ONE_DECIMAL_FORMATTER.format(value);
}

function formatCompactMetric(value) {
  if (Math.abs(value) >= 1000000) {
    return `${formatOneDecimal(value / 1000000)} mil.`;
  }

  if (Math.abs(value) >= 1000) {
    const thousands = value / 1000;
    const formattedThousands =
      value >= 100000 ? formatInteger(thousands) : formatOneDecimal(thousands);

    return `${formattedThousands} tis.`;
  }

  return formatInteger(value);
}

function formatShortPercent(value) {
  return `${formatOneDecimal(value)} %`;
}

function compactPersonName(name) {
  const primaryName = name.split(",")[0].trim();
  const parts = primaryName.split(/\s+/).filter(Boolean);

  if (parts.length <= 2) {
    return primaryName;
  }

  return parts.slice(-2).join(" ");
}

function wrapLabel(label, maxLineLength = 16) {
  const words = label.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxLineLength || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function formatAxisTick(value) {
  return Number.isInteger(value)
    ? formatInteger(value)
    : formatOneDecimal(value);
}

function getAxisLabelHoverIndex(chart, event) {
  const yScale = chart.scales.y;

  if (
    !yScale ||
    event.x == null ||
    event.y == null ||
    !Array.isArray(chart.data.labels) ||
    !chart.data.labels.length
  ) {
    return null;
  }

  const { x, y } = event;

  if (
    x < yScale.left ||
    x > yScale.right ||
    y < yScale.top ||
    y > yScale.bottom
  ) {
    return null;
  }

  const tickPositions = chart.data.labels.map((_, index) =>
    yScale.getPixelForTick(index),
  );
  const spacing =
    tickPositions.length > 1
      ? Math.min(
          ...tickPositions
            .slice(1)
            .map((position, index) =>
              Math.abs(position - tickPositions[index]),
            ),
        )
      : 28;
  const threshold = Math.max(12, spacing * 0.45);

  let nearestIndex = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  tickPositions.forEach((position, index) => {
    const distance = Math.abs(y - position);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestDistance <= threshold ? nearestIndex : null;
}

function clearAxisLabelTooltip(chart) {
  if (!chart.$axisLabelTooltipActive) {
    return;
  }

  chart.tooltip.setActiveElements([], { x: 0, y: 0 });
  chart.$axisLabelTooltipActive = false;
  chart.$axisLabelTooltipIndex = -1;
  chart.update("none");
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pearsonCorrelation(points) {
  const meanX = average(points.map((point) => point.x));
  const meanY = average(points.map((point) => point.y));
  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  points.forEach((point) => {
    const deltaX = point.x - meanX;
    const deltaY = point.y - meanY;

    numerator += deltaX * deltaY;
    denominatorX += deltaX * deltaX;
    denominatorY += deltaY * deltaY;
  });

  if (!denominatorX || !denominatorY) {
    return 0;
  }

  return numerator / Math.sqrt(denominatorX * denominatorY);
}

function linearRegression(points) {
  const meanX = average(points.map((point) => point.x));
  const meanY = average(points.map((point) => point.y));
  let covariance = 0;
  let varianceX = 0;

  points.forEach((point) => {
    const deltaX = point.x - meanX;
    covariance += deltaX * (point.y - meanY);
    varianceX += deltaX * deltaX;
  });

  const slope = varianceX ? covariance / varianceX : 0;
  const intercept = meanY - slope * meanX;

  return { slope, intercept };
}

function regressionLine(points, regression) {
  const xValues = points.map((point) => point.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const sampleCount = 56;

  if (minX === maxX) {
    const y = regression.intercept + regression.slope * minX;

    return [
      { label: "Trendová čiara", x: minX, y },
      { label: "Trendová čiara", x: maxX, y },
    ];
  }

  return Array.from({ length: sampleCount }, (_, index) => {
    const progress = index / (sampleCount - 1);
    const x = minX + (maxX - minX) * progress;

    return {
      label: "Trendová čiara",
      x,
      y: regression.intercept + regression.slope * x,
    };
  });
}

function nicePercentAxis(
  values,
  { floor = 0, step = 1, minimumMax = step } = {},
) {
  const maxValue = Math.max(...values);

  return {
    min: floor,
    max: Math.max(minimumMax, Math.ceil(maxValue / step) * step),
  };
}

function describeCorrelation(correlation) {
  const absoluteCorrelation = Math.abs(correlation);
  let strength = "nízka";

  if (absoluteCorrelation >= 0.6) {
    strength = "vysoká";
  } else if (absoluteCorrelation >= 0.3) {
    strength = "stredná";
  }

  if (correlation > 0.05) {
    return `${strength} pozitívna`;
  }

  if (correlation < -0.05) {
    return `${strength} negatívna`;
  }

  return strength === "nízka" ? "veľmi nízka" : strength;
}

function describeTrend(slope) {
  if (Math.abs(slope) < 0.5) {
    return "Takmer plochý trend";
  }

  return slope > 0 ? "Rastúci trend" : "Klesajúci trend";
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatMonth(monthValue) {
  const [year, month] = monthValue.split("-");
  const monthNames = [
    "január",
    "február",
    "marec",
    "apríl",
    "máj",
    "jún",
    "júl",
    "august",
    "september",
    "október",
    "november",
    "december",
  ];

  return `${monthNames[Number(month) - 1]} ${year}`;
}

function cleanPartyLabel(label) {
  return label.replace(/\s*\(%\)\s*$/, "");
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("sk-SK");
}

function getPartyDefinition(key) {
  return electionState.partyOptions.find((party) => party.key === key);
}

function getDistrictRow(label) {
  return (
    electionState.payload?.data?.find((row) => row.okres === label) ?? null
  );
}

function getSortedDistrictRows() {
  if (!electionState.payload?.data) {
    return [];
  }

  return [...electionState.payload.data].sort((left, right) =>
    left.okres.localeCompare(right.okres, "sk-SK"),
  );
}

function buildPartyOptions(meta) {
  return Object.entries(meta.columns)
    .filter(([key]) => !["okres", "nezam_pct"].includes(key))
    .map(([key, label]) => ({
      key,
      label: PARTY_LABELS[key] ?? cleanPartyLabel(label),
      buttonLabel: PARTY_BUTTON_LABELS[key] ?? cleanPartyLabel(label),
      accent: PARTY_VISUALS[key]?.accent ?? COLORS.accent,
      accentStrong: PARTY_VISUALS[key]?.accentStrong ?? COLORS.accentStrong,
      trendColor:
        PARTY_VISUALS[key]?.trendColor ??
        PARTY_VISUALS[key]?.accentStrong ??
        COLORS.electric,
      logoSrc: PARTY_VISUALS[key]?.logoSrc ?? "",
      logoBackground: PARTY_VISUALS[key]?.logoBackground ?? "#ffffff",
      logoBorder: PARTY_VISUALS[key]?.logoBorder ?? "rgba(7, 12, 28, 0.08)",
      logoShadow: PARTY_VISUALS[key]?.logoShadow ?? "none",
      logoScale: PARTY_VISUALS[key]?.logoScale ?? 1,
    }));
}

function getScatterData(partyKey) {
  return electionState.payload.data
    .map((row) => ({
      label: row.okres,
      x: row.nezam_pct,
      y: row[partyKey],
    }))
    .sort((left, right) => left.x - right.x);
}

function createPartyLogoShell(party, shellClassName, imageClassName) {
  const shell = document.createElement("span");
  shell.className = shellClassName;
  shell.style.setProperty("--party-logo-bg", party.logoBackground ?? "#ffffff");
  shell.style.setProperty(
    "--party-logo-border",
    party.logoBorder ?? "rgba(7, 12, 28, 0.08)",
  );
  shell.style.setProperty("--party-logo-shadow", party.logoShadow ?? "none");
  shell.style.setProperty("--party-logo-scale", String(party.logoScale ?? 1));

  if (!party.logoSrc) {
    shell.textContent = party.buttonLabel;
    return shell;
  }

  const image = document.createElement("img");
  image.className = imageClassName;
  image.src = party.logoSrc;
  image.alt = "";
  image.decoding = "async";
  image.loading = "lazy";
  shell.append(image);

  return shell;
}

function sumValues(values) {
  return values.reduce((sum, value) => sum + value, 0);
}

function perThousand(value, total) {
  return total ? (value / total) * 1000 : 0;
}

function prepareSocialProfiles(rawProfiles = SOCIAL_PROFILES) {
  return rawProfiles.map((profile) => {
    const posts = profile.posts.map((post) => ({
      ...post,
      interactions: post.likes + post.comments + post.shares,
    }));
    const typeCounts = posts.reduce(
      (summary, post) => {
        summary[post.type] += 1;
        return summary;
      },
      { reels: 0, post: 0, event: 0 },
    );

    const totalInteractions = sumValues(posts.map((post) => post.interactions));
    const reelsPosts = posts.filter((post) => post.type === "reels");
    const reelsViews = sumValues(reelsPosts.map((post) => post.views));
    const reelsLikes = sumValues(reelsPosts.map((post) => post.likes));
    const reelsStrongInteractions = sumValues(
      reelsPosts.map((post) => post.comments + post.shares),
    );
    const reelsInteractions = reelsLikes + reelsStrongInteractions;
    const reelsEngagementRate = reelsViews ? reelsInteractions / reelsViews : 0;

    return {
      ...profile,
      posts,
      typeCounts,
      totalPosts: posts.length,
      totalInteractions,
      averageInteractions: totalInteractions / posts.length,
      reelsViews,
      reelsLikes,
      reelsStrongInteractions,
      reelsInteractions,
      reelsPassiveViews: Math.max(reelsViews - reelsInteractions, 0),
      reelsEngagementRate,
      reelsPassiveShare: reelsViews
        ? Math.max((reelsViews - reelsInteractions) / reelsViews, 0)
        : 0,
      likesPerThousandViews: perThousand(reelsLikes, reelsViews),
      strongPerThousandViews: perThousand(reelsStrongInteractions, reelsViews),
    };
  });
}

function hexToRgb(color) {
  const normalized = color.replace("#", "");
  const hex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized;
  const numericValue = Number.parseInt(hex, 16);

  return {
    r: (numericValue >> 16) & 255,
    g: (numericValue >> 8) & 255,
    b: numericValue & 255,
  };
}

function withOpacity(color, opacity) {
  if (!color.startsWith("#")) {
    return color;
  }

  const { r, g, b } = hexToRgb(color);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getPartyVisualByLabel(label) {
  const normalizedLabel = label
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return (
    PARTY_VISUALS_BY_LABEL[label] ??
    PARTY_VISUALS_BY_LABEL[normalizedLabel] ??
    PARTY_VISUALS[label] ??
    PARTY_VISUALS[normalizedLabel] ??
    null
  );
}

function createVerticalGradient(chart, startColor, endColor) {
  const { ctx, chartArea } = chart;

  if (!chartArea) {
    return startColor;
  }

  const gradient = ctx.createLinearGradient(
    0,
    chartArea.bottom,
    0,
    chartArea.top,
  );
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);

  return gradient;
}

function uniqueFormatCount(profile) {
  return Object.values(profile.typeCounts).filter(Boolean).length;
}

function renderSocialNarratives(profiles) {
  const rankedByReach = [...profiles].sort(
    (left, right) => right.reelsViews - left.reelsViews,
  );
  const rankedByActivity = [...profiles].sort(
    (left, right) => right.reelsEngagementRate - left.reelsEngagementRate,
  );
  const rankedByStrongReactions = [...profiles].sort(
    (left, right) => right.strongPerThousandViews - left.strongPerThousandViews,
  );
  const totalInteractions = sumValues(
    profiles.map((profile) => profile.totalInteractions),
  );
  const totalPosts = sumValues(profiles.map((profile) => profile.totalPosts));
  const totalReels = sumValues(
    profiles.map((profile) => profile.typeCounts.reels),
  );
  const [reachLeader] = rankedByReach;
  const [activityLeader] = rankedByActivity;
  const [strongLeader] = rankedByStrongReactions;
  const mostPassive = rankedByActivity[rankedByActivity.length - 1];

  if (socialSection.profilesCount) {
    socialSection.profilesCount.textContent = formatInteger(profiles.length);
  }

  if (socialSection.postsCount) {
    socialSection.postsCount.textContent = formatInteger(totalPosts);
  }

  if (socialSection.interactionsCount) {
    socialSection.interactionsCount.textContent =
      formatCompactMetric(totalInteractions);
  }

  if (socialSection.reelsCount) {
    socialSection.reelsCount.textContent = formatInteger(totalReels);
  }
}

function renderSocialError(message) {
  if (socialSection.profilesCount) {
    socialSection.profilesCount.textContent = "--";
  }

  if (socialSection.postsCount) {
    socialSection.postsCount.textContent = "--";
  }

  if (socialSection.interactionsCount) {
    socialSection.interactionsCount.textContent = "--";
  }

  if (socialSection.reelsCount) {
    socialSection.reelsCount.textContent = "--";
  }
}

function getVisibleSocialTypes(profile) {
  return SOCIAL_TYPE_ORDER.filter((type) => profile.typeCounts[type] > 0);
}

function getSocialStackRadius(type, profile) {
  const visibleTypes = getVisibleSocialTypes(profile);
  const isBottom = visibleTypes[0] === type;
  const isTop = visibleTypes[visibleTypes.length - 1] === type;

  if (!visibleTypes.length) {
    return 0;
  }

  if (isBottom && isTop) {
    return 14;
  }

  return {
    topLeft: isTop ? 12 : 0,
    topRight: isTop ? 12 : 0,
    bottomLeft: isBottom ? 12 : 0,
    bottomRight: isBottom ? 12 : 0,
  };
}

async function loadSocialProfiles() {
  if (socialState.profiles.length) {
    return socialState.profiles;
  }

  if (socialState.loadingPromise) {
    return socialState.loadingPromise;
  }

  socialState.loadingPromise = fetch(SOCIAL_DATA_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Social data request failed: ${response.status}`);
      }

      return response.json();
    })
    .then((payload) => {
      socialState.payload = payload;
      socialState.profiles = prepareSocialProfiles(payload.profiles);
      return socialState.profiles;
    })
    .catch((error) => {
      console.warn(
        "Nepodarilo sa načítať externý JSON pre sociálne siete, používam fallback z app.js.",
        error,
      );

      socialState.payload = null;
      socialState.profiles = prepareSocialProfiles();
      return socialState.profiles;
    });

  return socialState.loadingPromise;
}

async function hydrateSocialSection() {
  try {
    const profiles = await loadSocialProfiles();
    renderSocialNarratives(profiles);
    return profiles;
  } catch (error) {
    console.error("Nepodarilo sa pripraviť dáta pre sociálne siete.", error);
    renderSocialError(
      "Nepodarilo sa načítať dáta pre sekciu Sila na sociálnych sieťach.",
    );
    return [];
  }
}

function createSocialImpactChart(canvas, profiles) {
  return new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: profiles.map((profile) => profile.shortLabel),
      datasets: [
        {
          label: "Lajky",
          data: profiles.map((profile) => profile.likesPerThousandViews),
          backgroundColor: withOpacity("#63c7ff", 0.84),
          borderColor: "#8ad8ff",
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 46,
        },
        {
          label: "Komentáre + zdieľania",
          data: profiles.map((profile) => profile.strongPerThousandViews),
          backgroundColor: withOpacity("#f3a64a", 0.86),
          borderColor: "#ffcf82",
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 46,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...basePluginConfig(),
        legend: {
          ...basePluginConfig().legend,
          display: true,
          position: "top",
          align: "center",
        },
        tooltip: {
          ...basePluginConfig().tooltip,
          callbacks: {
            label: (tooltipItem) =>
              `${tooltipItem.dataset.label}: ${formatOneDecimal(tooltipItem.parsed.y)} na 1 000 videní`,
          },
        },
      },
      scales: {
        x: {
          ...commonScale("Líder politickej strany"),
          grid: {
            display: false,
            drawBorder: false,
          },
        },
        y: {
          ...commonScale("Interakcie na 1 000 videní"),
          beginAtZero: true,
          suggestedMax:
            Math.max(
              ...profiles.map(
                (profile) =>
                  profile.likesPerThousandViews +
                  profile.strongPerThousandViews,
              ),
            ) * 1.15,
          ticks: {
            ...commonScale("").ticks,
            callback: (value) => formatInteger(Number(value)),
          },
        },
      },
    },
  });
}

function createSocialStrategyChart(canvas, profiles) {
  const tooltipProximityPlugin = createTooltipProximityPlugin();

  return new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: profiles.map((profile) => profile.shortLabel),
      datasets: [
        {
          label: "Aktívni",
          data: profiles.map((profile) => profile.reelsEngagementRate * 100),
          backgroundColor: withOpacity("#61c5ff", 0.9),
          borderColor: withOpacity("#61c5ff", 0.9),
          borderWidth: 0,
          borderRadius: {
            topLeft: 10,
            topRight: 0,
            bottomLeft: 10,
            bottomRight: 0,
          },
          borderSkipped: false,
          stack: "audience",
          maxBarThickness: 34,
          barPercentage: 0.84,
          categoryPercentage: 0.68,
        },
        {
          label: "Len pozerajúci",
          data: profiles.map((profile) => profile.reelsPassiveShare * 100),
          backgroundColor: withOpacity("#586888", 0.88),
          borderColor: withOpacity("#586888", 0.88),
          borderWidth: 0,
          borderRadius: {
            topLeft: 0,
            topRight: 10,
            bottomLeft: 0,
            bottomRight: 10,
          },
          borderSkipped: false,
          stack: "audience",
          maxBarThickness: 34,
          barPercentage: 0.84,
          categoryPercentage: 0.68,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        axis: "y",
        intersect: false,
      },
      plugins: {
        ...basePluginConfig(),
        legend: {
          ...basePluginConfig().legend,
          display: true,
          position: "top",
          align: "center",
        },
        tooltip: {
          ...basePluginConfig().tooltip,
          callbacks: {
            label: (tooltipItem) =>
              `${tooltipItem.dataset.label}: ${formatShortPercent(
                tooltipItem.parsed.x,
              )}`,
            afterBody: (tooltipItems) => {
              const profile = profiles[tooltipItems[0].dataIndex];

              return [
                `Reels videnia: ${formatCompactMetric(profile.reelsViews)}`,
                `Reels interakcie: ${formatCompactMetric(profile.reelsInteractions)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          ...commonScale("Podiel Reels publika"),
          stacked: true,
          beginAtZero: true,
          max: 100,
          grid: {
            drawBorder: false,
          },
          ticks: {
            ...commonScale("").ticks,
            callback: (value) => `${formatInteger(Number(value))} %`,
          },
        },
        y: {
          ...commonScale("Líder politickej strany"),
          stacked: true,
          grid: {
            display: false,
            drawBorder: false,
          },
        },
      },
    },
    plugins: [tooltipProximityPlugin],
  });
}

function createSocialTotalChart(canvas, profiles) {
  return new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: profiles.map((profile) => profile.shortLabel),
      datasets: [
        {
          label: "Interakcie",
          data: profiles.map((profile) => profile.totalInteractions),
          backgroundColor: (context) => {
            const profile = profiles[context.dataIndex];

            return createVerticalGradient(
              context.chart,
              withOpacity(profile.color, 0.74),
              profile.highlight,
            );
          },
          borderColor: (context) => profiles[context.dataIndex].color,
          borderWidth: 1.5,
          borderRadius: 10,
          borderSkipped: false,
          maxBarThickness: 54,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...basePluginConfig(),
        legend: {
          display: false,
        },
        tooltip: {
          ...basePluginConfig().tooltip,
          displayColors: false,
          callbacks: {
            label: (tooltipItem) =>
              `Interakcie: ${formatCompactMetric(tooltipItem.parsed.y)}`,
            afterLabel: (tooltipItem) => {
              const profile = profiles[tooltipItem.dataIndex];

              return [
                `Príspevky: ${formatInteger(profile.totalPosts)}`,
                `Priemer na príspevok: ${formatCompactMetric(profile.averageInteractions)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          ...commonScale("Líder politickej strany"),
          grid: {
            display: false,
            drawBorder: false,
          },
        },
        y: {
          ...commonScale("Súčet interakcií"),
          beginAtZero: true,
          suggestedMax:
            Math.max(...profiles.map((profile) => profile.totalInteractions)) *
            1.12,
          ticks: {
            ...commonScale("").ticks,
            callback: (value) => formatCompactMetric(Number(value)),
          },
        },
      },
    },
  });
}

function createSocialFormatsChart(canvas, profiles) {
  const tooltipProximityPlugin = createTooltipProximityPlugin();

  return new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: profiles.map((profile) => profile.shortLabel),
      datasets: SOCIAL_TYPE_ORDER.map((type) => ({
        label: SOCIAL_TYPE_LABELS[type],
        data: profiles.map((profile) => profile.typeCounts[type]),
        backgroundColor: withOpacity(SOCIAL_TYPE_COLORS[type], 0.84),
        borderColor: SOCIAL_TYPE_COLORS[type],
        borderWidth: 1.4,
        borderRadius: (context) =>
          getSocialStackRadius(type, profiles[context.dataIndex]),
        borderSkipped: false,
        stack: "formats",
        maxBarThickness: 56,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        ...basePluginConfig(),
        legend: {
          ...basePluginConfig().legend,
          display: true,
          position: "top",
          align: "center",
        },
        tooltip: {
          ...basePluginConfig().tooltip,
          callbacks: {
            label: (tooltipItem) =>
              `${tooltipItem.dataset.label}: ${formatInteger(tooltipItem.parsed.y)} príspevkov`,
            afterBody: (tooltipItems) => {
              const profile = profiles[tooltipItems[0].dataIndex];

              return `Spolu: ${formatInteger(profile.totalPosts)} príspevkov`;
            },
          },
        },
      },
      scales: {
        x: {
          ...commonScale("Líder politickej strany"),
          stacked: true,
          grid: {
            display: false,
            drawBorder: false,
          },
        },
        y: {
          ...commonScale("Počet príspevkov"),
          stacked: true,
          beginAtZero: true,
          suggestedMax:
            Math.max(...profiles.map((profile) => profile.totalPosts)) + 2,
          ticks: {
            ...commonScale("").ticks,
            precision: 0,
            callback: (value) => formatInteger(Number(value)),
          },
        },
      },
    },
    plugins: [tooltipProximityPlugin],
  });
}

function resizeChart(chart) {
  if (!chart) {
    return;
  }

  chart.resize();
  chart.update("none");
}

function getActivityCharts() {
  return [
    activityState.topActiveChart,
    activityState.topInactiveChart,
    activityState.partyChart,
    activityState.speechesChart,
    activityState.lawsChart,
  ].filter(Boolean);
}

function destroyActivityCharts() {
  getActivityCharts().forEach((chart) => chart.destroy());
  activityState.topActiveChart = null;
  activityState.topInactiveChart = null;
  activityState.partyChart = null;
  activityState.speechesChart = null;
  activityState.lawsChart = null;
}

function calculateActivityScore(member) {
  return (
    member.navrhy_zakonov +
    member.pozmenujuce_navrhy +
    member.vystupenia_v_rozprave
  );
}

function deriveActivityPayload(entries) {
  const activeMembers = entries
    .filter((member) => member.aktivny_mandat)
    .map((member) => ({
      ...member,
      score: calculateActivityScore(member),
      shortName: compactPersonName(member.meno),
    }));

  const topActive = [...activeMembers]
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.navrhy_zakonov - left.navrhy_zakonov ||
        right.vystupenia_v_rozprave - left.vystupenia_v_rozprave ||
        left.meno.localeCompare(right.meno, "sk"),
    )
    .slice(0, 10);

  const topInactive = [...activeMembers]
    .sort(
      (left, right) =>
        left.score - right.score ||
        left.navrhy_zakonov - right.navrhy_zakonov ||
        left.meno.localeCompare(right.meno, "sk"),
    )
    .slice(0, 10);

  const partyMap = activeMembers.reduce((map, member) => {
    const currentValue = map.get(member.strana) ?? {
      party: member.strana,
      score: 0,
      count: 0,
    };

    currentValue.score += member.score;
    currentValue.count += 1;
    map.set(member.strana, currentValue);

    return map;
  }, new Map());

  const partyRanking = [...partyMap.values()]
    .map((item) => ({
      ...item,
      averageScore: item.count ? item.score / item.count : 0,
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.count - left.count ||
        left.party.localeCompare(right.party, "sk"),
    );

  const topSpeeches = [...activeMembers]
    .sort(
      (left, right) =>
        right.vystupenia_v_rozprave - left.vystupenia_v_rozprave ||
        right.score - left.score ||
        left.meno.localeCompare(right.meno, "sk"),
    )
    .slice(0, 5);

  const topLaws = [...activeMembers]
    .sort(
      (left, right) =>
        right.navrhy_zakonov - left.navrhy_zakonov ||
        right.score - left.score ||
        left.meno.localeCompare(right.meno, "sk"),
    )
    .slice(0, 5);

  return {
    activeCount: activeMembers.length,
    partyCount: partyRanking.length,
    topActive,
    topInactive,
    partyRanking,
    topSpeeches,
    topLaws,
  };
}

async function loadActivityPayload() {
  if (activityState.payload) {
    return activityState.payload;
  }

  if (activityState.loadingPromise) {
    return activityState.loadingPromise;
  }

  activityState.loadingPromise = fetch(ACTIVITY_DATA_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Aktivita data request failed: ${response.status}`);
      }

      return response.json();
    })
    .then((payload) => {
      const derivedPayload = deriveActivityPayload(payload);
      activityState.payload = derivedPayload;
      return derivedPayload;
    })
    .finally(() => {
      activityState.loadingPromise = null;
    });

  return activityState.loadingPromise;
}

function createActivityRankingChart(canvas, config) {
  const values = config.items.map((item) => config.getValue(item));
  const maxValue = Math.max(...values, 0);
  const allIntegerValues = values.every(Number.isInteger);
  const useUnitTicks = allIntegerValues && maxValue <= 12;
  const formatValue = config.formatValue ?? ((value) => formatAxisTick(value));
  const tickFormatter =
    config.tickFormatter ?? ((value) => formatAxisTick(value));
  const labels = config.items.map((item) =>
    wrapLabel(config.getAxisLabel(item), config.maxLineLength ?? 16),
  );
  const axisLabelTooltipPlugin = {
    id: "axisLabelTooltip",
    afterEvent(chart, args) {
      if (!config.enableAxisLabelTooltip) {
        return;
      }

      if (args.event.type === "mouseout") {
        clearAxisLabelTooltip(chart);
        return;
      }

      if (chart.getActiveElements().length) {
        chart.$axisLabelTooltipActive = false;
        chart.$axisLabelTooltipIndex = -1;
        return;
      }

      const hoveredIndex = getAxisLabelHoverIndex(chart, args.event);

      if (hoveredIndex == null) {
        clearAxisLabelTooltip(chart);
        return;
      }

      if (chart.$axisLabelTooltipIndex === hoveredIndex) {
        return;
      }

      const barElement = chart.getDatasetMeta(0).data[hoveredIndex];

      if (!barElement) {
        return;
      }

      chart.tooltip.setActiveElements(
        [{ datasetIndex: 0, index: hoveredIndex }],
        { x: barElement.x, y: barElement.y },
      );
      chart.$axisLabelTooltipActive = true;
      chart.$axisLabelTooltipIndex = hoveredIndex;
      chart.update("none");
    },
  };

  return new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: config.datasetLabel,
          data: values,
          backgroundColor: config.getBackgroundColor
            ? config.items.map((item) => config.getBackgroundColor(item))
            : (context) =>
                createVerticalGradient(
                  context.chart,
                  config.colors.start,
                  config.colors.end,
                ),
          borderColor: config.getBorderColor
            ? config.items.map((item) => config.getBorderColor(item))
            : config.colors.border,
          borderWidth: 1.2,
          borderRadius: 14,
          borderSkipped: false,
          maxBarThickness: config.maxBarThickness ?? 26,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"],
      plugins: {
        ...basePluginConfig(),
        legend: {
          display: false,
        },
        tooltip: {
          ...basePluginConfig().tooltip,
          callbacks: {
            title: (tooltipItems) => {
              const item = config.items[tooltipItems[0].dataIndex];
              return config.getTitle(item);
            },
            label: (tooltipItem) =>
              `${config.datasetLabel}: ${formatValue(tooltipItem.parsed.x)}`,
            afterLabel: (tooltipItem) => {
              if (!config.getAfterLabel) {
                return [];
              }

              return config.getAfterLabel(config.items[tooltipItem.dataIndex]);
            },
          },
        },
      },
      scales: {
        x: {
          ...commonScale(config.xAxisTitle),
          beginAtZero: true,
          grace: useUnitTicks ? 0 : "10%",
          suggestedMax: useUnitTicks ? maxValue : undefined,
          ticks: {
            ...commonScale("").ticks,
            precision: allIntegerValues ? 0 : undefined,
            stepSize: useUnitTicks ? 1 : undefined,
            callback: (value) => tickFormatter(value),
          },
        },
        y: {
          ...commonScale(""),
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            ...commonScale("").ticks,
            autoSkip: false,
          },
        },
      },
    },
    plugins: [axisLabelTooltipPlugin, ...(config.plugins || [])],
  });
}

async function initActivityCharts() {
  const topActiveCanvas = document.getElementById("chartActivityTopActive");
  const topInactiveCanvas = document.getElementById("chartActivityTopInactive");
  const partiesCanvas = document.getElementById("chartActivityParties");
  const speechesCanvas = document.getElementById("chartActivitySpeeches");
  const lawsCanvas = document.getElementById("chartActivityLaws");

  if (
    !topActiveCanvas ||
    !topInactiveCanvas ||
    !partiesCanvas ||
    !speechesCanvas ||
    !lawsCanvas
  ) {
    return;
  }

  try {
    const payload = await loadActivityPayload();

    destroyActivityCharts();

    activityState.topActiveChart = createActivityRankingChart(topActiveCanvas, {
      items: payload.topActive,
      datasetLabel: "Skóre aktivity",
      xAxisTitle: "Celkové skóre aktivity",
      colors: {
        start: withOpacity(COLORS.accentStrong, 0.92),
        end: withOpacity(COLORS.accent, 0.72),
        border: COLORS.accentStrong,
      },
      getBackgroundColor: (item) =>
        withOpacity(
          getPartyVisualByLabel(item.strana)?.accent ?? COLORS.accent,
          0.84,
        ),
      getBorderColor: (item) =>
        withOpacity(
          getPartyVisualByLabel(item.strana)?.accentStrong ??
            COLORS.accentStrong,
          0.95,
        ),
      getAxisLabel: (item) => item.shortName,
      getTitle: (item) => [item.meno, `Strana: ${item.strana}`],
      getValue: (item) => item.score,
      enableAxisLabelTooltip: true,
      formatValue: (value) => formatInteger(value),
      tickFormatter: (value) => formatInteger(value),
      getAfterLabel: (item) => [
        `Návrhy zákonov: ${formatInteger(item.navrhy_zakonov)}`,
        `Pozmeňujúce návrhy: ${formatInteger(item.pozmenujuce_navrhy)}`,
        `Rozpravy: ${formatInteger(item.vystupenia_v_rozprave)}`,
      ],
    });

    activityState.topInactiveChart = createActivityRankingChart(
      topInactiveCanvas,
      {
        items: payload.topInactive,
        datasetLabel: "Skóre aktivity",
        xAxisTitle: "Celkové skóre aktivity",
        colors: {
          start: withOpacity(COLORS.mutedStrong, 0.9),
          end: withOpacity(COLORS.muted, 0.72),
          border: COLORS.mutedStrong,
        },
        getBackgroundColor: (item) =>
          withOpacity(
            getPartyVisualByLabel(item.strana)?.accent ?? COLORS.mutedStrong,
            0.84,
          ),
        getBorderColor: (item) =>
          withOpacity(
            getPartyVisualByLabel(item.strana)?.accentStrong ??
              COLORS.mutedStrong,
            0.95,
          ),
        getAxisLabel: (item) => item.shortName,
        getTitle: (item) =>
          item.meno.includes("Monika Kolejáková")
            ? [
                item.meno,
                "V parlamente menej ako 2 mesiace",
                `Strana: ${item.strana}`,
              ]
            : [item.meno, `Strana: ${item.strana}`],
        getValue: (item) => item.score,
        enableAxisLabelTooltip: true,
        formatValue: (value) => formatInteger(value),
        tickFormatter: (value) => formatInteger(value),
        getAfterLabel: (item) => [
          `Návrhy zákonov: ${formatInteger(item.navrhy_zakonov)}`,
          `Pozmeňujúce návrhy: ${formatInteger(item.pozmenujuce_navrhy)}`,
          `Rozpravy: ${formatInteger(item.vystupenia_v_rozprave)}`,
        ],
        plugins: [
          {
            id: "kolejakovaInlineLabel",
            afterDatasetsDraw(chart) {
              const ctx = chart.ctx;
              const meta = chart.getDatasetMeta(0);
              const dataPoints = payload.topInactive;

              meta.data.forEach((bar, index) => {
                const item = dataPoints[index];
                if (item && item.meno.includes("Monika Kolejáková")) {
                  ctx.save();
                  ctx.font = "italic 12px Manrope, system-ui, sans-serif";
                  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
                  ctx.textAlign = "left";
                  ctx.textBaseline = "middle";
                  ctx.fillText(
                    "* vykonáva mandát až od 3. 2. 2026, teda v parlamente je menej ako 2 mesiace.",
                    bar.x + 10,
                    bar.y,
                  );
                  ctx.restore();
                }
              });
            },
          },
        ],
      },
    );

    activityState.partyChart = createActivityRankingChart(partiesCanvas, {
      items: payload.partyRanking,
      datasetLabel: "Súčet aktivity",
      xAxisTitle: "Súčet skóre aktivity",
      colors: {
        start: withOpacity("#ffb37f", 0.94),
        end: withOpacity("#d5474d", 0.74),
        border: "#ffd2ad",
      },
      getBackgroundColor: (item) =>
        withOpacity(
          getPartyVisualByLabel(item.party)?.accent ?? COLORS.accent,
          0.84,
        ),
      getBorderColor: (item) =>
        withOpacity(
          getPartyVisualByLabel(item.party)?.accentStrong ??
            COLORS.accentStrong,
          0.95,
        ),
      getAxisLabel: (item) => item.party,
      getTitle: (item) => item.party,
      getValue: (item) => item.score,
      formatValue: (value) => formatInteger(value),
      tickFormatter: (value) => formatInteger(value),
      maxLineLength: 14,
      getAfterLabel: (item) => [
        `Aktívne mandáty: ${formatInteger(item.count)}`,
        `Priemer na mandát: ${formatOneDecimal(item.averageScore)}`,
      ],
    });

    activityState.speechesChart = createActivityRankingChart(speechesCanvas, {
      items: payload.topSpeeches,
      datasetLabel: "Počet rozpráv",
      xAxisTitle: "Počet vystúpení v rozprave",
      colors: {
        start: withOpacity(COLORS.electric, 0.92),
        end: withOpacity(COLORS.softBlue, 0.74),
        border: COLORS.electric,
      },
      getBackgroundColor: (item) =>
        withOpacity(
          getPartyVisualByLabel(item.strana)?.accent ?? COLORS.electric,
          0.84,
        ),
      getBorderColor: (item) =>
        withOpacity(
          getPartyVisualByLabel(item.strana)?.accentStrong ?? COLORS.electric,
          0.95,
        ),
      getAxisLabel: (item) => item.shortName,
      getTitle: (item) => [item.meno, `Strana: ${item.strana}`],
      getValue: (item) => item.vystupenia_v_rozprave,
      enableAxisLabelTooltip: true,
      formatValue: (value) => formatInteger(value),
      tickFormatter: (value) => formatInteger(value),
      getAfterLabel: (item) => [
        `Celkové skóre: ${formatInteger(item.score)}`,
        `Návrhy zákonov: ${formatInteger(item.navrhy_zakonov)}`,
        `Pozmeňujúce návrhy: ${formatInteger(item.pozmenujuce_navrhy)}`,
      ],
    });

    activityState.lawsChart = createActivityRankingChart(lawsCanvas, {
      items: payload.topLaws,
      datasetLabel: "Počet návrhov zákonov",
      xAxisTitle: "Počet návrhov zákonov",
      colors: {
        start: withOpacity("#408080", 0.94),
        end: withOpacity("#2a5959", 0.74),
        border: "#408080",
      },
      getBackgroundColor: (item) =>
        withOpacity(
          getPartyVisualByLabel(item.strana)?.accent ?? "#408080",
          0.84,
        ),
      getBorderColor: (item) =>
        withOpacity(
          getPartyVisualByLabel(item.strana)?.accentStrong ?? "#408080",
          0.95,
        ),
      getAxisLabel: (item) => item.shortName,
      getTitle: (item) => [item.meno, `Strana: ${item.strana}`],
      getValue: (item) => item.navrhy_zakonov,
      enableAxisLabelTooltip: true,
      formatValue: (value) => formatInteger(value),
      tickFormatter: (value) => formatInteger(value),
      getAfterLabel: (item) => [
        `Celkové skóre: ${formatInteger(item.score)}`,
        `Pozmeňujúce návrhy: ${formatInteger(item.pozmenujuce_navrhy)}`,
        `Rozpravy: ${formatInteger(item.vystupenia_v_rozprave)}`,
      ],
    });
  } catch (error) {
    console.error("Nepodarilo sa načítať dáta o aktivite poslancov.", error);
  }
}

function syncPanelCharts(targetId) {
  if (targetId === "panel-socialne") {
    requestAnimationFrame(() => {
      if (
        !socialState.impactChart ||
        !socialState.strategyChart ||
        !socialState.totalChart ||
        !socialState.formatsChart
      ) {
        void initSocialChart();
        return;
      }

      resizeChart(socialState.impactChart);
      resizeChart(socialState.strategyChart);
      resizeChart(socialState.totalChart);
      resizeChart(socialState.formatsChart);
    });
  }

  if (targetId === "panel-aktivita") {
    requestAnimationFrame(() => {
      if (
        !activityState.topActiveChart ||
        !activityState.topInactiveChart ||
        !activityState.partyChart ||
        !activityState.speechesChart ||
        !activityState.lawsChart
      ) {
        void initActivityCharts();
        return;
      }

      getActivityCharts().forEach((chart) => resizeChart(chart));
    });
  }
}

function renderPartySwitcher() {
  const container = electionSection.partySwitcher;

  if (!container) {
    return;
  }

  container.textContent = "";

  electionState.partyOptions.forEach((party) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "party-switcher__btn";
    button.dataset.party = party.key;
    button.setAttribute(
      "aria-label",
      `Zobraziť korelačný graf pre stranu ${party.label}`,
    );
    button.setAttribute(
      "aria-pressed",
      String(party.key === electionState.selectedPartyKey),
    );
    button.style.setProperty("--party-accent", party.accent);
    button.style.setProperty("--party-accent-strong", party.accentStrong);
    button.style.setProperty(
      "--party-accent-soft",
      withOpacity(party.accent, 0.2),
    );
    button.style.setProperty(
      "--party-accent-border",
      withOpacity(party.accent, 0.44),
    );
    button.style.setProperty("--party-shadow", withOpacity(party.accent, 0.32));

    const logoShell = createPartyLogoShell(
      party,
      "party-switcher__logo-shell",
      "party-switcher__logo",
    );
    const label = document.createElement("span");
    label.className = "party-switcher__label";
    label.textContent = party.buttonLabel;

    button.append(logoShell, label);

    if (party.key === electionState.selectedPartyKey) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      if (party.key === electionState.selectedPartyKey) {
        return;
      }

      electionState.selectedPartyKey = party.key;
      renderPartySwitcher();

      try {
        updateElectionChart();
      } catch (error) {
        console.error(error);
        renderElectionError(
          "Nepodarilo sa prekresliť graf pre zvolenú stranu.",
        );
      }
    });

    container.append(button);
  });
}

function isDistrictSearchOpen() {
  return Boolean(
    electionSection.districtSearchPanel &&
    !electionSection.districtSearchPanel.hidden,
  );
}

function applyElectionTheme(party) {
  const accentSoft = withOpacity(party.accent, 0.16);
  const accentGlow = withOpacity(party.accentStrong, 0.24);
  const accentLine = withOpacity(party.accentStrong, 0.22);

  if (electionSection.card) {
    electionSection.card.style.setProperty("--party-accent-soft", accentSoft);
    electionSection.card.style.setProperty("--party-accent-glow", accentGlow);
  }

  if (electionSection.chartFrame) {
    electionSection.chartFrame.style.setProperty(
      "--party-accent-soft",
      accentSoft,
    );
    electionSection.chartFrame.style.setProperty(
      "--party-accent-line",
      accentLine,
    );
  }
}

function syncDistrictSearchSummary() {
  const { districtSearchValue, districtSearchHint } = electionSection;
  const party = getPartyDefinition(electionState.selectedPartyKey);
  const district = getDistrictRow(electionState.selectedDistrictLabel);

  if (!districtSearchValue || !districtSearchHint) {
    return;
  }

  if (!district || !party) {
    districtSearchValue.textContent = "Vyber okres";
    districtSearchHint.textContent = "Klikni a začni písať názov okresu";
    return;
  }

  districtSearchValue.textContent = district.okres;
  districtSearchHint.textContent = `Nezamestnanosť ${formatPercent(district.nezam_pct)} • ${party.buttonLabel} ${formatPercent(district[party.key])}`;
}

function clearElectionChartSelection() {
  if (!electionState.chart) {
    return;
  }

  electionState.chart.setActiveElements([]);
  electionState.chart.tooltip.setActiveElements([], { x: 0, y: 0 });
  electionState.chart.update("none");
}

function focusDistrictInChart(label) {
  if (!label || !electionState.chart) {
    clearElectionChartSelection();
    return;
  }

  if (applyPinnedDistrictSelection(electionState.chart, label)) {
    electionState.chart.update("none");
  }
}

function applyPinnedDistrictSelection(chart, label) {
  if (!label || !chart) {
    return false;
  }

  const dataset = chart.data.datasets[0]?.data ?? [];
  const pointIndex = dataset.findIndex((point) => point.label === label);

  if (pointIndex === -1) {
    return false;
  }

  const pointElement = chart.getDatasetMeta(0).data[pointIndex];

  if (!pointElement) {
    return false;
  }

  const activeElements = [{ datasetIndex: 0, index: pointIndex }];
  chart.setActiveElements(activeElements);
  chart.tooltip.setActiveElements(activeElements, {
    x: pointElement.x,
    y: pointElement.y,
  });

  return true;
}

function handleElectionChartClick(event) {
  if (!electionState.chart) {
    return;
  }

  const hitElements = electionState.chart.getElementsAtEventForMode(
    event,
    "nearest",
    {
      intersect: true,
      axis: "xy",
    },
    false,
  );
  const pointHit = hitElements.find((item) => item.datasetIndex === 0);

  if (!pointHit) {
    selectDistrict("");
    return;
  }

  const point =
    electionState.chart.data.datasets[pointHit.datasetIndex]?.data?.[
      pointHit.index
    ];

  selectDistrict(point?.label ?? "");
}

function setDistrictSearchOpen(isOpen) {
  const {
    districtSearch,
    districtSearchToggle,
    districtSearchPanel,
    districtSearchInput,
  } = electionSection;

  if (!districtSearch || !districtSearchToggle || !districtSearchPanel) {
    return;
  }

  districtSearch.classList.toggle("open", isOpen);
  districtSearchToggle.setAttribute("aria-expanded", String(isOpen));
  districtSearchPanel.hidden = !isOpen;

  if (isOpen) {
    renderDistrictSearchResults();
    requestAnimationFrame(() => {
      districtSearchInput?.focus();
      districtSearchInput?.select();
    });
    return;
  }

  electionState.districtQuery = "";

  if (districtSearchInput) {
    districtSearchInput.value = "";
  }
}

function selectDistrict(label) {
  electionState.selectedDistrictLabel = label;
  syncDistrictSearchSummary();
  setDistrictSearchOpen(false);

  if (!label) {
    clearElectionChartSelection();
    return;
  }

  focusDistrictInChart(label);
}

function renderDistrictSearchResults() {
  const container = electionSection.districtSearchResults;
  const party = getPartyDefinition(electionState.selectedPartyKey);
  const query = normalizeSearchText(electionState.districtQuery);

  if (!container || !party) {
    return;
  }

  container.textContent = "";

  const fragment = document.createDocumentFragment();
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className =
    "district-search__option district-search__option--clear";
  clearButton.setAttribute("role", "option");
  clearButton.setAttribute(
    "aria-selected",
    String(!electionState.selectedDistrictLabel),
  );

  if (!electionState.selectedDistrictLabel) {
    clearButton.classList.add("active");
  }

  const clearTitle = document.createElement("strong");
  clearTitle.className = "district-search__option-name";
  clearTitle.textContent = "Všetky okresy";

  const clearMeta = document.createElement("span");
  clearMeta.className = "district-search__option-meta";
  clearMeta.textContent =
    "Zruš zvýraznenie a nechaj tooltip reagovať iba na hover.";

  clearButton.append(clearTitle, clearMeta);
  clearButton.addEventListener("click", () => {
    selectDistrict("");
  });
  fragment.append(clearButton);

  const filteredRows = getSortedDistrictRows().filter(
    (row) => !query || normalizeSearchText(row.okres).includes(query),
  );

  if (!filteredRows.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "district-search__empty";
    emptyState.textContent = "Tomuto filtru nezodpovedá žiadny okres.";
    fragment.append(emptyState);
    container.append(fragment);
    return;
  }

  filteredRows.forEach((row) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "district-search__option";
    option.setAttribute("role", "option");
    option.setAttribute(
      "aria-selected",
      String(row.okres === electionState.selectedDistrictLabel),
    );

    if (row.okres === electionState.selectedDistrictLabel) {
      option.classList.add("active");
    }

    const name = document.createElement("strong");
    name.className = "district-search__option-name";
    name.textContent = row.okres;

    const meta = document.createElement("span");
    meta.className = "district-search__option-meta";
    meta.textContent = `Nezamestnanosť ${formatPercent(row.nezam_pct)} • ${party.buttonLabel} ${formatPercent(row[party.key])}`;

    option.append(name, meta);
    option.addEventListener("click", () => {
      selectDistrict(row.okres);
    });

    fragment.append(option);
  });

  container.append(fragment);
}

function initDistrictSearch() {
  const { districtSearch, districtSearchToggle, districtSearchInput } =
    electionSection;

  if (
    electionState.districtSearchReady ||
    !districtSearch ||
    !districtSearchToggle ||
    !districtSearchInput
  ) {
    return;
  }

  districtSearchToggle.addEventListener("click", () => {
    setDistrictSearchOpen(!isDistrictSearchOpen());
  });

  districtSearchInput.addEventListener("input", (event) => {
    electionState.districtQuery = event.currentTarget.value;
    renderDistrictSearchResults();
  });

  districtSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setDistrictSearchOpen(false);
      districtSearchToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!districtSearch.contains(event.target)) {
      setDistrictSearchOpen(false);
    }
  });

  electionState.districtSearchReady = true;
  syncDistrictSearchSummary();
}

const pinnedDistrictSelectionPlugin = {
  id: "pinnedDistrictSelection",
  afterEvent(chart, args) {
    if (chart !== electionState.chart || !electionState.selectedDistrictLabel) {
      return;
    }

    if (
      applyPinnedDistrictSelection(chart, electionState.selectedDistrictLabel)
    ) {
      args.changed = true;
    }
  },
};

function renderElectionSummary({
  party,
  pointCount,
  correlation,
  regression,
  meta,
}) {
  const assessment = describeCorrelation(correlation);
  const trendLabel = describeTrend(regression.slope);
  const monthLabel = formatMonth(meta.unemployment_month);
  const absoluteSlope = Math.abs(regression.slope);
  const slopeDirection = regression.slope >= 0 ? "rastie" : "klesá";

  const assessmentAccusative = assessment
    .replace("nízka", "nízku")
    .replace("stredná", "strednú")
    .replace("vysoká", "vysokú")
    .replace("pozitívna", "pozitívnu")
    .replace("negatívna", "negatívnu");

  electionSection.correlationValue.textContent = `r = ${formatNumber(correlation)}`;
  electionSection.correlationText.textContent = `Pearsonov korelačný koeficient pre ${party.label} vypočítaný z ${pointCount} okresov.`;
  electionSection.trendValue.textContent = trendLabel;
  electionSection.trendText.textContent = `Sklon trendovej čiary je ${regression.slope >= 0 ? "+" : "-"}${formatNumber(absoluteSlope)} p. b.; pri raste nezamestnanosti o 1 p. b. ${slopeDirection} odhadovaný zisk ${party.label} približne o ${formatNumber(absoluteSlope)} p. b.`;
  electionSection.assessmentValue.textContent = capitalize(assessment);
  electionSection.assessmentText.textContent = `${party.label} a nezamestnanosť majú v okresoch Slovenska ${assessmentAccusative} koreláciu.`;
  electionSection.footnote.textContent = `Zdroj: ${meta.sources.volby}; ${meta.sources.nezamestnanost}.`;
}

function renderElectionError(message) {
  electionSection.description.textContent = message;
  electionSection.note.textContent =
    "Skontroluj, či je JSON súbor dostupný a stránka beží cez lokálny server.";
  electionSection.partySwitcher.textContent = "";
  electionState.selectedDistrictLabel = "";
  syncDistrictSearchSummary();
  setDistrictSearchOpen(false);

  if (electionSection.districtSearchResults) {
    electionSection.districtSearchResults.textContent = "";
  }

  electionSection.correlationValue.textContent = "r = --";
  electionSection.correlationText.textContent =
    "Výpočet sa nepodarilo dokončiť.";
  electionSection.trendValue.textContent = "--";
  electionSection.trendText.textContent =
    "Trendovú čiaru sa nepodarilo zostaviť.";
  electionSection.assessmentValue.textContent = "--";
  electionSection.assessmentText.textContent =
    "Zhodnotenie bude dostupné po načítaní dát.";
  electionSection.footnote.textContent = `Dáta sa nepodarilo načítať zo súboru ${ELECTION_DATA_URL}.`;
}

function updateElectionChart() {
  const party = getPartyDefinition(electionState.selectedPartyKey);

  if (!party) {
    return;
  }

  const scatterData = getScatterData(party.key);

  if (!scatterData.length) {
    throw new Error("Pre zvolenú stranu sa nenašli žiadne dáta.");
  }

  const correlation = pearsonCorrelation(scatterData);
  const regression = linearRegression(scatterData);
  const trendLine = regressionLine(scatterData, regression);
  const xBounds = nicePercentAxis(
    scatterData.map((point) => point.x),
    {
      floor: 0,
      step: 1,
      minimumMax: 1,
    },
  );
  const yBounds = nicePercentAxis(
    [
      ...scatterData.map((point) => point.y),
      ...trendLine.map((point) => point.y),
    ],
    {
      floor: 0,
      step: 5,
      minimumMax: 5,
    },
  );
  const axisLabel = `Podiel hlasov ${party.label} (%) — NRSR ${electionState.payload.meta.election_year}`;

  renderElectionSummary({
    party,
    pointCount: scatterData.length,
    correlation,
    regression,
    meta: electionState.payload.meta,
  });
  applyElectionTheme(party);
  syncDistrictSearchSummary();

  if (isDistrictSearchOpen()) {
    renderDistrictSearchResults();
  }

  if (electionState.chart) {
    // Update existing chart instance to trigger animations
    electionState.chart.data.datasets[0].label = `${party.label} – ${ELECTION_SCOPE_LABEL}`;
    electionState.chart.data.datasets[0].data = scatterData;
    electionState.chart.data.datasets[0].backgroundColor = withOpacity(
      party.accent,
      0.74,
    );
    electionState.chart.data.datasets[0].borderColor = party.accentStrong;
    electionState.chart.data.datasets[0].pointHoverBackgroundColor =
      party.accentStrong;

    electionState.chart.data.datasets[1].data = trendLine;
    electionState.chart.data.datasets[1].borderColor = party.trendColor;

    electionState.chart.options.scales.x.title.text = `Nezamestnanosť (${formatMonth(electionState.payload.meta.unemployment_month)})`;
    electionState.chart.options.scales.x.min = xBounds.min;
    electionState.chart.options.scales.x.max = xBounds.max;

    electionState.chart.options.scales.y.title.text = axisLabel;
    electionState.chart.options.scales.y.min = yBounds.min;
    electionState.chart.options.scales.y.max = yBounds.max;

    electionState.chart.update();
  } else {
    electionState.chart = new Chart(electionState.context, {
      type: "scatter",
      plugins: [pinnedDistrictSelectionPlugin],
      data: {
        datasets: [
          {
            label: `${party.label} – ${ELECTION_SCOPE_LABEL}`,
            data: scatterData,
            backgroundColor: withOpacity(party.accent, 0.74),
            borderColor: party.accentStrong,
            borderWidth: 1.5,
            pointRadius: (context) =>
              context.raw?.label === electionState.selectedDistrictLabel
                ? 7
                : 5,
            pointBorderWidth: (context) =>
              context.raw?.label === electionState.selectedDistrictLabel
                ? 2.4
                : 1.5,
            pointBorderColor: withOpacity(COLORS.paper, 0.88),
            pointHoverRadius: (context) =>
              context.raw?.label === electionState.selectedDistrictLabel
                ? 10
                : 8,
            pointHitRadius: 18,
            pointHoverBackgroundColor: party.accentStrong,
            pointHoverBorderColor: COLORS.paper,
            pointHoverBorderWidth: 2,
          },
          {
            type: "line",
            label: "Trendová čiara",
            data: trendLine,
            borderColor: party.trendColor,
            borderWidth: 2.5,
            borderDash: [8, 6],
            borderCapStyle: "round",
            borderJoinStyle: "round",
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 24,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: "easeOutQuart",
        },
        interaction: {
          mode: "nearest",
          axis: "xy",
          intersect: true,
          includeInvisible: true,
        },
        plugins: {
          ...basePluginConfig(),
          tooltip: {
            ...basePluginConfig().tooltip,
            displayColors: false,
            padding: 14,
            caretPadding: 10,
            cornerRadius: 16,
            callbacks: {
              title: (items) => {
                const [item] = items;

                if (!item) {
                  return "";
                }

                return item.dataset.type === "line"
                  ? "Trendová čiara"
                  : (item.raw?.label ?? "Okres");
              },
              label: (item) => {
                if (item.dataset.type === "line") {
                  return [
                    `Nezamestnanosť: ${formatPercent(item.parsed.x)}`,
                    `Odhad ${party.label}: ${formatPercent(item.parsed.y)}`,
                  ];
                }

                return [
                  `Nezamestnanosť: ${formatPercent(item.parsed.x)}`,
                  `${party.label}: ${formatPercent(item.parsed.y)}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            ...commonScale("Miera nezamestnanosti (%) — september 2023"),
            min: xBounds.min,
            max: xBounds.max,
            ticks: {
              ...commonScale("").ticks,
              callback: (value) => `${formatNumber(value)} %`,
            },
          },
          y: {
            ...commonScale(axisLabel),
            min: yBounds.min,
            max: yBounds.max,
            ticks: {
              ...commonScale("").ticks,
              stepSize: 5,
              callback: (value) => `${formatNumber(value)} %`,
            },
          },
        },
      },
    });
  }

  if (electionState.selectedDistrictLabel) {
    focusDistrictInChart(electionState.selectedDistrictLabel);
  }
}

async function initElectionChart() {
  const canvas = document.getElementById("chartVolby");

  if (!canvas) {
    return;
  }

  try {
    const response = await fetch(ELECTION_DATA_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    electionState.payload = await response.json();
    electionState.context = canvas.getContext("2d");
    electionState.partyOptions = buildPartyOptions(electionState.payload.meta);
    electionState.selectedPartyKey = electionState.partyOptions.some(
      (party) => party.key === DEFAULT_PARTY_KEY,
    )
      ? DEFAULT_PARTY_KEY
      : electionState.partyOptions[0]?.key;

    initDistrictSearch();
    renderPartySwitcher();
    renderDistrictSearchResults();
    updateElectionChart();

    canvas.addEventListener("mouseleave", () => {
      if (electionState.selectedDistrictLabel) {
        focusDistrictInChart(electionState.selectedDistrictLabel);
      }
    });
    canvas.addEventListener("click", handleElectionChartClick);
  } catch (error) {
    console.error(error);
    renderElectionError(
      "Nepodarilo sa načítať dáta pre korelačný graf všetkých okresov SR.",
    );
  }
}

async function initSocialChart() {
  const impactCanvas = document.getElementById("chartSocialImpact");
  const strategyCanvas = document.getElementById("chartSocialStrategy");
  const totalCanvas = document.getElementById("chartSocialTotal");
  const formatsCanvas = document.getElementById("chartSocialFormats");

  if (!impactCanvas || !strategyCanvas || !totalCanvas || !formatsCanvas) {
    return;
  }

  const profiles = await hydrateSocialSection();

  if (!profiles.length) {
    return;
  }

  if (socialState.impactChart) {
    socialState.impactChart.destroy();
  }

  if (socialState.strategyChart) {
    socialState.strategyChart.destroy();
  }

  if (socialState.totalChart) {
    socialState.totalChart.destroy();
  }

  if (socialState.formatsChart) {
    socialState.formatsChart.destroy();
  }

  socialState.impactChart = createSocialImpactChart(impactCanvas, profiles);
  socialState.strategyChart = createSocialStrategyChart(
    strategyCanvas,
    profiles,
  );
  socialState.totalChart = createSocialTotalChart(totalCanvas, profiles);
  socialState.formatsChart = createSocialFormatsChart(formatsCanvas, profiles);
}

void hydrateSocialSection();
syncMobileGate();
resetScrollPosition();
setActivePanel("panel-volby");
void initElectionChart();
