//para iniciar o servidor, usar terminal na pasta backend e digite: node server.js

require('dotenv').config();
const express  = require('express');
const { Pool } = require('pg');
const cors     = require('cors');
const bcrypt   = require('bcrypt');
const session  = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Conexão com PostgreSQL ───────────────────────────────────────────────────
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

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Sessão e Passport ────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ─── Estratégia Google ────────────────────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  'http://localhost:3000/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1', [profile.emails[0].value]
    );

    if (resultado.rows.length > 0) {
      // Usuário já cadastrado — faz login normalmente
      return done(null, { ...resultado.rows[0], jaExiste: true });
    }

    // Usuário não cadastrado — passa os dados do Google
    return done(null, {
      jaExiste: false,
      nome:  profile.displayName,
      email: profile.emails[0].value,
    });

  } catch (err) {
    return done(err, null);
  }
}));

// ─── Rotas Google Auth ────────────────────────────────────────────────────────
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    if (req.user.jaExiste) {
      // Já cadastrado — loga e vai para página principal
      const usuario = {
        id:    req.user.id,
        nome:  req.user.nome,
        email: req.user.email,
        tipo:  req.user.tipo,
      };
      const dados = encodeURIComponent(JSON.stringify(usuario));
      res.redirect(`http://127.0.0.1:5501/Frontend/Pagina%20de%20login/Pagina%20de%20Login.html?usuario=${dados}`);
    } else {
      // Não cadastrado — vai para cadastro com email preenchido
      const email = encodeURIComponent(req.user.email);
      const nome  = encodeURIComponent(req.user.nome);
      res.redirect(`http://127.0.0.1:5501/Frontend/Pagina%20de%20Cadastro/CadastroUsuarios.html?email=${email}&nome=${nome}`);
    }
  }
);

// ─── Rota: Cadastro ───────────────────────────────────────────────────────────
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

    // DEPOIS
    if (tipo === 'profissional') {
      await pool.query(
        `INSERT INTO estabelecimentos 
          (usuario_id, profissao, nome_estab, cnpj, tel_estab, endereco, bairro, cidade, cep, descricao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [usuarioId, profissao, nomeEstab, cnpj, telEstab, endereco, bairro, cidadeEstab, cep, descricao]
      );

      // Cria horários padrão automaticamente
      const dias     = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
      const horarios = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

      for (const dia of dias) {
        for (const horario of horarios) {
          await pool.query(
            `INSERT INTO horarios (profissional_id, dia_semana, horario, disponivel)
            VALUES ($1, $2, $3, TRUE)`,
            [usuarioId, dia, horario]
          );
        }
      }
    }
    res.status(201).json({ 
      mensagem: 'Cadastro realizado com sucesso!',
      usuario: {
        id:    resultUsuario.rows[0].id,
        nome:  nome,
        email: email,
        tipo:  tipo
      }
    });
    
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    }
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// ─── Rota: Login ──────────────────────────────────────────────────────────────
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

    const usuario     = result.rows[0];
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

// ─── Rota: Buscar Profissionais ───────────────────────────────────────────────
app.get('/api/profissionais', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.nome, e.profissao, e.nome_estab, 
             e.tel_estab, e.endereco, e.bairro, e.cidade, e.descricao
      FROM usuarios u
      INNER JOIN estabelecimentos e ON e.usuario_id = u.id
      WHERE u.tipo = 'profissional'
      ORDER BY u.nome ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao buscar profissionais.' });
  }
});

// ─── Rota: Buscar Horários do Profissional ────────────────────────────────────
app.get('/api/horarios/:profissionalId', async (req, res) => {
  try {
    const { profissionalId } = req.params;
    const result = await pool.query(`
      SELECT h.id, h.dia_semana, h.horario, h.disponivel
      FROM horarios h
      WHERE h.profissional_id = $1
      ORDER BY h.dia_semana, h.horario
    `, [profissionalId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao buscar horários.' });
  }
});

// ─── Rota: Confirmar Agendamento ──────────────────────────────────────────────
app.post('/api/agendamentos', async (req, res) => {
  const { clienteId, horarioId } = req.body;

  if (!clienteId || !horarioId) {
    return res.status(400).json({ erro: 'Dados incompletos.' });
  }

  try {
    const horario = await pool.query(
      'SELECT * FROM horarios WHERE id = $1 AND disponivel = TRUE', [horarioId]
    );

    if (horario.rows.length === 0) {
      return res.status(400).json({ erro: 'Este horário já foi ocupado.' });
    }

    await pool.query(
      `INSERT INTO agendamentos (cliente_id, horario_id) VALUES ($1, $2)`,
      [clienteId, horarioId]
    );

    await pool.query(
      'UPDATE horarios SET disponivel = FALSE WHERE id = $1', [horarioId]
    );

    res.status(201).json({ mensagem: 'Agendamento confirmado com sucesso!' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao confirmar agendamento.' });
  }
});

// ─── Rota: Buscar agendamentos do cliente ─────────────────────────────────────
app.get('/api/meus-agendamentos/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const result = await pool.query(`
      SELECT 
        a.id,
        a.status,
        a.criado_em,
        h.dia_semana,
        h.horario,
        u.nome AS profissional_nome,
        e.profissao,
        e.nome_estab,
        e.endereco,
        e.bairro,
        e.cidade,
        e.tel_estab
      FROM agendamentos a
      INNER JOIN horarios h ON h.id = a.horario_id
      INNER JOIN usuarios u ON u.id = h.profissional_id
      INNER JOIN estabelecimentos e ON e.usuario_id = u.id
      WHERE a.cliente_id = $1
      ORDER BY a.criado_em DESC
    `, [clienteId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });
  }
});

// ─── Rota: Cancelar agendamento ───────────────────────────────────────────────
app.put('/api/agendamentos/:id/cancelar', async (req, res) => {
  const { id } = req.params;
  try {
    const ag = await pool.query('SELECT horario_id FROM agendamentos WHERE id = $1', [id]);
    if (ag.rows.length === 0) return res.status(404).json({ erro: 'Agendamento não encontrado.' });

    await pool.query('UPDATE horarios SET disponivel = TRUE WHERE id = $1', [ag.rows[0].horario_id]);
    await pool.query('UPDATE agendamentos SET status = $1 WHERE id = $2', ['cancelado', id]);

    res.json({ mensagem: 'Agendamento cancelado com sucesso!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao cancelar agendamento.' });
  }
});

// ─── Rota: Buscar dados do usuário ────────────────────────────────────────────
app.get('/api/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, nome, email, cpf, telefone, cidade, estado, tipo FROM usuarios WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao buscar usuário.' });
  }
});

// ─── Rota: Atualizar dados do usuário ─────────────────────────────────────────
app.put('/api/usuario/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, cidade, estado } = req.body;

  try {
    await pool.query(
      `UPDATE usuarios SET nome = $1, telefone = $2, cidade = $3, estado = $4 WHERE id = $5`,
      [nome, telefone, cidade, estado, id]
    );
    res.json({ mensagem: 'Dados atualizados com sucesso!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao atualizar dados.' });
  }
});

// ─── Rota: Alterar senha ──────────────────────────────────────────────────────
app.put('/api/usuario/:id/senha', async (req, res) => {
  const { id } = req.params;
  const { senhaAtual, novaSenha } = req.body;

  try {
    const result = await pool.query('SELECT senha FROM usuarios WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    const senhaCorreta = await bcrypt.compare(senhaAtual, result.rows[0].senha);
    if (!senhaCorreta) return res.status(401).json({ erro: 'Senha atual incorreta.' });

    const novaSenhaCriptografada = await bcrypt.hash(novaSenha, 10);
    await pool.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [novaSenhaCriptografada, id]);

    res.json({ mensagem: 'Senha alterada com sucesso!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao alterar senha.' });
  }
});

// ─── Rota: Buscar estabelecimentos do profissional ────────────────────────────
app.get('/api/meus-estabelecimentos/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const result = await pool.query(
      `SELECT * FROM estabelecimentos WHERE usuario_id = $1`,
      [usuarioId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao buscar estabelecimentos.' });
  }
});

// ─── Rota: Agendamentos recebidos pelo profissional ───────────────────────────
app.get('/api/agendamentos-profissional/:profissionalId', async (req, res) => {
  try {
    const { profissionalId } = req.params;
    const result = await pool.query(`
      SELECT 
        a.id,
        a.status,
        a.criado_em,
        h.dia_semana,
        h.horario,
        u.nome AS cliente_nome,
        u.telefone AS cliente_telefone,
        u.email AS cliente_email
      FROM agendamentos a
      INNER JOIN horarios h ON h.id = a.horario_id
      INNER JOIN usuarios u ON u.id = a.cliente_id
      WHERE h.profissional_id = $1
      ORDER BY a.criado_em DESC
    `, [profissionalId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });
  }
});

// Edição do estabalecimento
app.put('/api/estabelecimento/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;
  const { profissao, nome_estab, cnpj, tel_estab, endereco, bairro, cidade, cep, descricao } = req.body;

  try {
    await pool.query(
      `UPDATE estabelecimentos SET 
        profissao = $1, nome_estab = $2, cnpj = $3, tel_estab = $4,
        endereco = $5, bairro = $6, cidade = $7, cep = $8, descricao = $9
       WHERE usuario_id = $10`,
      [profissao, nome_estab, cnpj, tel_estab, endereco, bairro, cidade, cep, descricao, usuarioId]
    );
    res.json({ mensagem: 'Estabelecimento atualizado com sucesso!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao atualizar estabelecimento.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});