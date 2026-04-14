const { Pool } = require('pg');
require('dotenv').config();

console.log('🔌 Conectando ao banco de dados...');
console.log('Host:', process.env.DB_HOST);
console.log('Database:', process.env.DB_NAME);

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'uniservice'
});

pool.on('connect', () => {
    console.log('✅ Conectado ao banco de dados!');
});

pool.on('error', (err) => {
    console.error('❌ Erro no banco:', err.message);
});

module.exports = pool;