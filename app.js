'use strict';

const topicTabs = document.querySelectorAll('.topic-tab');
const topicPanels = document.querySelectorAll('.topic-panel');

function setActivePanel(targetId) {
  topicTabs.forEach(button => {
    const isActive = button.dataset.target === targetId;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  topicPanels.forEach(panel => {
    const isActive = panel.id === targetId;
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
  });

  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('resize'));
    syncPanelCharts(targetId);
  });
}

topicTabs.forEach(button => {
  button.addEventListener('click', () => {
    setActivePanel(button.dataset.target);
  });
});

const styles = getComputedStyle(document.documentElement);

const COLORS = {
  accent: styles.getPropertyValue('--accent').trim(),
  accentStrong: styles.getPropertyValue('--accent-strong').trim(),
  accentSoft: styles.getPropertyValue('--accent-soft').trim(),
  text: styles.getPropertyValue('--text').trim(),
  muted: styles.getPropertyValue('--muted').trim(),
  mutedStrong: styles.getPropertyValue('--muted-strong').trim(),
  line: styles.getPropertyValue('--line-strong').trim(),
  electric: '#71b7ff',
  softBlue: '#95a8d6',
  whiteSoft: 'rgba(255, 255, 255, 0.42)',
  paper: '#ffffff',
};

Chart.defaults.font.family = "'Manrope', 'Segoe UI', sans-serif";
Chart.defaults.color = COLORS.mutedStrong;
Chart.defaults.borderColor = COLORS.line;

function basePluginConfig() {
  return {
    legend: {
      position: 'top',
      labels: {
        color: COLORS.mutedStrong,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
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
      bodyColor: '#f5f7ff',
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

const NUMBER_FORMATTER = new Intl.NumberFormat('sk-SK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INTEGER_FORMATTER = new Intl.NumberFormat('sk-SK', {
  maximumFractionDigits: 0,
});

const ONE_DECIMAL_FORMATTER = new Intl.NumberFormat('sk-SK', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
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

const SOCIAL_TYPE_LABELS = {
  reels: 'Reels',
  post: 'Príspevok',
  event: 'Udalosť',
};

const SOCIAL_TYPE_ORDER = ['reels', 'post', 'event'];

const SOCIAL_TYPE_COLORS = {
  reels: '#59bbff',
  post: '#9fafd9',
  event: '#e5a047',
};

const SOCIAL_PROFILES = [
  {
    key: 'fico',
    label: 'Robert Fico',
    shortLabel: 'Fico',
    color: '#d5464e',
    highlight: '#ff9fa4',
    rawPosts: [
      '7k 850 1,1k 120k',
      '2,6k 298 161 52k',
      '2,8k 582 109 -',
      '4,8k 652 423 128k',
      '34k 2228 3,2k 714k',
      '4,7k 1k 157 115k',
      '29k 1,9k 3,2k 702k',
      '3,3k 361 140 82k',
      '2,6k 258 99 -',
      '3,3k 312 125 -',
      '7,5k 2332 149 -',
      '5,1k 655 324 190k',
      '17k 1,6k 1,7k 425k',
      '6,6k 698 344 163k',
    ],
  },
  {
    key: 'simecka',
    label: 'Michal Šimečka',
    shortLabel: 'Šimečka',
    color: '#66c9ff',
    highlight: '#b7ebff',
    rawPosts: [
      '2,3k 86 70 50k',
      '2,3k 97 97 -',
      '2k 26 33 -',
      '665 63 23 -',
      '330 22 34 -',
      '1,3k 59 34 24k',
      '2,5k 89 74 -',
      '305 35 3 6,3k',
      '1,5k 45 44 -',
      '957 58 69 -',
      '2,4k 85 105 35k',
      '118 23 - -',
      '3,6k 138 177 47k',
      '665 92 21 16k',
      '1,3k 124 41 -',
      '800 49 13 43',
      '7,6k 454 146 -',
      '174 43 - -',
      '2k 71 24 -',
      '432 23 1 9,7k',
      '298 29 6 7,8k',
      '1,9k 96 80 59k',
      '2,9k 141 113 48k',
      '7,7k 1,5k 333 -',
      '294 20 11 -',
      '668 140 17 17k',
    ],
  },
  {
    key: 'uhrik',
    label: 'Milan Uhrík',
    shortLabel: 'Uhrík',
    color: '#2c6f57',
    highlight: '#79b39b',
    rawPosts: [
      '1,8k 259 163 -',
      '2,7k 130 184 43k',
      '710 19 115 -',
      '22k 681 5k 502k',
    ],
  },
  {
    key: 'matovic',
    label: 'Igor Matovič',
    shortLabel: 'Matovič',
    color: '#79b445',
    highlight: '#c4ec82',
    rawPosts: [
      '1k 276 45 -',
      '1,3k 325 486 39k',
      '562 220 56 -',
      '493 179 42 -',
      '1,1k 278 308 33k',
      '2k 498 383 70k',
      '2,1k 455 378 -',
      '2,3k 454 183 96k',
      '461 252 26 -',
      '2,2k 497 436 102k',
      '459 135 36 -',
      '2,5k 101 235 150k',
      '2,3k 1,4k 476 80k',
      '756 463 79 -',
      '1,1k 262 201 42k',
      '3,7k 996 231 224k',
      '2,2k 655 274 104k',
    ],
  },
];

const socialSection = {
  leadNarrative: document.getElementById('socialLeadNarrative'),
  volumeNarrative: document.getElementById('socialVolumeNarrative'),
  formatNarrative: document.getElementById('socialFormatNarrative'),
  profilesCount: document.getElementById('socialProfilesCount'),
  postsCount: document.getElementById('socialPostsCount'),
  interactionsCount: document.getElementById('socialInteractionsCount'),
  reelsCount: document.getElementById('socialReelsCount'),
};

const socialState = {
  impactChart: null,
  strategyChart: null,
  profiles: [],
};

const transparentState = {
  chart: null,
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
  if (Math.abs(value) >= 1000) {
    const thousands = value / 1000;
    const formattedThousands = value >= 100000 ? formatInteger(thousands) : formatOneDecimal(thousands);

    return `${formattedThousands} tis.`;
  }

  return formatInteger(value);
}

function formatShortPercent(value) {
  return `${formatOneDecimal(value)} %`;
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

function nicePercentAxis(values, { floor = 0, step = 1, minimumMax = step } = {}) {
  const maxValue = Math.max(...values);

  return {
    min: floor,
    max: Math.max(minimumMax, Math.ceil(maxValue / step) * step),
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

function sumValues(values) {
  return values.reduce((sum, value) => sum + value, 0);
}

function parseCompactNumber(token) {
  const normalizedToken = String(token ?? '').trim().toLowerCase();

  if (!normalizedToken || normalizedToken === '-') {
    return null;
  }

  const normalizedNumber = normalizedToken.replace(',', '.');

  if (normalizedNumber.endsWith('k')) {
    return Math.round(Number.parseFloat(normalizedNumber.slice(0, -1)) * 1000);
  }

  return Number.parseInt(normalizedNumber, 10);
}

function parseSocialPostRow(row) {
  const [likesToken = '', commentsToken = '', sharesToken = '-', viewsToken = '-'] = row.trim().split(/\s+/);
  const likes = parseCompactNumber(likesToken) ?? 0;
  const comments = parseCompactNumber(commentsToken) ?? 0;
  const shareValue = parseCompactNumber(sharesToken);
  const viewValue = parseCompactNumber(viewsToken);
  const type = viewValue !== null ? 'reels' : shareValue === null ? 'event' : 'post';

  return {
    likes,
    comments,
    shares: shareValue ?? 0,
    views: viewValue ?? 0,
    type,
    interactions: likes + comments + (shareValue ?? 0),
  };
}

function prepareSocialProfiles() {
  return SOCIAL_PROFILES.map(profile => {
    const posts = profile.rawPosts.map(parseSocialPostRow);
    const typeCounts = posts.reduce((summary, post) => {
      summary[post.type] += 1;
      return summary;
    }, { reels: 0, post: 0, event: 0 });

    const totalInteractions = sumValues(posts.map(post => post.interactions));

    return {
      ...profile,
      posts,
      typeCounts,
      totalPosts: posts.length,
      totalInteractions,
      averageInteractions: totalInteractions / posts.length,
    };
  });
}

function hexToRgb(color) {
  const normalized = color.replace('#', '');
  const hex = normalized.length === 3
    ? normalized.split('').map(character => `${character}${character}`).join('')
    : normalized;
  const numericValue = Number.parseInt(hex, 16);

  return {
    r: (numericValue >> 16) & 255,
    g: (numericValue >> 8) & 255,
    b: numericValue & 255,
  };
}

function withOpacity(color, opacity) {
  if (!color.startsWith('#')) {
    return color;
  }

  const { r, g, b } = hexToRgb(color);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function createVerticalGradient(chart, startColor, endColor) {
  const { ctx, chartArea } = chart;

  if (!chartArea) {
    return startColor;
  }

  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);

  return gradient;
}

function uniqueFormatCount(profile) {
  return Object.values(profile.typeCounts).filter(Boolean).length;
}

function renderSocialNarratives(profiles) {
  const rankedByImpact = [...profiles].sort((left, right) => right.totalInteractions - left.totalInteractions);
  const rankedByVolume = [...profiles].sort((left, right) => right.totalPosts - left.totalPosts);
  const [leader, runnerUp] = rankedByImpact;
  const volumeLeader = rankedByVolume[0];
  const diverseLeader = [...profiles].sort((left, right) => uniqueFormatCount(right) - uniqueFormatCount(left) || right.totalPosts - left.totalPosts)[0];
  const totalInteractions = sumValues(profiles.map(profile => profile.totalInteractions));
  const totalPosts = sumValues(profiles.map(profile => profile.totalPosts));
  const totalReels = sumValues(profiles.map(profile => profile.typeCounts.reels));
  const leaderShare = totalInteractions ? (leader.totalInteractions / totalInteractions) * 100 : 0;
  const gapToRunnerUp = runnerUp ? leader.totalInteractions - runnerUp.totalInteractions : 0;
  const eventProfiles = profiles.filter(profile => profile.typeCounts.event > 0);

  if (socialSection.profilesCount) {
    socialSection.profilesCount.textContent = formatInteger(profiles.length);
  }

  if (socialSection.postsCount) {
    socialSection.postsCount.textContent = formatInteger(totalPosts);
  }

  if (socialSection.interactionsCount) {
    socialSection.interactionsCount.textContent = formatCompactMetric(totalInteractions);
  }

  if (socialSection.reelsCount) {
    socialSection.reelsCount.textContent = formatInteger(totalReels);
  }

  if (socialSection.leadNarrative) {
    socialSection.leadNarrative.textContent = `${leader.label} nazbieral ${formatInteger(leader.totalInteractions)} interakcií, teda ${formatShortPercent(leaderShare)} všetkých reakcií v sledovanom balíku. Pred druhým miestom má náskok ${formatCompactMetric(gapToRunnerUp)}.`;
  }

  if (socialSection.volumeNarrative) {
    if (leader.key === volumeLeader.key) {
      socialSection.volumeNarrative.textContent = `${leader.label} bol zároveň najaktívnejší aj najvýkonnejší: zverejnil ${formatInteger(leader.totalPosts)} príspevkov a na jeden post priemerne získal ${formatCompactMetric(leader.averageInteractions)} interakcií.`;
    } else {
      socialSection.volumeNarrative.textContent = `${volumeLeader.label} tlačil na objem a zverejnil ${formatInteger(volumeLeader.totalPosts)} príspevkov, najviac zo všetkých. ${leader.label} však aj pri ${formatInteger(leader.totalPosts)} príspevkoch doručil takmer ${formatOneDecimal(leader.totalInteractions / runnerUp.totalInteractions)}-násobok interakcií oproti druhému miestu.`;
    }
  }

  if (socialSection.formatNarrative) {
    const eventClause = eventProfiles.length
      ? ` ${eventProfiles.map(profile => profile.label).join(', ')} ${eventProfiles.length === 1 ? 'bol jediný, kto' : 'boli jediní, ktorí'} pracoval${eventProfiles.length === 1 ? '' : 'i'} aj s udalosťami.`
      : '';

    socialSection.formatNarrative.textContent = `Reels tvorili ${formatShortPercent((totalReels / totalPosts) * 100)} všetkého obsahu (${formatInteger(totalReels)} z ${formatInteger(totalPosts)} príspevkov). Najpestrejší mix formátov mal ${diverseLeader.label}.${eventClause}`;
  }
}

function getVisibleSocialTypes(profile) {
  return SOCIAL_TYPE_ORDER.filter(type => profile.typeCounts[type] > 0);
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

function hydrateSocialSection() {
  if (!socialState.profiles.length) {
    socialState.profiles = prepareSocialProfiles();
  }

  renderSocialNarratives(socialState.profiles);
}

function createSocialImpactChart(canvas, profiles) {
  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: profiles.map(profile => profile.shortLabel),
      datasets: [
        {
          label: 'Interakcie',
          data: profiles.map(profile => profile.totalInteractions),
          backgroundColor: context => {
            const profile = profiles[context.dataIndex];

            return createVerticalGradient(context.chart, withOpacity(profile.color, 0.72), profile.highlight);
          },
          borderColor: context => profiles[context.dataIndex].color,
          borderWidth: 1.5,
          borderRadius: 18,
          borderSkipped: false,
          maxBarThickness: 66,
          hoverBackgroundColor: context => {
            const profile = profiles[context.dataIndex];

            return createVerticalGradient(context.chart, profile.color, profile.highlight);
          },
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
          callbacks: {
            label: tooltipItem => `Interakcie: ${formatInteger(tooltipItem.parsed.y)}`,
            afterLabel: tooltipItem => {
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
          ...commonScale('Líder politickej strany'),
          grid: {
            display: false,
            drawBorder: false,
          },
        },
        y: {
          ...commonScale('Súčet interakcií'),
          beginAtZero: true,
          suggestedMax: Math.max(...profiles.map(profile => profile.totalInteractions)) * 1.12,
          ticks: {
            ...commonScale('').ticks,
            callback: value => formatCompactMetric(Number(value)),
          },
        },
      },
    },
  });
}

function createSocialStrategyChart(canvas, profiles) {
  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: profiles.map(profile => profile.shortLabel),
      datasets: SOCIAL_TYPE_ORDER.map(type => ({
        label: SOCIAL_TYPE_LABELS[type],
        data: profiles.map(profile => profile.typeCounts[type]),
        backgroundColor: withOpacity(SOCIAL_TYPE_COLORS[type], 0.82),
        borderColor: SOCIAL_TYPE_COLORS[type],
        borderWidth: 1.6,
        borderRadius: context => getSocialStackRadius(type, profiles[context.dataIndex]),
        borderSkipped: false,
        stack: 'content',
        maxBarThickness: 64,
        borderJoinStyle: 'round',
        barPercentage: 0.74,
        categoryPercentage: 0.7,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        ...basePluginConfig(),
        legend: {
          display: false,
        },
        tooltip: {
          ...basePluginConfig().tooltip,
          callbacks: {
            label: tooltipItem => `${tooltipItem.dataset.label}: ${formatInteger(tooltipItem.parsed.y)} príspevkov`,
            afterBody: tooltipItems => {
              const profile = profiles[tooltipItems[0].dataIndex];

              return `Spolu: ${formatInteger(profile.totalPosts)} príspevkov`;
            },
          },
        },
      },
      scales: {
        x: {
          ...commonScale('Líder politickej strany'),
          stacked: true,
          grid: {
            display: false,
            drawBorder: false,
          },
        },
        y: {
          ...commonScale('Počet príspevkov'),
          stacked: true,
          beginAtZero: true,
          suggestedMax: Math.max(...profiles.map(profile => profile.totalPosts)) + 2,
          ticks: {
            ...commonScale('').ticks,
            precision: 0,
            callback: value => formatInteger(Number(value)),
          },
        },
      },
    },
  });
}

function resizeChart(chart) {
  if (!chart) {
    return;
  }

  chart.resize();
  chart.update('none');
}

function syncPanelCharts(targetId) {
  if (targetId === 'panel-socialne') {
    requestAnimationFrame(() => {
      if (!socialState.impactChart || !socialState.strategyChart) {
        initSocialChart();
        return;
      }

      resizeChart(socialState.impactChart);
      resizeChart(socialState.strategyChart);
    });
  }

  if (targetId === 'panel-transparentne') {
    requestAnimationFrame(() => {
      if (!transparentState.chart) {
        initTransparentChart();
        return;
      }

      resizeChart(transparentState.chart);
    });
  }
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

  electionSection.title.textContent = 'Okresy ukazujú, kde ekonomický tlak mení politické preferencie.';
  electionSection.description.textContent = `Každý bod v grafe predstavuje jeden okres Slovenska a porovnáva nezamestnanosť z ${monthLabel} s podielom hlasov pre ${party.label} vo voľbách do NR SR ${meta.election_year}.`;
  electionSection.note.textContent = `Pri strane ${party.label} trendová čiara naznačuje ${regression.slope >= 0 ? 'rastúci' : 'klesajúci'} vzťah a Pearsonov koeficient r = ${formatNumber(correlation)} hovorí o tom, že ide o ${assessment} koreláciu. Je to typ signálu, ktorý môže redakcia ďalej rozpracovať reportážou z konkrétnych regiónov.`;
  electionSection.toolbarText.textContent = `Dataset pracuje s ${pointCount} okresmi Slovenska. Rozsah analýzy je ${ELECTION_SCOPE_LABEL}; na osi X je nezamestnanosť za ${monthLabel}, na osi Y volebný výsledok strany ${party.label}.`;
  electionSection.correlationValue.textContent = `r = ${formatNumber(correlation)}`;
  electionSection.correlationText.textContent = `Pearsonov korelačný koeficient pre ${party.label} vypočítaný z ${pointCount} okresov.`;
  electionSection.trendValue.textContent = trendLabel;
  electionSection.trendText.textContent = `Sklon trendovej čiary je ${regression.slope >= 0 ? '+' : '-'}${formatNumber(absoluteSlope)} p. b.; pri raste nezamestnanosti o 1 p. b. ${slopeDirection} odhadovaný zisk ${party.label} približne o ${formatNumber(absoluteSlope)} p. b.`;
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
  const xBounds = nicePercentAxis(scatterData.map(point => point.x), {
    floor: 0,
    step: 1,
    minimumMax: 1,
  });
  const yBounds = nicePercentAxis(
    [...scatterData.map(point => point.y), ...trendLine.map(point => point.y)],
    {
      floor: 0,
      step: 5,
      minimumMax: 5,
    }
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
          backgroundColor: COLORS.accentSoft,
          borderColor: COLORS.accent,
          borderWidth: 1.5,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: COLORS.accent,
          pointHoverBorderColor: COLORS.paper,
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
            stepSize: 5,
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

function initSocialChart() {
  const impactCanvas = document.getElementById('chartSocialImpact');
  const strategyCanvas = document.getElementById('chartSocialStrategy');

  if (!impactCanvas || !strategyCanvas) {
    return;
  }

  hydrateSocialSection();

  if (socialState.impactChart) {
    socialState.impactChart.destroy();
  }

  if (socialState.strategyChart) {
    socialState.strategyChart.destroy();
  }

  socialState.impactChart = createSocialImpactChart(impactCanvas, socialState.profiles);
  socialState.strategyChart = createSocialStrategyChart(strategyCanvas, socialState.profiles);
}

function initTransparentChart() {
  const canvas = document.getElementById('chartTransparentne');

  if (!canvas) {
    return;
  }

  const parties = ['PS', 'SMER-SD', 'HLAS-SD', 'KDH', 'SaS'];
  const income = [840, 910, 560, 320, 280];
  const expenses = [690, 980, 430, 260, 310];

  if (transparentState.chart) {
    transparentState.chart.destroy();
  }

  transparentState.chart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: parties,
      datasets: [
        {
          label: 'Príjmy (tis. €)',
          data: income,
          backgroundColor: COLORS.accent,
          borderRadius: 16,
          borderSkipped: false,
        },
        {
          label: 'Výdavky (tis. €)',
          data: expenses,
          backgroundColor: COLORS.electric,
          borderRadius: 16,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...basePluginConfig(),
        tooltip: {
          ...basePluginConfig().tooltip,
          callbacks: {
            label: tooltipItem => `${tooltipItem.dataset.label}: ${tooltipItem.parsed.y} tis. €`,
          },
        },
      },
      scales: {
        x: {
          ...commonScale('Politický subjekt'),
          grid: {
            display: false,
            drawBorder: false,
          },
        },
        y: {
          ...commonScale('Objem transakcií (tis. €)'),
          beginAtZero: true,
          ticks: {
            ...commonScale('').ticks,
            callback: value => `${value} tis.`,
          },
        },
      },
    },
  });
}

hydrateSocialSection();
setActivePanel('panel-volby');
void initElectionChart();
