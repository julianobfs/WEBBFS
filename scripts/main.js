import { signInWithEmailPassword } from './auth/login.js';
import { getSession, onAuthStateChange, signOut } from './auth/session.js';
import { fetchRecords, renderRecords } from './ui/records.js';

const els = {
  loginView: document.getElementById('login-view'),
  recordsView: document.getElementById('records-view'),
  logoutBtn: document.getElementById('logout-btn'),
  sessionEmail: document.getElementById('session-email'),

  loginForm: document.getElementById('login-form'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  loginClear: document.getElementById('login-clear'),
  loginMessage: document.getElementById('login-message'),

  filtersForm: document.getElementById('filters-form'),
  filtersClear: document.getElementById('filters-clear'),
  refreshBtn: document.getElementById('refresh-btn'),
  recordsMessage: document.getElementById('records-message'),
  recordsTbody: document.getElementById('records-tbody'),

  fCodAtivEquipe: document.getElementById('f-cod-ativ-equipe'),
  fDateFrom: document.getElementById('f-date-from'),
  fDateTo: document.getElementById('f-date-to'),
  fTimeFrom: document.getElementById('f-time-from'),
  fTimeTo: document.getElementById('f-time-to'),
};

function setMessage(el, text, kind = 'info') {
  el.textContent = text ?? '';
  el.classList.toggle('message--error', kind === 'error');
}

function show(view) {
  const isLogin = view === 'login';
  els.loginView.hidden = !isLogin;
  els.recordsView.hidden = isLogin;
  els.logoutBtn.hidden = isLogin;
}

function getFiltersFromUi() {
  const cod = els.fCodAtivEquipe.value ? Number(els.fCodAtivEquipe.value) : null;
  return {
    cod_ativ_equipe: Number.isFinite(cod) ? cod : null,
    data_acao_from: els.fDateFrom.value || null,
    data_acao_to: els.fDateTo.value || null,
    hora_acao_from: els.fTimeFrom.value || null,
    hora_acao_to: els.fTimeTo.value || null,
  };
}

async function refreshRecords() {
  setMessage(els.recordsMessage, 'Carregando registros...');
  try {
    const records = await fetchRecords(getFiltersFromUi());
    renderRecords(els.recordsTbody, records);
    setMessage(els.recordsMessage, `OK. ${records.length} registro(s).`);
  } catch (e) {
    setMessage(els.recordsMessage, e?.message ?? 'Erro ao carregar registros.', 'error');
  }
}

function applySession(session) {
  if (!session) {
    els.sessionEmail.textContent = '';
    show('login');
    return;
  }

  els.sessionEmail.textContent = session.user?.email ? `Logado: ${session.user.email}` : 'Logado';
  show('records');
  void refreshRecords();
}

els.loginForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  setMessage(els.loginMessage, 'Entrando...');
  try {
    const email = els.loginEmail.value.trim();
    const password = els.loginPassword.value;
    await signInWithEmailPassword({ email, password });
    setMessage(els.loginMessage, 'OK.');
  } catch (e) {
    setMessage(els.loginMessage, e?.message ?? 'Falha no login.', 'error');
  }
});

els.loginClear.addEventListener('click', () => {
  els.loginEmail.value = '';
  els.loginPassword.value = '';
  setMessage(els.loginMessage, '');
});

els.logoutBtn.addEventListener('click', async () => {
  try {
    await signOut();
  } catch (e) {
    // Melhor effort: se falhar, ainda assim limpa UI no próximo auth event.
    console.error(e);
  }
});

els.filtersForm.addEventListener('submit', (ev) => {
  ev.preventDefault();
  void refreshRecords();
});

els.filtersClear.addEventListener('click', () => {
  els.fCodAtivEquipe.value = '';
  els.fDateFrom.value = '';
  els.fDateTo.value = '';
  els.fTimeFrom.value = '';
  els.fTimeTo.value = '';
  void refreshRecords();
});

els.refreshBtn.addEventListener('click', () => void refreshRecords());

onAuthStateChange((session) => applySession(session));

const initialSession = await getSession();
applySession(initialSession);

