const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./config/db');
require('dotenv').config();

const app = express();

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'seu_session_secret_aqui',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// POST /api/auth/cadastro
app.post('/api/auth/cadastro', async (req, res) => {
    try {
        const { nome, email, telefone, senha, confirmSenha, tipo_usuario } = req.body;

        console.log('📝 Cadastro recebido:', { nome, email, tipo_usuario });

        if (!nome || !email || !senha || !tipo_usuario) {
            return res.status(400).json({ erro: 'Preencha todos os campos' });
        }

        if (senha !== confirmSenha) {
            return res.status(400).json({ erro: 'Senhas não conferem' });
        }

        if (senha.length < 6) {
            return res.status(400).json({ erro: 'Senha deve ter 6+ caracteres' });
        }

        // Verificar se email já existe
        const usuarioExistente = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Inserir no banco
        const result = await pool.query(
            'INSERT INTO usuarios (nome, email, telefone, senha, tipo_usuario) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, tipo_usuario',
            [nome, email, telefone || '', senhaHash, tipo_usuario]
        );

        const novoUsuario = result.rows[0];

        // Salvar na sessão
        req.session.usuario = {
            id: novoUsuario.id,
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            tipo_usuario: novoUsuario.tipo_usuario
        };

        console.log('✅ Usuário cadastrado:', novoUsuario.email);

        res.json({ sucesso: true, usuario: req.session.usuario });
    } catch (erro) {
        console.error('❌ Erro ao registrar:', erro.message);
        res.status(500).json({ erro: 'Erro ao registrar' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        console.log('🔐 Login recebido:', email);

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha obrigatórios' });
        }

        // Buscar usuário
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuario = result.rows[0];

        if (!usuario) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        // Salvar na sessão
        req.session.usuario = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            tipo_usuario: usuario.tipo_usuario
        };

        console.log('✅ Login realizado:', email);

        res.json({ sucesso: true, usuario: req.session.usuario });
    } catch (erro) {
        console.error('❌ Erro ao fazer login:', erro.message);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
});

// GET /api/auth/logout
app.get('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ sucesso: true });
});

// GET /api/auth/usuario
app.get('/api/auth/usuario', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ erro: 'Não autenticado' });
    }
    res.json({ usuario: req.session.usuario });
});

// ==================== ROTAS DE SERVIÇOS ====================

// GET /api/servicos - Listar todos os serviços
app.get('/api/servicos', async (req, res) => {
    try {
        console.log('📋 Listando serviços...');
        const result = await pool.query(
            'SELECT s.*, u.nome as prestador_nome FROM servicos s JOIN usuarios u ON s.usuario_id = u.id WHERE s.ativo = true ORDER BY s.criado_em DESC'
        );
        console.log('✅ Serviços retornados:', result.rows.length);
        res.json(result.rows);
    } catch (erro) {
        console.error('❌ Erro ao listar serviços:', erro.message);
        res.status(500).json({ erro: 'Erro ao listar serviços' });
    }
});

// GET /api/servicos/:id - Buscar serviço por ID
app.get('/api/servicos/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT s.*, u.nome as prestador_nome FROM servicos s JOIN usuarios u ON s.usuario_id = u.id WHERE s.id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Serviço não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (erro) {
        console.error('❌ Erro ao buscar serviço:', erro.message);
        res.status(500).json({ erro: 'Erro ao buscar serviço' });
    }
});

// POST /api/servicos - Criar novo serviço
app.post('/api/servicos', async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({ erro: 'Não autenticado' });
        }

        const { titulo, descricao, categoria, preco, tempo_entrega } = req.body;

        if (!titulo || !descricao || !categoria || !preco) {
            return res.status(400).json({ erro: 'Preencha todos os campos' });
        }

        const result = await pool.query(
            'INSERT INTO servicos (usuario_id, titulo, descricao, categoria, preco, tempo_entrega) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.session.usuario.id, titulo, descricao, categoria, preco, tempo_entrega]
        );

        console.log('✅ Serviço criado:', titulo);

        res.json({ sucesso: true, servico: result.rows[0] });
    } catch (erro) {
        console.error('❌ Erro ao criar serviço:', erro.message);
        res.status(500).json({ erro: 'Erro ao criar serviço' });
    }
});

// GET /api/servicos/usuario/:usuario_id - Listar serviços do usuário
app.get('/api/servicos/usuario/:usuario_id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM servicos WHERE usuario_id = $1 ORDER BY criado_em DESC',
            [req.params.usuario_id]
        );
        console.log('✅ Serviços do usuário retornados:', result.rows.length);
        res.json(result.rows);
    } catch (erro) {
        console.error('❌ Erro ao listar serviços:', erro.message);
        res.status(500).json({ erro: 'Erro ao listar serviços' });
    }
});

// ==================== ROTAS DE USUÁRIOS ====================

// GET /api/usuarios/:id - Buscar usuário por ID
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nome, email, telefone, bio, tipo_usuario FROM usuarios WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (erro) {
        console.error('❌ Erro ao buscar usuário:', erro.message);
        res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }
});

// PUT /api/usuarios/:id - Atualizar usuário
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        if (!req.session.usuario || req.session.usuario.id != req.params.id) {
            return res.status(403).json({ erro: 'Acesso negado' });
        }

        const { nome, telefone, bio } = req.body;
        const result = await pool.query(
            'UPDATE usuarios SET nome = $1, telefone = $2, bio = $3 WHERE id = $4 RETURNING id, nome, email, telefone, bio',
            [nome, telefone, bio, req.params.id]
        );

        res.json({ sucesso: true, usuario: result.rows[0] });
    } catch (erro) {
        console.error('❌ Erro ao atualizar usuário:', erro.message);
        res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
});

// ==================== ROTAS DE PÁGINAS ====================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cadastro.html'));
});

app.get('/marketplace', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'marketplace.html'));
});

app.get('/perfil', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'perfil.html'));
});

app.get('/novo-servico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'novo-servico.html'));
});

app.get('/meus-servicos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'meus-servicos.html'));
});

app.get('/pedidos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pedidos.html'));
});

// 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ==================== INICIAR SERVIDOR ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}\n` );
});