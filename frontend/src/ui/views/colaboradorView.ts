import {
  colaboradorService,
  type ColaboradorFormData,
} from '../../services/colaboradorService.js';
import { formatCpf, formatDate, hojeInput, toDateInput } from '../../services/format.js';
import { LABEL_SITUACAO_APTIDAO, VARIANT_SITUACAO_APTIDAO } from '../../services/labels.js';
import { isAdmin } from '../../state/session.js';
import type { AvaliacaoAptidao } from '../../types/aptidao.js';
import type { Colaborador } from '../../types/colaborador.js';
import { badge, cardTabela, pageHeader, table } from '../components.js';
import { bindAction } from '../forms.js';
import { readString, textField } from '../formFields.js';
import { esc } from '../html.js';
import { openConfirm, openFormModal } from '../modal.js';
import { showToast } from '../toast.js';

/** Campos do cadastro de colaborador, reaproveitados no modal de edição. */
export const camposColaborador = (colaborador?: Colaborador): string => `
  ${textField({ name: 'nome', label: 'Nome completo', col: 12, required: true, value: colaborador?.nome })}
  ${textField({ name: 'cpf', label: 'CPF', col: 6, required: true, maxlength: 14, placeholder: '000.000.000-00', value: colaborador ? formatCpf(colaborador.cpf) : '' })}
  ${textField({ name: 'cargo', label: 'Cargo', col: 6, required: true, value: colaborador?.cargo })}
  ${textField({ name: 'dataNascimento', label: 'Data de nascimento', type: 'date', col: 6, required: true, value: toDateInput(colaborador?.dataNascimento) })}
  ${textField({ name: 'dataAdmissao', label: 'Data de admissão', type: 'date', col: 6, required: true, value: toDateInput(colaborador?.dataAdmissao) })}
  ${
    colaborador
      ? textField({
          name: 'dataDemissao',
          label: 'Data de demissão',
          type: 'date',
          col: 6,
          value: toDateInput(colaborador.dataDemissao),
          help: 'Preencha apenas ao desligar o colaborador. O histórico é preservado.',
        })
      : ''
  }
`;

export const lerColaboradorForm = (form: HTMLFormElement): ColaboradorFormData => ({
  nome: readString(form, 'nome'),
  cpf: readString(form, 'cpf'),
  cargo: readString(form, 'cargo'),
  dataNascimento: readString(form, 'dataNascimento'),
  dataAdmissao: readString(form, 'dataAdmissao'),
  dataDemissao: readString(form, 'dataDemissao') || null,
});

export const abrirModalColaborador = (
  colaborador: Colaborador | undefined,
  aoConcluir: () => Promise<void> | void,
): void => {
  openFormModal({
    titulo: colaborador ? `Editar ${colaborador.nome}` : 'Novo colaborador',
    campos: camposColaborador(colaborador),
    confirmLabel: colaborador ? 'Salvar alterações' : 'Cadastrar',
    onConfirm: async (form) => {
      const dados = lerColaboradorForm(form);
      if (colaborador) {
        await colaboradorService.atualizar(colaborador.id, dados);
        showToast('Colaborador atualizado.');
      } else {
        await colaboradorService.criar(dados);
        showToast('Colaborador cadastrado.');
      }
      await aoConcluir();
    },
  });
};

export const abrirModalDesligamento = (
  colaborador: Colaborador,
  aoConcluir: () => Promise<void> | void,
): void => {
  openFormModal({
    titulo: `Desligar ${colaborador.nome}`,
    tamanho: 'md',
    confirmLabel: 'Registrar desligamento',
    campos: `
      <div class="col-12">
        <p class="text-muted mb-0">
          O desligamento registra a data de demissão e mantém todo o histórico de ASOs,
          acidentes e eventos do trabalhador.
        </p>
      </div>
      ${textField({ name: 'dataDemissao', label: 'Data de demissão', type: 'date', col: 12, required: true, value: hojeInput() })}
    `,
    onConfirm: async (form) => {
      await colaboradorService.desligar(colaborador.id, readString(form, 'dataDemissao'));
      showToast('Desligamento registrado.');
      await aoConcluir();
    },
  });
};

type Filtro = 'ativos' | 'desligados' | 'todos';

const linha = (colaborador: Colaborador, avaliacao?: AvaliacaoAptidao): string => {
  const ativo = colaboradorService.ativo(colaborador);
  const situacao = avaliacao
    ? badge(LABEL_SITUACAO_APTIDAO[avaliacao.situacao], VARIANT_SITUACAO_APTIDAO[avaliacao.situacao])
    : '<span class="text-muted small">—</span>';

  return `
    <tr>
      <td>
        <a class="fw-semibold" href="#/colaboradores/${esc(colaborador.id)}">${esc(colaborador.nome)}</a>
        <div class="text-muted small">${esc(colaborador.cargo)}</div>
      </td>
      <td class="mono">${esc(formatCpf(colaborador.cpf))}</td>
      <td class="text-nowrap">${esc(formatDate(colaborador.dataAdmissao))}</td>
      <td>${situacao}</td>
      <td>${ativo ? badge('Ativo', 'success') : badge(`Desligado em ${formatDate(colaborador.dataDemissao)}`, 'dark')}</td>
      <td class="text-end text-nowrap">
        <button type="button" class="btn btn-sm btn-outline-secondary" data-action="editar" data-id="${esc(colaborador.id)}">Editar</button>
        ${
          ativo
            ? `<button type="button" class="btn btn-sm btn-outline-warning ms-2" data-action="desligar" data-id="${esc(colaborador.id)}">Desligar</button>`
            : `<button type="button" class="btn btn-sm btn-outline-success ms-2" data-action="reativar" data-id="${esc(colaborador.id)}">Reativar</button>`
        }
        ${
          isAdmin()
            ? `<button type="button" class="btn btn-sm btn-outline-danger ms-2" data-action="remover" data-id="${esc(colaborador.id)}">Remover</button>`
            : ''
        }
      </td>
    </tr>
  `;
};

export const renderColaboradorView = async (root: HTMLElement): Promise<void> => {
  let colaboradores = await colaboradorService.listar();
  let aptidoes = await colaboradorService.aptidoes(
    colaboradores.filter(colaboradorService.ativo).map((colaborador) => colaborador.id),
  );
  let filtro: Filtro = 'ativos';
  let busca = '';

  const visiveis = (): Colaborador[] =>
    colaboradores
      .filter((colaborador) => {
        const ativo = colaboradorService.ativo(colaborador);
        if (filtro === 'ativos') return ativo;
        if (filtro === 'desligados') return !ativo;
        return true;
      })
      .filter((colaborador) => {
        if (!busca) return true;
        const termo = busca.toLowerCase();
        return (
          colaborador.nome.toLowerCase().includes(termo) ||
          colaborador.cpf.includes(termo.replace(/\D/g, ''))
        );
      });

  const recarregar = async (): Promise<void> => {
    colaboradores = await colaboradorService.listar();
    aptidoes = await colaboradorService.aptidoes(
      colaboradores.filter(colaboradorService.ativo).map((colaborador) => colaborador.id),
    );
    desenharTabela();
  };

  const desenharTabela = (): void => {
    const container = root.querySelector('#tabela-colaboradores');
    if (!container) return;

    container.innerHTML = table({
      colunas: ['Colaborador', 'CPF', 'Admissão', 'Aptidão (NR-07)', 'Vínculo', ''],
      linhas: visiveis().map((colaborador) => linha(colaborador, aptidoes.get(colaborador.id))),
      vazio:
        colaboradores.length === 0
          ? 'Nenhum colaborador cadastrado. Comece cadastrando o primeiro trabalhador.'
          : 'Nenhum colaborador corresponde ao filtro aplicado.',
    });

    ligarAcoes(container);
  };

  const ligarAcoes = (container: Element): void => {
    const buscar = (id: string): Colaborador | undefined =>
      colaboradores.find((colaborador) => colaborador.id === id);

    bindAction(container, 'editar', (elemento) => {
      const colaborador = buscar(elemento.dataset.id ?? '');
      if (colaborador) abrirModalColaborador(colaborador, recarregar);
    });

    bindAction(container, 'desligar', (elemento) => {
      const colaborador = buscar(elemento.dataset.id ?? '');
      if (colaborador) abrirModalDesligamento(colaborador, recarregar);
    });

    bindAction(container, 'reativar', async (elemento) => {
      const colaborador = buscar(elemento.dataset.id ?? '');
      if (!colaborador) return;

      const confirmado = await openConfirm({
        titulo: 'Reativar colaborador',
        mensagem: `Remover a data de demissão de ${colaborador.nome} e voltar a considerá-lo ativo?`,
        confirmLabel: 'Reativar',
        variant: 'primary',
      });
      if (!confirmado) return;

      await colaboradorService.reativar(colaborador.id);
      showToast('Colaborador reativado.');
      await recarregar();
    });

    bindAction(container, 'remover', async (elemento) => {
      const colaborador = buscar(elemento.dataset.id ?? '');
      if (!colaborador) return;

      const confirmado = await openConfirm({
        titulo: 'Remover colaborador',
        mensagem: `Excluir ${colaborador.nome} apaga também ASOs, acidentes e eventos vinculados. Para encerrar o vínculo sem perder o histórico, use "Desligar".`,
        confirmLabel: 'Excluir definitivamente',
      });
      if (!confirmado) return;

      await colaboradorService.remover(colaborador.id);
      showToast('Colaborador removido.');
      await recarregar();
    });
  };

  root.innerHTML = `
    ${pageHeader({
      titulo: 'Colaboradores',
      subtitulo: 'Base de trabalhadores da sua empresa e a situação de aptidão de cada um.',
      acoes: '<button type="button" class="btn btn-primary" data-action="novo">Novo colaborador</button>',
    })}

    <div class="toolbar mb-3">
      <div class="btn-group" role="group" aria-label="Filtrar por vínculo">
        <button type="button" class="btn btn-sm btn-outline-secondary active" data-filtro="ativos">Ativos</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-filtro="desligados">Desligados</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-filtro="todos">Todos</button>
      </div>
      <input type="search" class="form-control form-control-sm toolbar-search" id="busca" placeholder="Buscar por nome ou CPF" aria-label="Buscar colaborador" />
    </div>

    ${cardTabela('Trabalhadores', '<div id="tabela-colaboradores"></div>')}
  `;

  desenharTabela();

  bindAction(root, 'novo', () => abrirModalColaborador(undefined, recarregar));

  root.querySelectorAll<HTMLButtonElement>('[data-filtro]').forEach((botao) => {
    botao.addEventListener('click', () => {
      filtro = (botao.dataset.filtro as Filtro) ?? 'ativos';
      root
        .querySelectorAll('[data-filtro]')
        .forEach((item) => item.classList.toggle('active', item === botao));
      desenharTabela();
    });
  });

  root.querySelector<HTMLInputElement>('#busca')?.addEventListener('input', (event) => {
    busca = (event.target as HTMLInputElement).value.trim();
    desenharTabela();
  });
};
