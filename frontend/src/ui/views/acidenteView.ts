import { acidenteService, type AcidenteFormData } from '../../services/acidenteService.js';
import { colaboradorService } from '../../services/colaboradorService.js';
import { eventoService } from '../../services/eventoService.js';
import { formatDate, formatHora, hojeInput, toDateInput, toHoraInput } from '../../services/format.js';
import {
  LABEL_AGENTE_CAUSADOR,
  LABEL_PARTE_ATINGIDA,
  LABEL_STATUS_EVENTO,
  LABEL_TIPO_ACIDENTE,
  LABEL_TIPO_CAT,
  LABEL_TIPO_LESAO,
  VARIANT_STATUS_EVENTO,
  opcoesDe,
} from '../../services/labels.js';
import { isAdmin } from '../../state/session.js';
import {
  AGENTES_CAUSADORES,
  PARTES_ATINGIDAS,
  TIPOS_ACIDENTE,
  TIPOS_CAT,
  TIPOS_LESAO,
  type Acidente,
} from '../../types/acidente.js';
import type { Colaborador } from '../../types/colaborador.js';
import type { EventoESocial } from '../../types/evento.js';
import { badge, cardTabela, pageHeader, table } from '../components.js';
import { bindAction } from '../forms.js';
import {
  checkField,
  fieldsetTitle,
  readBoolean,
  readNumber,
  readString,
  selectField,
  textField,
  textareaField,
} from '../formFields.js';
import { esc } from '../html.js';
import { openConfirm, openFormModal } from '../modal.js';
import { showToast } from '../toast.js';

const camposAcidente = (
  colaboradores: Colaborador[],
  acidente?: Acidente,
  colaboradorFixo?: string,
): string => `
  ${
    colaboradorFixo
      ? `<input type="hidden" name="colaboradorId" value="${esc(colaboradorFixo)}" />`
      : selectField({
          name: 'colaboradorId',
          label: 'Trabalhador acidentado',
          col: 12,
          required: true,
          options: colaboradores.map((colaborador) => ({
            value: colaborador.id,
            label: colaborador.nome,
          })),
          value: acidente?.colaboradorId,
          disabled: Boolean(acidente),
          help: acidente ? 'O trabalhador da CAT não pode ser alterado.' : undefined,
        })
  }

  ${fieldsetTitle('Ocorrência')}
  ${textField({ name: 'dataAcidente', label: 'Data do acidente', type: 'date', col: 4, required: true, value: acidente ? toDateInput(acidente.dataAcidente) : hojeInput() })}
  ${textField({ name: 'horaAcidente', label: 'Hora do acidente', type: 'time', col: 4, required: true, value: toHoraInput(acidente?.horaAcidente) })}
  ${textField({ name: 'horasTrabalhadasAntes', label: 'Horas trabalhadas antes', type: 'time', col: 4, required: true, value: toHoraInput(acidente?.horasTrabalhadasAntes ?? '0000'), help: 'Tempo decorrido da jornada até o acidente.' })}
  ${selectField({ name: 'tipoAcidente', label: 'Natureza', col: 6, required: true, options: opcoesDe(TIPOS_ACIDENTE, LABEL_TIPO_ACIDENTE), value: acidente?.tipoAcidente })}
  ${selectField({ name: 'tipoCat', label: 'Tipo de CAT', col: 6, required: true, options: opcoesDe(TIPOS_CAT, LABEL_TIPO_CAT), value: acidente?.tipoCat ?? 'INICIAL' })}
  ${textField({ name: 'localAcidente', label: 'Local do acidente', col: 12, required: true, maxlength: 255, value: acidente?.localAcidente })}
  ${checkField({ name: 'comunicadoPolicia', label: 'Comunicado à autoridade policial', col: 4, checked: acidente?.comunicadoPolicia })}
  ${checkField({ name: 'obito', label: 'Houve óbito', col: 4, checked: acidente?.obito })}
  ${textField({ name: 'dataObito', label: 'Data do óbito', type: 'date', col: 4, value: toDateInput(acidente?.dataObito), help: 'Obrigatória quando houve óbito.' })}

  ${fieldsetTitle('Lesão')}
  ${selectField({ name: 'parteAtingida', label: 'Parte atingida', col: 4, required: true, options: opcoesDe(PARTES_ATINGIDAS, LABEL_PARTE_ATINGIDA), value: acidente?.parteAtingida })}
  ${selectField({ name: 'agenteCausador', label: 'Agente causador', col: 4, required: true, options: opcoesDe(AGENTES_CAUSADORES, LABEL_AGENTE_CAUSADOR), value: acidente?.agenteCausador })}
  ${selectField({ name: 'tipoLesao', label: 'Natureza da lesão', col: 4, required: true, options: opcoesDe(TIPOS_LESAO, LABEL_TIPO_LESAO), value: acidente?.tipoLesao })}
  ${textareaField({ name: 'descricao', label: 'Descrição do acidente', col: 12, required: true, rows: 3, maxlength: 999, value: acidente?.descricao })}

  ${fieldsetTitle('Atendimento médico')}
  ${textField({ name: 'dataAtendimento', label: 'Data do atendimento', type: 'date', col: 4, required: true, value: acidente ? toDateInput(acidente.dataAtendimento) : hojeInput() })}
  ${textField({ name: 'horaAtendimento', label: 'Hora do atendimento', type: 'time', col: 4, required: true, value: toHoraInput(acidente?.horaAtendimento) })}
  ${textField({ name: 'cid', label: 'CID-10', col: 4, maxlength: 6, placeholder: 'S61.0', value: acidente?.cid })}
  ${textField({ name: 'medico', label: 'Médico', col: 5, required: true, value: acidente?.medico })}
  ${textField({ name: 'crm', label: 'CRM', col: 4, required: true, maxlength: 20, value: acidente?.crm })}
  ${textField({ name: 'ufCrm', label: 'UF do CRM', col: 3, required: true, maxlength: 2, placeholder: 'PE', value: acidente?.ufCrm })}
  ${textField({ name: 'duracaoTratamentoDias', label: 'Dias de tratamento', type: 'number', col: 4, min: 0, value: acidente?.duracaoTratamentoDias ?? 0 })}
  ${checkField({ name: 'houveInternacao', label: 'Houve internação', col: 4, checked: acidente?.houveInternacao })}
  ${checkField({ name: 'houveAfastamento', label: 'Houve afastamento', col: 4, checked: acidente?.houveAfastamento })}
`;

const lerAcidenteForm = (form: HTMLFormElement, colaboradorId?: string): AcidenteFormData => ({
  colaboradorId: colaboradorId ?? readString(form, 'colaboradorId'),
  dataAcidente: readString(form, 'dataAcidente'),
  horaAcidente: readString(form, 'horaAcidente'),
  horasTrabalhadasAntes: readString(form, 'horasTrabalhadasAntes'),
  tipoAcidente: readString(form, 'tipoAcidente') as AcidenteFormData['tipoAcidente'],
  tipoCat: readString(form, 'tipoCat') as AcidenteFormData['tipoCat'],
  obito: readBoolean(form, 'obito'),
  dataObito: readString(form, 'dataObito') || null,
  comunicadoPolicia: readBoolean(form, 'comunicadoPolicia'),
  localAcidente: readString(form, 'localAcidente'),
  parteAtingida: readString(form, 'parteAtingida') as AcidenteFormData['parteAtingida'],
  agenteCausador: readString(form, 'agenteCausador') as AcidenteFormData['agenteCausador'],
  tipoLesao: readString(form, 'tipoLesao') as AcidenteFormData['tipoLesao'],
  descricao: readString(form, 'descricao'),
  cid: readString(form, 'cid') || null,
  dataAtendimento: readString(form, 'dataAtendimento'),
  horaAtendimento: readString(form, 'horaAtendimento'),
  houveInternacao: readBoolean(form, 'houveInternacao'),
  houveAfastamento: readBoolean(form, 'houveAfastamento'),
  duracaoTratamentoDias: readNumber(form, 'duracaoTratamentoDias'),
  medico: readString(form, 'medico'),
  crm: readString(form, 'crm'),
  ufCrm: readString(form, 'ufCrm'),
});

export interface ModalAcidenteOptions {
  colaboradores: Colaborador[];
  acidente?: Acidente;
  colaboradorId?: string;
  aoConcluir: () => Promise<void> | void;
}

export const abrirModalAcidente = ({
  colaboradores,
  acidente,
  colaboradorId,
  aoConcluir,
}: ModalAcidenteOptions): void => {
  openFormModal({
    titulo: acidente ? 'Editar acidente' : 'Registrar acidente de trabalho',
    tamanho: 'xl',
    campos: camposAcidente(colaboradores, acidente, acidente ? undefined : colaboradorId),
    confirmLabel: acidente ? 'Salvar alterações' : 'Registrar acidente',
    onConfirm: async (form) => {
      const dados = lerAcidenteForm(form, acidente?.colaboradorId ?? colaboradorId);
      if (acidente) {
        await acidenteService.atualizar(acidente.id, dados);
        showToast('Acidente atualizado.');
      } else {
        await acidenteService.criar(dados);
        showToast('Acidente registrado. Gere a CAT (S-2210) para comunicar ao eSocial.');
      }
      await aoConcluir();
    },
  });
};

/** Botão de geração do S-2210 ou o estado do evento já gerado. */
export const celulaCatDoAcidente = (acidente: Acidente, evento?: EventoESocial): string => {
  if (evento) {
    return `
      <a href="#/esocial" class="text-decoration-none">
        ${badge(`S-2210 ${LABEL_STATUS_EVENTO[evento.status]}`, VARIANT_STATUS_EVENTO[evento.status])}
      </a>
    `;
  }
  return `
    <button type="button" class="btn btn-sm btn-outline-primary" data-action="gerar-cat" data-id="${esc(acidente.id)}">
      Gerar CAT (S-2210)
    </button>
  `;
};

export const renderAcidenteView = async (root: HTMLElement): Promise<void> => {
  let [acidentes, colaboradores, eventos] = await Promise.all([
    acidenteService.listar(),
    colaboradorService.listar(),
    eventoService.listar(),
  ]);

  const nomePorId = (id: string): string =>
    colaboradores.find((colaborador) => colaborador.id === id)?.nome ?? 'Colaborador removido';

  const eventoDoAcidente = (acidenteId: string): EventoESocial | undefined =>
    eventos.find((evento) => evento.acidenteId === acidenteId);

  const recarregar = async (): Promise<void> => {
    [acidentes, colaboradores, eventos] = await Promise.all([
      acidenteService.listar(),
      colaboradorService.listar(),
      eventoService.listar(),
    ]);
    desenharTabela();
  };

  const linha = (acidente: Acidente): string => {
    const expirado = acidenteService.prazoExpirado(acidente);

    return `
      <tr>
        <td>
          <span class="fw-semibold">${esc(formatDate(acidente.dataAcidente))}</span>
          <div class="text-muted small">${esc(formatHora(acidente.horaAcidente))} · ${esc(acidente.localAcidente)}</div>
        </td>
        <td>
          <a href="#/colaboradores/${esc(acidente.colaboradorId)}">${esc(nomePorId(acidente.colaboradorId))}</a>
        </td>
        <td>
          ${esc(LABEL_TIPO_ACIDENTE[acidente.tipoAcidente])}
          <div class="text-muted small">${esc(LABEL_TIPO_CAT[acidente.tipoCat])}</div>
        </td>
        <td>
          ${esc(LABEL_TIPO_LESAO[acidente.tipoLesao])}
          <div class="text-muted small">${esc(LABEL_PARTE_ATINGIDA[acidente.parteAtingida])}</div>
        </td>
        <td>
          ${acidente.obito ? badge('Óbito', 'dark') : ''}
          ${badge(expirado ? 'Prazo expirado' : 'No prazo', expirado ? 'danger' : 'success')}
        </td>
        <td>${celulaCatDoAcidente(acidente, eventoDoAcidente(acidente.id))}</td>
        <td class="text-end text-nowrap">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-action="editar" data-id="${esc(acidente.id)}">Editar</button>
          ${
            isAdmin()
              ? `<button type="button" class="btn btn-sm btn-outline-danger ms-2" data-action="remover" data-id="${esc(acidente.id)}">Remover</button>`
              : ''
          }
        </td>
      </tr>
    `;
  };

  const desenharTabela = (): void => {
    const container = root.querySelector('#tabela-acidentes');
    if (!container) return;

    container.innerHTML = table({
      colunas: ['Ocorrência', 'Trabalhador', 'Natureza', 'Lesão', 'Comunicação', 'eSocial', ''],
      linhas: acidentes.map(linha),
      vazio: 'Nenhum acidente registrado.',
    });

    bindAction(container, 'editar', (elemento) => {
      const acidente = acidentes.find((item) => item.id === elemento.dataset.id);
      if (acidente) abrirModalAcidente({ colaboradores, acidente, aoConcluir: recarregar });
    });

    bindAction(container, 'gerar-cat', async (elemento) => {
      const acidente = acidentes.find((item) => item.id === elemento.dataset.id);
      if (!acidente) return;

      const botao = elemento as HTMLButtonElement;
      botao.disabled = true;
      try {
        await eventoService.gerarDeAcidente(acidente.id);
        showToast('CAT (S-2210) gerada e validada contra o schema.');
        await recarregar();
      } catch (error) {
        botao.disabled = false;
        showToast(error instanceof Error ? error.message : 'Não foi possível gerar a CAT.', 'danger');
      }
    });

    bindAction(container, 'remover', async (elemento) => {
      const acidente = acidentes.find((item) => item.id === elemento.dataset.id);
      if (!acidente) return;

      const confirmado = await openConfirm({
        titulo: 'Remover acidente',
        mensagem: `Excluir o acidente de ${formatDate(acidente.dataAcidente)} de ${nomePorId(acidente.colaboradorId)}? O registro é a base legal da CAT.`,
        confirmLabel: 'Excluir',
      });
      if (!confirmado) return;

      await acidenteService.remover(acidente.id);
      showToast('Acidente removido.');
      await recarregar();
    });
  };

  root.innerHTML = `
    ${pageHeader({
      titulo: 'Acidentes de trabalho',
      subtitulo:
        'A CAT é devida até o primeiro dia útil seguinte ao acidente — e de imediato em caso de óbito (Lei 8.213/91, art. 22).',
      acoes: '<button type="button" class="btn btn-primary" data-action="novo">Registrar acidente</button>',
    })}

    ${cardTabela('Ocorrências registradas', '<div id="tabela-acidentes"></div>')}
  `;

  desenharTabela();
  bindAction(root, 'novo', () => abrirModalAcidente({ colaboradores, aoConcluir: recarregar }));
};
