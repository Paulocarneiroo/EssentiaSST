# Protótipo — Projeto 2
Autor: Paulo Segundo

## Link do Figma
https://www.figma.com/design/OsGFzuGRiDCzcrpUjHOrlQ/EssentiaSST-%E2%80%94-Prot%C3%B3tipo-Projeto-2


## Produto
Um app para técnicos de SST que permite gerenciar colaboradores, ASOs, riscos e eventos eSocial.

## Usuário principal
Técnico / analista de SST (ou administrador da empresa) responsável pelo ciclo de aptidão e conformidade eSocial.

## Fluxo principal prototipado
1. **Login** — autenticação com marca EssentiaSST (accent com contraste corrigido)
2. **Painel** — visão geral de aptidão, riscos e eventos
3. **Colaboradores** — listagem com filtros, busca, `aria-live` e foco restaurado
4. **Modal Novo colaborador** — cadastro do trabalhador
5. **Feedback** — toast de sucesso após cadastrar; toast de erro se a exclusão falhar

## Estados de feedback (Heurística #1)
| Estado | Frame no Figma |
|--------|----------------|
| Vazio | `04 — Estado vazio` |
| Carregamento | `05 — Estado de carregamento` |
| Erro | `08 — Estado de erro (exclusão)` |
| Sucesso | `07 — Estado de sucesso (toast)` |

## Melhorias aplicadas (do relatório heurístico do E6)
1. **Problema 1 — exclusão sem feedback de erro (#1 / #9):** no protótipo, a remoção de colaborador leva a um toast de erro claro (“Não foi possível remover o colaborador. Tente novamente.”), representando o `try/catch` + `toastErro` a codar em React.
2. **Problema 2 — foco e status após CRUD (#1 / #3):** a lista mostra região `aria-live` (“Lista atualizada…”) e o campo de busca com anel de foco restaurado após a ação.
3. **Problemas 3 e 4 — menu acessível + contraste da marca (#6 / contraste):** o menu do usuário documenta `aria-label: Menu da conta de Paulo Segundo`; o accent da marca usa `#0f8f84` (em vez de `#2ec4b6`) para contraste adequado sobre fundo claro/navbar.

## Como navegar no protótipo
1. Abra o arquivo no Figma e pressione **Play (▶)**
2. Inicie pelo flow **Fluxo principal** (tela de Login)
3. Clique: **Entrar** → **Colaboradores** (navbar) → **Novo colaborador** → **Cadastrar**
4. Na lista, clique **Remover** em Ana Souza para ver o estado de erro
5. Flows extras: **Estado vazio**, **Carregamento**, **Erro na exclusão**

## Base para React (próxima fase)
As telas espelham o frontend atual (`frontend/src/ui/views`) e os tokens de `frontend/css/styles.css`, já com as correções de UX do E6 como plano visual dos componentes React.
