const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha obrigatórios' });
        }

        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuario = result.rows[0];

        if (!usuario) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        req.session.usuario = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            tipo_usuario: usuario.tipo_usuario
        };

        res.json({ sucesso: true, usuario: req.session.usuario });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
});

// POST /api/auth/cadastro
router.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, telefone, senha, confirmSenha, tipo_usuario } = req.body;

        if (!nome || !email || !senha || !tipo_usuario) {
            return res.status(400).json({ erro: 'Preencha todos os campos' });
        }

        if (senha !== confirmSenha) {
            return res.status(400).json({ erro: 'Senhas não conferem' });
        }

        if (senha.length < 6) {
            return res.status(400).json({ erro: 'Senha deve ter 6+ caracteres' });
        }

        const usuarioExistente = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        const result = await pool.query(
            'INSERT INTO usuarios (nome, email, telefone, senha, tipo_usuario) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, tipo_usuario',
            [nome, email, telefone, senhaHash, tipo_usuario]
        );

        const novoUsuario = result.rows[0];

        req.session.usuario = {
            id: novoUsuario.id,
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            tipo_usuario: novoUsuario.tipo_usuario
        };

        res.json({ sucesso: true, usuario: req.session.usuario });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao registrar' });
    }
});

// GET /api/auth/logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.json({ sucesso: true });
    });
});

// GET /api/auth/usuario
router.get('/usuario', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ erro: 'Não autenticado' });
    }
    res.json({ usuario: req.session.usuario });
});

module.exports = router;