const API_URL = 'http://localhost:3000/api';

let todosAgendamentosModal = [];

document.addEventListener('DOMContentLoaded', async function () {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario || usuario.tipo !== 'profissional') return;
  await carregarEstabelecimentos(usuario.id);
});

// ─── Carrega estabelecimentos ─────────────────────────────────────────────────
async function carregarEstabelecimentos(usuarioId) {
  const loading = document.getElementById('loading');
  const lista   = document.getElementById('lista');
  const vazio   = document.getElementById('vazio');

  loading.style.display = 'flex';
  lista.innerHTML = '';
  vazio.style.display = 'none';

  try {
    const resposta = await fetch(`${API_URL}/meus-estabelecimentos/${usuarioId}`);
    const dados    = await resposta.json();

    loading.style.display = 'none';

    if (dados.length === 0) {
      vazio.style.display = 'flex';
      return;
    }

    dados.forEach(estab => {
      const card = document.createElement('div');
      card.className = 'estab-card';
      card.innerHTML = `
        <div class="estab-header">
          <div class="estab-avatar">${estab.nome_estab ? estab.nome_estab.charAt(0).toUpperCase() : '?'}</div>
          <div class="estab-info">
            <div class="estab-nome">${estab.nome_estab || 'Sem nome'}</div>
            <div class="estab-area">${estab.profissao || ''}</div>
          </div>
          <div class="estab-acoes">
            <button class="btn-editar" onclick="abrirEditar(${JSON.stringify(estab).replace(/"/g, '&quot;')})">✏️ Editar</button>
            <button class="btn-ver-agendamentos" onclick="abrirAgendamentos()">📋 Agendamentos</button>
          </div>
        </div>

        <div class="estab-detalhes">
          ${estab.endereco ? `
            <div class="estab-detalhe">
              <span class="detalhe-label">📍 Endereço</span>
              <span class="detalhe-val">${estab.endereco}${estab.bairro ? ', ' + estab.bairro : ''}${estab.cidade ? ' — ' + estab.cidade : ''}</span>
            </div>` : ''}
          ${estab.cep ? `
            <div class="estab-detalhe">
              <span class="detalhe-label">📮 CEP</span>
              <span class="detalhe-val">${estab.cep}</span>
            </div>` : ''}
          ${estab.tel_estab ? `
            <div class="estab-detalhe">
              <span class="detalhe-label">📞 Telefone</span>
              <span class="detalhe-val">${estab.tel_estab}</span>
            </div>` : ''}
          ${estab.cnpj ? `
            <div class="estab-detalhe">
              <span class="detalhe-label">🏛️ CNPJ</span>
              <span class="detalhe-val">${estab.cnpj}</span>
            </div>` : ''}
          ${estab.descricao ? `
            <div class="estab-detalhe full">
              <span class="detalhe-label">💬 Descrição</span>
              <span class="detalhe-val">${estab.descricao}</span>
            </div>` : ''}
        </div>
      `;
      lista.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    loading.style.display = 'none';
    vazio.style.display   = 'flex';
  }
}

// ─── Abre modal de edição ─────────────────────────────────────────────────────
function abrirEditar(estab) {
  document.getElementById('edit-profissao').value   = estab.profissao   || '';
  document.getElementById('edit-nome-estab').value  = estab.nome_estab  || '';
  document.getElementById('edit-cnpj').value        = estab.cnpj        || '';
  document.getElementById('edit-tel').value         = estab.tel_estab   || '';
  document.getElementById('edit-endereco').value    = estab.endereco    || '';
  document.getElementById('edit-bairro').value      = estab.bairro      || '';
  document.getElementById('edit-cidade').value      = estab.cidade      || '';
  document.getElementById('edit-cep').value         = estab.cep         || '';
  document.getElementById('edit-descricao').value   = estab.descricao   || '';
  document.getElementById('alerta-editar').innerHTML = '';

  document.getElementById('modal-editar').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ─── Salva alterações do estabelecimento ──────────────────────────────────────
async function salvarEstabelecimento(e) {
  e.preventDefault();
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  const dados = {
    profissao:  document.getElementById('edit-profissao').value,
    nome_estab: document.getElementById('edit-nome-estab').value.trim(),
    cnpj:       document.getElementById('edit-cnpj').value.trim(),
    tel_estab:  document.getElementById('edit-tel').value.trim(),
    endereco:   document.getElementById('edit-endereco').value.trim(),
    bairro:     document.getElementById('edit-bairro').value.trim(),
    cidade:     document.getElementById('edit-cidade').value.trim(),
    cep:        document.getElementById('edit-cep').value.trim(),
    descricao:  document.getElementById('edit-descricao').value.trim(),
  };

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled    = true;
  btn.textContent = 'Salvando...';

  try {
    const resposta = await fetch(`${API_URL}/estabelecimento/${usuario.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const json = await resposta.json();

    if (resposta.ok) {
      mostrarAlerta('alerta-editar', '✅ Estabelecimento atualizado com sucesso!', 'sucesso');
      setTimeout(() => {
        fecharModalId('modal-editar');
        carregarEstabelecimentos(usuario.id);
      }, 1500);
    } else {
      mostrarAlerta('alerta-editar', json.erro || 'Erro ao salvar.', 'erro');
    }
  } catch (err) {
    mostrarAlerta('alerta-editar', 'Não foi possível conectar ao servidor.', 'erro');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Salvar alterações';
  }
}

// ─── Abre modal de agendamentos ───────────────────────────────────────────────
async function abrirAgendamentos() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  document.getElementById('modal-agendamentos').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.getElementById('modal-loading').style.display = 'flex';
  document.getElementById('modal-lista').innerHTML = '';
  document.getElementById('modal-vazio').style.display = 'none';

  try {
    const resposta = await fetch(`${API_URL}/agendamentos-profissional/${usuario.id}`);
    todosAgendamentosModal = await resposta.json();
    renderizarAgendamentosModal(todosAgendamentosModal);
  } catch (err) {
    document.getElementById('modal-loading').style.display = 'none';
    document.getElementById('modal-vazio').style.display = 'block';
  }
}

// ─── Renderiza agendamentos no modal ──────────────────────────────────────────
function renderizarAgendamentosModal(lista) {
  const container = document.getElementById('modal-lista');
  const loading   = document.getElementById('modal-loading');
  const vazio     = document.getElementById('modal-vazio');

  loading.style.display = 'none';
  container.innerHTML   = '';

  if (lista.length === 0) {
    vazio.style.display = 'block';
    return;
  }

  vazio.style.display = 'none';

  lista.forEach(ag => {
    const horario     = ag.horario ? ag.horario.substring(0, 5) : '';
    const statusClass = ag.status === 'cancelado' ? 'cancelado' : ag.status === 'concluido' ? 'concluido' : 'confirmado';
    const statusLabel = ag.status === 'cancelado' ? 'Cancelado' : ag.status === 'concluido' ? 'Concluído' : 'Confirmado';

    const item = document.createElement('div');
    item.className = 'ag-item';
    item.dataset.status = statusClass;
    item.innerHTML = `
      <div class="ag-item-info">
        <div class="ag-item-topo">
          <span class="ag-item-cliente">👤 ${ag.cliente_nome}</span>
          <span class="status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="ag-item-detalhes">
          <span>📅 ${ag.dia_semana}</span>
          <span>⏰ ${horario}</span>
          ${ag.cliente_telefone ? `<span>📞 ${ag.cliente_telefone}</span>` : ''}
          ${ag.cliente_email ? `<span>✉️ ${ag.cliente_email}</span>` : ''}
        </div>
        ${ag.status !== 'cancelado' && ag.status !== 'concluido' ? `
        <div class="ag-item-acoes">
          <button class="btn-concluir" onclick="atualizarAgendamento(${ag.id}, 'concluir')">✅ Concluir</button>
          <button class="btn-cancelar-prof" onclick="atualizarAgendamento(${ag.id}, 'cancelar-profissional')">❌ Cancelar</button>
        </div>` : ''}
      </div>
    `;
    container.appendChild(item);
  });
}

// ─── Filtra agendamentos no modal ─────────────────────────────────────────────
function filtrarModal(btn, status) {
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const filtrados = status === 'todos'
    ? todosAgendamentosModal
    : todosAgendamentosModal.filter(ag => ag.status === status);

  renderizarAgendamentosModal(filtrados);
}

// ─── Utilitários de modal ─────────────────────────────────────────────────────
function fecharModalId(id) {
  document.getElementById(id).style.display = 'none';
  document.body.style.overflow = '';
}

function fecharModalFora(e, id) {
  if (e.target.id === id) fecharModalId(id);
}

// ─── Alerta ───────────────────────────────────────────────────────────────────
function mostrarAlerta(elementId, mensagem, tipo) {
  const div = document.getElementById(elementId);
  div.innerHTML = `<div class="alerta ${tipo}">${mensagem}</div>`;
  setTimeout(() => div.innerHTML = '', 4000);
}

// ─── Abre modal de cadastro ───────────────────────────────────────────────────
function abrirCadastro() {
  document.getElementById('novo-profissao').value   = '';
  document.getElementById('novo-nome-estab').value  = '';
  document.getElementById('novo-cnpj').value        = '';
  document.getElementById('novo-tel').value         = '';
  document.getElementById('novo-endereco').value    = '';
  document.getElementById('novo-bairro').value      = '';
  document.getElementById('novo-cidade').value      = '';
  document.getElementById('novo-cep').value         = '';
  document.getElementById('novo-descricao').value   = '';
  document.getElementById('alerta-cadastrar').innerHTML = '';

  document.getElementById('modal-cadastrar').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ─── Cadastra novo estabelecimento ────────────────────────────────────────────
async function cadastrarEstabelecimento(e) {
  e.preventDefault();
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  const dados = {
    usuarioId:  usuario.id,
    profissao:  document.getElementById('novo-profissao').value,
    nome_estab: document.getElementById('novo-nome-estab').value.trim(),
    cnpj:       document.getElementById('novo-cnpj').value.trim(),
    tel_estab:  document.getElementById('novo-tel').value.trim(),
    endereco:   document.getElementById('novo-endereco').value.trim(),
    bairro:     document.getElementById('novo-bairro').value.trim(),
    cidade:     document.getElementById('novo-cidade').value.trim(),
    cep:        document.getElementById('novo-cep').value.trim(),
    descricao:  document.getElementById('novo-descricao').value.trim(),
  };

  if (!dados.profissao || !dados.nome_estab || !dados.tel_estab || !dados.endereco || !dados.cidade) {
    return mostrarAlerta('alerta-cadastrar', 'Preencha todos os campos obrigatórios.', 'erro');
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled    = true;
  btn.textContent = 'Cadastrando...';

  try {
    const resposta = await fetch(`${API_URL}/estabelecimento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const json = await resposta.json();

    if (resposta.ok) {
      mostrarAlerta('alerta-cadastrar', '✅ Estabelecimento cadastrado com sucesso!', 'sucesso');
      setTimeout(() => {
        fecharModalId('modal-cadastrar');
        carregarEstabelecimentos(usuario.id);
      }, 1500);
    } else {
      mostrarAlerta('alerta-cadastrar', json.erro || 'Erro ao cadastrar.', 'erro');
    }
  } catch (err) {
    mostrarAlerta('alerta-cadastrar', 'Não foi possível conectar ao servidor.', 'erro');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Cadastrar estabelecimento';
  }
}

// ─── Atualiza status do agendamento ──────────────────────────────────────────
async function atualizarAgendamento(id, acao) {
  const confirmar = acao === 'concluir'
    ? 'Marcar este agendamento como concluído?'
    : 'Cancelar este agendamento?';

  if (!confirm(confirmar)) return;

  try {
    const resposta = await fetch(`${API_URL}/agendamentos/${id}/${acao}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await resposta.json();

    if (resposta.ok) {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      await abrirAgendamentos();
    } else {
      alert(json.erro || 'Erro ao atualizar agendamento.');
    }
  } catch (err) {
    alert('Não foi possível conectar ao servidor.');
  }
}