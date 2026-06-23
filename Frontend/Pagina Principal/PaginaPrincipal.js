const API_URL = 'http://localhost:3000/api';

const icones = {
  'Médico':        '🩺',
  'Dentista':      '🦷',
  'Psicólogo':     '💆',
  'Cabeleireiro':  '✂️',
  'Manicure':      '💅',
  'Mecânico':      '🚗',
  'Professor':     '📚',
  'Veterinário':   '🐾',
  'Nutricionista': '🥗',
  'Outro':         '🔧',
};

document.addEventListener('DOMContentLoaded', async function () {
  await carregarServicosPopulares();
});

async function carregarServicosPopulares() {
  try {
    const resposta = await fetch(`${API_URL}/servicos-populares`);
    const dados    = await resposta.json();

    const grid = document.querySelector('.services-grid');
    if (!grid) return;

    if (dados.length === 0) {
      grid.innerHTML = `
        <div class="servicos-vazio">
          
          <p>Nenhum serviço agendado ainda.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';

    dados.forEach(servico => {
      const icone = icones[servico.profissao] || '🔧';
      const card = document.createElement('div');
      card.className = 'service-card';
      card.innerHTML = `
        <div class="service-icon">${icone}</div>
        <span>${servico.profissao}</span>
        <small class="service-count">${servico.total} agendamento${servico.total > 1 ? 's' : ''}</small>
      `;
      grid.appendChild(card);
    });

  } catch (err) {
    console.error('Erro ao carregar serviços populares:', err);
  }
}