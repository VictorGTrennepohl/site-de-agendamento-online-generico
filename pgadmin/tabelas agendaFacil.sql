CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  cpf VARCHAR(14),
  telefone VARCHAR(15),
  senha VARCHAR(255) NOT NULL,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  tipo VARCHAR(20) DEFAULT 'cliente',
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE estabelecimentos (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  profissao VARCHAR(100),
  nome_estab VARCHAR(150),
  cnpj VARCHAR(18),
  tel_estab VARCHAR(15),
  endereco VARCHAR(200),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  cep VARCHAR(9),
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

SELECT * FROM usuarios;
