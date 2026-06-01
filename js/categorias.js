import { db } from './firebase.js';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showToast, setLoading, openModal, closeModal } from './ui.js';

const CORES = [
  { label: 'Vermelho',  value: '#EF4444' },
  { label: 'Azul',      value: '#3B82F6' },
  { label: 'Verde',     value: '#22C55E' },
  { label: 'Amarelo',   value: '#EAB308' },
  { label: 'Roxo',      value: '#A855F7' },
  { label: 'Laranja',   value: '#F97316' },
  { label: 'Rosa',      value: '#EC4899' },
  { label: 'Cinza',     value: '#6B7280' },
];

export function initCategorias(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Categorias</h1>
      <p class="page-subtitle">Organize suas despesas por categoria</p>
    </div>

    <div class="card">
      <h2 class="card-title">Nova Categoria</h2>
      <form id="form-categoria">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nome</label>
            <input type="text" id="nome" class="form-input" required placeholder="Ex: Alimentação, Transporte...">
          </div>
          <div class="form-group">
            <label class="form-label">Cor</label>
            <select id="cor" class="form-input" required>
              ${CORES.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" id="btn-categoria">Adicionar Categoria</button>
      </form>
    </div>

    <div class="card">
      <h2 class="card-title">Categorias Cadastradas</h2>
      <div id="lista-categorias"><p class="loading-text">Carregando...</p></div>
    </div>
  `;

  document.getElementById('form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-categoria');
    setLoading(btn, true, 'Adicionar Categoria');
    try {
      await addDoc(collection(db, 'categorias'), {
        nome: document.getElementById('nome').value.trim(),
        cor: document.getElementById('cor').value,
        criadoEm: new Date().toISOString()
      });
      showToast('Categoria adicionada!');
      e.target.reset();
    } catch {
      showToast('Erro ao salvar.', 'error');
    } finally {
      setLoading(btn, false, 'Adicionar Categoria');
    }
  });

  const lista = document.getElementById('lista-categorias');

  lista.addEventListener('click', (e) => {
    if (!e.target.classList.contains('btn-delete')) return;
    const id = e.target.dataset.id;
    openModal(`
      <div class="modal-header">
        <span class="modal-title">Excluir Categoria</span>
        <button class="modal-close" id="modal-close-btn">&times;</button>
      </div>
      <p class="modal-confirm">Tem certeza que deseja excluir esta categoria?<br>Essa ação não pode ser desfeita.</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="cancel-del">Cancelar</button>
        <button class="btn btn-danger" id="confirm-del">Excluir</button>
      </div>
    `);
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-del').addEventListener('click', closeModal);
    document.getElementById('confirm-del').addEventListener('click', async () => {
      try {
        await deleteDoc(doc(db, 'categorias', id));
        showToast('Categoria excluída.');
        closeModal();
      } catch {
        showToast('Erro ao excluir.', 'error');
      }
    });
  });

  const unsub = onSnapshot(collection(db, 'categorias'), (snap) => {
    const el = document.getElementById('lista-categorias');
    if (!el) return;

    if (snap.empty) {
      el.innerHTML = '<p class="empty-text">Nenhuma categoria cadastrada ainda.</p>';
      return;
    }

    el.innerHTML = `
      <div class="categorias-grid">
        ${snap.docs.map(d => `
          <div class="categoria-item">
            <span class="categoria-cor" style="background:${d.data().cor}"></span>
            <span class="categoria-nome">${d.data().nome}</span>
            <button class="btn btn-danger btn-sm btn-delete" data-id="${d.id}">Excluir</button>
          </div>
        `).join('')}
      </div>
    `;
  });

  return unsub;
}
