// ==================== AUTENTICAÇÃO ====================

// Fazer login
function fazerLogin() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    if (!email || !senha) {
        alert('❌ Preencha email e senha');
        return;
    }

    fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            alert('✅ Login realizado com sucesso!');
            // Redirecionar baseado no tipo de usuário
            redirecionarAposLogin(data.usuario.tipo_usuario);
        } else {
            alert('❌ ' + data.erro);
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('❌ Erro ao fazer login');
    });
}

// Criar conta
function criarConta() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;
    const senha = document.getElementById('senha').value;
    const confirmSenha = document.getElementById('confirmSenha').value;
    const tipoUsuario = document.getElementById('tipoUsuario').value;

    if (!nome || !email || !senha || !confirmSenha || !tipoUsuario) {
        alert('❌ Preencha todos os campos');
        return;
    }

    if (senha !== confirmSenha) {
        alert('❌ Senhas não conferem');
        return;
    }

    if (senha.length < 6) {
        alert('❌ Senha deve ter 6+ caracteres');
        return;
    }

    fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nome,
            email,
            telefone,
            senha,
            confirmSenha,
            tipo_usuario: tipoUsuario
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            alert('✅ Conta criada com sucesso!');
            // Redirecionar baseado no tipo de usuário
            redirecionarAposLogin(data.usuario.tipo_usuario);
        } else {
            alert('❌ ' + data.erro);
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('❌ Erro ao criar conta');
    });
}

// Logout
function logout() {
    fetch('/api/auth/logout')
        .then(() => {
            window.location.href = '/';
        })
        .catch(err => {
            console.error('Erro:', err);
            alert('❌ Erro ao fazer logout');
        });
}

// ==================== REDIRECIONAMENTO ====================

// Redirecionar baseado no tipo de usuário após login/cadastro
function redirecionarAposLogin(tipo_usuario) {
    if (tipo_usuario === 'cliente') {
        window.location.href = '/marketplace';
    } else if (tipo_usuario === 'prestador') {
        window.location.href = '/novo-servico';
    }
}

// ==================== SERVIÇOS ====================

// Carregar serviços
function carregarServicos() {
    fetch('/api/servicos')
        .then(res => res.json())
        .then(servicos => {
            exibirServicos(servicos);
        })
        .catch(err => {
            console.error('Erro ao carregar serviços:', err);
            document.getElementById('servicosList').innerHTML = '<p style="color: red;">Erro ao carregar serviços</p>';
        });
}

// Exibir serviços
function exibirServicos(servicos) {
    const lista = document.getElementById('servicosList');
    
    if (!lista) return;

    if (servicos.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: var(--cinza);">Nenhum serviço encontrado</p>';
        return;
    }

    lista.innerHTML = servicos.map(s => `
        <div class="card">
            <h3>${s.titulo}</h3>
            <p><strong>Prestador:</strong> ${s.prestador_nome}</p>
            <p><strong>Categoria:</strong> ${s.categoria}</p>
            <p>${s.descricao}</p>
            <p style="color: var(--verde-acessivel); font-weight: bold; font-size: 18px;">R$ ${parseFloat(s.preco).toFixed(2)}</p>
            ${s.tempo_entrega ? `<p><strong>Tempo de entrega:</strong> ${s.tempo_entrega} dias</p>` : ''}
            <button class="btn btn-secondary" onclick="contratarServico(${s.id})" style="width: 100%; margin-top: 10px;">✓ Contratar</button>
        </div>
    `).join('');
}

// Criar novo serviço
function criarServico() {
    const titulo = document.getElementById('titulo').value;
    const descricao = document.getElementById('descricao').value;
    const categoria = document.getElementById('categoria').value;
    const preco = document.getElementById('preco').value;
    const tempoEntrega = document.getElementById('tempoEntrega').value;

    if (!titulo || !descricao || !categoria || !preco) {
        alert('❌ Preencha todos os campos obrigatórios');
        return;
    }

    fetch('/api/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            titulo,
            descricao,
            categoria,
            preco: parseFloat(preco),
            tempo_entrega: tempoEntrega ? parseInt(tempoEntrega) : null
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            alert('✅ Serviço criado com sucesso!');
            window.location.href = '/meus-servicos';
        } else {
            alert('❌ ' + data.erro);
        }
    })
    .catch(err => {
        console.error('Erro:', err);
        alert('❌ Erro ao criar serviço');
    });
}

// Carregar meus serviços
function carregarMeusServicos() {
    fetch('/api/auth/usuario')
        .then(res => res.json())
        .then(data => {
            if (data.usuario) {
                fetch(`/api/servicos/usuario/${data.usuario.id}`)
                    .then(res => res.json())
                    .then(servicos => {
                        exibirMeusServicos(servicos);
                    })
                    .catch(err => {
                        console.error('Erro:', err);
                        document.getElementById('servicosList').innerHTML = '<p style="color: red;">Erro ao carregar serviços</p>';
                    });
            }
        })
        .catch(err => console.error('Erro:', err));
}

// Exibir meus serviços
function exibirMeusServicos(servicos) {
    const lista = document.getElementById('servicosList');
    
    if (!lista) return;

    if (servicos.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: var(--cinza);">Você ainda não criou nenhum serviço</p>';
        return;
    }

    lista.innerHTML = servicos.map(s => `
        <div class="card">
            <h3>${s.titulo}</h3>
            <p><strong>Categoria:</strong> ${s.categoria}</p>
            <p>${s.descricao}</p>
            <p style="color: var(--verde-acessivel); font-weight: bold; font-size: 18px;">R$ ${parseFloat(s.preco).toFixed(2)}</p>
            ${s.tempo_entrega ? `<p><strong>Tempo de entrega:</strong> ${s.tempo_entrega} dias</p>` : ''}
            <p><strong>Status:</strong> ${s.ativo ? '✅ Ativo' : '❌ Inativo'}</p>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="btn btn-primary" onclick="editarServico(${s.id})" style="flex: 1;">✏️ Editar</button>
                <button class="btn btn-laranja" onclick="deletarServico(${s.id})" style="flex: 1;">🗑️ Deletar</button>
            </div>
        </div>
    `).join('');
}

// Contratar serviço
function contratarServico(servicoId) {
    alert('✓ Serviço contratado com sucesso!');
    // Aqui você pode adicionar lógica para criar um pedido
}

// Editar serviço
function editarServico(servicoId) {
    alert('✏️ Função de edição em desenvolvimento');
}

// Deletar serviço
function deletarServico(servicoId) {
    if (confirm('Tem certeza que deseja deletar este serviço?')) {
        alert('🗑️ Serviço deletado com sucesso!');
        // Aqui você pode adicionar lógica para deletar o serviço
    }
}

// ==================== PERFIL ====================

// Carregar perfil do usuário
function carregarPerfil() {
    fetch('/api/auth/usuario')
        .then(res => res.json())
        .then(data => {
            if (data.usuario) {
                fetch(`/api/usuarios/${data.usuario.id}`)
                    .then(res => res.json())
                    .then(usuario => {
                        exibirPerfil(usuario);
                    })
                    .catch(err => console.error('Erro:', err));
            }
        })
        .catch(err => console.error('Erro:', err));
}

// Exibir perfil
function exibirPerfil(usuario) {
    const perfil = document.getElementById('perfilContainer');
    
    if (!perfil) return;

    perfil.innerHTML = `
        <div class="card">
            <h2>👤 Meu Perfil</h2>
            <p><strong>Nome:</strong> ${usuario.nome}</p>
            <p><strong>Email:</strong> ${usuario.email}</p>
            <p><strong>Telefone:</strong> ${usuario.telefone || 'Não informado'}</p>
            <p><strong>Tipo:</strong> ${usuario.tipo_usuario === 'cliente' ? 'Cliente' : 'Prestador'}</p>
            <p><strong>Bio:</strong> ${usuario.bio || 'Não informado'}</p>
            <button class="btn btn-primary" onclick="editarPerfil(${usuario.id})">✏️ Editar Perfil</button>
        </div>
    `;
}

// Editar perfil
function editarPerfil(usuarioId) {
    alert('✏️ Função de edição em desenvolvimento');
}

// ==================== UTILITÁRIOS ====================

// Verificar se usuário está autenticado
function verificarAutenticacao() {
    fetch('/api/auth/usuario')
        .then(res => res.json())
        .then(data => {
            if (!data.usuario) {
                window.location.href = '/login';
            }
        })
        .catch(err => {
            console.error('Erro:', err);
            window.location.href = '/login';
        });
}

// Formatar moeda
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Formatar data
function formatarData(data) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
}