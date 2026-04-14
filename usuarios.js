const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// GET /api/usuarios/:id - Buscar usuário por ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nome, email, telefone, bio, tipo_usuario FROM usuarios WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }
});

// PUT /api/usuarios/:id - Atualizar usuário
router.put('/:id', async (req, res) => {
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
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
});

module.exports = router;