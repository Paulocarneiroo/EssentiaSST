# EssentiaSST

> Plataforma web modular para Gestão de Segurança e Saúde no Trabalho (SST) integrada ao eSocial.

---

## 1. Sobre o projeto

O **EssentiaSST** será um software web em nuvem, modular e escalável, voltado para a Gestão de Segurança e Saúde no Trabalho (SST) de empresas brasileiras, com ênfase em micro, pequenas e médias empresas (MPMEs). A plataforma reúne, em módulos independentes, as principais rotinas exigidas pela legislação trabalhista (NRs, ISO 45001, eSocial-SST) e propõe um modelo de contratação *pague pelo que usar*, com interface centrada no usuário.

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

## 2. Esboço do domínio (primeira entrega)

Nesta entrega inicial são esboçadas **cinco classes** do núcleo do domínio, suficientes para representar o fluxo crítico:

> *empresa cadastra colaborador → colaborador realiza ASO → ASO gera evento eSocial; em paralelo, empresa mapeia seus riscos ocupacionais (PGR).*

### 2.1 Diagrama de classes (UML simplificado)

```
+-----------------+ 1     1..* +-------------------+ 1   0..* +------------+
|     Empresa     |◆-----------|    Colaborador    |◆---------|    ASO     |
+-----------------+ composição +-------------------+ composiç.+------------+
| -id             |            | -id               |          | -id        |
| -cnpj           |            | -cpf              |          | -tipoExame |
| -razaoSocial    |            | -nome             |          | -dataExame |
| -cnae           |            | -cargo            |          | -resultado |
| -grauRisco      |            | -dataAdmissao     |          | -medico    |
+-----------------+            +-------------------+          | -crm       |
        ◇ 1                            | 1                    +------------+
        | agregação                    | associação                  | 1
        | 0..*                         | 0..*                        | associação
+-----------------+                    |                             | 0..1
|      Risco      |                    +-----------------------------+
+-----------------+                                  |
| -id             |                                  v 0..*
| -descricao      |                          +------------------+
| -tipo           |                          |  EventoESocial   |
| -severidade     |                          +------------------+
| -probabilidade  |                          | -id              |
+-----------------+                          | -tipoEvento      |
                                             | -payloadXML      |
                                             | -dataEnvio       |
                                             | -statusEnvio     |
                                             | -protocolo       |
                                             +------------------+
```

> Legenda: `◆` composição (parte indissociável do todo) • `◇` agregação (todo "tem" parte, mas a parte pode existir independentemente) • linha simples = associação.

### 2.2 Classes do domínio

#### `Empresa`
Representa o **tenant** (cliente contratante) da plataforma. É a raiz do agregado: tudo o que é cadastrado no sistema pertence a uma empresa.

| Atributo       | Tipo     | Descrição                                |
|----------------|----------|------------------------------------------|
| `id`           | UUID     | Identificador único.                     |
| `cnpj`         | string   | CNPJ formatado (14 dígitos).             |
| `razaoSocial`  | string   | Razão social.                            |
| `nomeFantasia` | string   | Nome fantasia.                           |
| `cnae`         | string   | Código CNAE da atividade econômica.      |
| `grauRisco`    | int      | Grau de risco (1 a 4), conforme NR-04.   |

**Métodos principais:** `cadastrarColaborador()`, `listarRiscos()`, `gerarRelatorioPGR()`.

---

#### `Colaborador`
Representa um trabalhador vinculado a uma empresa. É o sujeito das obrigações de SST (ASO, treinamentos, CAT).

| Atributo        | Tipo     | Descrição                              |
|-----------------|----------|----------------------------------------|
| `id`            | UUID     | Identificador único.                   |
| `cpf`           | string   | CPF (11 dígitos).                      |
| `nome`          | string   | Nome completo.                         |
| `dataNascimento`| date     | Data de nascimento.                    |
| `cargo`         | string   | Cargo/função.                          |
| `dataAdmissao`  | date     | Data de admissão.                      |
| `dataDemissao`  | date?    | Data de demissão (opcional).           |

**Métodos principais:** `agendarASO()`, `historicoASOs()`, `estaApto()`.

---

#### `ASO` (Atestado de Saúde Ocupacional)
Documento médico que atesta a aptidão do colaborador para a função. Cada ASO gera um evento **S-2220** no eSocial.

| Atributo     | Tipo     | Descrição                                                       |
|--------------|----------|-----------------------------------------------------------------|
| `id`         | UUID     | Identificador único.                                            |
| `tipoExame`  | enum     | `ADMISSIONAL`, `PERIODICO`, `RETORNO_TRABALHO`, `MUDANCA_RISCO`, `DEMISSIONAL`. |
| `dataExame`  | date     | Data de realização do exame.                                    |
| `resultado`  | enum     | `APTO`, `INAPTO`, `APTO_COM_RESTRICOES`.                        |
| `medico`     | string   | Nome do médico responsável.                                     |
| `crm`        | string   | CRM do médico.                                                  |

**Métodos principais:** `validar()`, `gerarEventoS2220()`.

---

#### `Risco` (Risco Ocupacional)
Representa um risco identificado no ambiente de trabalho (componente central do PGR).

| Atributo         | Tipo     | Descrição                                                  |
|------------------|----------|------------------------------------------------------------|
| `id`             | UUID     | Identificador único.                                       |
| `descricao`      | string   | Descrição do risco.                                        |
| `tipo`           | enum     | `FISICO`, `QUIMICO`, `BIOLOGICO`, `ERGONOMICO`, `ACIDENTE`.|
| `severidade`     | int      | Severidade (1 a 5).                                        |
| `probabilidade`  | int      | Probabilidade de ocorrência (1 a 5).                       |

**Métodos principais:** `calcularNivelRisco()`, `sugerirMedidasControle()`.

---

#### `EventoESocial`
Mensagem XML enviada ao eSocial (eventos da série S-2xxx referentes a SST).

| Atributo            | Tipo     | Descrição                                                  |
|---------------------|----------|------------------------------------------------------------|
| `id`                | UUID     | Identificador único.                                       |
| `tipoEvento`        | enum     | `S_2210` (CAT), `S_2220` (ASO), `S_2240` (PPP).            |
| `payloadXML`        | text     | Payload XML conforme leiaute S-1.2.                        |
| `dataEnvio`         | datetime | Timestamp do envio.                                        |
| `statusEnvio`       | enum     | `PENDENTE`, `ENVIADO`, `ACEITO`, `REJEITADO`.              |
| `protocolo`         | string?  | Protocolo de recebimento devolvido pelo eSocial.           |

**Métodos principais:** `montarXML()`, `enviar()`, `processarRetorno()`.

---

### 2.3 Relacionamentos

| # | Origem         | Destino         | Tipo          | Cardinalidade | Justificativa |
|---|----------------|-----------------|---------------|---------------|---------------|
| 1 | `Empresa`      | `Colaborador`   | **Composição**| 1 → 1..*      | No contexto multi-tenant, o cadastro de colaboradores existe **apenas** dentro do contexto de uma empresa: se a empresa é descontratada do SaaS, seus colaboradores deixam de existir como entidade do sistema. |
| 2 | `Colaborador`  | `ASO`           | **Composição**| 1 → 0..*      | Um ASO **não existe** sem um colaborador — o atestado é dele, indissociavelmente. Removido o colaborador (encerramento da retenção legal), seus ASOs vão junto. |
| 3 | `Empresa`      | `Risco`         | **Agregação** | 1 → 0..*      | Riscos ocupacionais podem ser **catalogados de forma genérica** (catálogo de riscos comuns por CNAE) e *agregados* a uma empresa específica no seu PGR. Um mesmo "Risco — ruído > 85 dB" pode existir independentemente e ser reutilizado em várias empresas. |
| 4 | `ASO`          | `EventoESocial` | **Associação**| 1 → 0..1      | Cada ASO **referencia** o evento S-2220 que o representa no eSocial, mas as duas entidades têm ciclos de vida independentes (o evento pode ser reenviado, retificado, excluído sem invalidar o ASO). |
| 5 | `Colaborador`  | `EventoESocial` | **Associação**| 1 → 0..*      | Todo evento eSocial é **sobre** um colaborador (S-2210 referencia o acidentado, S-2240 referencia o exposto). Relação fraca, navegável apenas para fins de consulta/auditoria. |

---


