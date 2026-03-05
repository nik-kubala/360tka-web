'use strict';

// ── Tab switching ──────────────────────────────────────────────────────────────

const tabBtns = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tab-section');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;

    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    sections.forEach(sec => {
      if (sec.id === target) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });
  });
});

// ── Report buttons ─────────────────────────────────────────────────────────────

document.querySelectorAll('.btn-report').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    alert(`Report pre sekciu „${section}" bude čoskoro dostupný.`);
  });
});

// ── Chart defaults ─────────────────────────────────────────────────────────────

Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
Chart.defaults.color = '#5a6a8a';

const ACCENT   = '#e8242b';
const PRIMARY  = '#0d1b3e';
const BLUE     = '#1a3a6e';
const BLUE2    = '#2e6db4';
const BLUE3    = '#4a9fd4';
const GREY     = '#c0cce0';

// ── 1. Voľby vs. Nezamestnanosť – Line chart (dual-axis) ──────────────────────

(function initVolbyChart() {
  const years = [2006, 2008, 2010, 2012, 2016, 2020, 2023];

  // % hlasov SMER-SD vo voľbách (mock)
  const smerVotes = [29.1, null, 34.8, 44.4, 28.3, 18.3, 23.0];

  // Priemerná miera nezamestnanosti v danom roku (mock, %)
  const unemployment = [13.4, 9.6, 14.5, 14.0, 9.7, 6.7, 5.8];

  const ctx = document.getElementById('chartVolby').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'SMER-SD – % hlasov',
          data: smerVotes,
          yAxisID: 'yVotes',
          borderColor: ACCENT,
          backgroundColor: ACCENT + '22',
          pointBackgroundColor: ACCENT,
          pointRadius: 5,
          tension: 0.35,
          fill: true,
          spanGaps: true,
        },
        {
          label: 'Miera nezamestnanosti (%)',
          data: unemployment,
          yAxisID: 'yUnemployment',
          borderColor: BLUE2,
          backgroundColor: BLUE2 + '22',
          pointBackgroundColor: BLUE2,
          pointRadius: 5,
          tension: 0.35,
          fill: true,
          borderDash: [5, 3],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y + ' %' : 'N/A'}`,
          },
        },
      },
      scales: {
        yVotes: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Hlasy (%)' },
          min: 0,
          max: 55,
          grid: { color: '#e8ecf4' },
        },
        yUnemployment: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Nezamestnanosť (%)' },
          min: 0,
          max: 25,
          grid: { drawOnChartArea: false },
        },
        x: {
          title: { display: true, text: 'Rok' },
          grid: { color: '#e8ecf4' },
        },
      },
    },
  });
})();

// ── 2. Sila politikov na sieťach – Horizontal Bar chart ───────────────────────

(function initSocialneChart() {
  const politicians = [
    'Robert Fico',
    'Peter Pellegrini',
    'Igor Matovič',
    'Michal Šimečka',
    'Zuzana Čaputová',
    'Richard Sulík',
  ];

  // Počet sledovateľov (tisíce) – Facebook / Instagram / Twitter (mock)
  const facebook  = [310, 185, 420, 95,  280, 150];
  const instagram = [42,  68,  95,  110, 195, 38 ];
  const twitter   = [28,  22,  85,  55,  120, 45 ];

  const ctx = document.getElementById('chartSocialne').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: politicians,
      datasets: [
        { label: 'Facebook (tis.)', data: facebook,  backgroundColor: '#1877f2cc' },
        { label: 'Instagram (tis.)', data: instagram, backgroundColor: '#e1306ccc' },
        { label: 'Twitter/X (tis.)', data: twitter,   backgroundColor: '#1da1f2cc' },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x} tis.`,
          },
        },
      },
      scales: {
        x: {
          stacked: false,
          title: { display: true, text: 'Sledovatelia (tisíce)' },
          grid: { color: '#e8ecf4' },
        },
        y: {
          grid: { display: false },
        },
      },
    },
  });
})();

// ── 3. Aktivita v parlamente – Radar chart ────────────────────────────────────

(function initParlamentChart() {
  const metrics = [
    'Dochádzka',
    'Hlasovanie',
    'Interpelácie',
    'Legislatíva',
    'Výbory',
  ];

  // Skóre 0–100 pre každý poslanecký klub (mock)
  const data = {
    'SMER-SD':  [72, 68, 85, 60, 70],
    'PS':       [88, 91, 78, 82, 85],
    'OĽaNO':   [65, 62, 92, 75, 60],
  };

  const ctx = document.getElementById('chartParlament').getContext('2d');

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: metrics,
      datasets: [
        {
          label: 'SMER-SD',
          data: data['SMER-SD'],
          borderColor: ACCENT,
          backgroundColor: ACCENT + '33',
          pointBackgroundColor: ACCENT,
          pointRadius: 4,
        },
        {
          label: 'PS',
          data: data['PS'],
          borderColor: BLUE2,
          backgroundColor: BLUE2 + '33',
          pointBackgroundColor: BLUE2,
          pointRadius: 4,
        },
        {
          label: 'OĽaNO',
          data: data['OĽaNO'],
          borderColor: BLUE3,
          backgroundColor: BLUE3 + '33',
          pointBackgroundColor: BLUE3,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20, backdropColor: 'transparent' },
          grid: { color: '#e0e6f0' },
          angleLines: { color: '#d0d8ea' },
          pointLabels: { font: { size: 13, weight: '600' } },
        },
      },
    },
  });
})();
