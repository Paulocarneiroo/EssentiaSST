import { asoService, type AsoFormData } from '../../services/asoService.js';
import { colaboradorService } from '../../services/colaboradorService.js';
import { eventoService } from '../../services/eventoService.js';
import { formatDate, hojeInput, toDateInput } from '../../services/format.js';
import {
  LABEL_RESULTADO_ASO,
  LABEL_STATUS_EVENTO,
  LABEL_TIPO_EXAME,
  VARIANT_RESULTADO_ASO,
  VARIANT_STATUS_EVENTO,
  opcoesDe,
} from '../../services/labels.js';
import { isAdmin } from '../../state/session.js';
import { RESULTADOS_ASO, TIPOS_EXAME, type Aso } from '../../types/aso.js';
import type { Colaborador } from '../../types/colaborador.js';
import type { EventoESocial } from '../../types/evento.js';
import { badge, cardTabela, pageHeader, table } from '../components.js';
import { bindAction } from '../forms.js';
import { readString, selectField, textField } from '../formFields.js';
import { esc } from '../html.js';
import { openConfirm, openFormModal } from '../modal.js';
import { showToast } from '../toast.js';

const opcoesColaborador = (colaboradores: Colaborador[]) =>
  colaboradores.map((colaborador) => ({
    value: colaborador.id,
    label: colaboradorService.ativo(colaborador)
      ? colaborador.nome
      : `${colaborador.nome} (desligado)`,
  }));

const camposAso = (colaboradores: Colaborador[], aso?: Aso, colaboradorFixo?: string): string => `
  ${
    colaboradorFixo
      ? `<input type="hidden" name="colaboradorId" value="${esc(colaboradorFixo)}" />`
      : selectField({
          name: 'colaboradorId',
          label: 'Colaborador',
          col: 12,
          required: true,
          options: opcoesColaborador(colaboradores),
          value: aso?.colaboradorId,
          disabled: Boolean(aso),
          help: aso ? 'O colaborador do ASO não pode ser alterado.' : undefined,
        })
  }
  ${selectField({ name: 'tipoExame', label: 'Tipo de exame', col: 6, required: true, options: opcoesDe(TIPOS_EXAME, LABEL_TIPO_EXAME), value: aso?.tipoExame })}
  ${selectField({ name: 'resultado', label: 'Resultado', col: 6, required: true, options: opcoesDe(RESULTADOS_ASO, LABEL_RESULTADO_ASO), value: aso?.resultado })}
  ${textField({ name: 'dataExame', label: 'Data do exame', type: 'date', col: 6, required: true, max: undefined, value: aso ? toDateInput(aso.dataExame) : hojeInput(), help: 'Não pode estar no futuro.' })}
  ${textField({ name: 'crm', label: 'CRM', col: 6, required: true, maxlength: 20, value: aso?.crm })}
  ${textField({ name: 'medico', label: 'Médico responsável', col: 12, required: true, value: aso?.medico })}
`;

const lerAsoForm = (form: HTMLFormElement, colaboradorId?: string): AsoFormData => ({
  colaboradorId: colaboradorId ?? readString(form, 'colaboradorId'),
  tipoExame: readString(form, 'tipoExame') as AsoFormData['tipoExame'],
  resultado: readString(form, 'resultado') as AsoFormData['resultado'],
  dataExame: readString(form, 'dataExame'),
  medico: readString(form, 'medico'),
  crm: readString(form, 'crm'),
});

export interface ModalAsoOptions {
  colaboradores: Colaborador[];
  aso?: Aso;
  /** Fixa o colaborador quando o ASO é criado a partir da ficha dele. */
  colaboradorId?: string;
  aoConcluir: () => Promise<void> | void;
}

export const abrirModalAso = ({
  colaboradores,
  aso,
  colaboradorId,
  aoConcluir,
}: ModalAsoOptions): void => {
  openFormModal({
    titulo: aso ? 'Editar ASO' : 'Registrar ASO',
    campos: camposAso(colaboradores, aso, aso ? undefined : colaboradorId),
    confirmLabel: aso ? 'Salvar alterações' : 'Registrar',
    onConfirm: async (form) => {
      const dados = lerAsoForm(form, aso?.colaboradorId ?? colaboradorId);
      if (aso) {
        await asoService.atualizar(aso.id, dados);
        showToast('ASO atualizado.');
      } else {
        await asoService.criar(dados);
        showToast('ASO registrado.');
      }
      await aoConcluir();
    },
  });
};

/** Célula com o estado do evento S-2220 do ASO, ou o botão que o gera (H3.1). */
export const celulaEventoDoAso = (aso: Aso, evento?: EventoESocial): string => {
  if (evento) {
    return `
      <a href="#/esocial" class="text-decoration-none">
        ${badge(`S-2220 ${LABEL_STATUS_EVENTO[evento.status]}`, VARIANT_STATUS_EVENTO[evento.status])}
      </a>
    `;
  }
  return `
    <button type="button" class="btn btn-sm btn-outline-primary" data-action="gerar-evento" data-id="${esc(aso.id)}">
      Gerar S-2220
    </button>
  `;
};

export const renderAsoView = async (root: HTMLElement): Promise<void> => {
  let [colaboradores, asos, eventos] = await Promise.all([
    colaboradorService.listar(),
    asoService.listar(),
    eventoService.listar(),
  ]);

  let filtroColaborador = '';

  const nomePorId = (id: string): string =>
    colaboradores.find((colaborador) => colaborador.id === id)?.nome ?? 'Colaborador removido';

  const eventoDoAso = (asoId: string): EventoESocial | undefined =>
    eventos.find((evento) => evento.asoId === asoId);

  const recarregar = async (): Promise<void> => {
    [colaboradores, asos, eventos] = await Promise.all([
      colaboradorService.listar(),
      asoService.listar(),
      eventoService.listar(),
    ]);
    desenharTabela();
  };

  const linha = (aso: Aso): string => `
    <tr>
      <td>
        <a class="fw-semibold" href="#/colaboradores/${esc(aso.colaboradorId)}">${esc(nomePorId(aso.colaboradorId))}</a>
      </td>
      <td>${esc(LABEL_TIPO_EXAME[aso.tipoExame])}</td>
      <td class="text-nowrap">${esc(formatDate(aso.dataExame))}</td>
      <td>${badge(LABEL_RESULTADO_ASO[aso.resultado], VARIANT_RESULTADO_ASO[aso.resultado])}</td>
      <td>
        ${esc(aso.medico)}
        <div class="text-muted small">CRM ${esc(aso.crm)}</div>
      </td>
      <td>${celulaEventoDoAso(aso, eventoDoAso(aso.id))}</td>
      <td class="text-end text-nowrap">
        <button type="button" class="btn btn-sm btn-outline-secondary" data-action="editar" data-id="${esc(aso.id)}">Editar</button>
        ${
          isAdmin()
            ? `<button type="button" class="btn btn-sm btn-outline-danger ms-2" data-action="remover" data-id="${esc(aso.id)}">Remover</button>`
            : ''
        }
      </td>
    </tr>
  `;

  const desenharTabela = (): void => {
    const container = root.querySelector('#tabela-asos');
    if (!container) return;

    const visiveis = filtroColaborador
      ? asos.filter((aso) => aso.colaboradorId === filtroColaborador)
      : asos;

    container.innerHTML = table({
      colunas: ['Colaborador', 'Tipo', 'Data do exame', 'Resultado', 'Médico', 'eSocial', ''],
      linhas: visiveis.map(linha),
      vazio:
        asos.length === 0
          ? 'Nenhum ASO registrado até agora.'
          : 'Nenhum ASO para o colaborador selecionado.',
    });

    bindAction(container, 'editar', (elemento) => {
      const aso = asos.find((item) => item.id === elemento.dataset.id);
      if (aso) abrirModalAso({ colaboradores, aso, aoConcluir: recarregar });
    });

    bindAction(container, 'gerar-evento', async (elemento) => {
      const aso = asos.find((item) => item.id === elemento.dataset.id);
      if (!aso) return;

      const botao = elemento as HTMLButtonElement;
      botao.disabled = true;
      try {
        const evento = await eventoService.gerarDeAso(aso.id);
        showToast(`Evento ${evento.tipoEvento.replace('_', '-')} gerado e validado contra o schema.`);
        await recarregar();
      } catch (error) {
        botao.disabled = false;
        // O montador bloqueia XML fora do leiaute S-1.2 (H3.2).
        showToast(
          error instanceof Error ? error.message : 'Não foi possível gerar o evento.',
          'danger',
        );
      }
    });

    bindAction(container, 'remover', async (elemento) => {
      const aso = asos.find((item) => item.id === elemento.dataset.id);
      if (!aso) return;

      const confirmado = await openConfirm({
        titulo: 'Remover ASO',
        mensagem: `Excluir o ASO de ${formatDate(aso.dataExame)} de ${nomePorId(aso.colaboradorId)}? O histórico médico é parte do prontuário ocupacional.`,
        confirmLabel: 'Excluir',
      });
      if (!confirmado) return;

      await asoService.remover(aso.id);
      showToast('ASO removido.');
      await recarregar();
    });
  };

  root.innerHTML = `
    ${pageHeader({
      titulo: 'ASOs',
      subtitulo: 'Atestados de Saúde Ocupacional e os eventos S-2220 correspondentes.',
      acoes: '<button type="button" class="btn btn-primary" data-action="novo">Registrar ASO</button>',
    })}

    <div class="toolbar mb-3">
      <select class="form-select form-select-sm toolbar-search" id="filtro-colaborador" aria-label="Filtrar por colaborador">
        <option value="">Todos os colaboradores</option>
        ${colaboradores
          .map((colaborador) => `<option value="${esc(colaborador.id)}">${esc(colaborador.nome)}</option>`)
          .join('')}
      </select>
    </div>

    ${cardTabela('Atestados registrados', '<div id="tabela-asos"></div>')}
  `;

  desenharTabela();

  bindAction(root, 'novo', () => abrirModalAso({ colaboradores, aoConcluir: recarregar }));

  root.querySelector<HTMLSelectElement>('#filtro-colaborador')?.addEventListener('change', (event) => {
    filtroColaborador = (event.target as HTMLSelectElement).value;
    desenharTabela();
  });
};
