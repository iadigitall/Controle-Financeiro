import { db } from './firebase.js';
import {
  collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { formatCurrency, formatDate, showToast, setLoading } from './ui.js';

export function initReceitas(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Receitas</h1>
      <p class="page-subtitle">Cadastre suas entradas de dinheiro</p>
    </div>

    <div class="card">
      <h2 class="card-title">Nova Receita</h2>
      <form id="form-receita">
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <input type="text" id="descricao" class="form-input" required placeholder="Ex: Salário, Freelance...">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Valor (R$)</label>
            <input type="number" id="valor" class="form-input" required min="0.01" step="0.01" placeholder="0,00">
          </div>
          <div class="form-group">
            <label class="form-label">Data</label>
            <input type="date" id="data" class="form-input" required>
          </div>
        </div>
        <button type="submit" class="btn btn-success" id="btn-receita">Adicionar Receita</button>
      </form>
    </div>

    <div class="card">
      <h2 class="card-title">Receitas Cadastradas</h2>
      <div id="lista-receitas"><p class="loading-text">Carregando...</p></div>
    </div>
  `;

  document.getElementById('data').valueAsDate = new Date();

  document.getElementById('form-receita').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-receita');
    setLoading(btn, true, 'Adicionar Receita');
    try {
      await addDoc(collection(db, 'receitas'), {
        descricao: document.getElementById('descricao').value.trim(),
        valor: parseFloat(document.getElementById('valor').value),
        data: document.getElementById('data').value,
        criadoEm: new Date().toISOString()
      });
      showToast('Receita adicionada com sucesso!');
      e.target.reset();
      document.getElementById('data').valueAsDate = new Date();
    } catch {
      showToast('Erro ao salvar. Tente novamente.', 'error');
    } finally {
      setLoading(btn, false, 'Adicionar Receita');
    }
  });

  const lista = document.getElementById('lista-receitas');

  lista.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('btn-delete')) return;
    if (!confirm('Deseja excluir esta receita?')) return;
    try {
      await deleteDoc(doc(db, 'receitas', e.target.dataset.id));
      showToast('Receita excluída.');
    } catch {
      showToast('Erro ao excluir.', 'error');
    }
  });

  const q = query(collection(db, 'receitas'), orderBy('data', 'desc'));
  const unsub = onSnapshot(q, (snap) => {
    const el = document.getElementById('lista-receitas');
    if (!el) return;

    if (snap.empty) {
      el.innerHTML = '<p class="empty-text">Nenhuma receita cadastrada ainda.</p>';
      return;
    }

    const total = snap.docs.reduce((sum, d) => sum + d.data().valor, 0);

    el.innerHTML = `
      <div class="table-total">Total: <strong class="text-success">${formatCurrency(total)}</strong></div>
      <table class="table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Data</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${snap.docs.map(d => `
            <tr>
              <td>${d.data().descricao}</td>
              <td class="text-success fw-bold">${formatCurrency(d.data().valor)}</td>
              <td>${formatDate(d.data().data)}</td>
              <td><button class="btn btn-danger btn-sm btn-delete" data-id="${d.id}">Excluir</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  });

  return unsub;
}
