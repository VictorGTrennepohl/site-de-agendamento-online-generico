require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// CONEXÃO COM O BANCO
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.connect()
  .then(() => console.log('✅ Conectado ao PostgreSQL!'))
  .catch(err => console.error('❌ Erro ao conectar:', err.message));

// ROTA: CADASTRO
app.post('/api/cadastro', async (req, res) => {
  const {
    nome, email, cpf, telefone, senha, cidade, estado, tipo,
    profissao, nomeEstab, cnpj, telEstab, endereco, bairro, cidadeEstab, cep, descricao
  } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
  }

  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const resultUsuario = await pool.query(
      `INSERT INTO usuarios (nome, email, cpf, telefone, senha, cidade, estado, tipo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [nome, email, cpf, telefone, senhaCriptografada, cidade, estado, tipo]
    );

    const usuarioId = resultUsuario.rows[0].id;

    if (tipo === 'profissional') {
      await pool.query(
        `INSERT INTO estabelecimentos 
          (usuario_id, profissao, nome_estab, cnpj, tel_estab, endereco, bairro, cidade, cep, descricao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [usuarioId, profissao, nomeEstab, cnpj, telEstab, endereco, bairro, cidadeEstab, cep, descricao]
      );
    }

    res.status(201).json({ mensagem: 'Cadastro realizado com sucesso!' });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    }
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// ROTA: LOGIN
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const usuario = result.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    res.json({
      mensagem: 'Login realizado com sucesso!',
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});