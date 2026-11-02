# EssentiaSST — Regras de negócio (alto nível)

> Visão resumida do produto e das regras de domínio. O detalhamento técnico (classes, SRP, DIP, atributos) está em [`regras-de-negocio.md`](./regras-de-negocio.md).

---

## O que é

Plataforma web para **Gestão de Segurança e Saúde no Trabalho (SST)**, voltada a **micro, pequenas e médias empresas (MPMEs)** brasileiras, com integração ao **eSocial**.

---

## Por que existe

- Softwares de SST do mercado costumam ser caros e complexos demais para MPMEs.
- O eSocial-SST (eventos S-2210, S-2220 e S-2240) exige prazos e validações rígidas.
- Falhas de conformidade geram multas, prejuízo previdenciário e risco maior de acidentes.

**Metas:** reduzir tempo em rotinas de SST, zerar rejeições no eSocial e facilitar a conformidade legal para MPMEs.

---

## Conceitos principais

| Conceito | Em uma frase |
|----------|----------------|
| **Empresa** | Cliente (tenant) da plataforma: CNPJ, CNAE, grau de risco. |
| **Colaborador** | Trabalhador vinculado a uma empresa. |
| **ASO** | Atestado de Saúde Ocupacional (aptidão para a função). |
| **Acidente** | Registro de acidente de trabalho que origina a CAT. |
| **Risco** | Risco ocupacional do ambiente da empresa (base do PGR). |
| **Evento eSocial** | Mensagem enviada ao governo (CAT, ASO ou condições ambientais). |

**Relação central:** a empresa tem colaboradores e riscos; o colaborador tem ASOs e acidentes; ASOs e acidentes geram eventos no eSocial.

---

## Fluxo de negócio (visão geral)

```
Empresa cadastra colaborador
        ↓
Colaborador realiza ASO
        ↓
Sistema avalia aptidão
        ↓
Sistema monta e envia evento ao eSocial (quando aplicável)
        ↓
Empresa gera relatório PGR a partir dos riscos
```

Em paralelo: se houver acidente de trabalho → registra CAT → envia S-2210 ao eSocial.

---

## Regras por área

### Empresa e multi-tenant

- Cada empresa é um **cliente isolado** da plataforma.
- Colaboradores e riscos **pertencem** à empresa; não existem fora dela.
- Grau de risco (1 a 4, NR-04) influencia a periodicidade dos exames.

### Colaborador

- Sempre vinculado a uma empresa.
- Dados cadastrais (CPF, cargo, admissão/demissão) são a base das rotinas de SST.
- Histórico de ASOs e acidentes fica associado ao trabalhador.

### ASO e aptidão

- Tipos de exame: admissional, periódico, retorno ao trabalho, mudança de risco, demissional.
- Resultado: apto, inapto ou apto com restrições.
- A aptidão do colaborador é avaliada pelo **ASO mais recente válido** (exame demissional **não** conta como aptidão para trabalhar).
- Periodicidade do periódico (NR-07): em geral **24 meses** (grau 1–2) ou **12 meses** (grau 3–4, menores de 18, maiores de 45, ou ASO com restrição).
- Situações possíveis na avaliação: apto, apto com restrições, inapto, vencido, sem ASO, desligado.

### Acidente e CAT

- O acidente gera a Comunicação de Acidente de Trabalho (evento **S-2210**).
- Tipos: típico, doença, trajeto; CAT inicial, reabertura ou comunicação de óbito.
- **Prazo legal:** comunicar até o **primeiro dia útil** após o acidente; **imediatamente** em caso de óbito.

### Riscos e PGR

- Riscos são do ambiente da **empresa** (físico, químico, biológico, ergonômico, acidente).
- Nível = severidade × probabilidade (matriz 5×5) → baixo / moderado / alto / crítico.
- O relatório PGR reúne identificação da empresa, inventário de riscos (do maior para o menor) e medidas de controle sugeridas (hierarquia NR-01).

### eSocial

| Evento | Origem | Conteúdo |
|--------|--------|----------|
| **S-2210** | Acidente | CAT |
| **S-2220** | ASO | Monitoramento da saúde do trabalhador |
| **S-2240** | Risco / condições | Condições ambientais / PPP |

- O sistema **monta** o XML (leiaute S-1.2), **valida**, **envia** e trata o retorno.
- Status do evento: pendente → enviado → aceito ou rejeitado (com possibilidade de reenvio após correção).
- Em desenvolvimento/testes, o envio pode usar sandbox ou mock em vez do webservice real.

---

## Fronteiras do produto (o que o negócio resolve)

1. Cadastro e isolamento por empresa (tenant).
2. Gestão de colaboradores e histórico de saúde ocupacional.
3. Avaliação de aptidão e vencimento de exames.
4. Registro de acidentes e cumprimento de prazo da CAT.
5. Inventário de riscos e geração do PGR.
6. Integração confiável com o eSocial-SST (montagem, validação, envio e reenvio).

---

## Fora do escopo deste documento

Detalhes de implementação (camadas, interfaces, injeção de dependência, diagramas de classe) — ver [`regras-de-negocio.md`](./regras-de-negocio.md).
