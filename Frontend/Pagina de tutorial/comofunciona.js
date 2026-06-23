document.addEventListener('DOMContentLoaded', function () {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario) {
      document.getElementById('btn-criar-conta').style.display = 'none';
    }
  });