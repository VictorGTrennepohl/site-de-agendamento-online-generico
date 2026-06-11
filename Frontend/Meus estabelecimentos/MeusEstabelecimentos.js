const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async function () {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario || usuario.tipo !== 'profissional') return;
  await carregarEstabelecimentos(usuario.id);
});

// ─── Carrega estabelecimentos do banco ────────────────────────────────────────
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
    vazio.querySelector('h3').textContent = 'Erro ao carregar estabelecimentos.';
    vazio.querySelector('p').textContent  = 'Verifique se o servidor está rodando.';
  }
}