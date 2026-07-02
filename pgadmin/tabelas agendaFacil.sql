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
DELETE FROM usuarios WHERE email = 'hypersnakeex@gmail.com';
UPDATE horarios SET disponivel = TRUE;
SELECT id, nome, email, senha FROM usuarios WHERE email = 'hypersnakeex@gmail.com';
ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(100);
ALTER TABLE estabelecimentos ADD COLUMN estado VARCHAR(2);

CREATE TABLE horarios (
  id SERIAL PRIMARY KEY,
  profissional_id INT REFERENCES usuarios(id),
  dia_semana VARCHAR(10),
  horario TIME,
  disponivel BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agendamentos (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES usuarios(id),
  horario_id INT REFERENCES horarios(id),
  status VARCHAR(20) DEFAULT 'confirmado',
  criado_em TIMESTAMP DEFAULT NOW()
);


INSERT INTO horarios (profissional_id, dia_semana, horario, disponivel)
VALUES 
(2, 'Segunda', '08:00', TRUE),
(2, 'Segunda', '09:00', TRUE),
(2, 'Segunda', '10:00', TRUE),
(2, 'Terça',   '08:00', TRUE),
(2, 'Terça',   '09:00', FALSE),
(2, 'Quarta',  '10:00', TRUE);

DO $$
DECLARE
  prof RECORD;
  dia TEXT;
  hora TEXT;
BEGIN
  FOR prof IN SELECT id FROM usuarios WHERE tipo = 'profissional' LOOP
    FOREACH dia IN ARRAY ARRAY['Segunda','Terça','Quarta','Quinta','Sexta'] LOOP
      FOREACH hora IN ARRAY ARRAY['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'] LOOP
        INSERT INTO horarios (profissional_id, dia_semana, horario, disponivel)
        VALUES (prof.id, dia, hora::TIME, TRUE)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;