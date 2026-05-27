const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o seu banco PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'AgendaFacil',
  password: 'root', // Sua senha que deu certo no pgAdmin
  port: 5432,
});

// Rota para salvar o cadastro
app.post('/api/cadastro', async (req, res) => {
  try {
    const {
      tipo_conta, nome, cpf, email, telefone, senha, cidade, estado,
      profissao, nome_estab, cnpj, tel_estab, endereco, bairro, cidade_estab, cep, descricao
    } = req.body;

    const queryText = `
      INSERT INTO usuarios (
        tipo_conta, nome, cpf, email, telefone, senha, cidade, estado,
        profissao, nome_estab, cnpj, tel_estab, endereco, bairro, cidade_estab, cep, descricao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id;
    `;

    const values = [
      tipo_conta, nome, cpf, email, telefone, senha, cidade, estado,
      profissao || null, nome_estab || null, cnpj || null, tel_estab || null, 
      endereco || null, bairro || null, city_estab = cidade_estab || null, cep || null, descricao || null
    ];

    const result = await pool.query(queryText, values);
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', id: result.rows[0].id });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
        return res.status(400).json({ error: 'E-mail ou CPF já cadastrado.' });
    }
    res.status(500).json({ error: 'Erro ao salvar no banco de dados.' });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});