'use strict';

const tabButtons = document.querySelectorAll('.tab-btn');
const tabSections = document.querySelectorAll('.tab-section');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.target;

    tabButtons.forEach(item => item.classList.remove('active'));
    button.classList.add('active');

    tabSections.forEach(section => {
      section.classList.toggle('active', section.id === targetId);
    });
  });
});

document.querySelectorAll('.btn-report').forEach(button => {
  button.addEventListener('click', () => {
    const sectionName = button.dataset.section;
    alert(`Report pre sekciu „${sectionName}“ bude čoskoro dostupný.`);
  });
});

Chart.defaults.font.family = "'Manrope', 'Segoe UI', sans-serif";
Chart.defaults.color = '#d7e2ff';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';

const COLORS = {
  accent: '#3e8cff',
  accentStrong: '#1f6cff',
  accentSoft: 'rgba(62, 140, 255, 0.2)',
  electric: '#71b7ff',
  mist: '#d7e2ff',
  muted: '#95a8d6',
  grid: 'rgba(255, 255, 255, 0.08)',
  glass: 'rgba(255, 255, 255, 0.05)',
  whiteSoft: 'rgba(255, 255, 255, 0.72)',
};

function createLineGradient(context, fromColor, toColor) {
  const gradient = context.createLinearGradient(0, 0, 0, 360);
  gradient.addColorStop(0, fromColor);
  gradient.addColorStop(1, toColor);
  return gradient;
}

function basePluginConfig() {
  return {
    legend: {
      position: 'top',
      labels: {
        color: COLORS.mist,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 18,
        boxWidth: 10,
        boxHeight: 10,
        font: {
          size: 12,
          weight: '700',
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(4, 9, 20, 0.96)',
      titleColor: '#ffffff',
      bodyColor: COLORS.mist,
      borderColor: 'rgba(62, 140, 255, 0.36)',
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
        weight: '700',
      },
    },
    ticks: {
      color: COLORS.muted,
      padding: 8,
      font: {
        size: 11,
      },
    },
    grid: {
      color: COLORS.grid,
      drawBorder: false,
    },
  };
}

const NUMBER_FORMATTER = new Intl.NumberFormat('sk-SK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DEFAULT_PARTY_KEY = 'SMER';
const ELECTION_SCOPE_LABEL = 'okresy SR';

const PARTY_LABELS = {
  HLAS: 'HLAS-SD',
  KDH: 'KDH',
  OLaNO: 'OĽANO a priatelia',
  PS: 'PS',
  REPUBLIKA: 'REPUBLIKA',
  SMER: 'SMER-SD',
  SaS: 'SaS',
  SNS: 'SNS',
  SZÖVETSÉG: 'SZÖVETSÉG',
};

const PARTY_BUTTON_LABELS = {
  HLAS: 'HLAS',
  KDH: 'KDH',
  OLaNO: 'OĽANO',
  PS: 'PS',
  REPUBLIKA: 'REPUBLIKA',
  SMER: 'SMER',
  SaS: 'SaS',
  SNS: 'SNS',
  SZÖVETSÉG: 'SZÖVETSÉG',
};

const electionSection = {
  title: document.getElementById('volbyRegionTitle'),
  description: document.getElementById('volbyRegionDescription'),
  regionFact: document.getElementById('volbyRegionFact'),
  districtFact: document.getElementById('volbyDistrictFact'),
  note: document.getElementById('volbyRegionNote'),
  toolbarText: document.getElementById('volbyToolbarText'),
  partySwitcher: document.getElementById('partySwitcher'),
  correlationValue: document.getElementById('volbyCorrelationValue'),
  correlationText: document.getElementById('volbyCorrelationText'),
  trendValue: document.getElementById('volbyTrendValue'),
  trendText: document.getElementById('volbyTrendText'),
  assessmentValue: document.getElementById('volbyAssessmentValue'),
  assessmentText: document.getElementById('volbyAssessmentText'),
  footnote: document.getElementById('volbyFootnote'),
};

const electionState = {
  chart: null,
  context: null,
  payload: null,
  partyOptions: [],
  selectedPartyKey: DEFAULT_PARTY_KEY,
};

function formatNumber(value) {
  return NUMBER_FORMATTER.format(value);
}

function formatPercent(value) {
  return `${formatNumber(value)} %`;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pearsonCorrelation(points) {
  const meanX = average(points.map(point => point.x));
  const meanY = average(points.map(point => point.y));
  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  points.forEach(point => {
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
  const meanX = average(points.map(point => point.x));
  const meanY = average(points.map(point => point.y));
  let covariance = 0;
  let varianceX = 0;

  points.forEach(point => {
    const deltaX = point.x - meanX;
    covariance += deltaX * (point.y - meanY);
    varianceX += deltaX * deltaX;
  });

  const slope = varianceX ? covariance / varianceX : 0;
  const intercept = meanY - slope * meanX;

  return { slope, intercept };
}

function regressionLine(points, regression) {
  const xValues = points.map(point => point.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);

  return [
    { x: minX, y: regression.intercept + regression.slope * minX },
    { x: maxX, y: regression.intercept + regression.slope * maxX },
  ];
}

function chartBounds(values, minimumPadding, floor = 0) {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const padding = Math.max(range * 0.2, minimumPadding);

  return {
    min: Math.max(floor, minValue - padding),
    max: maxValue + padding,
  };
}

function describeCorrelation(correlation) {
  const absoluteCorrelation = Math.abs(correlation);
  let strength = 'nízka';

  if (absoluteCorrelation >= 0.6) {
    strength = 'vysoká';
  } else if (absoluteCorrelation >= 0.3) {
    strength = 'stredná';
  }

  if (correlation > 0.05) {
    return `${strength} pozitívna`;
  }

  if (correlation < -0.05) {
    return `${strength} negatívna`;
  }

  return strength === 'nízka' ? 'veľmi nízka' : strength;
}

function describeTrend(slope) {
  if (Math.abs(slope) < 0.5) {
    return 'Takmer plochý trend';
  }

  return slope > 0 ? 'Rastúci trend' : 'Klesajúci trend';
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatMonth(monthValue) {
  const [year, month] = monthValue.split('-');
  const monthNames = [
    'január',
    'február',
    'marec',
    'apríl',
    'máj',
    'jún',
    'júl',
    'august',
    'september',
    'október',
    'november',
    'december',
  ];

  return `${monthNames[Number(month) - 1]} ${year}`;
}

function cleanPartyLabel(label) {
  return label.replace(/\s*\(%\)\s*$/, '');
}

function getPartyDefinition(key) {
  return electionState.partyOptions.find(party => party.key === key);
}

function buildPartyOptions(meta) {
  return Object.entries(meta.columns)
    .filter(([key]) => !['okres', 'nezam_pct'].includes(key))
    .map(([key, label]) => ({
      key,
      label: PARTY_LABELS[key] ?? cleanPartyLabel(label),
      buttonLabel: PARTY_BUTTON_LABELS[key] ?? cleanPartyLabel(label),
    }));
}

function getScatterData(partyKey) {
  return electionState.payload.data
    .map(row => ({
      label: row.okres,
      x: row.nezam_pct,
      y: row[partyKey],
    }))
    .sort((left, right) => left.x - right.x);
}

function renderPartySwitcher() {
  const container = electionSection.partySwitcher;

  if (!container) {
    return;
  }

  container.textContent = '';

  electionState.partyOptions.forEach(party => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'party-switcher__btn';
    button.textContent = party.buttonLabel;
    button.dataset.party = party.key;
    button.setAttribute('aria-pressed', String(party.key === electionState.selectedPartyKey));

    if (party.key === electionState.selectedPartyKey) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      if (party.key === electionState.selectedPartyKey) {
        return;
      }

      electionState.selectedPartyKey = party.key;
      renderPartySwitcher();

      try {
        updateElectionChart();
      } catch (error) {
        console.error(error);
        renderElectionError('Nepodarilo sa prekresliť graf pre zvolenú stranu.');
      }
    });

    container.append(button);
  });
}

function renderElectionSummary({ party, pointCount, correlation, regression, meta }) {
  const assessment = describeCorrelation(correlation);
  const trendLabel = describeTrend(regression.slope);
  const monthLabel = formatMonth(meta.unemployment_month);
  const absoluteSlope = Math.abs(regression.slope);
  const slopeDirection = regression.slope >= 0 ? 'rastie' : 'klesá';

  electionSection.title.textContent = `Voľby vs. nezamestnanosť: ${ELECTION_SCOPE_LABEL}`;
  electionSection.description.textContent = `Každý bod predstavuje jeden okres Slovenska a porovnáva nezamestnanosť z ${monthLabel} s podielom hlasov pre ${party.label} vo voľbách do NR SR ${meta.election_year}.`;
  electionSection.regionFact.textContent = ELECTION_SCOPE_LABEL;
  electionSection.districtFact.textContent = `${pointCount} okresov`;
  electionSection.note.textContent = `Trendová čiara ukazuje ${regression.slope >= 0 ? 'mierne rastúci' : 'mierne klesajúci'} vzťah a Pearsonov koeficient r = ${formatNumber(correlation)} naznačuje ${assessment} koreláciu. Dáta sú za všetkých ${pointCount} okresov Slovenska.`;
  electionSection.toolbarText.textContent = `Tento dataset obsahuje ${pointCount} okresov Slovenska, preto má graf pri každej strane ${pointCount} bodov. Prepína sa iba volebný výsledok na osi Y.`;
  electionSection.correlationValue.textContent = `r = ${formatNumber(correlation)}`;
  electionSection.correlationText.textContent = `Pearsonov korelačný koeficient vypočítaný z ${pointCount} okresov Slovenska pre stranu ${party.label}.`;
  electionSection.trendValue.textContent = trendLabel;
  electionSection.trendText.textContent = `Sklon trendovej čiary je ${regression.slope >= 0 ? '+' : '-'}${formatNumber(absoluteSlope)} p. b.; pri zvýšení nezamestnanosti o 1 p. b. ${slopeDirection} odhadovaný zisk ${party.label} približne o ${formatNumber(absoluteSlope)} p. b.`;
  electionSection.assessmentValue.textContent = capitalize(assessment);
  electionSection.assessmentText.textContent = `${party.label} a nezamestnanosť majú v okresoch Slovenska ${assessment} koreláciu.`;
  electionSection.footnote.textContent = `Zdroj: ${meta.sources.volby}; ${meta.sources.nezamestnanost}. Voľby ${meta.election_year}, nezamestnanosť ${monthLabel}.`;
}

function renderElectionError(message) {
  electionSection.description.textContent = message;
  electionSection.note.textContent = 'Skontroluj, či je JSON súbor dostupný a stránka beží cez lokálny server.';
  electionSection.toolbarText.textContent = 'Prepínanie strán bude dostupné po úspešnom načítaní dát.';
  electionSection.partySwitcher.textContent = '';
  electionSection.correlationValue.textContent = 'r = --';
  electionSection.correlationText.textContent = 'Výpočet sa nepodarilo dokončiť.';
  electionSection.trendValue.textContent = '--';
  electionSection.trendText.textContent = 'Trendovú čiaru sa nepodarilo zostaviť.';
  electionSection.assessmentValue.textContent = '--';
  electionSection.assessmentText.textContent = 'Zhodnotenie bude dostupné po načítaní dát.';
  electionSection.footnote.textContent = 'Dáta sa nepodarilo načítať zo súboru data/volby_nezamestnanost_okresy.json.';
}

function updateElectionChart() {
  const party = getPartyDefinition(electionState.selectedPartyKey);

  if (!party) {
    return;
  }

  const scatterData = getScatterData(party.key);

  if (!scatterData.length) {
    throw new Error('Pre zvolenú stranu sa nenašli žiadne dáta.');
  }

  const correlation = pearsonCorrelation(scatterData);
  const regression = linearRegression(scatterData);
  const trendLine = regressionLine(scatterData, regression);
  const xBounds = chartBounds(scatterData.map(point => point.x), 0.12);
  const yBounds = chartBounds(
    [...scatterData.map(point => point.y), ...trendLine.map(point => point.y)],
    1.4
  );
  const axisLabel = `Podiel hlasov ${party.label} (%) — NRSR ${electionState.payload.meta.election_year}`;

  renderElectionSummary({
    party,
    pointCount: scatterData.length,
    correlation,
    regression,
    meta: electionState.payload.meta,
  });

  if (electionState.chart) {
    electionState.chart.destroy();
  }

  electionState.chart = new Chart(electionState.context, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: `${party.label} – ${ELECTION_SCOPE_LABEL}`,
          data: scatterData,
          backgroundColor: 'rgba(62, 140, 255, 0.36)',
          borderColor: COLORS.accent,
          borderWidth: 1.5,
          pointRadius: 6,
          pointHoverRadius: 9,
          pointHoverBackgroundColor: COLORS.accent,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
        },
        {
          type: 'line',
          label: 'Trendová čiara',
          data: trendLine,
          borderColor: COLORS.electric,
          borderWidth: 2.5,
          borderDash: [8, 6],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'nearest',
        intersect: false,
      },
      plugins: {
        ...basePluginConfig(),
        tooltip: {
          ...basePluginConfig().tooltip,
          callbacks: {
            title: items => items[0]?.raw?.label ?? 'Trendová čiara',
            label: item => {
              if (item.dataset.type === 'line') {
                return `Odhad na trendovej čiare: ${formatPercent(item.parsed.y)}`;
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
          ...commonScale('Miera nezamestnanosti (%) — september 2023'),
          min: xBounds.min,
          max: xBounds.max,
          ticks: {
            ...commonScale('').ticks,
            callback: value => `${formatNumber(value)} %`,
          },
        },
        y: {
          ...commonScale(axisLabel),
          min: yBounds.min,
          max: yBounds.max,
          ticks: {
            ...commonScale('').ticks,
            callback: value => `${formatNumber(value)} %`,
          },
        },
      },
    },
  });
}

async function initElectionChart() {
  const canvas = document.getElementById('chartVolby');

  if (!canvas) {
    return;
  }

  try {
    const response = await fetch('data/volby_nezamestnanost_okresy.json');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    electionState.payload = await response.json();
    electionState.context = canvas.getContext('2d');
    electionState.partyOptions = buildPartyOptions(electionState.payload.meta);
    electionState.selectedPartyKey = electionState.partyOptions.some(party => party.key === DEFAULT_PARTY_KEY)
      ? DEFAULT_PARTY_KEY
      : electionState.partyOptions[0]?.key;

    renderPartySwitcher();
    updateElectionChart();
  } catch (error) {
    console.error(error);
    renderElectionError('Nepodarilo sa načítať dáta pre korelačný graf všetkých okresov SR.');
  }
}

void initElectionChart();

(function initSocialChart() {
  const politicians = [
    'Robert Fico',
    'Peter Pellegrini',
    'Igor Matovič',
    'Michal Šimečka',
    'Zuzana Čaputová',
    'Richard Sulík',
  ];

  const facebook = [310, 185, 420, 95, 280, 150];
  const instagram = [42, 68, 95, 110, 195, 38];
  const twitter = [28, 22, 85, 55, 120, 45];

  const context = document.getElementById('chartSocialne').getContext('2d');

  new Chart(context, {
    type: 'bar',
    data: {
      labels: politicians,
      datasets: [
        {
          label: 'Facebook (tis.)',
          data: facebook,
          backgroundColor: 'rgba(62, 140, 255, 0.82)',
          borderRadius: 999,
          borderSkipped: false,
        },
        {
          label: 'Instagram (tis.)',
          data: instagram,
          backgroundColor: 'rgba(113, 183, 255, 0.64)',
          borderRadius: 999,
          borderSkipped: false,
        },
        {
          label: 'Twitter/X (tis.)',
          data: twitter,
          backgroundColor: 'rgba(255, 255, 255, 0.42)',
          borderRadius: 999,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...basePluginConfig(),
        tooltip: {
          ...basePluginConfig().tooltip,
          callbacks: {
            label: tooltipItem => `${tooltipItem.dataset.label}: ${tooltipItem.parsed.x} tis.`,
          },
        },
      },
      scales: {
        x: {
          ...commonScale('Sledovatelia (tisíce)'),
          suggestedMax: 450,
        },
        y: {
          ...commonScale(''),
          grid: {
            display: false,
            drawBorder: false,
          },
        },
      },
    },
  });
})();

(function initParliamentChart() {
  const metrics = [
    'Dochádzka',
    'Hlasovanie',
    'Interpelácie',
    'Legislatíva',
    'Výbory',
  ];

  const data = {
    'SMER-SD': [72, 68, 85, 60, 70],
    PS: [88, 91, 78, 82, 85],
    'OĽaNO': [65, 62, 92, 75, 60],
  };

  const context = document.getElementById('chartParlament').getContext('2d');

  new Chart(context, {
    type: 'radar',
    data: {
      labels: metrics,
      datasets: [
        {
          label: 'SMER-SD',
          data: data['SMER-SD'],
          borderColor: COLORS.accent,
          backgroundColor: 'rgba(62, 140, 255, 0.18)',
          pointBackgroundColor: COLORS.accent,
          pointBorderColor: '#081124',
          pointRadius: 4,
          borderWidth: 2.5,
        },
        {
          label: 'PS',
          data: data.PS,
          borderColor: COLORS.electric,
          backgroundColor: 'rgba(113, 183, 255, 0.15)',
          pointBackgroundColor: COLORS.electric,
          pointBorderColor: '#081124',
          pointRadius: 4,
          borderWidth: 2.5,
        },
        {
          label: 'OĽaNO',
          data: data['OĽaNO'],
          borderColor: '#ffffff',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#081124',
          pointRadius: 4,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: basePluginConfig(),
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            color: COLORS.muted,
            showLabelBackdrop: false,
            backdropColor: 'transparent',
            font: {
              size: 11,
            },
          },
          grid: {
            color: COLORS.grid,
          },
          angleLines: {
            color: COLORS.grid,
          },
          pointLabels: {
            color: COLORS.mist,
            font: {
              size: 12,
              weight: '700',
            },
          },
        },
      },
    },
  });
})();
