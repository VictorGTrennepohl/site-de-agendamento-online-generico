// Preenche campos vindos do Google
const params = new URLSearchParams(window.location.search);
const emailGoogle = params.get('email');
const nomeGoogle  = params.get('nome');
const googleId = params.get('googleId');

if (emailGoogle) {
  document.getElementById('email').value = decodeURIComponent(emailGoogle);
  document.getElementById('email').readOnly = true;
}
if (nomeGoogle) {
  document.getElementById('nome').value = decodeURIComponent(nomeGoogle);
}
// ─── URL do seu servidor backend ─────────────────────────────────────────────
const API_URL = 'http://localhost:3000/api/cadastro';

// Guarda o tipo selecionado (cliente ou profissional)
let tipoAtual = 'cliente';

// ─── Alterna entre cliente e profissional ─────────────────────────────────────
function setTipo(tipo) {
  tipoAtual = tipo;
  document.getElementById('btn-cliente').classList.toggle('active', tipo === 'cliente');
  document.getElementById('btn-profissional').classList.toggle('active', tipo === 'profissional');
  document.getElementById('campo-profissional').style.display =
    tipo === 'profissional' ? 'flex' : 'none';
}

// ─── Mostra/oculta senha ──────────────────────────────────────────────────────
function toggleSenha(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ─── Submissão do formulário ──────────────────────────────────────────────────
document.querySelector('.cadastro-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  // ── Lê os campos ──
  const nome     = document.getElementById('nome').value.trim();
  const cpf      = document.getElementById('cpf').value.trim();
  const email    = document.getElementById('email').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const senha    = document.getElementById('senha').value;
  const confirmar = document.getElementById('confirmar').value;
  const cidade   = document.getElementById('cidade').value.trim();
  const estado   = document.getElementById('estado').value;
  const aceito   = document.getElementById('aceito').checked;

  // ── Validações no frontend ──
  if (!nome || !cpf || !email || !telefone || !senha || !cidade || !estado) {
    return alerta('Preencha todos os campos obrigatórios.', 'erro');
  }
  if (senha !== confirmar) {
    return alerta('As senhas não coincidem.', 'erro');
  }
  if (senha.length < 8) {
    return alerta('A senha deve ter no mínimo 8 caracteres.', 'erro');
  }
  if (!aceito) {
    return alerta('Você precisa aceitar os Termos de Uso.', 'erro');
  }

  // ── Monta o corpo da requisição ──
  const dados = {
    tipo: tipoAtual,
    nome, cpf, email, telefone, senha, cidade, estado,
    googleId: googleId || null,
  };

  // Campos extras se for profissional
  if (tipoAtual === 'profissional') {
    dados.profissao   = document.getElementById('profissao').value;
    dados.nomeEstab   = document.getElementById('nome-estab').value.trim();
    dados.cnpj        = document.getElementById('cnpj').value.trim();
    dados.telEstab    = document.getElementById('tel-estab').value.trim();
    dados.endereco    = document.getElementById('endereco').value.trim();
    dados.bairro      = document.getElementById('bairro').value.trim();
    dados.cidadeEstab = document.getElementById('cidade-estab').value.trim();
    dados.cep         = document.getElementById('cep').value.trim();
    dados.descricao   = document.getElementById('descricao').value.trim();

    if (!dados.profissao || !dados.nomeEstab || !dados.telEstab || !dados.endereco) {
      return alerta('Preencha todos os campos do estabelecimento.', 'erro');
    }
  }

  // ── Desabilita o botão durante o envio ──
  const btnCadastrar = document.querySelector('.btn-cadastrar');
  btnCadastrar.disabled = true;
  btnCadastrar.textContent = 'Cadastrando...';

  // ── Envia para o backend ──
  try {
    const resposta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const json = await resposta.json();

   if (resposta.ok) {
      localStorage.setItem('usuario', JSON.stringify(json.usuario));
      alerta('Cadastro realizado com sucesso! Redirecionando...', 'sucesso');
      setTimeout(() => {
        window.location.href = '../Pagina Principal/Pagina_Principal.html';
      }, 2000);
    } else {
      alerta(json.erro || 'Erro ao realizar cadastro.', 'erro');
    }
     

  } catch (err) {
    console.error(err);
    alerta('Não foi possível conectar ao servidor. Verifique se ele está rodando.', 'erro');
  } finally {
    btnCadastrar.disabled = false;
    btnCadastrar.textContent = 'Criar minha conta';
  }
});

// ─── Exibe mensagem de feedback ───────────────────────────────────────────────
function alerta(mensagem, tipo) {
  // Remove alerta anterior se existir
  const anterior = document.querySelector('.alerta-cadastro');
  if (anterior) anterior.remove();

  const div = document.createElement('div');
  div.className = 'alerta-cadastro';
  div.textContent = mensagem;
  div.style.cssText = `
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 500;
    background: ${tipo === 'sucesso' ? '#d1fae5' : '#fee2e2'};
    color: ${tipo === 'sucesso' ? '#065f46' : '#991b1b'};
    border: 1px solid ${tipo === 'sucesso' ? '#6ee7b7' : '#fca5a5'};
  `;

  // Insere antes do botão de cadastrar
  const btn = document.querySelector('.btn-cadastrar');
  btn.parentNode.insertBefore(div, btn);
}