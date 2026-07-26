import type {
  DocumentoExportado,
  IExportadorRelatorio,
  ItemRelatorioPGR,
  RelatorioPGR,
} from '../../application/ports/IExportadorRelatorio.js';

/** Descrições de risco são texto do usuário: escapar antes de interpolar no HTML. */
const escapar = (valor: string): string =>
  valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const dataBR = (data: Date): string =>
  `${String(data.getUTCDate()).padStart(2, '0')}/${String(data.getUTCMonth() + 1).padStart(2, '0')}/${data.getUTCFullYear()}`;

const cnpjFormatado = (cnpj: string): string =>
  cnpj.length === 14
    ? cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    : cnpj;

const linha = (item: ItemRelatorioPGR, indice: number): string => `
      <tr class="${item.classificacao.toLowerCase()}">
        <td>${indice + 1}</td>
        <td>${escapar(item.descricao)}</td>
        <td>${item.tipo}</td>
        <td class="num">${item.severidade}</td>
        <td class="num">${item.probabilidade}</td>
        <td class="num"><strong>${item.nivelRisco}</strong></td>
        <td><span class="tag">${item.classificacao}</span></td>
        <td>
          <ul>${item.medidasControle.map((m) => `<li>${escapar(m)}</li>`).join('')}</ul>
        </td>
      </tr>`;

const ESTILO = `
    body { font-family: Segoe UI, Arial, sans-serif; margin: 32px; color: #1c1c1c; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .sub { color: #555; font-size: 13px; margin-top: 0; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; margin-top: 16px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; vertical-align: top; text-align: left; }
    th { background: #f0f0f0; }
    td.num { text-align: center; }
    ul { margin: 0; padding-left: 18px; }
    .tag { padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; }
    tr.baixo .tag { background: #d8f0d8; }
    tr.moderado .tag { background: #fdf1c8; }
    tr.alto .tag { background: #fbdcc0; }
    tr.critico .tag { background: #f5c6c6; }
    .resumo { margin-top: 20px; font-size: 13px; }
    .rodape { margin-top: 24px; font-size: 11px; color: #666; }
    @media print { body { margin: 0; } }`;

/**
 * Exporta o PGR como documento HTML autocontido — legível no navegador e
 * imprimível em PDF pelo próprio navegador (Ctrl+P → Salvar como PDF).
 */
export class ExportadorHTMLRelatorio implements IExportadorRelatorio {
  exportar(relatorio: RelatorioPGR): DocumentoExportado {
    const { empresa, resumo, itens, geradoEm } = relatorio;

    const conteudo = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>PGR — ${escapar(empresa.razaoSocial)}</title>
  <style>${ESTILO}
  </style>
</head>
<body>
  <h1>Programa de Gerenciamento de Riscos (PGR)</h1>
  <p class="sub">
    ${escapar(empresa.razaoSocial)} (${escapar(empresa.nomeFantasia)})<br>
    CNPJ ${cnpjFormatado(empresa.cnpj)} • CNAE ${escapar(empresa.cnae)} • Grau de risco ${empresa.grauRisco}
  </p>

  <h2 style="font-size:15px">Inventário de riscos</h2>
  ${
    itens.length === 0
      ? '<p>Nenhum risco cadastrado para esta empresa.</p>'
      : `<table>
    <thead>
      <tr>
        <th>#</th><th>Descrição</th><th>Tipo</th><th>Sev.</th><th>Prob.</th>
        <th>Nível</th><th>Classificação</th><th>Medidas de controle sugeridas</th>
      </tr>
    </thead>
    <tbody>${itens.map(linha).join('')}
    </tbody>
  </table>`
  }

  <div class="resumo">
    <strong>Resumo:</strong> ${resumo.totalRiscos} risco(s) inventariado(s) —
    ${resumo.porClassificacao.CRITICO} crítico(s),
    ${resumo.porClassificacao.ALTO} alto(s),
    ${resumo.porClassificacao.MODERADO} moderado(s),
    ${resumo.porClassificacao.BAIXO} baixo(s).
    Maior nível registrado: ${resumo.maiorNivel}.
  </div>

  <p class="rodape">
    Gerado por EssentiaSST em ${dataBR(geradoEm)}. Nível de risco = severidade × probabilidade
    (matriz 5×5). As medidas são sugestões automáticas e não substituem a avaliação do
    responsável técnico.
  </p>
</body>
</html>`;

    return { conteudo, mimeType: 'text/html; charset=utf-8', extensao: 'html' };
  }
}
