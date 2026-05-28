const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ─── Conexão com PostgreSQL ───────────────────────────────────────────────────
// Altere os valores abaixo para os dados do seu banco no pgAdmin
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'agendafacil',   // nome do seu banco no pgAdmin
  user: 'postgres',           // usuário do pgAdmin
  password: 'sua_senha_aqui', // senha do pgAdmin
});

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors()); // permite que o HTML aberto no navegador fale com o servidor
app.use(express.json());

// ─── Rota de Cadastro ─────────────────────────────────────────────────────────
app.post('/api/cadastro', async (req, res) => {
  const {
    tipo,
    nome, cpf, email, telefone, senha, cidade, estado,
    // campos de profissional (podem vir vazios se for cliente)
    profissao, nomeEstab, cnpj, telEstab, endereco, bairro, cidadeEstab, cep, descricao,
  } = req.body;

  // ── Validações básicas ──
  if (!nome || !cpf || !email || !telefone || !senha || !cidade || !estado) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
  }

  if (tipo === 'profissional' && (!profissao || !nomeEstab || !telEstab || !endereco)) {
    return res.status(400).json({ erro: 'Preencha todos os campos do estabelecimento.' });
  }

  try {
    // ── Verifica se e-mail já existe ──
    const emailExiste = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1', [email]
    );
    if (emailExiste.rows.length > 0) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    // ── Insere usuário ──
    const resultado = await pool.query(
      `INSERT INTO usuarios
        (tipo, nome, cpf, email, telefone, senha, cidade, estado,
         profissao, nome_estab, cnpj, tel_estab, endereco, bairro, cidade_estab, cep, descricao)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        tipo, nome, cpf, email, telefone, senha, cidade, estado,
        profissao || null, nomeEstab || null, cnpj || null, telEstab || null,
        endereco || null, bairro || null, cidadeEstab || null, cep || null, descricao || null,
      ]
    );

    return res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso!',
      id: resultado.rows[0].id,
    });

  } catch (err) {
    console.error('Erro no cadastro:', err);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// ─── Inicia o servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});