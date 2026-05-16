import { initDashboard } from './dashboard.js';
import { initReceitas } from './receitas.js';
import { initDespesas } from './despesas.js';
import { initCategorias } from './categorias.js';

// Para adicionar uma nova página na Sprint 2 ou 3:
// 1. Crie js/novaFuncao.js com export function initNovaFuncao(container) { ... }
// 2. Importe aqui e adicione em routes
// 3. Adicione o link no index.html

const routes = {
  '':           initDashboard,
  'dashboard':  initDashboard,
  'receitas':   initReceitas,
  'despesas':   initDespesas,
  'categorias': initCategorias,
};

let currentCleanup = null;

function navigate() {
  const hash = location.hash.replace('#', '') || 'dashboard';
  const app = document.getElementById('app');

  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  app.innerHTML = '';

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.route === hash);
  });

  const handler = routes[hash] || routes['dashboard'];
  currentCleanup = handler(app) || null;
}

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);
