// Atualizar navbar com informações do usuário
function atualizarNavbar() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const navLinks = document.getElementById('navLinks');

    if (!navLinks) return;

    if (usuario) {
        navLinks.innerHTML = `
            <a href="/marketplace">Marketplace</a>
            <a href="/meus-servicos">Meus Serviços</a>
            <a href="/perfil">Perfil</a>
            <a href="#" onclick="logout()" class="btn btn-primary">Sair</a>
        `;
    } else {
        navLinks.innerHTML = `
            <a href="/login" class="btn btn-primary">Entrar</a>
        `;
    }
}

function logout() {
    fetch('/api/auth/logout').then(() => {
        localStorage.removeItem('usuario');
        window.location.href = '/';
    });
}

// Executar ao carregar a página
document.addEventListener('DOMContentLoaded', atualizarNavbar);