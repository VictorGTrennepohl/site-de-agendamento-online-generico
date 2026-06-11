document.addEventListener('DOMContentLoaded', function () {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const navActions = document.querySelector('.nav-actions');

  if (!navActions) return;

  if (usuario) {
    // Usuário logado — substitui botões pelo menu
    navActions.innerHTML = `
      <div class="user-menu">
        <button class="user-btn" onclick="toggleMenu()">
          <span class="user-avatar">${usuario.nome.charAt(0).toUpperCase()}</span>
          <span class="user-nome">${usuario.nome.split(' ')[0]}</span>
          <span class="user-seta">▾</span>
        </button>
        <div class="user-dropdown" id="user-dropdown">
          <a href="../Pagina Agendamento/Pagina Agendamento.html">📅 Agendar</a>
          <a href="../Meus agendamentos/Meus agendamentos.html">📋 Meus agendamentos</a>
          <a href="../Pagina de configuracoes/PaginaConfiguracoes.html">⚙️ Configurações</a>
          <div class="dropdown-divider"></div>
          <a href="#" onclick="sairConta()" class="sair">🚪 Sair da conta</a>
        </div>
      </div>
    `;
  }
  // Se não estiver logado, não faz nada — mantém os botões do HTML
});

function toggleMenu() {
  const dropdown = document.getElementById('user-dropdown');
  dropdown.classList.toggle('aberto');

  document.addEventListener('click', function fechar(e) {
    if (!e.target.closest('.user-menu')) {
      dropdown.classList.remove('aberto');
      document.removeEventListener('click', fechar);
    }
  });
}

if (usuario) {
  navActions.innerHTML = `
    <div class="user-menu">
      <button class="user-btn" onclick="toggleMenu()">
        <span class="user-avatar">${usuario.nome.charAt(0).toUpperCase()}</span>
        <span class="user-nome">${usuario.nome.split(' ')[0]}</span>
        <span class="user-seta">▾</span>
      </button>
      <div class="user-dropdown" id="user-dropdown">
        <a href="../Pagina de Agendamento/Pagina Agendamento.html">📅 Agendar</a>
        <a href="../Pagina de Meus Agendamentos/MeusAgendamentos.html">📋 Meus agendamentos</a>
        ${usuario.tipo === 'profissional' ? `<a href="../Meus estabelecimentos/meusEstabelecimentos.html">🏢 Meus estabelecimentos</a>` : ''}
        <a href="../Pagina de Configuracoes/Configuracoes.html">⚙️ Configurações</a>
        <div class="dropdown-divider"></div>
        <a href="#" onclick="sairConta()" class="sair">🚪 Sair da conta</a>
      </div>
    </div>
  `;
}

function sairConta() {
  localStorage.removeItem('usuario');
  window.location.reload();
}