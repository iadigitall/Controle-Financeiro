import { db } from './firebase.js';
import {
  collection, addDoc, deleteDoc, updateDoc, doc, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { formatCurrency, formatDate, showToast, setLoading, openModal, closeModal, escapeHtml } from './ui.js';

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
  let docsCache = {};

  lista.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('btn-edit')) {
      const data = docsCache[id];
      openModal(`
        <div class="modal-header">
          <span class="modal-title">Editar Receita</span>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <form id="form-edit-receita">
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <input type="text" id="edit-descricao" class="form-input" required value="${escapeHtml(data.descricao)}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Valor (R$)</label>
              <input type="number" id="edit-valor" class="form-input" required min="0.01" step="0.01" value="${data.valor}">
            </div>
            <div class="form-group">
              <label class="form-label">Data</label>
              <input type="date" id="edit-data" class="form-input" required value="${data.data}">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="cancel-edit">Cancelar</button>
            <button type="submit" class="btn btn-success" id="btn-save-edit">Salvar</button>
          </div>
        </form>
      `);
      document.getElementById('modal-close-btn').addEventListener('click', closeModal);
      document.getElementById('cancel-edit').addEventListener('click', closeModal);
      document.getElementById('form-edit-receita').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const btn = document.getElementById('btn-save-edit');
        setLoading(btn, true, 'Salvar');
        try {
          await updateDoc(doc(db, 'receitas', id), {
            descricao: document.getElementById('edit-descricao').value.trim(),
            valor: parseFloat(document.getElementById('edit-valor').value),
            data: document.getElementById('edit-data').value
          });
          showToast('Receita atualizada!');
          closeModal();
        } catch {
          showToast('Erro ao atualizar.', 'error');
        } finally {
          setLoading(btn, false, 'Salvar');
        }
      });
      return;
    }

    if (e.target.classList.contains('btn-delete')) {
      openModal(`
        <div class="modal-header">
          <span class="modal-title">Excluir Receita</span>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <p class="modal-confirm">Tem certeza que deseja excluir esta receita?<br>Essa ação não pode ser desfeita.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="cancel-del">Cancelar</button>
          <button class="btn btn-danger" id="confirm-del">Excluir</button>
        </div>
      `);
      document.getElementById('modal-close-btn').addEventListener('click', closeModal);
      document.getElementById('cancel-del').addEventListener('click', closeModal);
      document.getElementById('confirm-del').addEventListener('click', async () => {
        try {
          await deleteDoc(doc(db, 'receitas', id));
          showToast('Receita excluída.');
          closeModal();
        } catch {
          showToast('Erro ao excluir.', 'error');
        }
      });
    }
  });

  const q = query(collection(db, 'receitas'), orderBy('data', 'desc'));
  const unsub = onSnapshot(q, (snap) => {
    const el = document.getElementById('lista-receitas');
    if (!el) return;

    docsCache = {};
    snap.docs.forEach(d => { docsCache[d.id] = d.data(); });

    if (snap.empty) {
      el.innerHTML = '<p class="empty-text">Nenhuma receita cadastrada ainda.</p>';
      return;
    }

    const total = snap.docs.reduce((sum, d) => sum + d.data().valor, 0);

    el.innerHTML = `
      <div class="table-total">Total: <strong class="text-success">${formatCurrency(total)}</strong></div>
      <div class="table-wrapper">
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
                <td>${escapeHtml(d.data().descricao)}</td>
                <td class="text-success fw-bold">${formatCurrency(d.data().valor)}</td>
                <td>${formatDate(d.data().data)}</td>
                <td class="table-actions">
                  <button class="btn btn-primary btn-sm btn-edit" data-id="${d.id}">Editar</button>
                  <button class="btn btn-danger btn-sm btn-delete" data-id="${d.id}">Excluir</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  });

  return unsub;
}
