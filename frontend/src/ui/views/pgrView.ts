import { relatorioApi } from '../../api/relatorioApi.js';
import { formatCnpj, formatDateTime } from '../../services/format.js';
import {
  LABEL_CLASSIFICACAO,
  LABEL_TIPO_RISCO,
  VARIANT_CLASSIFICACAO,
} from '../../services/labels.js';
import type { ItemRelatorioPGR } from '../../types/relatorio.js';
import { TIPOS_RISCO, type ClassificacaoRisco } from '../../types/risco.js';
import { badge, card, cardTabela, pageHeader, statCard, table } from '../components.js';
import { bindAction } from '../forms.js';
import { baixarArquivo, esc } from '../html.js';
import { showToast, toastErro } from '../toast.js';

/** Ordem do resumo: da faixa mais grave para a menos grave. */
const CLASSIFICACOES: readonly ClassificacaoRisco[] = ['CRITICO', 'ALTO', 'MODERADO', 'BAIXO'];

const linhaItem = (item: ItemRelatorioPGR): string => `
  <tr>
    <td>
      <span class="fw-semibold">${esc(item.descricao)}</span>
      <div class="text-muted small">${esc(LABEL_TIPO_RISCO[item.tipo])}</div>
    </td>
    <td class="text-center">${item.severidade} × ${item.probabilidade}</td>
    <td class="text-center fw-semibold">${item.nivelRisco}</td>
    <td>${badge(LABEL_CLASSIFICACAO[item.classificacao], VARIANT_CLASSIFICACAO[item.classificacao])}</td>
    <td>
      <ul class="medidas-list">
        ${item.medidasControle.map((medida) => `<li>${esc(medida)}</li>`).join('')}
      </ul>
    </td>
  </tr>
`;

export const renderPgrView = async (root: HTMLElement): Promise<void> => {
  const relatorio = await relatorioApi.pgrJson();
  const { empresa, resumo, itens } = relatorio;

  const distribuicaoTipos = TIPOS_RISCO.filter((tipo) => resumo.porTipo[tipo] > 0)
    .map((tipo) => `${esc(LABEL_TIPO_RISCO[tipo])}: <strong>${resumo.porTipo[tipo]}</strong>`)
    .join(' · ');

  root.innerHTML = `
    ${pageHeader({
      titulo: 'Relatório do PGR',
      subtitulo: `Gerado em ${formatDateTime(relatorio.geradoEm)} · ${empresa.razaoSocial} · CNPJ ${formatCnpj(empresa.cnpj)}`,
      acoes: `
        <button type="button" class="btn btn-outline-secondary me-2" data-action="baixar-html">Baixar HTML</button>
        <button type="button" class="btn btn-outline-secondary" data-action="baixar-json">Baixar JSON</button>
      `,
    })}

    <div class="stat-grid mb-4">
      ${statCard({ label: 'Riscos inventariados', valor: resumo.totalRiscos })}
      ${statCard({ label: 'Maior nível', valor: resumo.maiorNivel, detalhe: 'escala de 1 a 25' })}
      ${CLASSIFICACOES.map((classificacao) =>
        statCard({
          label: LABEL_CLASSIFICACAO[classificacao],
          valor: resumo.porClassificacao[classificacao],
          variant: resumo.porClassificacao[classificacao] ? VARIANT_CLASSIFICACAO[classificacao] : undefined,
        }),
      ).join('')}
    </div>

    ${
      distribuicaoTipos
        ? card(`<span class="text-muted small">Distribuição por natureza do agente — ${distribuicaoTipos}</span>`, 'mb-4')
        : ''
    }

    ${cardTabela(
      'Inventário priorizado e medidas de controle (NR-01)',
      table({
        colunas: ['Risco', 'Sev. × Prob.', 'Nível', 'Classificação', 'Medidas sugeridas'],
        linhas: itens.map(linhaItem),
        vazio: 'Nenhum risco inventariado. Cadastre os riscos para gerar o PGR.',
      }),
      '<a class="btn btn-sm btn-outline-primary" href="#/riscos">Gerenciar riscos</a>',
    )}

    <p class="text-muted small mt-3">
      As medidas são uma sugestão automática na hierarquia da NR-01 e não substituem a avaliação
      do responsável técnico.
    </p>
  `;

  const nomeBase = `pgr-${empresa.cnpj}-${new Date().toISOString().slice(0, 10)}`;

  bindAction(root, 'baixar-html', async () => {
    try {
      const html = await relatorioApi.pgrHtml();
      baixarArquivo(html, `${nomeBase}.html`, 'text/html');
      showToast('Relatório HTML baixado.');
    } catch (error) {
      toastErro(error, 'Não foi possível gerar o relatório em HTML.');
    }
  });

  bindAction(root, 'baixar-json', () => {
    baixarArquivo(JSON.stringify(relatorio, null, 2), `${nomeBase}.json`, 'application/json');
    showToast('Relatório JSON baixado.');
  });
};
