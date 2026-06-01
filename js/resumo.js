import { db } from './firebase.js';
import {
  collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { formatCurrency } from './ui.js';

export function initResumo(container) {
  const today = new Date();
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    monthOptions.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }

  container.innerHTML = `
    <div class="page-header">
      <h1>Resumo Mensal</h1>
      <p class="page-subtitle">Visão detalhada das suas finanças por período</p>
    </div>

    <div class="card">
      <div class="period-filter">
        <label class="form-label">Período:</label>
        <select id="select-mes" class="form-input" style="max-width:220px">
          ${monthOptions.map((m, i) => `<option value="${m.value}"${i === 0 ? ' selected' : ''}>${m.label}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card stat-success">
        <div class="stat-label">Receitas</div>
        <div class="stat-value text-success" id="r-receitas">—</div>
      </div>
      <div class="stat-card stat-danger">
        <div class="stat-label">Despesas</div>
        <div class="stat-value text-danger" id="r-despesas">—</div>
      </div>
      <div class="stat-card stat-primary">
        <div class="stat-label">Saldo</div>
        <div class="stat-value" id="r-saldo">—</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card">
        <h2 class="card-title">Despesas por Categoria</h2>
        <div class="chart-container">
          <canvas id="chart-pizza"></canvas>
          <p class="empty-text" id="pizza-empty" style="display:none">Sem despesas no período.</p>
        </div>
      </div>
      <div class="card">
        <h2 class="card-title">Receitas vs Despesas (6 meses)</h2>
        <div class="chart-container">
          <canvas id="chart-barras"></canvas>
        </div>
      </div>
    </div>
  `;

  let pizzaChart = null;
  let barChart = null;
  let isMounted = true;

  function getPeriodRange(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return {
      start: `${yearMonth}-01`,
      end: `${yearMonth}-${String(lastDay).padStart(2, '0')}`
    };
  }

  async function loadResumo(yearMonth) {
    const { start, end } = getPeriodRange(yearMonth);

    const [snapR, snapD] = await Promise.all([
      getDocs(query(collection(db, 'receitas'), where('data', '>=', start), where('data', '<=', end))),
      getDocs(query(collection(db, 'despesas'), where('data', '>=', start), where('data', '<=', end)))
    ]);

    if (!isMounted) return;

    const totalR = snapR.docs.reduce((s, d) => s + d.data().valor, 0);
    const totalD = snapD.docs.reduce((s, d) => s + d.data().valor, 0);
    const saldo = totalR - totalD;

    document.getElementById('r-receitas').textContent = formatCurrency(totalR);
    document.getElementById('r-despesas').textContent = formatCurrency(totalD);
    const saldoEl = document.getElementById('r-saldo');
    saldoEl.textContent = formatCurrency(saldo);
    saldoEl.className = `stat-value ${saldo >= 0 ? 'text-success' : 'text-danger'}`;

    // Gráfico pizza — despesas por categoria
    const catMap = {};
    snapD.docs.forEach(d => {
      const cat = d.data().categoriaNome || 'Sem categoria';
      catMap[cat] = (catMap[cat] || 0) + d.data().valor;
    });

    if (pizzaChart) { pizzaChart.destroy(); pizzaChart = null; }

    const pizzaCanvas = document.getElementById('chart-pizza');
    const pizzaEmpty = document.getElementById('pizza-empty');

    if (!pizzaCanvas || !pizzaEmpty) return;

    if (Object.keys(catMap).length === 0) {
      pizzaCanvas.style.display = 'none';
      pizzaEmpty.style.display = 'block';
    } else {
      pizzaCanvas.style.display = 'block';
      pizzaEmpty.style.display = 'none';
      pizzaChart = new Chart(pizzaCanvas, {
        type: 'doughnut',
        data: {
          labels: Object.keys(catMap),
          datasets: [{
            data: Object.values(catMap),
            backgroundColor: ['#4F46E5','#DC2626','#16A34A','#EAB308','#A855F7','#F97316','#EC4899','#6B7280'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}` }
            }
          }
        }
      });
    }

    await loadBarChart(yearMonth);
  }

  async function loadBarChart(currentYearMonth) {
    const [curYear, curMonth] = currentYearMonth.split('-').map(Number);

    // busca tudo a partir de 6 meses atrás e agrupa client-side
    const startDate = new Date(curYear, curMonth - 6, 1);
    const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;

    const [snapR, snapD] = await Promise.all([
      getDocs(query(collection(db, 'receitas'), where('data', '>=', startStr))),
      getDocs(query(collection(db, 'despesas'), where('data', '>=', startStr)))
    ]);

    if (!isMounted) return;

    const labels = [];
    const byMonthR = {};
    const byMonthD = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(curYear, curMonth - 1 - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.push(d.toLocaleString('pt-BR', { month: 'short' }));
      byMonthR[ym] = 0;
      byMonthD[ym] = 0;
    }

    snapR.docs.forEach(d => {
      const ym = d.data().data.slice(0, 7);
      if (byMonthR[ym] !== undefined) byMonthR[ym] += d.data().valor;
    });

    snapD.docs.forEach(d => {
      const ym = d.data().data.slice(0, 7);
      if (byMonthD[ym] !== undefined) byMonthD[ym] += d.data().valor;
    });

    const monthKeys = Object.keys(byMonthR);
    const canvas = document.getElementById('chart-barras');
    if (!canvas) return;

    if (barChart) { barChart.destroy(); barChart = null; }

    barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: monthKeys.map(k => byMonthR[k]),
            backgroundColor: 'rgba(22,163,74,0.7)',
            borderColor: '#16A34A',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Despesas',
            data: monthKeys.map(k => byMonthD[k]),
            backgroundColor: 'rgba(220,38,38,0.7)',
            borderColor: '#DC2626',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => 'R$ ' + v.toLocaleString('pt-BR') }
          }
        }
      }
    });
  }

  const selectMes = document.getElementById('select-mes');
  selectMes.addEventListener('change', () => loadResumo(selectMes.value));
  loadResumo(selectMes.value);

  return () => {
    isMounted = false;
    if (pizzaChart) pizzaChart.destroy();
    if (barChart) barChart.destroy();
  };
}
