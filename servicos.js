const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// GET /api/servicos - Listar todos os serviços
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT s.*, u.nome as prestador_nome FROM servicos s JOIN usuarios u ON s.usuario_id = u.id WHERE s.ativo = true ORDER BY s.criado_em DESC'
        );
        res.json(result.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar serviços' });
    }
});

// GET /api/servicos/:id - Buscar serviço por ID
router.get('/:id', async (req, res) => {
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
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar serviço' });
    }
});

// POST /api/servicos - Criar novo serviço
router.post('/', async (req, res) => {
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

        res.json({ sucesso: true, servico: result.rows[0] });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao criar serviço' });
    }
});

// GET /api/servicos/usuario/:usuario_id - Listar serviços do usuário
router.get('/usuario/:usuario_id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM servicos WHERE usuario_id = $1 ORDER BY criado_em DESC',
            [req.params.usuario_id]
        );
        res.json(result.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar serviços' });
    }
});

module.exports = router;