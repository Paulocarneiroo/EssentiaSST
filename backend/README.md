# EssentiaSST — Backend

API REST do **EssentiaSST**, plataforma de Gestão de Segurança e Saúde no Trabalho integrada ao eSocial.

---

## Stack

- **Node.js** (>= 20) + **Express** — API REST com módulos ESM.
- **TypeScript** — tipagem estática em todo o backend (`strict` mode).
- **PostgreSQL 16** — banco de dados relacional, executado em container Docker.
- **pg** — driver oficial do PostgreSQL para Node (sem ORM nesta etapa).
- **Jest** + **ts-jest** — testes unitários e de integração.
- **ESLint** (typescript-eslint) + **Prettier** — qualidade e formatação de código.
- **tsx** — execução direta de TypeScript em desenvolvimento (hot-reload via `--watch`).
- **dotenv** — carregamento de variáveis de ambiente.
- **swagger-ui-express** — documentação interativa OpenAPI 3.

---

## Estrutura

```
backend/
├── src/
│   ├── config/              # Carregamento e validação de variáveis de ambiente
│   ├── controllers/         # Camada HTTP (MVC) — recebe request, delega ao service
│   ├── domain/              # Entidades, validadores e erros de domínio
│   ├── application/         # Services e ports (interfaces) — Clean Architecture
│   ├── infrastructure/      # Repositórios Postgres, migrations e DI
│   ├── database/            # Pool de conexões PostgreSQL
│   ├── middlewares/         # Tratamento de erros, autenticação, etc.
│   ├── routes/              # Definição das rotas Express
│   ├── services/            # Serviços transversais (ex.: health)
│   ├── utils/               # Utilitários transversais (logger, helpers)
│   └── server.ts            # Bootstrap da aplicação
├── dist/               # Saída compilada do TypeScript (gerada por `npm run build`)
├── .env                # Variáveis locais (NÃO versionar)
├── .env.example        # Modelo de variáveis
├── docker-compose.yml  # Container do PostgreSQL
├── tsconfig.json
├── jest.config.js
├── eslint.config.js
├── .prettierrc.json
└── package.json
```

A separação segue **SRP** (cada camada tem um motivo único para mudar) e prepara o terreno para **DIP** — os services dependerão de interfaces de repositório, não do driver `pg` diretamente, conforme evolução do domínio descrito no [README principal](../README.md).

---

## Pré-requisitos

- Node.js **>= 20**
- Docker + Docker Compose
- npm (vem com o Node)

---

## Setup

```bash
# 1. Entrar no diretório
cd backend

# 2. Instalar dependências
npm install

# 3. Copiar o arquivo de variáveis
cp .env.example .env
# (Windows PowerShell)
# Copy-Item .env.example .env

# 4. Subir o banco PostgreSQL
docker compose up -d

# 5. Iniciar a API em modo desenvolvimento
npm run dev
```

A API ficará disponível em `http://localhost:3000`.

### Swagger (testar endpoints)

Com a API rodando, abra no navegador:

**http://localhost:3000/api/docs**

A especificação OpenAPI em JSON está em `http://localhost:3000/api/docs/openapi.json`.

### Verificar saúde

```bash
curl http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "uptime": 1.23,
  "database": true,
  "timestamp": "2026-05-21T12:00:00.000Z"
}
```

---

## Scripts npm

| Script              | Descrição                                                       |
|---------------------|-----------------------------------------------------------------|
| `npm run dev`       | Inicia a API com `tsx --watch` (executa TS direto + auto-reload).|
| `npm run build`     | Compila TypeScript para `dist/` via `tsc`.                       |
| `npm start`         | Roda a versão compilada (`node dist/server.js`).                 |
| `npm test`          | Roda a suíte de testes com Jest + ts-jest.                       |
| `npm run typecheck` | Verifica tipos sem emitir arquivos (`tsc --noEmit`).             |
| `npm run lint`      | Executa o ESLint em `src/**/*.ts`.                               |
| `npm run format`    | Formata o código TypeScript com Prettier.                        |

---

## Variáveis de ambiente

| Variável         | Descrição                                  | Default            |
|------------------|--------------------------------------------|--------------------|
| `NODE_ENV`       | Ambiente (`development`/`production`).     | `development`      |
| `PORT`           | Porta HTTP da API.                         | `3000`             |
| `DB_HOST`        | Host do PostgreSQL.                        | `localhost`        |
| `DB_PORT`        | Porta do PostgreSQL.                       | `5432`             |
| `DB_NAME`        | Nome do banco.                             | `essentiasst`      |
| `DB_USER`        | Usuário do banco.                          | `essentiasst`      |
| `DB_PASSWORD`    | Senha do banco.                            | —                  |
| `JWT_SECRET`     | Segredo para assinatura de tokens JWT.     | —                  |
| `JWT_EXPIRES_IN` | Duração do token.                          | `1d`               |

---

## Docker — PostgreSQL

O serviço de banco é definido em `docker-compose.yml`:

- **Container**: `api-essentiasst-db`
- **Imagem**: `postgres:16-alpine`
- **Porta**: `5432` (configurável via `DB_PORT`)
- **Volume persistente**: `api-essentiasst-db-data`
- **Healthcheck**: `pg_isready` a cada 10s

Comandos úteis:

```bash
docker compose up -d           # subir o banco
docker compose logs -f         # acompanhar logs
docker compose down            # parar (mantém o volume)
docker compose down -v         # parar e apagar o volume
```

---

## API — Empresas e Colaboradores

### Empresas (`/api/empresas`)

| Método   | Rota              | Descrição              |
|----------|-------------------|------------------------|
| `GET`    | `/`               | Lista todas as empresas |
| `GET`    | `/:id`            | Busca por id (UUID)     |
| `POST`   | `/`               | Cria empresa            |
| `PUT`    | `/:id`            | Atualiza empresa        |
| `DELETE` | `/:id`            | Remove empresa          |

**Body (POST/PUT):**

```json
{
  "cnpj": "12345678000199",
  "razaoSocial": "Empresa Exemplo LTDA",
  "nomeFantasia": "Exemplo SST",
  "cnae": "6201500",
  "grauRisco": 2
}
```

### Colaboradores (`/api/colaboradores`)

| Método   | Rota              | Descrição                              |
|----------|-------------------|----------------------------------------|
| `GET`    | `/`               | Lista todos (`?empresaId=` opcional)   |
| `GET`    | `/:id`            | Busca por id (UUID)                    |
| `POST`   | `/`               | Cria colaborador                       |
| `PUT`    | `/:id`            | Atualiza colaborador                   |
| `DELETE` | `/:id`            | Remove colaborador                     |

**Body (POST/PUT):**

```json
{
  "empresaId": "uuid-da-empresa",
  "cpf": "12345678901",
  "nome": "Maria Silva",
  "dataNascimento": "1990-05-15",
  "cargo": "Analista de SST",
  "dataAdmissao": "2024-01-10",
  "dataDemissao": null
}
```

As migrations são aplicadas automaticamente na subida da API.

---

## Próximas etapas

- CRUD de ASO, Risco e EventoESocial.
- Implementação das demais interfaces (`IRepositorioASO`, `IClienteESocial`, etc.) seguindo DIP.
- Autenticação JWT e multi-tenancy.
- Mensageria eSocial (eventos S-2210, S-2220, S-2240).
