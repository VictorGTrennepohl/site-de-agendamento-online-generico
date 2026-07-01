const API_URL = 'http://localhost:3000/api';

let todosProfissionais = [];
let horariosAtuais     = [];
let semanaOffset       = 0; // 0 = semana atual, 1 = próxima, -1 = anterior

// ─── Verifica login e carrega profissionais ──────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario) {
    window.location.href = '../Pagina de login/Pagina de Login.html';
    return;
  }
  await carregarProfissionais();
});

// ─── Carrega profissionais do banco ──────────────────────────────────────────
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

// ─── Utilitários de data ──────────────────────────────────────────────────────
function getDiasSemana(offset) {
  const diasNomes = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=Dom, 1=Seg...
  const inicioSemana = new Date(hoje);
  // Vai para segunda-feira da semana atual
  inicioSemana.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1) + (offset * 7));

  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicioSemana);
    d.setDate(inicioSemana.getDate() + i);
    dias.push({
      nome:  diasNomes[d.getDay()],
      data:  d,
      label: `${diasNomes[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
      passado: new Date(d).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)
    });
  }
  return dias;
}

function formatarPeriodo(dias) {
  const inicio = dias[0].data;
  const fim    = dias[6].data;
  return `${String(inicio.getDate()).padStart(2,'0')}/${String(inicio.getMonth()+1).padStart(2,'0')} — ${String(fim.getDate()).padStart(2,'0')}/${String(fim.getMonth()+1).padStart(2,'0')}/${fim.getFullYear()}`;
}

// ─── Abre o modal ────────────────────────────────────────────────────────────
async function abrirModal(prof) {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario) {
    alert('Você precisa estar logado para agendar!');
    window.location.href = '../Pagina de login/Pagina de Login.html';
    return;
  }

  semanaOffset = 0;

  document.getElementById('modal-nome').textContent      = prof.nome;
  document.getElementById('modal-area').textContent      = prof.profissao || '';
  document.getElementById('modal-estab').textContent     = prof.nome_estab || '';
  document.getElementById('modal-endereco').textContent  = prof.endereco ? `${prof.endereco}, ${prof.bairro || ''} — ${prof.cidade || ''}` : '';
  document.getElementById('modal-tel').textContent       = prof.tel_estab || '';
  document.getElementById('modal-descricao').textContent = prof.descricao || '';
  document.getElementById('modal-avatar').textContent    = prof.nome.charAt(0).toUpperCase();

  document.getElementById('horario-selecionado-id').value  = '';
  document.getElementById('horario-selecionado-txt').value = '';

  // Restaura o HTML original da confirmação (o botão de sucesso anterior
  // pode ter sobrescrito o #confirmacao-horario na última vez que foi usado)
  const confirmacaoEl = document.getElementById('confirmacao');
  confirmacaoEl.innerHTML = `
    <div class="confirmacao-box">
      <p>Horário selecionado: <strong id="confirmacao-horario"></strong></p>
    </div>
  `;
  confirmacaoEl.style.display = 'none';

  document.getElementById('quadro-horarios').style.display = 'block';

  const btnConfirmar = document.getElementById('btn-confirmar');
  btnConfirmar.style.display = 'none';
  btnConfirmar.disabled      = false;
  btnConfirmar.textContent   = 'Confirmar agendamento ✅';

  await carregarHorarios(prof.id);

  document.getElementById('modal-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ─── Fecha o modal ───────────────────────────────────────────────────────────
function fecharModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

function fecharModalFora(e) {
  if (e.target.id === 'modal-overlay') fecharModal();
}

// ─── Navega entre semanas ─────────────────────────────────────────────────────
async function navegarSemana(direcao) {
  semanaOffset += direcao;
  if (semanaOffset < 0) semanaOffset = 0; // não permite voltar para o passado
  const profId = document.getElementById('horario-prof-id').value;
  await renderizarQuadro(profId);
}

// ─── Carrega horários do banco ────────────────────────────────────────────────
async function carregarHorarios(profissionalId) {
  document.getElementById('horario-prof-id').value = profissionalId;
  const quadro = document.getElementById('quadro-horarios');
  quadro.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:20px">Carregando horários...</p>';

  try {
    const resposta = await fetch(`${API_URL}/horarios/${profissionalId}`);
    horariosAtuais = await resposta.json();
    await renderizarQuadro(profissionalId);
  } catch (err) {
    quadro.innerHTML = '<p style="color:#f87171;text-align:center;padding:20px">Erro ao carregar horários.</p>';
  }
}

// ─── Renderiza o quadro com a semana correta ──────────────────────────────────
async function renderizarQuadro(profissionalId) {
  const quadro = document.getElementById('quadro-horarios');

  if (horariosAtuais.length === 0) {
    quadro.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:20px">Nenhum horário cadastrado.</p>';
    return;
  }

  const diasSemana = getDiasSemana(semanaOffset);
  const periodo    = formatarPeriodo(diasSemana);

  // Pega nomes dos dias com horários cadastrados
  const diasComHorario = diasSemana.filter(d =>
    horariosAtuais.some(h => h.dia_semana === d.nome)
  );

  if (diasComHorario.length === 0) {
    quadro.innerHTML = `
      <div class="semana-nav">
        <button onclick="navegarSemana(-1)" ${semanaOffset === 0 ? 'disabled' : ''}>← Anterior</button>
        <span>${periodo}</span>
        <button onclick="navegarSemana(1)">Próxima →</button>
      </div>
      <p style="color:rgba(255,255,255,0.5);text-align:center;padding:20px">Nenhum horário disponível nessa semana.</p>
    `;
    return;
  }

  // Pega horários únicos ordenados
  const horariosUnicos = [...new Set(horariosAtuais.map(h => h.horario))].sort();

  let html = `
    <div class="semana-nav">
      <button onclick="navegarSemana(-1)" ${semanaOffset === 0 ? 'disabled' : ''}>← Anterior</button>
      <span>${periodo}</span>
      <button onclick="navegarSemana(1)">Próxima →</button>
    </div>
    <div class="quadro-tabela">
      <table>
        <thead>
          <tr>
            <th>Horário</th>
            ${diasComHorario.map(d => `<th class="${d.passado ? 'dia-passado' : ''}">${d.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;

  horariosUnicos.forEach(hora => {
    const horaFormatada = hora.substring(0, 5);
    html += `<tr><td class="hora-col">${horaFormatada}</td>`;

    diasComHorario.forEach(dia => {
      const slot = horariosAtuais.find(h => h.dia_semana === dia.nome && h.horario === hora);

      if (dia.passado) {
        html += `<td><span class="slot passado">—</span></td>`;
      } else if (slot) {
        if (slot.disponivel) {
          html += `<td><button class="slot disponivel" onclick="selecionarHorario(${slot.id}, \`${dia.label} ${horaFormatada}\`, this)">✅</button></td>`;
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
}

// ─── Seleciona horário ────────────────────────────────────────────────────────
function selecionarHorario(id, texto, btn) {
  document.querySelectorAll('.slot.selecionado').forEach(s => s.classList.remove('selecionado'));
  btn.classList.add('selecionado');

  document.getElementById('horario-selecionado-id').value  = id;
  document.getElementById('horario-selecionado-txt').value = texto;

  document.getElementById('confirmacao-horario').textContent = texto;
  document.getElementById('confirmacao').style.display = 'block';
  document.getElementById('btn-confirmar').style.display = 'block';
}

// ─── Confirma agendamento ─────────────────────────────────────────────────────
async function confirmarAgendamento() {
  const usuario   = JSON.parse(localStorage.getItem('usuario'));
  const horarioId = document.getElementById('horario-selecionado-id').value;

  if (!horarioId) {
    alert('Selecione um horário primeiro!');
    return;
  }

  const btn = document.getElementById('btn-confirmar');
  btn.disabled    = true;
  btn.textContent = 'Confirmando...';

  try {
    const resposta = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId: usuario.id, horarioId: parseInt(horarioId) }),
    });

    const json = await resposta.json();

    if (resposta.ok) {
      const confirmacaoEl = document.getElementById('confirmacao');
      confirmacaoEl.innerHTML = `
        <div class="sucesso-agendamento">
          ✅ <strong>Agendamento confirmado!</strong><br/>
          Horário: ${document.getElementById('horario-selecionado-txt').value}
        </div>
      `;
      document.getElementById('btn-confirmar').style.display = 'none';
      // Recarrega horários para mostrar slot como ocupado
      const profId = document.getElementById('horario-prof-id').value;
      await carregarHorarios(profId);
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