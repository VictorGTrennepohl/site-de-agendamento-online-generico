const API_URL = 'http://localhost:3000/api';

let usuarioAtual = null;

document.addEventListener('DOMContentLoaded', async function () {
  usuarioAtual = JSON.parse(localStorage.getItem('usuario'));
  if (!usuarioAtual) {
    window.location.href = '../Pagina de login/Pagina de Login.html';
    return;
  }
  await carregarDados();
});

// ─── Carrega dados do usuário ─────────────────────────────────────────────────
async function carregarDados() {
  try {
    const resposta = await fetch(`${API_URL}/usuario/${usuarioAtual.id}`);
    const dados    = await resposta.json();

    // Cabeçalho
    document.getElementById('header-avatar').textContent = dados.nome.charAt(0).toUpperCase();
    document.getElementById('header-nome').textContent   = dados.nome;
    document.getElementById('header-tipo').textContent   = dados.tipo === 'profissional' ? '💼 Profissional' : '👤 Cliente';

    // Campos do perfil
    document.getElementById('perfil-nome').value     = dados.nome     || '';
    document.getElementById('perfil-email').value    = dados.email    || '';
    document.getElementById('perfil-cpf').value      = dados.cpf      || '';
    document.getElementById('perfil-telefone').value = dados.telefone || '';
    document.getElementById('perfil-cidade').value   = dados.cidade   || '';
    document.getElementById('perfil-estado').value   = dados.estado   || '';

  } catch (err) {
    console.error(err);
  }
}

// ─── Troca de aba ─────────────────────────────────────────────────────────────
function trocarAba(btn, abaId) {
  document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.aba-conteudo').forEach(a => a.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(abaId).classList.add('active');
}

// ─── Salva perfil ─────────────────────────────────────────────────────────────
async function salvarPerfil(e) {
  e.preventDefault();

  const nome     = document.getElementById('perfil-nome').value.trim();
  const telefone = document.getElementById('perfil-telefone').value.trim();
  const cidade   = document.getElementById('perfil-cidade').value.trim();
  const estado   = document.getElementById('perfil-estado').value;

  if (!nome) return alerta('alerta-perfil', 'O nome é obrigatório.', 'erro');

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled    = true;
  btn.textContent = 'Salvando...';

  try {
    const resposta = await fetch(`${API_URL}/usuario/${usuarioAtual.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, telefone, cidade, estado }),
    });

    const json = await resposta.json();

    if (resposta.ok) {
      // Atualiza o localStorage com o novo nome
      usuarioAtual.nome = nome;
      localStorage.setItem('usuario', JSON.stringify(usuarioAtual));
      document.getElementById('header-avatar').textContent = nome.charAt(0).toUpperCase();
      document.getElementById('header-nome').textContent   = nome;
      alerta('alerta-perfil', 'Dados atualizados com sucesso!', 'sucesso');
    } else {
      alerta('alerta-perfil', json.erro || 'Erro ao salvar.', 'erro');
    }
  } catch (err) {
    alerta('alerta-perfil', 'Não foi possível conectar ao servidor.', 'erro');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Salvar alterações';
  }
}

// ─── Altera senha ─────────────────────────────────────────────────────────────
async function alterarSenha(e) {
  e.preventDefault();

  const senhaAtual    = document.getElementById('senha-atual').value;
  const novaSenha     = document.getElementById('senha-nova').value;
  const confirmarSenha = document.getElementById('senha-confirmar').value;

  if (!senhaAtual || !novaSenha || !confirmarSenha)
    return alerta('alerta-senha', 'Preencha todos os campos.', 'erro');

  if (novaSenha.length < 8)
    return alerta('alerta-senha', 'A nova senha deve ter no mínimo 8 caracteres.', 'erro');

  if (novaSenha !== confirmarSenha)
    return alerta('alerta-senha', 'As senhas não coincidem.', 'erro');

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled    = true;
  btn.textContent = 'Alterando...';

  try {
    const resposta = await fetch(`${API_URL}/usuario/${usuarioAtual.id}/senha`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });

    const json = await resposta.json();

    if (resposta.ok) {
      alerta('alerta-senha', 'Senha alterada com sucesso!', 'sucesso');
      e.target.reset();
    } else {
      alerta('alerta-senha', json.erro || 'Erro ao alterar senha.', 'erro');
    }
  } catch (err) {
    alerta('alerta-senha', 'Não foi possível conectar ao servidor.', 'erro');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Alterar senha';
  }
}

// ─── Mostrar/ocultar senha ────────────────────────────────────────────────────
function toggleSenha(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ─── Sair da conta ────────────────────────────────────────────────────────────
function sairConta() {
  localStorage.removeItem('usuario');
  window.location.href = '../Pagina Principal/index.html';
}

// ─── Excluir conta ────────────────────────────────────────────────────────────
async function excluirConta() {
  if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita!')) return;
  if (!confirm('Última confirmação — todos os seus dados serão removidos permanentemente!')) return;

  try {
    const resposta = await fetch(`${API_URL}/usuario/${usuarioAtual.id}`, {
      method: 'DELETE',
    });

    const json = await resposta.json();

    if (resposta.ok) {
      localStorage.removeItem('usuario');
      alert('Conta excluída com sucesso!');
      window.location.href = '../Pagina Principal/index.html';
    } else {
      alert(json.erro || 'Erro ao excluir conta.');
    }
  } catch (err) {
    alert('Não foi possível conectar ao servidor.');
  }
}

// ─── Exibe alerta ─────────────────────────────────────────────────────────────
function alerta(elementId, mensagem, tipo) {
  const div = document.getElementById(elementId);
  div.innerHTML = `
    <div class="alerta ${tipo}">
      ${mensagem}
    </div>
  `;
  setTimeout(() => div.innerHTML = '', 4000);
}