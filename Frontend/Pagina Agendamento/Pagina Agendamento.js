const API_URL = 'http://localhost:3000/api';

let todosProfissionais = [];

// ─── Carrega profissionais ao abrir a página ─────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
  await carregarProfissionais();
});

async function carregarProfissionais() {
  const loading = document.getElementById('loading');
  const lista   = document.getElementById('lista-profissionais');
  const vazio   = document.getElementById('vazio');

  loading.style.display = 'flex';
  lista.innerHTML = '';
  vazio.style.display = 'none';

  try {
    const resposta = await fetch(`${API_URL}/profissionais`);
    const dados    = await resposta.json();
    todosProfissionais = dados;
    renderizarProfissionais(todosProfissionais);
  } catch (err) {
    console.error(err);
    loading.style.display = 'none';
    vazio.style.display   = 'flex';
    vazio.querySelector('h3').textContent = 'Erro ao carregar profissionais.';
    vazio.querySelector('p').textContent  = 'Verifique se o servidor está rodando.';
  }
}

// ─── Renderiza os cards ──────────────────────────────────────────────────────
function renderizarProfissionais(lista) {
  const container = document.getElementById('lista-profissionais');
  const loading   = document.getElementById('loading');
  const vazio     = document.getElementById('vazio');

  loading.style.display = 'none';
  container.innerHTML   = '';

  if (lista.length === 0) {
    vazio.style.display = 'flex';
    return;
  }

  vazio.style.display = 'none';

  lista.forEach(prof => {
    const inicial = prof.nome ? prof.nome.charAt(0).toUpperCase() : '?';
    const card = document.createElement('div');
    card.className = 'prof-card';
    card.innerHTML = `
      <div class="prof-avatar">${inicial}</div>
      <div class="prof-info">
        <div class="prof-nome">${prof.nome}</div>
        <div class="prof-area">${prof.profissao || 'Profissional'}</div>
        <div class="prof-estab">🏢 ${prof.nome_estab || ''}</div>
        <div class="prof-detalhes">
          ${prof.cidade    ? `<span>📍 ${prof.bairro ? prof.bairro + ' — ' : ''}${prof.cidade}</span>` : ''}
          ${prof.tel_estab ? `<span>📞 ${prof.tel_estab}</span>` : ''}
        </div>
        ${prof.descricao ? `<div class="prof-descricao">"${prof.descricao}"</div>` : ''}
      </div>
      <div class="prof-acoes">
        <button class="btn-agendar-card" onclick="abrirModal(${JSON.stringify(prof).replace(/"/g, '&quot;')})">Agendar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// ─── Filtra em tempo real ────────────────────────────────────────────────────
function filtrarProfissionais() {
  const busca = document.getElementById('input-busca').value.toLowerCase().trim();
  const area  = document.getElementById('input-area').value.toLowerCase();

  const filtrados = todosProfissionais.filter(prof => {
    const texto  = `${prof.nome} ${prof.profissao} ${prof.nome_estab} ${prof.cidade} ${prof.bairro}`.toLowerCase();
    const buscaOk = busca === '' || texto.includes(busca);
    const areaOk  = area  === '' || (prof.profissao || '').toLowerCase() === area;
    return buscaOk && areaOk;
  });

  renderizarProfissionais(filtrados);
}

// ─── Abre o modal com dados do profissional ──────────────────────────────────
async function abrirModal(prof) {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario) {
    alert('Você precisa estar logado para agendar!');
    window.location.href = '../Pagina de login/Pagina de Login.html';
    return;
  }

  // Preenche os dados do estabelecimento no modal
  document.getElementById('modal-nome').textContent     = prof.nome;
  document.getElementById('modal-area').textContent     = prof.profissao || '';
  document.getElementById('modal-estab').textContent    = prof.nome_estab || '';
  document.getElementById('modal-endereco').textContent = prof.endereco ? `${prof.endereco}, ${prof.bairro || ''} — ${prof.cidade || ''}` : '';
  document.getElementById('modal-tel').textContent      = prof.tel_estab || '';
  document.getElementById('modal-descricao').textContent = prof.descricao || '';

  // Limpa seleção anterior
  document.getElementById('horario-selecionado-id').value   = '';
  document.getElementById('horario-selecionado-txt').value  = '';
  document.getElementById('confirmacao').style.display      = 'none';
  document.getElementById('quadro-horarios').style.display  = 'block';
  document.getElementById('btn-confirmar').style.display    = 'none';

  // Carrega horários
  await carregarHorarios(prof.id);

  document.getElementById('modal-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ─── Fecha o modal ───────────────────────────────────────────────────────────
function fecharModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

// ─── Carrega e monta o quadro de horários ────────────────────────────────────
async function carregarHorarios(profissionalId) {
  const quadro = document.getElementById('quadro-horarios');
  quadro.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:20px">Carregando horários...</p>';

  try {
    const resposta = await fetch(`${API_URL}/horarios/${profissionalId}`);
    const horarios = await resposta.json();

    if (horarios.length === 0) {
      quadro.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:20px">Nenhum horário cadastrado.</p>';
      return;
    }

    // Organiza por dia
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const porDia = {};
    dias.forEach(d => porDia[d] = []);
    horarios.forEach(h => {
      if (porDia[h.dia_semana] !== undefined) {
        porDia[h.dia_semana].push(h);
      }
    });

    // Monta a tabela
    const diasComHorario = dias.filter(d => porDia[d].length > 0);

    let html = '<div class="quadro-tabela"><table><thead><tr><th>Horário</th>';
    diasComHorario.forEach(d => html += `<th>${d}</th>`);
    html += '</tr></thead><tbody>';

    // Pega todos os horários únicos
    const horariosUnicos = [...new Set(horarios.map(h => h.horario))].sort();

    horariosUnicos.forEach(hora => {
      const horaFormatada = hora.substring(0, 5);
      html += `<tr><td class="hora-col">${horaFormatada}</td>`;
      diasComHorario.forEach(dia => {
        const slot = porDia[dia].find(h => h.horario === hora);
        if (slot) {
          if (slot.disponivel) {
            html += `<td><button class="slot disponivel" onclick="selecionarHorario(${slot.id}, '${dia} ${horaFormatada}', this)">✅</button></td>`;
          } else {
            html += `<td><button class="slot ocupado" disabled>❌</button></td>`;
          }
        } else {
          html += `<td><span class="slot vazio">—</span></td>`;
        }
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    quadro.innerHTML = html;

  } catch (err) {
    quadro.innerHTML = '<p style="color:#f87171;text-align:center;padding:20px">Erro ao carregar horários.</p>';
  }
}

// ─── Seleciona um horário disponível ────────────────────────────────────────
function selecionarHorario(id, texto, btn) {
  // Remove seleção anterior
  document.querySelectorAll('.slot.selecionado').forEach(s => s.classList.remove('selecionado'));
  btn.classList.add('selecionado');

  document.getElementById('horario-selecionado-id').value  = id;
  document.getElementById('horario-selecionado-txt').value = texto;

  // Mostra confirmação
  document.getElementById('confirmacao-horario').textContent = texto;
  document.getElementById('confirmacao').style.display = 'block';
  document.getElementById('btn-confirmar').style.display = 'block';
}

// ─── Confirma o agendamento ──────────────────────────────────────────────────
async function confirmarAgendamento() {
  const usuario   = JSON.parse(localStorage.getItem('usuario'));
  const horarioId = document.getElementById('horario-selecionado-id').value;

  if (!horarioId) {
    alert('Selecione um horário primeiro!');
    return;
  }

  const btn = document.getElementById('btn-confirmar');
  btn.disabled     = true;
  btn.textContent  = 'Confirmando...';

  try {
    const resposta = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId: usuario.id, horarioId: parseInt(horarioId) }),
    });

    const json = await resposta.json();

    if (resposta.ok) {
      document.getElementById('confirmacao').innerHTML = `
        <div class="sucesso-agendamento">
          ✅ <strong>Agendamento confirmado!</strong><br/>
          Horário: ${document.getElementById('horario-selecionado-txt').value}
        </div>
      `;
      document.getElementById('btn-confirmar').style.display = 'none';
      // Recarrega horários para mostrar o slot como ocupado
      const profId = document.getElementById('horario-selecionado-id').dataset.profId;
      setTimeout(() => fecharModal(), 3000);
    } else {
      alert(json.erro || 'Erro ao confirmar agendamento.');
      btn.disabled    = false;
      btn.textContent = 'Confirmar agendamento';
    }

  } catch (err) {
    alert('Não foi possível conectar ao servidor.');
    btn.disabled    = false;
    btn.textContent = 'Confirmar agendamento';
  }
}

function fecharModalFora(e) {
  if (e.target.id === 'modal-overlay') fecharModal();
}