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

(function initElectionChart() {
  const years = [2006, 2008, 2010, 2012, 2016, 2020, 2023];
  const smerVotes = [29.1, null, 34.8, 44.4, 28.3, 18.3, 23.0];
  const unemployment = [13.4, 9.6, 14.5, 14.0, 9.7, 6.7, 5.8];

  const context = document.getElementById('chartVolby').getContext('2d');
  const votesFill = createLineGradient(context, 'rgba(62, 140, 255, 0.34)', 'rgba(62, 140, 255, 0.02)');
  const unemploymentFill = createLineGradient(context, 'rgba(113, 183, 255, 0.22)', 'rgba(113, 183, 255, 0.02)');

  new Chart(context, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'SMER-SD – % hlasov',
          data: smerVotes,
          yAxisID: 'yVotes',
          borderColor: COLORS.accent,
          backgroundColor: votesFill,
          pointBackgroundColor: COLORS.accent,
          pointBorderColor: '#081124',
          pointHoverBackgroundColor: '#ffffff',
          pointRadius: 5,
          pointHoverRadius: 6,
          borderWidth: 3,
          tension: 0.38,
          fill: true,
          spanGaps: true,
        },
        {
          label: 'Nezamestnanosť (%)',
          data: unemployment,
          yAxisID: 'yUnemployment',
          borderColor: COLORS.electric,
          backgroundColor: unemploymentFill,
          pointBackgroundColor: COLORS.electric,
          pointBorderColor: '#081124',
          pointRadius: 4,
          borderWidth: 2,
          tension: 0.38,
          borderDash: [6, 4],
          fill: true,
        },
      ],
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
        tooltip: {
          ...basePluginConfig().tooltip,
          callbacks: {
            label: tooltipItem => {
              const value = tooltipItem.parsed.y;
              return `${tooltipItem.dataset.label}: ${value !== null ? `${value} %` : 'N/A'}`;
            },
          },
        },
      },
      scales: {
        x: commonScale('Rok'),
        yVotes: {
          ...commonScale('Hlasy (%)'),
          type: 'linear',
          position: 'left',
          min: 0,
          max: 55,
        },
        yUnemployment: {
          ...commonScale('Nezamestnanosť (%)'),
          type: 'linear',
          position: 'right',
          min: 0,
          max: 25,
          grid: {
            drawOnChartArea: false,
            color: COLORS.grid,
            drawBorder: false,
          },
        },
      },
    },
  });
})();

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
