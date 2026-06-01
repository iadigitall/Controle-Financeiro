import { initDashboard } from './dashboard.js';
import { initReceitas } from './receitas.js';
import { initDespesas } from './despesas.js';
import { initCategorias } from './categorias.js';
import { initResumo } from './resumo.js';

const routes = {
  '':           initDashboard,
  'dashboard':  initDashboard,
  'receitas':   initReceitas,
  'despesas':   initDespesas,
  'categorias': initCategorias,
  'resumo':     initResumo,
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
