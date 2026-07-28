import { colaboradorService } from '../../services/colaboradorService.js';
import { eventoService } from '../../services/eventoService.js';
import {
  LABEL_CLASSIFICACAO,
  LABEL_TIPO_RISCO,
  VARIANT_CLASSIFICACAO,
  opcoesDe,
} from '../../services/labels.js';
import { riscoService, type RiscoFormData } from '../../services/riscoService.js';
import { isAdmin } from '../../state/session.js';
import type { Colaborador } from '../../types/colaborador.js';
import type { EventoESocial } from '../../types/evento.js';
import { TIPOS_RISCO, calcularNivelRisco, classificarRisco, type Risco } from '../../types/risco.js';
import { badge, cardTabela, pageHeader, statCard, table } from '../components.js';
import { bindAction } from '../forms.js';
import { readNumber, readString, selectField, textareaField } from '../formFields.js';
import { esc } from '../html.js';
import { openConfirm, openFormModal } from '../modal.js';
import { showToast } from '../toast.js';

const ESCALA = [1, 2, 3, 4, 5].map((valor) => ({ value: valor, label: String(valor) }));

const camposRisco = (risco?: Risco): string => `
  ${textareaField({ name: 'descricao', label: 'Descrição do risco', col: 12, required: true, rows: 3, maxlength: 500, value: risco?.descricao })}
  ${selectField({ name: 'tipo', label: 'Tipo (natureza do agente)', col: 12, required: true, options: opcoesDe(TIPOS_RISCO, LABEL_TIPO_RISCO), value: risco?.tipo })}
  ${selectField({ name: 'severidade', label: 'Severidade', col: 6, required: true, options: ESCALA, value: risco?.severidade, help: '1 = dano leve · 5 = dano catastrófico.' })}
  ${selectField({ name: 'probabilidade', label: 'Probabilidade', col: 6, required: true, options: ESCALA, value: risco?.probabilidade, help: '1 = improvável · 5 = frequente.' })}
`;

const lerRiscoForm = (form: HTMLFormElement): RiscoFormData => ({
  descricao: readString(form, 'descricao'),
  tipo: readString(form, 'tipo') as RiscoFormData['tipo'],
  severidade: readNumber(form, 'severidade'),
  probabilidade: readNumber(form, 'probabilidade'),
});

const abrirModalRisco = (risco: Risco | undefined, aoConcluir: () => Promise<void>): void => {
  openFormModal({
    titulo: risco ? 'Editar risco' : 'Novo risco do PGR',
    campos: camposRisco(risco),
    confirmLabel: risco ? 'Salvar alterações' : 'Cadastrar risco',
    onConfirm: async (form) => {
      const dados = lerRiscoForm(form);
      if (risco) {
        await riscoService.atualizar(risco.id, dados);
        showToast('Risco atualizado.');
      } else {
        await riscoService.criar(dados);
        showToast('Risco cadastrado no inventário.');
      }
      await aoConcluir();
    },
  });
};

/**
 * O S-2240 declara a exposição de um trabalhador específico ao agente,
 * por isso a geração pede o colaborador exposto.
 */
const abrirModalExposicao = (
  risco: Risco,
  colaboradores: Colaborador[],
  aoConcluir: () => Promise<void>,
): void => {
  openFormModal({
    titulo: 'Gerar evento S-2240',
    tamanho: 'md',
    confirmLabel: 'Gerar evento',
    campos: `
      <div class="col-12">
        <p class="text-muted mb-0">
          Risco: <strong>${esc(risco.descricao)}</strong>
        </p>
      </div>
      ${selectField({
        name: 'colaboradorId',
        label: 'Trabalhador exposto',
        col: 12,
        required: true,
        options: colaboradores
          .filter(colaboradorService.ativo)
          .map((colaborador) => ({ value: colaborador.id, label: colaborador.nome })),
        help: 'O S-2240 registra as condições ambientais a que este trabalhador está exposto.',
      })}
    `,
    onConfirm: async (form) => {
      await eventoService.gerarDeRisco(risco.id, readString(form, 'colaboradorId'));
      showToast('Evento S-2240 gerado e validado contra o schema.');
      await aoConcluir();
    },
  });
};

export const renderRiscoView = async (root: HTMLElement): Promise<void> => {
  let [riscos, colaboradores, eventos] = await Promise.all([
    riscoService.listar(),
    colaboradorService.listar(),
    eventoService.listar(),
  ]);

  const eventosDoRisco = (riscoId: string): EventoESocial[] =>
    eventos.filter((evento) => evento.riscoId === riscoId);

  const recarregar = async (): Promise<void> => {
    [riscos, colaboradores, eventos] = await Promise.all([
      riscoService.listar(),
      colaboradorService.listar(),
      eventoService.listar(),
    ]);
    desenhar();
  };

  const linha = (risco: Risco): string => {
    const nivel = calcularNivelRisco(risco);
    const classificacao = classificarRisco(nivel);
    const gerados = eventosDoRisco(risco.id).length;

    return `
      <tr>
        <td>
          <span class="fw-semibold">${esc(risco.descricao)}</span>
          <div class="text-muted small">${esc(LABEL_TIPO_RISCO[risco.tipo])}</div>
        </td>
        <td class="text-center">${risco.severidade}</td>
        <td class="text-center">${risco.probabilidade}</td>
        <td class="text-center fw-semibold">${nivel}</td>
        <td>${badge(LABEL_CLASSIFICACAO[classificacao], VARIANT_CLASSIFICACAO[classificacao])}</td>
        <td>
          <button type="button" class="btn btn-sm btn-outline-primary" data-action="gerar-evento" data-id="${esc(risco.id)}">
            Gerar S-2240
          </button>
          ${gerados ? `<div class="text-muted small mt-1">${gerados} evento(s) gerado(s)</div>` : ''}
        </td>
        <td class="text-end text-nowrap">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-action="editar" data-id="${esc(risco.id)}">Editar</button>
          ${
            isAdmin()
              ? `<button type="button" class="btn btn-sm btn-outline-danger ms-2" data-action="remover" data-id="${esc(risco.id)}">Remover</button>`
              : ''
          }
        </td>
      </tr>
    `;
  };

  const desenhar = (): void => {
    const resumo = root.querySelector('#resumo-riscos');
    const container = root.querySelector('#tabela-riscos');
    if (!resumo || !container) return;

    const contagem = { BAIXO: 0, MODERADO: 0, ALTO: 0, CRITICO: 0 };
    for (const risco of riscos) {
      contagem[classificarRisco(calcularNivelRisco(risco))] += 1;
    }

    resumo.innerHTML = `
      ${statCard({ label: 'Riscos mapeados', valor: riscos.length })}
      ${statCard({ label: 'Críticos', valor: contagem.CRITICO, variant: contagem.CRITICO ? 'danger' : undefined })}
      ${statCard({ label: 'Altos', valor: contagem.ALTO, variant: contagem.ALTO ? 'warning' : undefined })}
      ${statCard({ label: 'Moderados e baixos', valor: contagem.MODERADO + contagem.BAIXO })}
    `;

    container.innerHTML = table({
      colunas: ['Risco', 'Sev.', 'Prob.', 'Nível', 'Classificação', 'eSocial', ''],
      linhas: riscos.map(linha),
      vazio: 'Nenhum risco no inventário. O PGR começa pelo levantamento dos perigos do ambiente.',
    });

    bindAction(container, 'editar', (elemento) => {
      const risco = riscos.find((item) => item.id === elemento.dataset.id);
      if (risco) abrirModalRisco(risco, recarregar);
    });

    bindAction(container, 'gerar-evento', (elemento) => {
      const risco = riscos.find((item) => item.id === elemento.dataset.id);
      if (risco) abrirModalExposicao(risco, colaboradores, recarregar);
    });

    bindAction(container, 'remover', async (elemento) => {
      const risco = riscos.find((item) => item.id === elemento.dataset.id);
      if (!risco) return;

      const confirmado = await openConfirm({
        titulo: 'Remover risco',
        mensagem: `Excluir "${risco.descricao}" do inventário do PGR?`,
        confirmLabel: 'Excluir',
      });
      if (!confirmado) return;

      await riscoService.remover(risco.id);
      showToast('Risco removido.');
      await recarregar();
    });
  };

  root.innerHTML = `
    ${pageHeader({
      titulo: 'Inventário de riscos (PGR)',
      subtitulo: 'Nível de risco = severidade × probabilidade, na matriz 5×5 da NR-01.',
      acoes: `
        <a class="btn btn-outline-secondary me-2" href="#/pgr">Ver relatório</a>
        <button type="button" class="btn btn-primary" data-action="novo">Novo risco</button>
      `,
    })}

    <div class="stat-grid mb-4" id="resumo-riscos"></div>

    ${cardTabela('Riscos priorizados', '<div id="tabela-riscos"></div>')}
  `;

  desenhar();
  bindAction(root, 'novo', () => abrirModalRisco(undefined, recarregar));
};
