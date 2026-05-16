import { db } from './firebase.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { formatCurrency } from './ui.js';

export function initDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Dashboard</h1>
      <p class="page-subtitle">Visão geral das suas finanças</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card stat-success">
        <div class="stat-label">Total Receitas</div>
        <div class="stat-value text-success" id="total-receitas">R$ 0,00</div>
      </div>
      <div class="stat-card stat-danger">
        <div class="stat-label">Total Despesas</div>
        <div class="stat-value text-danger" id="total-despesas">R$ 0,00</div>
      </div>
      <div class="stat-card stat-primary">
        <div class="stat-label">Saldo</div>
        <div class="stat-value" id="saldo">R$ 0,00</div>
      </div>
    </div>
  `;

  let totalReceitas = 0;
  let totalDespesas = 0;

  const updateSaldo = () => {
    const el = document.getElementById('saldo');
    if (!el) return;
    const saldo = totalReceitas - totalDespesas;
    el.textContent = formatCurrency(saldo);
    el.className = `stat-value ${saldo >= 0 ? 'text-success' : 'text-danger'}`;
  };

  const unsubReceitas = onSnapshot(collection(db, 'receitas'), (snap) => {
    totalReceitas = snap.docs.reduce((sum, d) => sum + (d.data().valor || 0), 0);
    const el = document.getElementById('total-receitas');
    if (el) el.textContent = formatCurrency(totalReceitas);
    updateSaldo();
  });

  const unsubDespesas = onSnapshot(collection(db, 'despesas'), (snap) => {
    totalDespesas = snap.docs.reduce((sum, d) => sum + (d.data().valor || 0), 0);
    const el = document.getElementById('total-despesas');
    if (el) el.textContent = formatCurrency(totalDespesas);
    updateSaldo();
  });

  return () => {
    unsubReceitas();
    unsubDespesas();
  };
}
