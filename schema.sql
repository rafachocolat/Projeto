-- Criar tabela de usuários
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

-- Criar tabela de serviços
CREATE TABLE IF NOT EXISTS servicos (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    tempo_entrega INT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    servico_id INT NOT NULL REFERENCES servicos(id),
    cliente_id INT NOT NULL REFERENCES usuarios(id),
    prestador_id INT NOT NULL REFERENCES usuarios(id),
    status VARCHAR(50) DEFAULT 'pendente',
    preco_final DECIMAL(10,2),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_servicos_usuario ON servicos(usuario_id);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);