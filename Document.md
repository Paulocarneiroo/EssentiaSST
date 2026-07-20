# Início do Desenvolvimento — Projeto EssentialSST

## Contexto

Vamos iniciar o desenvolvimento do projeto com base na documentação presente no arquivo `README.md`.
Todo o desenvolvimento desta etapa inicial deve acontecer na branch:
```bash
projeto-1
```

---

# Objetivo da Primeira Versão

A primeira versão do projeto será composta por:

* Um frontend SPA (Single Page Application)
* Uma API backend REST
* Um banco de dados PostgreSQL rodando via Docker

A ideia desta etapa é criar uma estrutura simples e organizada para entrega na disciplina de Programação Web.

---

# Stack Tecnológica

## Frontend

O frontend deve ser desenvolvido sem utilização de frameworks JavaScript.

### Tecnologias permitidas

* HTML5
* CSS3
* JavaScript Vanilla
* Bootstrap

### Restrições

Não utilizar:

* React
* Angular
* Vue
* Next.js
* Qualquer outro framework frontend

### Objetivo

Construir uma SPA simples utilizando apenas JavaScript puro e Bootstrap para estilização e responsividade.

---

## Backend

O backend será desenvolvido utilizando:

* Node.js
* Express

### Objetivo

Criar uma API REST organizada e preparada para crescimento futuro.

---

## Banco de Dados

O banco de dados será:

* PostgreSQL
* Executado em container Docker

---

# Primeira Etapa do Projeto

## Prioridade Inicial

Começar pelo desenvolvimento do backend.

---

# Estrutura Inicial do Backend

Criar a estrutura base do projeto contendo os principais diretórios e arquivos necessários.

## Estrutura esperada

```bash
backend/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── database/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
├── .env
├── .env.example
├── .gitignore
├── .claudeignore
├── .cursorignore
├── package.json
├── docker-compose.yml
└── README.md
```

---

# Arquivos Iniciais Obrigatórios

Criar e configurar os seguintes arquivos:

## Configuração do projeto

* `package.json`
* `.env`
* `.env.example`

## Controle e organização

* `.gitignore`
* `.claudeignore`
* `.cursorignore`

## Documentação

* `README.md`

---

# Docker e Banco de Dados

Criar um arquivo `docker-compose.yml` responsável por subir o banco PostgreSQL do projeto.

## Requisitos do container

O container do banco deve possuir:

* PostgreSQL
* Volume persistente
* Porta exposta
* Variáveis de ambiente configuradas
* Nome padronizado

## Nome do serviço/container

```yaml
api-essentiasst-db
```

---

# Objetivos desta Etapa

Ao concluir esta etapa, o projeto deve possuir:

* Estrutura inicial organizada
* Backend Express funcional
* Configurações iniciais prontas
* PostgreSQL rodando via Docker
* Base preparada para evolução futura

---

# Diretrizes Importantes

## O projeto deve seguir princípios de SOLID, Clean Code e Clean Architecture, ou seja:
* Priorizar código limpo e organização.
* Seguir boas práticas de arquitetura.
* Evitar complexidade desnecessária neste momento.
* Criar uma estrutura escalável desde o início.
* Manter separação clara de responsabilidades.
