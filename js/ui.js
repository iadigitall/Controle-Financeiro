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

export function showFieldError(inputEl, message) {
  inputEl.classList.add('input-error');
  let errEl = inputEl.parentElement.querySelector('.field-error');
  if (!errEl) {
    errEl = document.createElement('span');
    errEl.className = 'field-error';
    errEl.setAttribute('role', 'alert');
    inputEl.parentElement.appendChild(errEl);
  }
  errEl.textContent = message;
  const clear = () => {
    inputEl.classList.remove('input-error');
    if (errEl.parentNode) errEl.remove();
  };
  inputEl.addEventListener('input', clear, { once: true });
  inputEl.addEventListener('change', clear, { once: true });
}

export function clearFieldErrors(formEl) {
  formEl.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  formEl.querySelectorAll('.field-error').forEach(el => el.remove());
}
