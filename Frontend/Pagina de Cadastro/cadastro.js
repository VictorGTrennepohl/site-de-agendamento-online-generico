function setTipo(tipo) {
    document.getElementById('btn-cliente').classList.toggle('active', tipo === 'cliente');
    document.getElementById('btn-profissional').classList.toggle('active', tipo === 'profissional');
    document.getElementById('campo-profissional').style.display = tipo === 'profissional' ? 'flex' : 'none';
}

function toggleSenha(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
}
