const API_URL = 'http://localhost:3000/api';

let todosAgendamentos = [];

document.addEventListener('DOMContentLoaded', async function () {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario) {
    window.location.href = '../Pagina de login/Pagina de Login.html';
    return;
  }
  await carregarAgendamentos(usuario.id);
});

// ─── Carrega agendamentos do banco ────────────────────────────────────────────
async function carregarAgendamentos(clienteId) {
  const loading = document.getElementById('loading');
  const lista   = document.getElementById('lista');
  const vazio   = document.getElementById('vazio');

  loading.style.display = 'flex';
  lista.innerHTML = '';
  vazio.style.display = 'none';

  try {
    const resposta = await fetch(`${API_URL}/meus-agendamentos/${clienteId}`);
    const dados    = await resposta.json();
    todosAgendamentos = dados;
    renderizarAgendamentos(todosAgendamentos);
  } catch (err) {
    console.error(err);
    loading.style.display = 'none';
    vazio.style.display   = 'flex';
    vazio.querySelector('h3').textContent = 'Erro ao carregar agendamentos.';
    vazio.querySelector('p').textContent  = 'Verifique se o servidor está rodando.';
  }
}

// ─── Renderiza os cards ──────────────────────────────────────────────────────
function renderizarAgendamentos(lista) {
  const container = document.getElementById('lista');
  const loading   = document.getElementById('loading');
  const vazio     = document.getElementById('vazio');

  loading.style.display = 'none';
  container.innerHTML   = '';

  if (lista.length === 0) {
    vazio.style.display = 'flex';
    return;
  }

  vazio.style.display = 'none';

  lista.forEach(ag => {
    const horario    = ag.horario ? ag.horario.substring(0, 5) : '';
    const inicial    = ag.profissional_nome ? ag.profissional_nome.charAt(0).toUpperCase() : '?';
    const statusClass = ag.status === 'cancelado' ? 'cancelado' : 'confirmado';
    const statusLabel = ag.status === 'cancelado' ? 'Cancelado' : 'Confirmado';

    const card = document.createElement('div');
    card.className = `ag-card`;
    card.dataset.status = statusClass;
    card.innerHTML = `
      <div class="ag-avatar">${inicial}</div>
      <div class="ag-info">
        <div class="ag-topo">
          <span class="ag-profissional">${ag.profissional_nome}</span>
          <span class="status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="ag-area">${ag.profissao || ''} — ${ag.nome_estab || ''}</div>
        <div class="ag-detalhes">
          <span>📅 ${ag.dia_semana}</span>
          <span>⏰ ${horario}</span>
          ${ag.cidade ? `<span>📍 ${ag.bairro ? ag.bairro + ' — ' : ''}${ag.cidade}</span>` : ''}
          ${ag.tel_estab ? `<span>📞 ${ag.tel_estab}</span>` : ''}
        </div>
      </div>
      <div class="ag-acoes">
        ${ag.status !== 'cancelado' ? `<button class="btn-cancelar" onclick="cancelarAgendamento(${ag.id}, this)">Cancelar</button>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

// ─── Filtra por status ────────────────────────────────────────────────────────
function filtrar(btn, status) {
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const filtrados = status === 'todos'
    ? todosAgendamentos
    : todosAgendamentos.filter(ag => {
        const s = ag.status === 'cancelado' ? 'cancelado' : 'confirmado';
        return s === status;
      });

  renderizarAgendamentos(filtrados);
}

// ─── Cancela agendamento ──────────────────────────────────────────────────────
async function cancelarAgendamento(id, btn) {
  if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

  btn.disabled    = true;
  btn.textContent = 'Cancelando...';

  try {
    const resposta = await fetch(`${API_URL}/agendamentos/${id}/cancelar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await resposta.json();

    if (resposta.ok) {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      await carregarAgendamentos(usuario.id);
    } else {
      alert(json.erro || 'Erro ao cancelar agendamento.');
      btn.disabled    = false;
      btn.textContent = 'Cancelar';
    }
  } catch (err) {
    alert('Não foi possível conectar ao servidor.');
    btn.disabled    = false;
    btn.textContent = 'Cancelar';
  }
}