document.querySelector('.contato-form').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const nome     = document.getElementById('nome').value.trim();
    const email    = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const assunto  = document.getElementById('assunto').value;
    const mensagem = document.getElementById('mensagem').value.trim();
  
    if (!nome || !email || !assunto || !mensagem) {
      mostrarAlerta('Preencha todos os campos obrigatórios.', 'erro');
      return;
    }
  
    const btn = document.querySelector('.btn-enviar');
    btn.disabled    = true;
    btn.textContent = 'Enviando...';
  
    try {
      const resposta = await fetch('http://localhost:3000/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone, assunto, mensagem }),
      });
  
      const json = await resposta.json();
  
      if (resposta.ok) {
        mostrarAlerta('✅ Mensagem enviada com sucesso!', 'sucesso');
        e.target.reset();
      } else {
        mostrarAlerta(json.erro || 'Erro ao enviar mensagem.', 'erro');
      }
  
    } catch (err) {
      mostrarAlerta('Não foi possível conectar ao servidor.', 'erro');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Enviar mensagem';
    }
  });
  
  function mostrarAlerta(mensagem, tipo) {
    const anterior = document.querySelector('.alerta-contato');
    if (anterior) anterior.remove();
  
    const div = document.createElement('div');
    div.className = 'alerta-contato';
    div.textContent = mensagem;
    div.style.cssText = `
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 14px;
      font-weight: 500;
      background: ${tipo === 'sucesso' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'};
      color: ${tipo === 'sucesso' ? '#22c55e' : '#f87171'};
      border: 1px solid ${tipo === 'sucesso' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'};
    `;
  
    const btn = document.querySelector('.btn-enviar');
    btn.parentNode.insertBefore(div, btn.nextSibling);
  }