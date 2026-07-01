// Captura login via Google
const params = new URLSearchParams(window.location.search);
const usuarioGoogle = params.get('usuario');
if (usuarioGoogle) {
  localStorage.setItem('usuario', decodeURIComponent(usuarioGoogle));
  window.location.href = '../Pagina Principal/index.html';
}

document.querySelector('.btn-login').addEventListener('click', async function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  if (!email || !senha) {
    return alerta('Preencha o e-mail e a senha.', 'erro');
  }

  this.disabled = true;
  this.textContent = 'Entrando...';

  try {
    const resposta = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    const json = await resposta.json();

    if (resposta.ok) {
      alerta('Login realizado com sucesso! Redirecionando...', 'sucesso');
      localStorage.setItem('usuario', JSON.stringify(json.usuario));
      setTimeout(() => {
        window.location.href = '../Pagina Principal/index.html';
      }, 2000);
    } else {
      alerta(json.erro || 'E-mail ou senha inválidos.', 'erro');
    }

  } catch (err) {
    alerta('Não foi possível conectar ao servidor.', 'erro');
  } finally {
    this.disabled = false;
    this.textContent = 'Entrar na minha conta';
  }
});

function toggleSenha() {
  const input = document.getElementById('senha');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function alerta(mensagem, tipo) {
  const anterior = document.querySelector('.alerta-login');
  if (anterior) anterior.remove();

  const div = document.createElement('div');
  div.className = 'alerta-login';
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

  const btn = document.querySelector('.btn-login');
  btn.parentNode.insertBefore(div, btn);
}