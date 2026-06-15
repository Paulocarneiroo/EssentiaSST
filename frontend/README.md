# EssentiaSST — Frontend

SPA em HTML, CSS e TypeScript puro, estilizada com Bootstrap.

## Arquitetura

```
src/
├── api/        # Chamadas HTTP aos endpoints da API
├── services/   # Regras de negócio e formatação
├── state/      # Estado global da aplicação
└── ui/         # Renderização e interação com o DOM
```

## Recursos

- **Empresas** — listar (GET), cadastrar (POST) e remover (DELETE)
- **Colaboradores** — listar (GET), cadastrar (POST) e remover (DELETE)

## Pré-requisitos

- Node.js 20+
- Backend da API rodando em `http://localhost:3000`

## Como executar

```bash
cd frontend
npm install
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173`.

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run build` | Compila TypeScript para `dist/` |
| `npm run watch` | Compila em modo watch |
| `npm run serve` | Sobe servidor estático na porta 5173 |
| `npm run dev` | Build + servidor estático |
