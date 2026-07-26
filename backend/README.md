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

A separação segue **SRP** (cada camada tem um motivo único para mudar) e prepara o terreno para **DIP** — os services dependerão de interfaces de repositório, não do driver `pg` diretamente, conforme evolução do domínio descrito no [README principal](../docs/regras-de-negocio.md).

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

# 5. Aplicar as migrations
npm run db:migrate

# 6. Iniciar a API em modo desenvolvimento
npm run dev
```

> **Banco já existente criado com `prisma db push`?** Antes do passo 5, marque a
> migration de baseline como já aplicada — ela descreve o estado que o banco já
> tem, e reexecutá-la falharia:
>
> ```bash
> npx prisma migrate resolve --applied 20260720000000_init
> npm run db:migrate   # aplica apenas 20260720000100_modulo3_esocial
> ```
>
> Em um banco vazio isso não é necessário: `db:migrate` aplica as duas em ordem.

A API ficará disponível em `http://localhost:3000`.

### Swagger (testar endpoints)

Com a API rodando, abra no navegador:

**http://localhost:3000/api/docs**

A especificação OpenAPI em JSON está em `http://localhost:3000/api/docs/openapi.json`.

---

## Acesso pela rede local

A API roda em uma máquina (notebook) e é consumida de outra (PC principal).
Por padrão `HOST=0.0.0.0`, ou seja, ela escuta em **todas as interfaces** — não
só em `localhost`. No boot, o log já imprime os endereços alcançáveis:

```
EssentiaSST API ouvindo em 0.0.0.0:3000 (development)
  local:   http://localhost:3000/api/docs
  na rede: http://192.168.0.42:3000/api/docs
```

### Na máquina que roda a API (uma vez só)

O Windows bloqueia conexões de entrada por padrão. Libere a porta 3000 em um
**PowerShell como administrador**:

```powershell
New-NetFirewallRule -DisplayName "EssentiaSST API" -Direction Inbound `
  -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
```

> `-Profile Private` restringe a regra a redes marcadas como *Particular*. Se a
> conexão não passar, confirme o perfil da rede com `Get-NetConnectionProfile` —
> em rede *Pública* o Windows bloqueia mesmo com a regra criada.

Descobrir o IP da máquina:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' }
```

### Na máquina cliente

Troque `localhost` pelo IP do notebook:

```
http://192.168.0.42:3000/api/docs      # Swagger
http://192.168.0.42:3000/api/health    # health check
```

O Swagger funciona de qualquer host porque o `servers` do OpenAPI usa o caminho
relativo `/api` — as requisições do "Try it out" vão para o mesmo endereço que
serviu a página.

Para restringir a API a acesso local de novo, basta `HOST=127.0.0.1` no `.env`.

### Banco de dados

O PostgreSQL (Docker) sobe **na mesma máquina da API** e é acessado por ela via
`localhost:5432` — não precisa ser exposto na rede. Mantenha `DB_HOST=localhost`
e não abra a porta 5432 no firewall.

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
| `npm run db:migrate`| Aplica as migrations pendentes (`prisma migrate deploy`).        |
| `npm run db:status` | Mostra quais migrations já foram aplicadas.                      |
| `npm run prisma:migrate` | Cria uma nova migration a partir do schema (exige banco).   |

---

## Migrations

O schema é versionado em `prisma/migrations/`:

| Migration                        | Conteúdo                                          |
|----------------------------------|---------------------------------------------------|
| `20260720000000_init`            | Baseline: `empresas`, `usuarios`, `colaboradores` |
| `20260720000100_modulo3_esocial` | `asos`, `riscos`, `eventos_esocial` e seus enums  |

`prisma db push` não é mais usado: ele altera o banco sem deixar histórico, o que
faz o estado depender de quem rodou o quê. Para criar uma migration nova, edite
`prisma/schema.prisma` e rode `npm run prisma:migrate -- --name descricao-curta`
**na máquina que tem o banco**.

---

## Variáveis de ambiente

| Variável         | Descrição                                  | Default            |
|------------------|--------------------------------------------|--------------------|
| `NODE_ENV`       | Ambiente (`development`/`production`).     | `development`      |
| `HOST`           | Interface de escuta (`0.0.0.0` = LAN).     | `0.0.0.0`          |
| `PORT`           | Porta HTTP da API.                         | `3000`             |
| `DB_HOST`        | Host do PostgreSQL.                        | `localhost`        |
| `DB_PORT`        | Porta do PostgreSQL.                       | `5432`             |
| `DB_NAME`        | Nome do banco.                             | `essentiasst`      |
| `DB_USER`        | Usuário do banco.                          | `essentiasst`      |
| `DB_PASSWORD`    | Senha do banco.                            | —                  |
| `JWT_SECRET`     | Segredo para assinatura de tokens JWT.     | —                  |
| `JWT_EXPIRES_IN` | Duração do token.                          | `1d`               |
| `ESOCIAL_AMBIENTE` | `PRODUCAO` ou `PRODUCAO_RESTRITA` (campo `tpAmb`). | `PRODUCAO_RESTRITA` |
| `ESOCIAL_CLIENTE`  | `sandbox` (simulador local) ou `govbr`.  | `sandbox`          |
| `ESOCIAL_TAXA_REJEICAO` | Proporção de rejeições simuladas (0 a 1). | `0`           |

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

### ASO (`/api/asos`)

| Método   | Rota     | Descrição                                        |
|----------|----------|--------------------------------------------------|
| `GET`    | `/`      | Lista ASOs do tenant (`?colaboradorId=` opcional)|
| `GET`    | `/:id`   | Busca por id                                     |
| `POST`   | `/`      | Registra ASO                                     |
| `PUT`    | `/:id`   | Atualiza ASO                                     |
| `DELETE` | `/:id`   | Remove ASO (**ADMIN**)                           |

### Riscos (`/api/riscos`)

| Método   | Rota     | Descrição                          |
|----------|----------|------------------------------------|
| `GET`    | `/`      | Lista riscos do PGR do tenant      |
| `GET`    | `/:id`   | Busca por id                       |
| `POST`   | `/`      | Cadastra risco                     |
| `PUT`    | `/:id`   | Atualiza risco                     |
| `DELETE` | `/:id`   | Remove risco (**ADMIN**)           |

---

## Mensageria eSocial (`/api/eventos-esocial`)

| Método | Rota             | Descrição                                             |
|--------|------------------|-------------------------------------------------------|
| `GET`  | `/`              | Lista eventos do tenant                               |
| `GET`  | `/:id`           | Busca evento por id                                   |
| `GET`  | `/:id/xml`       | Baixa o payload XML (`application/xml`)               |
| `POST` | `/aso`           | Gera **S-2220** a partir de um ASO                    |
| `POST` | `/risco`         | Gera **S-2240** a partir de um risco + colaborador    |
| `POST` | `/:id/enviar`    | Transmite ao eSocial (**ADMIN**)                      |
| `POST` | `/:id/reenviar`  | Reenvia evento `REJEITADO` (**ADMIN**)                |

### Ciclo de vida do evento

```
PENDENTE ──enviar──► ENVIADO ──┬──► ACEITO      (registra protocolo)
    ▲                          └──► REJEITADO   (registra mensagem de erro)
    └────────────── reenviar ────────┘
```

`ACEITO` é terminal. Somente `REJEITADO` admite reenvio, que remonta o XML a
partir do fato de origem já corrigido e preserva o vínculo do evento original.

### Arquitetura (DIP)

| Abstração          | Implementações                                                        |
|--------------------|-----------------------------------------------------------------------|
| `IValidadorSchema` | `ValidadorSchemaS12` (validação estrutural do leiaute S-1.2)          |
| `IClienteESocial`  | `ClienteESocialSandbox` (simulador), `ClienteWSeSocialGovBr` (*stub*) |

`MontadorXMLeSocial` monta e valida o XML; `ServicoEnvioESocial` cuida do ciclo
de vida e do transporte. Trocar o destino do envio é questão de configuração
(`ESOCIAL_CLIENTE`), sem tocar em regra de negócio.

### Limitações conhecidas

- **Sem transmissão real.** `ClienteWSeSocialGovBr` lança erro: falta certificado
  ICP-Brasil, assinatura XMLDSig e o fluxo de lote (`EnviarLoteEventos` /
  `ConsultarLoteEventos`). O sandbox simula o retorno de forma determinística.
- **Validação estrutural, não XSD oficial.** Cobre elementos obrigatórios,
  ordem, cardinalidade e formatos; não substitui a homologação oficial.
- **S-2210 (CAT) não implementado** — depende de uma entidade de Comunicação de
  Acidente de Trabalho que ainda não existe no domínio.
- **Códigos da Tabela 24** em `COD_AGENTE_NOCIVO` são representativos por
  categoria de risco, não o código específico do agente.

---

## Próximas etapas

- Entidade CAT e evento S-2210.
- Campo `matricula` próprio em `Colaborador` (hoje derivado do UUID).
- `AptidaoService` e `GeradorRelatorioPGR` (PGR em PDF).
- Migrations versionadas (`prisma migrate`) no lugar de `db push`.
