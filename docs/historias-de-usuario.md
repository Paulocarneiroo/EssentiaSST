# Histórias de Usuário — EssentiaSST

> As histórias a seguir descrevem o **comportamento desejado** e o **valor entregue ao usuário**,
> sem prescrever detalhes de implementação prematuramente. Conforme Wazlawick (2014), em pesquisas
> construtivo-tecnológicas a especificação de requisitos deve ser precisa o bastante para orientar
> as decisões de projeto e flexível o bastante para acomodar os refinamentos descobertos ao longo do
> desenvolvimento iterativo. O formato de histórias de usuário, consolidado nas metodologias ágeis,
> equilibra essa tensão.

Formato adotado: *"Como **\<papel\>**, quero **\<objetivo\>**, para **\<valor\>**"*, acompanhado de
**critérios de aceitação** em linguagem comportamental.

## Personas

- **Administrador (ADMIN):** gestor de SST responsável pela conta da empresa (tenant).
- **Operador (OPERADOR):** técnico/analista que executa as rotinas de SST no dia a dia.
- **Responsável pela conformidade:** papel focado na obrigação legal junto ao eSocial (na prática, um ADMIN).

---

## Microsserviço 1 — Cadastro de Empresas e Colaboradores

### H1.1 — Cadastro da empresa (tenant)
> Como **administrador**, quero cadastrar minha empresa com seus dados fiscais e de risco, para habilitar o uso da plataforma no contexto do meu negócio.

**Critérios de aceitação:**
- CNPJ válido (14 dígitos) e único na plataforma.
- Grau de risco entre 1 e 4, conforme a NR-04.
- Campos obrigatórios validados: razão social, nome fantasia e CNAE.
- Empresa com CNPJ já existente é rejeitada.

### H1.2 — Gestão de colaboradores
> Como **operador**, quero cadastrar, consultar, editar e desligar colaboradores da minha empresa, para manter a base de trabalhadores fiel à realidade.

**Critérios de aceitação:**
- CPF válido (11 dígitos) e único dentro da empresa.
- Datas (nascimento, admissão, demissão) em formato válido.
- Desligamento registra a data de demissão sem excluir o histórico.
- Todo colaborador está sempre vinculado a uma empresa existente.

### H1.3 — Isolamento entre empresas (multi-tenant)
> Como **administrador**, quero que meus dados sejam visíveis apenas para usuários da minha empresa, para garantir a confidencialidade entre clientes da plataforma.

**Critérios de aceitação:**
- Listagens retornam somente recursos do próprio tenant.
- Tentativa de acessar recurso de outra empresa resulta em "não encontrado".
- Ao cadastrar um colaborador, a empresa é sempre a do usuário autenticado.

---

## Microsserviço 2 — Autenticação (JWT)

### H2.1 — Registro de usuário
> Como **administrador**, quero registrar usuários vinculados à minha empresa, para que a equipe acesse a plataforma com identidade própria.

**Critérios de aceitação:**
- E-mail único e em formato válido.
- Senha com tamanho mínimo definido.
- A senha nunca é armazenada nem retornada em texto puro.
- Papel atribuído ao usuário (ADMIN ou OPERADOR).

### H2.2 — Login e sessão
> Como **usuário**, quero autenticar com e-mail e senha e receber um token, para acessar as funcionalidades protegidas com segurança.

**Critérios de aceitação:**
- Credenciais válidas retornam um token com prazo de expiração.
- Credenciais inválidas retornam mensagem genérica (sem revelar se o e-mail existe).
- O token identifica o usuário e a empresa (tenant) a que pertence.

### H2.3 — Proteção de recursos e perfis
> Como **administrador**, quero que as operações sensíveis exijam autenticação e respeitem o papel do usuário, para evitar acessos e ações indevidas.

**Critérios de aceitação:**
- Requisição sem token válido é recusada.
- Token expirado ou inválido é recusado.
- Ações restritas a determinado papel são negadas aos demais.

---

## Microsserviço 3 — Mensageria eSocial

### H3.1 — Geração de evento a partir do domínio
> Como **responsável pela conformidade**, quero gerar o evento eSocial correspondente a um ASO ou risco (S-2210, S-2220, S-2240), para cumprir a obrigação sem redigir XML manualmente.

**Critérios de aceitação:**
- O evento é montado a partir dos dados já cadastrados (colaborador / ASO / risco).
- O XML segue o leiaute vigente (S-1.2).
- O tipo de evento reflete o fato de origem.

### H3.2 — Validação antes do envio
> Como **responsável pela conformidade**, quero que o XML seja validado contra o schema antes da transmissão, para reduzir a zero as rejeições por erro de formato.

**Critérios de aceitação:**
- XML fora do schema é bloqueado, com indicação do problema.
- Apenas eventos válidos ficam aptos ao envio.

### H3.3 — Transmissão e acompanhamento de retorno
> Como **responsável pela conformidade**, quero enviar o evento ao eSocial e acompanhar seu status, para ter rastreabilidade do cumprimento da obrigação.

**Critérios de aceitação:**
- O status transita entre `PENDENTE → ENVIADO → ACEITO/REJEITADO`.
- Protocolo de recebimento é registrado quando o evento é aceito.
- A mensagem de erro é registrada quando o evento é rejeitado.

### H3.4 — Reenvio após correção
> Como **responsável pela conformidade**, quero reenviar um evento rejeitado após corrigir os dados, para regularizar a pendência sem recriar tudo do zero.

**Critérios de aceitação:**
- Apenas eventos em estado `REJEITADO` podem ser reenviados.
- O reenvio preserva o vínculo com o fato de origem.
- O novo retorno atualiza o status do evento.

### H3.5 — Ambiente de homologação
> Como **administrador**, quero validar os envios em ambiente de testes antes da produção, para experimentar o fluxo sem risco de gerar obrigações reais indevidas.

**Critérios de aceitação:**
- É possível direcionar os envios a um ambiente de homologação/sandbox.
- A troca de ambiente não altera a lógica de negócio, apenas o destino do envio.

---

## Referências

- WAZLAWICK, R. S. *Metodologia de pesquisa para ciência da computação.* 2. ed. Rio de Janeiro: Elsevier, 2014.
