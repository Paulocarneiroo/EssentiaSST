import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { colaboradorService } from '../../services/colaboradorService';
import { eventoService } from '../../services/eventoService';
import {
  LABEL_CLASSIFICACAO,
  LABEL_TIPO_RISCO,
  VARIANT_CLASSIFICACAO,
  opcoesDe,
} from '../../services/labels';
import { riscoService, type RiscoFormData } from '../../services/riscoService';
import { isAdmin } from '../../state/session';
import type { Colaborador } from '../../types/colaborador';
import type { EventoESocial } from '../../types/evento';
import { TIPOS_RISCO, calcularNivelRisco, classificarRisco, type Risco } from '../../types/risco';
import {
  Badge,
  CardTabela,
  Loading,
  PageError,
  PageHeader,
  StatCard,
  Table,
  useDocumentTitle,
} from '../components';
import { readNumber, readString, SelectField, TextareaField } from '../formFields';
import { openConfirm, openFormModal } from '../modal';
import { showToast } from '../toast';

const ESCALA = [1, 2, 3, 4, 5].map((valor) => ({ value: valor, label: String(valor) }));

const CamposRisco = ({ risco }: { risco?: Risco }) => (
  <>
    <TextareaField
      name="descricao"
      label="Descrição do risco"
      col={12}
      required
      rows={3}
      maxlength={500}
      value={risco?.descricao}
    />
    <SelectField
      name="tipo"
      label="Tipo (natureza do agente)"
      col={12}
      required
      options={opcoesDe(TIPOS_RISCO, LABEL_TIPO_RISCO)}
      value={risco?.tipo}
    />
    <SelectField
      name="severidade"
      label="Severidade"
      col={6}
      required
      options={ESCALA}
      value={risco?.severidade}
      help="1 = dano leve · 5 = dano catastrófico."
    />
    <SelectField
      name="probabilidade"
      label="Probabilidade"
      col={6}
      required
      options={ESCALA}
      value={risco?.probabilidade}
      help="1 = improvável · 5 = frequente."
    />
  </>
);

const lerRiscoForm = (form: HTMLFormElement): RiscoFormData => ({
  descricao: readString(form, 'descricao'),
  tipo: readString(form, 'tipo') as RiscoFormData['tipo'],
  severidade: readNumber(form, 'severidade'),
  probabilidade: readNumber(form, 'probabilidade'),
});

const abrirModalRisco = (risco: Risco | undefined, aoConcluir: () => Promise<void>): void => {
  openFormModal({
    titulo: risco ? 'Editar risco' : 'Novo risco do PGR',
    campos: <CamposRisco risco={risco} />,
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

const abrirModalExposicao = (
  risco: Risco,
  colaboradores: Colaborador[],
  aoConcluir: () => Promise<void>,
): void => {
  openFormModal({
    titulo: 'Gerar evento S-2240',
    tamanho: 'md',
    confirmLabel: 'Gerar evento',
    campos: (
      <>
        <div className="col-12">
          <p className="text-muted mb-0">
            Risco: <strong>{risco.descricao}</strong>
          </p>
        </div>
        <SelectField
          name="colaboradorId"
          label="Trabalhador exposto"
          col={12}
          required
          options={colaboradores
            .filter(colaboradorService.ativo)
            .map((colaborador) => ({ value: colaborador.id, label: colaborador.nome }))}
          help="O S-2240 registra as condições ambientais a que este trabalhador está exposto."
        />
      </>
    ),
    onConfirm: async (form) => {
      await eventoService.gerarDeRisco(risco.id, readString(form, 'colaboradorId'));
      showToast('Evento S-2240 gerado e validado contra o schema.');
      await aoConcluir();
    },
  });
};

export const RiscoPage = () => {
  useDocumentTitle('Riscos');
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [eventos, setEventos] = useState<EventoESocial[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async (): Promise<void> => {
    const [listaRiscos, listaColaboradores, listaEventos] = await Promise.all([
      riscoService.listar(),
      colaboradorService.listar(),
      eventoService.listar(),
    ]);
    setRiscos(listaRiscos);
    setColaboradores(listaColaboradores);
    setEventos(listaEventos);
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

  if (erro) return <PageError titulo="Riscos" mensagem={erro} />;
  if (carregando) return <Loading />;

  const eventosDoRisco = (riscoId: string): EventoESocial[] =>
    eventos.filter((evento) => evento.riscoId === riscoId);

  const contagem = { BAIXO: 0, MODERADO: 0, ALTO: 0, CRITICO: 0 };
  for (const risco of riscos) {
    contagem[classificarRisco(calcularNivelRisco(risco))] += 1;
  }

  const remover = async (risco: Risco): Promise<void> => {
    const confirmado = await openConfirm({
      titulo: 'Remover risco',
      mensagem: `Excluir "${risco.descricao}" do inventário do PGR?`,
      confirmLabel: 'Excluir',
    });
    if (!confirmado) return;
    await riscoService.remover(risco.id);
    showToast('Risco removido.');
    await recarregar();
  };

  return (
    <>
      <PageHeader
        titulo="Inventário de riscos (PGR)"
        subtitulo="Nível de risco = severidade × probabilidade, na matriz 5×5 da NR-01."
        acoes={
          <>
            <Link className="btn btn-outline-secondary me-2" to="/pgr">
              Ver relatório
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => abrirModalRisco(undefined, recarregar)}>
              Novo risco
            </button>
          </>
        }
      />

      <div className="stat-grid mb-4">
        <StatCard label="Riscos mapeados" valor={riscos.length} />
        <StatCard label="Críticos" valor={contagem.CRITICO} variant={contagem.CRITICO ? 'danger' : undefined} />
        <StatCard label="Altos" valor={contagem.ALTO} variant={contagem.ALTO ? 'warning' : undefined} />
        <StatCard label="Moderados e baixos" valor={contagem.MODERADO + contagem.BAIXO} />
      </div>

      <CardTabela titulo="Riscos priorizados">
        <Table
          colunas={['Risco', 'Sev.', 'Prob.', 'Nível', 'Classificação', 'eSocial', '']}
          linhas={riscos.map((risco) => {
            const nivel = calcularNivelRisco(risco);
            const classificacao = classificarRisco(nivel);
            const gerados = eventosDoRisco(risco.id).length;
            return (
              <tr key={risco.id}>
                <td>
                  <span className="fw-semibold">{risco.descricao}</span>
                  <div className="text-muted small">{LABEL_TIPO_RISCO[risco.tipo]}</div>
                </td>
                <td className="text-center">{risco.severidade}</td>
                <td className="text-center">{risco.probabilidade}</td>
                <td className="text-center fw-semibold">{nivel}</td>
                <td>
                  <Badge label={LABEL_CLASSIFICACAO[classificacao]} variant={VARIANT_CLASSIFICACAO[classificacao]} />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => abrirModalExposicao(risco, colaboradores, recarregar)}
                  >
                    Gerar S-2240
                  </button>
                  {gerados ? (
                    <div className="text-muted small mt-1">{gerados} evento(s) gerado(s)</div>
                  ) : null}
                </td>
                <td className="text-end text-nowrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => abrirModalRisco(risco, recarregar)}
                  >
                    Editar
                  </button>
                  {isAdmin() ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger ms-2"
                      onClick={() => void remover(risco)}
                    >
                      Remover
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
          vazio="Nenhum risco no inventário. O PGR começa pelo levantamento dos perigos do ambiente."
        />
      </CardTabela>
    </>
  );
};
