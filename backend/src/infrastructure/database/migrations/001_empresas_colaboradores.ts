export const migration001EmpresasColaboradores = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj VARCHAR(14) NOT NULL UNIQUE,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255) NOT NULL,
  cnae VARCHAR(10) NOT NULL,
  grau_risco INTEGER NOT NULL CHECK (grau_risco BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cpf VARCHAR(11) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  data_nascimento DATE NOT NULL,
  cargo VARCHAR(255) NOT NULL,
  data_admissao DATE NOT NULL,
  data_demissao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, cpf)
);

CREATE INDEX IF NOT EXISTS idx_colaboradores_empresa_id ON colaboradores(empresa_id);
`;
