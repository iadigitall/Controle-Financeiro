export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function setLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Salvando...' : label;
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function openModal(html) {
  const existing = document.getElementById('modal-root');
  if (existing) existing.remove();
  const root = document.createElement('div');
  root.id = 'modal-root';
  root.className = 'modal-overlay';
  root.innerHTML = `<div class="modal">${html}</div>`;
  root.addEventListener('click', (e) => { if (e.target === root) closeModal(); });
  document.body.appendChild(root);
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.remove();
}
