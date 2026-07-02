const API_URL = 'http://localhost:3000/api';

let todosEstabelecimentos = [];
let estabelecimentoAtual  = null;
let avaliacoesAtuais      = [];
let notaSelecionada       = 0;

document.addEventListener('DOMContentLoaded', async function () {
  await carregarEstabelecimentos();
});

// ─── Carrega lista de estabelecimentos com média ──────────────────────────────
async function carregarEstabelecimentos() {
  const loading = document.getElementById('loading');
  const lista   = document.getElementById('lista-estab');
  const vazio   = document.getElementById('vazio');

  loading.style.display = 'flex';
  lista.innerHTML = '';
  vazio.style.display = 'none';

  try {
    const resposta = await fetch(`${API_URL}/estabelecimentos-avaliacoes`);
    const dados = await resposta.json();

    if (!Array.isArray(dados)) {
      console.error('Erro da API:', dados);
      loading.style.display = 'none';
      vazio.style.display   = 'flex';
      return;
    }

    todosEstabelecimentos = dados;
    loading.style.display = 'none';

    preencherFiltros(todosEstabelecimentos);
    renderizarEstabelecimentos(todosEstabelecimentos);

  } catch (err) {
    console.error(err);
    loading.style.display = 'none';
    vazio.style.display   = 'flex';
  }
}

// ─── Preenche os selects de filtro dinamicamente ──────────────────────────────
function preencherFiltros(lista) {
  const servicos = [...new Set(lista.map(e => e.profissao).filter(Boolean))].sort();
  const cidades  = [...new Set(lista.map(e => e.cidade).filter(Boolean))].sort();
  const estados  = [...new Set(lista.map(e => e.estado).filter(Boolean))].sort();

  const selServico = document.getElementById('filtro-servico');
  const selCidade  = document.getElementById('filtro-cidade');
  const selEstado  = document.getElementById('filtro-estado');

  servicos.forEach(s => selServico.innerHTML += `<option value="${s}">${s}</option>`);
  cidades.forEach(c => selCidade.innerHTML += `<option value="${c}">${c}</option>`);
  estados.forEach(e => selEstado.innerHTML += `<option value="${e}">${e}</option>`);
}

// ─── Renderiza cards de estabelecimentos ──────────────────────────────────────
function renderizarEstabelecimentos(lista) {
  const container = document.getElementById('lista-estab');
  const vazio     = document.getElementById('vazio');

  container.innerHTML = '';

  if (lista.length === 0) {
    vazio.style.display = 'flex';
    return;
  }

  vazio.style.display = 'none';

  lista.forEach(estab => {
    const media    = parseFloat(estab.media).toFixed(1);
    const estrelas = gerarEstrelas(parseFloat(estab.media));
    const inicial  = estab.nome_estab ? estab.nome_estab.charAt(0).toUpperCase() : '?';

    const card = document.createElement('div');
    card.className = 'estab-card';
    card.onclick = () => abrirDetalhe(estab);
    card.innerHTML = `
      <div class="estab-card-avatar">${inicial}</div>
      <div class="estab-card-nome">${estab.nome_estab || 'Sem nome'}</div>
      <div class="estab-card-area">${estab.profissao || ''}</div>
      <div class="estab-card-local">📍 ${estab.bairro ? estab.bairro + ' — ' : ''}${estab.cidade || ''}${estab.estado ? '/' + estab.estado : ''}</div>
      <div class="estab-card-estrelas">${estrelas} <span>${media}</span></div>
      <div class="estab-card-total">${estab.total_avaliacoes} avaliaç${estab.total_avaliacoes == 1 ? 'ão' : 'ões'}</div>
    `;
    container.appendChild(card);
  });
}

// ─── Gera estrelas visuais ────────────────────────────────────────────────────
function gerarEstrelas(media) {
  const cheias = Math.round(media);
  return '★'.repeat(cheias) + '☆'.repeat(5 - cheias);
}

// ─── Filtra estabelecimentos ──────────────────────────────────────────────────
function filtrarEstabelecimentos() {
  const busca   = document.getElementById('input-busca').value.toLowerCase().trim();
  const servico = document.getElementById('filtro-servico').value;
  const cidade  = document.getElementById('filtro-cidade').value;
  const estado  = document.getElementById('filtro-estado').value;

  const filtrados = todosEstabelecimentos.filter(e => {
    const buscaOk   = busca === '' || (e.nome_estab || '').toLowerCase().includes(busca);
    const servicoOk = servico === '' || e.profissao === servico;
    const cidadeOk  = cidade  === '' || e.cidade === cidade;
    const estadoOk  = estado  === '' || e.estado === estado;
    return buscaOk && servicoOk && cidadeOk && estadoOk;
  });

  renderizarEstabelecimentos(filtrados);
}

// ─── Abre detalhe de um estabelecimento ───────────────────────────────────────
async function abrirDetalhe(estab) {
  estabelecimentoAtual = estab;

  document.getElementById('vista-lista').style.display   = 'none';
  document.getElementById('vista-detalhe').style.display  = 'block';

  const media    = parseFloat(estab.media).toFixed(1);
  const estrelas = gerarEstrelas(parseFloat(estab.media));
  const inicial  = estab.nome_estab ? estab.nome_estab.charAt(0).toUpperCase() : '?';

  document.getElementById('detalhe-avatar').textContent = inicial;
  document.getElementById('detalhe-nome').textContent   = estab.nome_estab || 'Sem nome';
  document.getElementById('detalhe-area').textContent   = `${estab.profissao || ''} — ${estab.profissional_nome || ''}`;
  document.getElementById('detalhe-local').textContent  = `📍 ${estab.bairro ? estab.bairro + ' — ' : ''}${estab.cidade || ''}${estab.estado ? '/' + estab.estado : ''}`;
  document.getElementById('detalhe-media').textContent          = media;
  document.getElementById('detalhe-media-estrelas').textContent = estrelas;
  document.getElementById('detalhe-media-total').textContent    = `${estab.total_avaliacoes} avaliaç${estab.total_avaliacoes == 1 ? 'ão' : 'ões'}`;

  await carregarAvaliacoesEstabelecimento(estab.profissional_id);
}

// ─── Volta para a lista ───────────────────────────────────────────────────────
function voltarLista() {
  document.getElementById('vista-detalhe').style.display = 'none';
  document.getElementById('vista-lista').style.display   = 'block';
}

// ─── Carrega avaliações de um estabelecimento ─────────────────────────────────
async function carregarAvaliacoesEstabelecimento(profissionalId) {
  const loading = document.getElementById('detalhe-loading');
  const lista   = document.getElementById('lista-avaliacoes');
  const vazio   = document.getElementById('detalhe-vazio');

  loading.style.display = 'flex';
  lista.innerHTML = '';
  vazio.style.display = 'none';

  try {
    const resposta = await fetch(`${API_URL}/avaliacoes-estabelecimento/${profissionalId}`);
    avaliacoesAtuais = await resposta.json();

    loading.style.display = 'none';

    if (avaliacoesAtuais.length === 0) {
      vazio.style.display = 'flex';
      return;
    }

    const usuario = JSON.parse(localStorage.getItem('usuario'));

    avaliacoesAtuais.forEach(av => {
      const estrelas = '★'.repeat(av.nota) + '☆'.repeat(5 - av.nota);
      const data     = new Date(av.criado_em).toLocaleDateString('pt-BR');
      const inicial  = av.cliente_nome ? av.cliente_nome.charAt(0).toUpperCase() : '?';
      const ehMinha  = usuario && usuario.id === av.cliente_id;

      const card = document.createElement('div');
      card.className = 'av-card';
      card.innerHTML = `
        <div class="av-header">
          <div class="av-avatar">${inicial}</div>
          <div class="av-info">
            <div class="av-cliente">${av.cliente_nome}</div>
          </div>
          <div class="av-data">${data}</div>
          ${ehMinha ? `<button class="btn-editar-av" onclick="abrirEditarAvaliacao(${av.id}, ${av.nota}, \`${av.comentario || ''}\`)">✏️ Editar</button>` : ''}
        </div>
        <div class="av-estrelas">${estrelas}</div>
        ${av.comentario ? `<div class="av-comentario">"${av.comentario}"</div>` : ''}
      `;
      lista.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    loading.style.display = 'none';
  }
}

// ─── Abre modal de avaliar ────────────────────────────────────────────────────
function abrirModalAvaliar() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  document.getElementById('modal-avaliar').style.display = 'flex';
  document.body.style.overflow = 'hidden';

  if (!usuario) {
    document.getElementById('login-aviso').style.display  = 'block';
    document.getElementById('form-avaliar').style.display = 'none';
    return;
  }

  document.getElementById('login-aviso').style.display  = 'none';
  document.getElementById('form-avaliar').style.display = 'block';

  notaSelecionada = 0;
  document.getElementById('aval-nota').value = 0;
  document.querySelectorAll('.estrela').forEach(e => e.classList.remove('ativa'));
  document.getElementById('aval-comentario').value = '';
  document.getElementById('alerta-aval').innerHTML = '';
}

// ─── Seleciona estrela ────────────────────────────────────────────────────────
function selecionarEstrela(nota) {
  notaSelecionada = nota;
  document.getElementById('aval-nota').value = nota;

  document.querySelectorAll('.estrela').forEach((e, i) => {
    e.classList.toggle('ativa', i < nota);
  });
}

// ─── Envia avaliação ──────────────────────────────────────────────────────────
async function enviarAvaliacao(e) {
  e.preventDefault();

  const usuario    = JSON.parse(localStorage.getItem('usuario'));
  const nota       = parseInt(document.getElementById('aval-nota').value);
  const comentario = document.getElementById('aval-comentario').value.trim();

  if (!nota || nota === 0) return mostrarAlerta('Selecione uma nota.', 'erro');

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled    = true;
  btn.textContent = 'Enviando...';

  try {
    const resposta = await fetch(`${API_URL}/avaliacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId:      usuario.id,
        profissionalId: estabelecimentoAtual.profissional_id,
        nota,
        comentario,
      }),
    });

    const json = await resposta.json();

    if (resposta.ok) {
      mostrarAlerta('✅ Avaliação enviada com sucesso!', 'sucesso');
      setTimeout(async () => {
        fecharModal();
        // Recarrega tudo para atualizar a média
        await carregarEstabelecimentos();
        const atualizado = todosEstabelecimentos.find(x => x.id === estabelecimentoAtual.id);
        if (atualizado) await abrirDetalhe(atualizado);
      }, 1500);
    } else {
      mostrarAlerta(json.erro || 'Erro ao enviar avaliação.', 'erro');
    }

  } catch (err) {
    mostrarAlerta('Não foi possível conectar ao servidor.', 'erro');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Enviar avaliação';
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function fecharModal() {
  document.getElementById('modal-avaliar').style.display = 'none';
  document.body.style.overflow = '';
}

function fecharModalFora(e) {
  if (e.target.id === 'modal-avaliar') fecharModal();
}

// ─── Alerta ───────────────────────────────────────────────────────────────────
function mostrarAlerta(mensagem, tipo) {
  const div = document.getElementById('alerta-aval');
  div.innerHTML = `<div class="alerta ${tipo}">${mensagem}</div>`;
  setTimeout(() => div.innerHTML = '', 4000);
}

// ─── Abre modal de editar avaliação ──────────────────────────────────────────
function abrirEditarAvaliacao(id, nota, comentario) {
  document.getElementById('edit-aval-id').value          = id;
  document.getElementById('edit-aval-comentario').value  = comentario;
  document.getElementById('edit-aval-nota').value        = nota;

  // Atualiza estrelas
  document.querySelectorAll('.estrela-edit').forEach((e, i) => {
    e.classList.toggle('ativa', i < nota);
  });

  document.getElementById('modal-editar-av').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ─── Seleciona estrela no modal de edição ────────────────────────────────────
function selecionarEstrelaEdit(nota) {
  document.getElementById('edit-aval-nota').value = nota;
  document.querySelectorAll('.estrela-edit').forEach((e, i) => {
    e.classList.toggle('ativa', i < nota);
  });
}

// ─── Salva edição da avaliação ────────────────────────────────────────────────
async function salvarEdicaoAvaliacao(e) {
  e.preventDefault();
  const usuario    = JSON.parse(localStorage.getItem('usuario'));
  const id         = document.getElementById('edit-aval-id').value;
  const nota       = parseInt(document.getElementById('edit-aval-nota').value);
  const comentario = document.getElementById('edit-aval-comentario').value.trim();

  if (!nota) return mostrarAlertaEdit('Selecione uma nota.', 'erro');

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled    = true;
  btn.textContent = 'Salvando...';

  try {
    const resposta = await fetch(`${API_URL}/avaliacoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId: usuario.id, nota, comentario }),
    });

    const json = await resposta.json();

    if (resposta.ok) {
      mostrarAlertaEdit('✅ Avaliação atualizada!', 'sucesso');
      setTimeout(async () => {
        document.getElementById('modal-editar-av').style.display = 'none';
        document.body.style.overflow = '';
        await carregarAvaliacoesEstabelecimento(estabelecimentoAtual.profissional_id);
        await carregarEstabelecimentos();
      }, 1500);
    } else {
      mostrarAlertaEdit(json.erro || 'Erro ao salvar.', 'erro');
    }
  } catch (err) {
    mostrarAlertaEdit('Não foi possível conectar ao servidor.', 'erro');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Salvar alterações';
  }
}

function mostrarAlertaEdit(mensagem, tipo) {
  const div = document.getElementById('alerta-edit-av');
  div.innerHTML = `<div class="alerta ${tipo}">${mensagem}</div>`;
  setTimeout(() => div.innerHTML = '', 4000);
}