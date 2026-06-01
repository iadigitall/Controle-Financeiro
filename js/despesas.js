import { db } from './firebase.js';
import {
  collection, addDoc, deleteDoc, updateDoc, doc, query, orderBy, onSnapshot, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { formatCurrency, formatDate, showToast, setLoading, openModal, closeModal, escapeHtml } from './ui.js';

export function initDespesas(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Despesas</h1>
      <p class="page-subtitle">Cadastre suas saídas de dinheiro</p>
    </div>

    <div class="card">
      <h2 class="card-title">Nova Despesa</h2>
      <form id="form-despesa">
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <input type="text" id="descricao" class="form-input" required placeholder="Ex: Mercado, Aluguel...">
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
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select id="categoriaId" class="form-input" required>
            <option value="">Selecione uma categoria...</option>
          </select>
        </div>
        <button type="submit" class="btn btn-danger" id="btn-despesa">Adicionar Despesa</button>
      </form>
    </div>

    <div class="card">
      <h2 class="card-title">Despesas Cadastradas</h2>
      <div id="lista-despesas"><p class="loading-text">Carregando...</p></div>
    </div>
  `;

  document.getElementById('data').valueAsDate = new Date();

  getDocs(collection(db, 'categorias')).then((snap) => {
    const select = document.getElementById('categoriaId');
    if (!select) return;
    snap.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.data().nome;
      select.appendChild(opt);
    });
  });

  document.getElementById('form-despesa').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-despesa');
    const select = document.getElementById('categoriaId');
    setLoading(btn, true, 'Adicionar Despesa');
    try {
      await addDoc(collection(db, 'despesas'), {
        descricao: document.getElementById('descricao').value.trim(),
        valor: parseFloat(document.getElementById('valor').value),
        data: document.getElementById('data').value,
        categoriaId: select.value,
        categoriaNome: select.selectedOptions[0]?.text || '',
        criadoEm: new Date().toISOString()
      });
      showToast('Despesa adicionada com sucesso!');
      e.target.reset();
      document.getElementById('data').valueAsDate = new Date();
    } catch {
      showToast('Erro ao salvar. Tente novamente.', 'error');
    } finally {
      setLoading(btn, false, 'Adicionar Despesa');
    }
  });

  const lista = document.getElementById('lista-despesas');
  let docsCache = {};

  lista.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('btn-edit')) {
      const data = docsCache[id];
      const catSnap = await getDocs(collection(db, 'categorias'));
      const catOptions = catSnap.docs.map(c =>
        `<option value="${c.id}"${c.id === data.categoriaId ? ' selected' : ''}>${escapeHtml(c.data().nome)}</option>`
      ).join('');

      openModal(`
        <div class="modal-header">
          <span class="modal-title">Editar Despesa</span>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <form id="form-edit-despesa">
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
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select id="edit-categoriaId" class="form-input" required>
              <option value="">Selecione...</option>
              ${catOptions}
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="cancel-edit">Cancelar</button>
            <button type="submit" class="btn btn-danger" id="btn-save-edit">Salvar</button>
          </div>
        </form>
      `);
      document.getElementById('modal-close-btn').addEventListener('click', closeModal);
      document.getElementById('cancel-edit').addEventListener('click', closeModal);
      document.getElementById('form-edit-despesa').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const btn = document.getElementById('btn-save-edit');
        const select = document.getElementById('edit-categoriaId');
        setLoading(btn, true, 'Salvar');
        try {
          await updateDoc(doc(db, 'despesas', id), {
            descricao: document.getElementById('edit-descricao').value.trim(),
            valor: parseFloat(document.getElementById('edit-valor').value),
            data: document.getElementById('edit-data').value,
            categoriaId: select.value,
            categoriaNome: select.selectedOptions[0]?.text || ''
          });
          showToast('Despesa atualizada!');
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
          <span class="modal-title">Excluir Despesa</span>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <p class="modal-confirm">Tem certeza que deseja excluir esta despesa?<br>Essa ação não pode ser desfeita.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="cancel-del">Cancelar</button>
          <button class="btn btn-danger" id="confirm-del">Excluir</button>
        </div>
      `);
      document.getElementById('modal-close-btn').addEventListener('click', closeModal);
      document.getElementById('cancel-del').addEventListener('click', closeModal);
      document.getElementById('confirm-del').addEventListener('click', async () => {
        try {
          await deleteDoc(doc(db, 'despesas', id));
          showToast('Despesa excluída.');
          closeModal();
        } catch {
          showToast('Erro ao excluir.', 'error');
        }
      });
    }
  });

  const q = query(collection(db, 'despesas'), orderBy('data', 'desc'));
  const unsub = onSnapshot(q, (snap) => {
    const el = document.getElementById('lista-despesas');
    if (!el) return;

    docsCache = {};
    snap.docs.forEach(d => { docsCache[d.id] = d.data(); });

    if (snap.empty) {
      el.innerHTML = '<p class="empty-text">Nenhuma despesa cadastrada ainda.</p>';
      return;
    }

    const total = snap.docs.reduce((sum, d) => sum + d.data().valor, 0);

    el.innerHTML = `
      <div class="table-total">Total: <strong class="text-danger">${formatCurrency(total)}</strong></div>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${snap.docs.map(d => `
              <tr>
                <td>${escapeHtml(d.data().descricao)}</td>
                <td><span class="badge">${escapeHtml(d.data().categoriaNome || '-')}</span></td>
                <td class="text-danger fw-bold">${formatCurrency(d.data().valor)}</td>
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
