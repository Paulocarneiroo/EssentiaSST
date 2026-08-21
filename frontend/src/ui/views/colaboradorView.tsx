import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  colaboradorService,
  type ColaboradorFormData,
} from '../../services/colaboradorService';
import { formatCpf, formatDate, hojeInput, toDateInput } from '../../services/format';
import { LABEL_SITUACAO_APTIDAO, VARIANT_SITUACAO_APTIDAO } from '../../services/labels';
import { isAdmin } from '../../state/session';
import type { AvaliacaoAptidao } from '../../types/aptidao';
import type { Colaborador } from '../../types/colaborador';
import {
  Badge,
  CardTabela,
  Loading,
  PageError,
  PageHeader,
  Table,
  useDocumentTitle,
} from '../components';
import { readString, TextField } from '../formFields';
import { openConfirm, openFormModal } from '../modal';
import { showToast } from '../toast';

export const CamposColaborador = ({ colaborador }: { colaborador?: Colaborador }) => (
  <>
    <TextField name="nome" label="Nome completo" col={12} required value={colaborador?.nome} />
    <TextField
      name="cpf"
      label="CPF"
      col={6}
      required
      maxlength={14}
      placeholder="000.000.000-00"
      value={colaborador ? formatCpf(colaborador.cpf) : ''}
    />
    <TextField name="cargo" label="Cargo" col={6} required value={colaborador?.cargo} />
    <TextField
      name="dataNascimento"
      label="Data de nascimento"
      type="date"
      col={6}
      required
      value={toDateInput(colaborador?.dataNascimento)}
    />
    <TextField
      name="dataAdmissao"
      label="Data de admissão"
      type="date"
      col={6}
      required
      value={toDateInput(colaborador?.dataAdmissao)}
    />
    {colaborador ? (
      <TextField
        name="dataDemissao"
        label="Data de demissão"
        type="date"
        col={6}
        value={toDateInput(colaborador.dataDemissao)}
        help="Preencha apenas ao desligar o colaborador. O histórico é preservado."
      />
    ) : null}
  </>
);

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
    campos: <CamposColaborador colaborador={colaborador} />,
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
    campos: (
      <>
        <div className="col-12">
          <p className="text-muted mb-0">
            O desligamento registra a data de demissão e mantém todo o histórico de ASOs, acidentes e
            eventos do trabalhador.
          </p>
        </div>
        <TextField
          name="dataDemissao"
          label="Data de demissão"
          type="date"
          col={12}
          required
          value={hojeInput()}
        />
      </>
    ),
    onConfirm: async (form) => {
      await colaboradorService.desligar(colaborador.id, readString(form, 'dataDemissao'));
      showToast('Desligamento registrado.');
      await aoConcluir();
    },
  });
};

type Filtro = 'ativos' | 'desligados' | 'todos';

export const ColaboradorPage = () => {
  useDocumentTitle('Colaboradores');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [aptidoes, setAptidoes] = useState<Map<string, AvaliacaoAptidao>>(new Map());
  const [filtro, setFiltro] = useState<Filtro>('ativos');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async (): Promise<void> => {
    const lista = await colaboradorService.listar();
    const mapa = await colaboradorService.aptidoes(
      lista.filter(colaboradorService.ativo).map((colaborador) => colaborador.id),
    );
    setColaboradores(lista);
    setAptidoes(mapa);
  }, []);

  useEffect(() => {
    let ativo = true;
    void recarregar()
      .catch((error: unknown) => {
        if (!ativo) return;
        setErro(error instanceof Error ? error.message : 'Não foi possível carregar esta página.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [recarregar]);

  if (erro) return <PageError titulo="Colaboradores" mensagem={erro} />;
  if (carregando) return <Loading />;

  const visiveis = colaboradores
    .filter((colaborador) => {
      const ativo = colaboradorService.ativo(colaborador);
      if (filtro === 'ativos') return ativo;
      if (filtro === 'desligados') return !ativo;
      return true;
    })
      .filter((colaborador) => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return true;
        return (
          colaborador.nome.toLowerCase().includes(termo) ||
          colaborador.cpf.includes(termo.replace(/\D/g, ''))
        );
      });

  const reativar = async (colaborador: Colaborador): Promise<void> => {
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
  };

  const remover = async (colaborador: Colaborador): Promise<void> => {
    const confirmado = await openConfirm({
      titulo: 'Remover colaborador',
      mensagem: `Excluir ${colaborador.nome} apaga também ASOs, acidentes e eventos vinculados. Para encerrar o vínculo sem perder o histórico, use "Desligar".`,
      confirmLabel: 'Excluir definitivamente',
    });
    if (!confirmado) return;
    await colaboradorService.remover(colaborador.id);
    showToast('Colaborador removido.');
    await recarregar();
  };

  return (
    <>
      <PageHeader
        titulo="Colaboradores"
        subtitulo="Base de trabalhadores da sua empresa e a situação de aptidão de cada um."
        acoes={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => abrirModalColaborador(undefined, recarregar)}
          >
            Novo colaborador
          </button>
        }
      />

      <div className="toolbar mb-3">
        <div className="btn-group" role="group" aria-label="Filtrar por vínculo">
          {(['ativos', 'desligados', 'todos'] as const).map((valor) => (
            <button
              key={valor}
              type="button"
              className={`btn btn-sm btn-outline-secondary${filtro === valor ? ' active' : ''}`}
              onClick={() => setFiltro(valor)}
            >
              {valor === 'ativos' ? 'Ativos' : valor === 'desligados' ? 'Desligados' : 'Todos'}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="form-control form-control-sm toolbar-search"
          placeholder="Buscar por nome ou CPF"
          aria-label="Buscar colaborador"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />
      </div>

      <CardTabela titulo="Trabalhadores">
        <Table
          colunas={['Colaborador', 'CPF', 'Admissão', 'Aptidão (NR-07)', 'Vínculo', '']}
          linhas={visiveis.map((colaborador) => {
            const ativo = colaboradorService.ativo(colaborador);
            const avaliacao = aptidoes.get(colaborador.id);
            return (
              <tr key={colaborador.id}>
                <td>
                  <Link className="fw-semibold" to={`/colaboradores/${colaborador.id}`}>
                    {colaborador.nome}
                  </Link>
                  <div className="text-muted small">{colaborador.cargo}</div>
                </td>
                <td className="mono">{formatCpf(colaborador.cpf)}</td>
                <td className="text-nowrap">{formatDate(colaborador.dataAdmissao)}</td>
                <td>
                  {avaliacao ? (
                    <Badge
                      label={LABEL_SITUACAO_APTIDAO[avaliacao.situacao]}
                      variant={VARIANT_SITUACAO_APTIDAO[avaliacao.situacao]}
                    />
                  ) : (
                    <span className="text-muted small">—</span>
                  )}
                </td>
                <td>
                  {ativo ? (
                    <Badge label="Ativo" variant="success" />
                  ) : (
                    <Badge label={`Desligado em ${formatDate(colaborador.dataDemissao)}`} variant="dark" />
                  )}
                </td>
                <td className="text-end text-nowrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => abrirModalColaborador(colaborador, recarregar)}
                  >
                    Editar
                  </button>
                  {ativo ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-warning ms-2"
                      onClick={() => abrirModalDesligamento(colaborador, recarregar)}
                    >
                      Desligar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success ms-2"
                      onClick={() => void reativar(colaborador)}
                    >
                      Reativar
                    </button>
                  )}
                  {isAdmin() ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger ms-2"
                      onClick={() => void remover(colaborador)}
                    >
                      Remover
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
          vazio={
            colaboradores.length === 0
              ? 'Nenhum colaborador cadastrado. Comece cadastrando o primeiro trabalhador.'
              : 'Nenhum colaborador corresponde ao filtro aplicado.'
          }
        />
      </CardTabela>
    </>
  );
};
