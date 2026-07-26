# EssentiaSST

> Plataforma web modular para Gestão de Segurança e Saúde no Trabalho (SST) integrada ao eSocial.

---

## 1. Sobre o projeto

O **EssentiaSST** será um software web, modular e escalável, voltado para a Gestão de Segurança e Saúde no Trabalho (SST) de empresas brasileiras, com ênfase em micro, pequenas e médias empresas (MPMEs). A plataforma reúne, em módulos independentes, as principais rotinas exigidas pela legislação trabalhista (NRs, ISO 45001, eSocial-SST) e propõe um modelo de contratação *pague pelo que usar*, com interface centrada no usuário.

O projeto compõe a avaliação da disciplina de **Programação Web**, sob ministração do Prof. Rodrigo Alves Costa.

### 1.1 Problema

- Sistemas comerciais de SST (SOC, RSData, SGG, IndexMed) são robustos, mas frequentemente complexos e financeiramente inviáveis para MPMEs.
- A digitalização das obrigações de SST pelo eSocial (eventos S-2210, S-2220 e S-2240) impôs prazos rígidos e validações de *schema* (leiaute S-1.2) que aumentaram a barreira técnica para pequenos empregadores.
- Falhas de conformidade resultam em multas, perda de benefícios previdenciários e, sobretudo, aumento de acidentes ocupacionais.

### 1.2 Objetivos

- Reduzir em ≥ 30 % o tempo gasto em tarefas rotineiras de SST.
- Eliminar falhas de envio ao eSocial (taxa de rejeição = 0 %).
- Oferecer conformidade legal a custos acessíveis para MPMEs.

---

## 2. Esboço do domínio (com SRP e DIP aplicados)

Nesta segunda entrega são esboçadas as classes do núcleo do domínio com dois princípios SOLID aplicados:

- **SRP** — cada classe tem um único motivo para mudar; responsabilidades de integração, relatório e aptidão foram extraídas para serviços dedicados.
- **DIP** — módulos de alto nível (serviços de negócio) não dependem de implementações concretas de infraestrutura; dependem de **abstrações (interfaces)**, que são implementadas por classes de infraestrutura intercambiáveis.

> *empresa cadastra colaborador → colaborador realiza ASO → serviço de aptidão avalia resultado via IRepositorioASO → serviço eSocial monta XML via IMontadorXML e envia via IClienteESocial; relatório PGR é gerado via IExportadorRelatorio.*

---

### 2.1 Diagrama de classes 

```
DOMÍNIO                              SERVIÇOS DE APLICAÇÃO              ABSTRAÇÕES (DIP)
────────────────────────────────     ──────────────────────────────     ──────────────────────────────
+-----------------+                  +---------------------------+
|     Empresa     |◆──1..*──────────►|       Colaborador         |◆──0..*──►[ ASO ]
+-----------------+   composição     +---------------------------+           composição
| -id             |                  | -id / -cpf / -nome        |
| -cnpj           |                  | -cargo / -dataAdmissao    |
| -razaoSocial    |                  +---------------------------+
| -cnae           |                                                    +---------------------------+
| -grauRisco      |                                                    |     AptidaoService        |
+-----------------+                                                    +---------------------------+
        ◇ 1 agregação                                                  | -repo: IRepositorioASO    |
        | 0..*                                                         +---------------------------+
+-----------------+                                                    | +avaliarAptidao(colab)    |
|      Risco      |                                                    | +proximoVencimento(colab) |
+-----------------+                                                    +---------------------------+
| -id             |                                                              |
| -descricao      |                                                              | depende de ▼ (DIP)
| -tipo           |                                                    «interface»
| -severidade     |                                                    +---------------------------+
| -probabilidade  |                                                    |    IRepositorioASO        |
+-----------------+                                                    +---------------------------+
        |                                                              | +buscarPorColaborador()   |
        | usa                                                          | +salvar()                 |
        ▼                                                              +---------------------------+
+---------------------+                                                         ▲ implementa
| GeradorRelatorioPGR |                                                +---------------------------+
+---------------------+                                                | RepositorioASOPostgres    |
| -exp:IExportadorRel.|                                                +---------------------------+
+---------------------+
| +gerar(empresa)     |            +---------------------------+
+---------------------+            |   ServicoEnvioESocial     |
        |                          +---------------------------+
        | depende de ▼ (DIP)       | -cliente: IClienteESocial |
«interface»                        +---------------------------+
+---------------------+            | +enviar(EventoESocial)    |
| IExportadorRelatorio|            | +processarRetorno(resp)   |
+---------------------+            | +reenviar(EventoESocial)  |
| +exportar(dados)    |            +---------------------------+
+---------------------+                      |
        ▲ implementa                          | depende de ▼ (DIP)
+---------------------+            «interface»
| ExportadorPDFRelat. |            +---------------------------+
+---------------------+            |     IClienteESocial       |
                                   +---------------------------+
                                   | +enviarEvento(xml)        |
                                   +---------------------------+
                                            ▲ implementa
                                   +---------------------------+     +---------------------------+
                                   |  ClienteWSeSocialGovBr    |     |  ClienteESocialSandbox    |
                                   +---------------------------+     +---------------------------+

                                   +---------------------------+
                                   |   MontadorXMLeSocial      |
                                   +---------------------------+
                                   | -schema: IValidadorSchema |
                                   +---------------------------+
                                   | +montar(aso)              |
                                   | +montar(risco)            |
                                   | +validarSchema(xml)       |
                                   +---------------------------+
                                             |
                                             | depende de ▼ (DIP)
                                   «interface»
                                   +---------------------------+
                                   |    IValidadorSchema       |
                                   +---------------------------+
                                   | +validar(xml): boolean    |
                                   +---------------------------+
                                            ▲ implementa
                                   +---------------------------+     +---------------------------+
                                   |   ValidadorSchemaS12      |     |   ValidadorSchemaMock     |
                                   +---------------------------+     +---------------------------+
```

> Legenda: `◆` composição • `◇` agregação • `──►` associação • `depende de ▼ (DIP)` dependência invertida para abstração • `«interface»` contrato sem implementação • `▲ implementa` realização concreta.

---

### 2.2 Classes do domínio

#### `Empresa`
Representa o **tenant** (cliente contratante) da plataforma. É a raiz do agregado.

**Motivo único para mudar (SRP):** alterações nas regras de negócio da empresa (CNPJ, CNAE, grau de risco).

| Atributo       | Tipo     | Descrição                                |
|----------------|----------|------------------------------------------|
| `id`           | UUID     | Identificador único.                     |
| `cnpj`         | string   | CNPJ formatado (14 dígitos).             |
| `razaoSocial`  | string   | Razão social.                            |
| `nomeFantasia` | string   | Nome fantasia.                           |
| `cnae`         | string   | Código CNAE da atividade econômica.      |
| `grauRisco`    | int      | Grau de risco (1 a 4), conforme NR-04.   |

**Métodos:** `cadastrarColaborador()`, `listarRiscos()`.

---

#### `Colaborador`
Representa um trabalhador vinculado a uma empresa.

**Motivo único para mudar (SRP):** alterações nos dados cadastrais do trabalhador.

| Atributo        | Tipo     | Descrição                              |
|-----------------|----------|----------------------------------------|
| `id`            | UUID     | Identificador único.                   |
| `cpf`           | string   | CPF (11 dígitos).                      |
| `nome`          | string   | Nome completo.                         |
| `dataNascimento`| date     | Data de nascimento.                    |
| `cargo`         | string   | Cargo/função.                          |
| `dataAdmissao`  | date     | Data de admissão.                      |
| `dataDemissao`  | date?    | Data de demissão (opcional).           |

**Métodos:** `agendarASO()`, `historicoASOs()`.

---

#### `ASO` (Atestado de Saúde Ocupacional)
Documento médico que atesta a aptidão do colaborador para a função.

**Motivo único para mudar (SRP):** alterações nas regras do atestado ocupacional.

| Atributo     | Tipo     | Descrição                                                       |
|--------------|----------|-----------------------------------------------------------------|
| `id`         | UUID     | Identificador único.                                            |
| `tipoExame`  | enum     | `ADMISSIONAL`, `PERIODICO`, `RETORNO_TRABALHO`, `MUDANCA_RISCO`, `DEMISSIONAL`. |
| `dataExame`  | date     | Data de realização do exame.                                    |
| `resultado`  | enum     | `APTO`, `INAPTO`, `APTO_COM_RESTRICOES`.                        |
| `medico`     | string   | Nome do médico responsável.                                     |
| `crm`        | string   | CRM do médico.                                                  |

**Métodos:** `validar()`.

---

#### `Risco` (Risco Ocupacional)
Representa um risco identificado no ambiente de trabalho (PGR).

**Motivo único para mudar (SRP):** alterações nas propriedades ou classificação de riscos ocupacionais.

| Atributo         | Tipo     | Descrição                                                  |
|------------------|----------|------------------------------------------------------------|
| `id`             | UUID     | Identificador único.                                       |
| `descricao`      | string   | Descrição do risco.                                        |
| `tipo`           | enum     | `FISICO`, `QUIMICO`, `BIOLOGICO`, `ERGONOMICO`, `ACIDENTE`.|
| `severidade`     | int      | Severidade (1 a 5).                                        |
| `probabilidade`  | int      | Probabilidade de ocorrência (1 a 5).                       |

**Métodos:** `calcularNivelRisco()`, `sugerirMedidasControle()`.

---

#### `EventoESocial`
Entidade que representa a mensagem XML enviada ao eSocial. Armazena apenas **estado**; não monta nem envia.

**Motivo único para mudar (SRP):** alterações na estrutura de dados ou ciclo de vida do evento.

| Atributo            | Tipo     | Descrição                                                  |
|---------------------|----------|------------------------------------------------------------|
| `id`                | UUID     | Identificador único.                                       |
| `tipoEvento`        | enum     | `S_2210` (CAT), `S_2220` (ASO), `S_2240` (PPP).            |
| `payloadXML`        | text     | Payload XML conforme leiaute S-1.2.                        |
| `dataEnvio`         | datetime | Timestamp do envio.                                        |
| `statusEnvio`       | enum     | `PENDENTE`, `ENVIADO`, `ACEITO`, `REJEITADO`.              |
| `protocolo`         | string?  | Protocolo de recebimento devolvido pelo eSocial.           |

---

### 2.3 Serviços de aplicação e suas abstrações (DIP)

#### `AptidaoService`
Avalia se um colaborador está apto com base no histórico de ASOs.

**Motivo único para mudar (SRP):** alterações nas regras de negócio de aptidão.

**DIP aplicado:** recebe `IRepositorioASO` por injeção de dependência — não conhece o banco de dados concreto. Em testes, basta injetar `RepositorioASOInMemory`.

| Membro                           | Descrição                                                   |
|----------------------------------|-------------------------------------------------------------|
| `-repo: IRepositorioASO`         | Abstração injetada para acesso aos ASOs.                    |
| `+avaliarAptidao(colaborador)`   | Verifica o ASO mais recente e retorna o status de aptidão.  |
| `+proximoVencimento(colaborador)`| Calcula a data de vencimento do ASO periódico vigente.      |

---

#### `GeradorRelatorioPGR`
Produz o relatório do PGR a partir dos dados da empresa e seus riscos.

**Motivo único para mudar (SRP):** alterações no formato ou conteúdo do relatório PGR.

**DIP aplicado:** recebe `IExportadorRelatorio` por injeção — pode exportar para PDF, DOCX ou HTML sem alterar o serviço.

| Membro                          | Descrição                                                    |
|---------------------------------|--------------------------------------------------------------|
| `-export: IExportadorRelatorio` | Abstração injetada para exportação do relatório.             |
| `+gerar(empresa)`               | Compila os dados e delega a exportação ao injetado.          |

---

#### `MontadorXMLeSocial`
Constrói o payload XML conforme o leiaute S-1.2.

**Motivo único para mudar (SRP):** alterações no leiaute XML do eSocial.

**DIP aplicado:** recebe `IValidadorSchema` por injeção — a biblioteca de validação XSD pode ser trocada sem alterar o montador.

| Membro                       | Descrição                                              |
|------------------------------|--------------------------------------------------------|
| `-schema: IValidadorSchema`  | Abstração injetada para validação do XML gerado.       |
| `+montar(aso)`               | Monta o XML do evento S-2220 a partir de um ASO.       |
| `+montar(risco)`             | Monta o XML do evento S-2240 a partir de um Risco.     |
| `+validarSchema(xml)`        | Valida o XML gerado contra o schema S-1.2.             |

---

#### `ServicoEnvioESocial`
Envia eventos ao webservice do eSocial e interpreta retornos.

**Motivo único para mudar (SRP):** alterações nas regras de negócio de envio e reenvio.

**DIP aplicado:** recebe `IClienteESocial` por injeção — o cliente HTTP concreto (produção, sandbox, mock de testes) pode ser trocado sem alterar o serviço.

| Membro                          | Descrição                                                       |
|---------------------------------|-----------------------------------------------------------------|
| `-cliente: IClienteESocial`     | Abstração injetada para comunicação com o webservice.           |
| `+enviar(eventoESocial)`        | Envia o evento e atualiza status.                               |
| `+processarRetorno(resposta)`   | Interpreta a resposta e registra protocolo ou erro.             |
| `+reenviar(eventoESocial)`      | Reenvia um evento `REJEITADO` após correção.                    |

---

### 2.4 Interfaces (abstrações introduzidas pelo DIP)

| Interface               | Consumida por              | Implementações previstas                                        | Motivo da inversão                                           |
|-------------------------|----------------------------|-----------------------------------------------------------------|--------------------------------------------------------------|
| `IRepositorioASO`       | `AptidaoService`           | `RepositorioASOPostgres`, `RepositorioASOInMemory` (testes)     | Isola o serviço de negócio do banco de dados concreto.       |
| `IExportadorRelatorio`  | `GeradorRelatorioPGR`      | `ExportadorPDFRelatorio`, `ExportadorHTMLRelatorio`             | Permite trocar o formato de saída sem alterar a lógica PGR.  |
| `IValidadorSchema`      | `MontadorXMLeSocial`       | `ValidadorSchemaS12`, `ValidadorSchemaMock` (testes)            | Isola o montador da biblioteca XSD concreta.                 |
| `IClienteESocial`       | `ServicoEnvioESocial`      | `ClienteWSeSocialGovBr`, `ClienteESocialSandbox`, `ClienteESocialMock` | Permite testar envios sem chamar o webservice real. |

---

### 2.5 Relacionamentos

| # | Origem                  | Destino                  | Tipo                | Cardinalidade | Justificativa |
|---|-------------------------|--------------------------|---------------------|---------------|---------------|
| 1 | `Empresa`               | `Colaborador`            | **Composição**      | 1 → 1..*      | Colaboradores existem apenas dentro do contexto de uma empresa no SaaS. |
| 2 | `Colaborador`           | `ASO`                    | **Composição**      | 1 → 0..*      | Um ASO não existe sem um colaborador — é indissociável. |
| 3 | `Empresa`               | `Risco`                  | **Agregação**       | 1 → 0..*      | Riscos podem ser catalogados genericamente e reutilizados em várias empresas. |
| 4 | `ASO`                   | `EventoESocial`          | **Associação**      | 1 → 0..1      | Cada ASO referencia o evento S-2220 correspondente; ciclos de vida independentes. |
| 5 | `Colaborador`           | `EventoESocial`          | **Associação**      | 1 → 0..*      | Todo evento eSocial é sobre um colaborador; relação de auditoria. |
| 6 | `AptidaoService`        | `IRepositorioASO`        | **Dependência DIP** | — → 1         | Alto nível depende da abstração, não do banco concreto. |
| 7 | `GeradorRelatorioPGR`   | `IExportadorRelatorio`   | **Dependência DIP** | — → 1         | Alto nível depende da abstração, não da biblioteca PDF. |
| 8 | `MontadorXMLeSocial`    | `IValidadorSchema`       | **Dependência DIP** | — → 1         | Alto nível depende da abstração, não da biblioteca XSD. |
| 9 | `ServicoEnvioESocial`   | `IClienteESocial`        | **Dependência DIP** | — → 1         | Alto nível depende da abstração, não do cliente HTTP concreto. |

---

### 2.6 Resumo das alterações aplicadas

#### SRP — responsabilidades extraídas das entidades

| Classe original  | Responsabilidade removida           | Destino                  |
|------------------|-------------------------------------|--------------------------|
| `Empresa`        | Geração de relatório PGR            | `GeradorRelatorioPGR`    |
| `Colaborador`    | Avaliação de aptidão do trabalhador | `AptidaoService`         |
| `ASO`            | Geração de evento eSocial           | `MontadorXMLeSocial`     |
| `EventoESocial`  | Montagem do XML                     | `MontadorXMLeSocial`     |
| `EventoESocial`  | Envio ao webservice                 | `ServicoEnvioESocial`    |
| `EventoESocial`  | Interpretação de retorno            | `ServicoEnvioESocial`    |
| `Risco`          | *(sem alteração — já era coeso)*    | —                        |

#### DIP — abstrações introduzidas

| Serviço de alto nível    | Dependência concreta eliminada    | Interface introduzida     |
|--------------------------|-----------------------------------|---------------------------|
| `AptidaoService`         | Banco de dados (Postgres)         | `IRepositorioASO`         |
| `GeradorRelatorioPGR`    | Biblioteca PDF                    | `IExportadorRelatorio`    |
| `MontadorXMLeSocial`     | Biblioteca de validação XSD       | `IValidadorSchema`        |
| `ServicoEnvioESocial`    | Cliente HTTP do webservice        | `IClienteESocial`         |
