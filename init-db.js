const pool = require('./config/db');

const criarTabelas = async () => {
    try {
        console.log('🔧 Criando tabelas...\n');

        // Criar tabela de usuários
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                telefone VARCHAR(20),
                senha VARCHAR(255) NOT NULL,
                tipo_usuario VARCHAR(20) NOT NULL,
                bio TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabela "usuarios" criada!');

        // Criar tabela de serviços
        await pool.query(`
            CREATE TABLE IF NOT EXISTS servicos (
                id SERIAL PRIMARY KEY,
                usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                titulo VARCHAR(255) NOT NULL,
                descricao TEXT NOT NULL,
                categoria VARCHAR(100) NOT NULL,
                preco DECIMAL(10,2) NOT NULL,
                tempo_entrega INT,
                ativo BOOLEAN DEFAULT TRUE,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabela "servicos" criada!');

        // Criar tabela de pedidos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pedidos (
                id SERIAL PRIMARY KEY,
                servico_id INT NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
                cliente_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                prestador_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'pendente',
                preco_final DECIMAL(10,2),
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabela "pedidos" criada!');

        // Criar índices
        await pool.query('CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_servicos_usuario ON servicos(usuario_id);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON servicos(categoria);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_pedidos_prestador ON pedidos(prestador_id);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_pedidos_servico ON pedidos(servico_id);');
        console.log('✅ Índices criados!');

        console.log('\n✅ Todas as tabelas foram criadas com sucesso!\n');
        
        process.exit(0);
    } catch (erro) {
        console.error('❌ Erro ao criar tabelas:', erro.message);
        process.exit(1);
    }
};

criarTabelas();