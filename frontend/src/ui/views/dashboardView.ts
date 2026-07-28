import { acidenteService } from '../../services/acidenteService.js';
import { asoService } from '../../services/asoService.js';
import { colaboradorService } from '../../services/colaboradorService.js';
import { empresaService } from '../../services/empresaService.js';
import { eventoService } from '../../services/eventoService.js';
import { formatCnpj, formatDate, pluralizar } from '../../services/format.js';
import {
  LABEL_AMBIENTE,
  LABEL_SITUACAO_APTIDAO,
  LABEL_STATUS_EVENTO,
  SIGLA_TIPO_EVENTO,
  VARIANT_AMBIENTE,
  VARIANT_SITUACAO_APTIDAO,
  VARIANT_STATUS_EVENTO,
} from '../../services/labels.js';
import { riscoService } from '../../services/riscoService.js';
import { getUsuario } from '../../state/session.js';
import type { AvaliacaoAptidao } from '../../types/aptidao.js';
import type { Colaborador } from '../../types/colaborador.js';
import { calcularNivelRisco, classificarRisco } from '../../types/risco.js';
import { badge, cardTabela, emptyState, pageHeader, statCard, table } from '../components.js';
import { esc } from '../html.js';

/** Situações que exigem ação do time de SST antes que virem passivo. */
const SITUACOES_PENDENTES = ['VENCIDO', 'SEM_ASO', 'INAPTO'] as const;

const linhaPendenciaAptidao = (
  colaborador: Colaborador,
  avaliacao: AvaliacaoAptidao,
): string => `
  <tr>
    <td>
      <a href="#/colaboradores/${esc(colaborador.id)}" class="fw-semibold">${esc(colaborador.nome)}</a>
      <div class="text-muted small">${esc(colaborador.cargo)}</div>
    </td>
    <td>${badge(LABEL_SITUACAO_APTIDAO[avaliacao.situacao], VARIANT_SITUACAO_APTIDAO[avaliacao.situacao])}</td>
    <td class="text-muted small">${esc(avaliacao.motivo)}</td>
  </tr>
`;

export const renderDashboardView = async (root: HTMLElement): Promise<void> => {
  const [empresa, colaboradores, riscos, eventos, acidentes, asos] = await Promise.all([
    empresaService.minhaEmpresa(),
    colaboradorService.listar(),
    riscoService.listar(),
    eventoService.listar(),
    acidenteService.listar(),
    asoService.listar(),
  ]);

  const ativos = colaboradores.filter(colaboradorService.ativo);
  const aptidoes = await colaboradorService.aptidoes(ativos.map((colaborador) => colaborador.id));

  const pendencias = ativos
    .map((colaborador) => ({ colaborador, avaliacao: aptidoes.get(colaborador.id) }))
    .filter(
      (item): item is { colaborador: Colaborador; avaliacao: AvaliacaoAptidao } =>
        item.avaliacao !== undefined &&
        (SITUACOES_PENDENTES as readonly string[]).includes(item.avaliacao.situacao),
    );

  const aptos = ativos.length - pendencias.length;
  const statusEventos = eventoService.contarPorStatus(eventos);
  const riscosPrioritarios = riscos.filter((risco) => {
    const classificacao = classificarRisco(calcularNivelRisco(risco));
    return classificacao === 'ALTO' || classificacao === 'CRITICO';
  });

  // Fatos de origem que ainda não viraram evento eSocial (H3.1).
  const acidentesComEvento = new Set(eventos.map((evento) => evento.acidenteId).filter(Boolean));
  const asosComEvento = new Set(eventos.map((evento) => evento.asoId).filter(Boolean));
  const acidentesSemCat = acidentes.filter((acidente) => !acidentesComEvento.has(acidente.id));
  const asosSemEvento = asos.filter((aso) => !asosComEvento.has(aso.id));

  const ambiente = eventos[0]?.ambiente;
  const nomeUsuario = getUsuario()?.nome.split(' ')[0] ?? '';

  const linhasEventosRecentes = eventos.slice(0, 5).map(
    (evento) => `
      <tr>
        <td><span class="mono">${esc(SIGLA_TIPO_EVENTO[evento.tipoEvento])}</span></td>
        <td>${badge(LABEL_STATUS_EVENTO[evento.status], VARIANT_STATUS_EVENTO[evento.status])}</td>
        <td class="text-muted small">${esc(evento.protocolo ?? evento.mensagemErro ?? '—')}</td>
        <td class="text-nowrap text-muted small">${esc(formatDate(evento.createdAt))}</td>
      </tr>
    `,
  );

  root.innerHTML = `
    ${pageHeader({
      titulo: `Olá, ${nomeUsuario}`,
      subtitulo: `${empresa.nomeFantasia} · CNPJ ${formatCnpj(empresa.cnpj)} · Grau de risco ${empresa.grauRisco}`,
      acoes: ambiente
        ? `<span class="ambiente-tag">Ambiente eSocial: ${badge(LABEL_AMBIENTE[ambiente], VARIANT_AMBIENTE[ambiente])}</span>`
        : '',
    })}

    <div class="stat-grid mb-4">
      ${statCard({
        label: 'Colaboradores ativos',
        valor: ativos.length,
        detalhe: `${colaboradores.length - ativos.length} desligado(s)`,
        href: '#/colaboradores',
      })}
      ${statCard({
        label: 'Aptidão em dia',
        valor: `${aptos}/${ativos.length}`,
        detalhe: pendencias.length ? `${pluralizar(pendencias.length, 'pendência', 'pendências')}` : 'Sem pendências',
        variant: pendencias.length ? 'danger' : 'success',
        href: '#/colaboradores',
      })}
      ${statCard({
        label: 'Riscos prioritários',
        valor: riscosPrioritarios.length,
        detalhe: `de ${pluralizar(riscos.length, 'risco mapeado', 'riscos mapeados')}`,
        variant: riscosPrioritarios.length ? 'warning' : undefined,
        href: '#/riscos',
      })}
      ${statCard({
        label: 'Eventos eSocial',
        valor: eventos.length,
        detalhe: `${statusEventos.ACEITO} aceito(s) · ${statusEventos.REJEITADO} rejeitado(s)`,
        variant: statusEventos.REJEITADO ? 'danger' : undefined,
        href: '#/esocial',
      })}
    </div>

    <div class="row g-4">
      <div class="col-lg-7">
        ${cardTabela(
          'Pendências de aptidão (NR-07)',
          table({
            colunas: ['Colaborador', 'Situação', 'Motivo'],
            linhas: pendencias.map((item) => linhaPendenciaAptidao(item.colaborador, item.avaliacao)),
            vazio: 'Nenhuma pendência de aptidão entre os colaboradores ativos.',
          }),
          '<a class="btn btn-sm btn-outline-primary" href="#/colaboradores">Ver todos</a>',
        )}
      </div>

      <div class="col-lg-5">
        ${cardTabela(
          'Últimos eventos eSocial',
          linhasEventosRecentes.length
            ? table({
                colunas: ['Evento', 'Status', 'Retorno', 'Criado'],
                linhas: linhasEventosRecentes,
                vazio: '',
              })
            : emptyState('Nenhum evento gerado até agora.'),
          '<a class="btn btn-sm btn-outline-primary" href="#/esocial">Acompanhar</a>',
        )}
      </div>

      <div class="col-lg-6">
        ${cardTabela(
          'CATs a comunicar',
          table({
            colunas: ['Acidente', 'Prazo legal'],
            linhas: acidentesSemCat.slice(0, 5).map((acidente) => {
              const expirado = acidenteService.prazoExpirado(acidente);
              return `
                <tr>
                  <td>
                    <a href="#/acidentes" class="fw-semibold">${esc(formatDate(acidente.dataAcidente))}</a>
                    <div class="text-muted small">${esc(acidente.localAcidente)}</div>
                  </td>
                  <td>${badge(expirado ? 'Prazo expirado' : 'Dentro do prazo', expirado ? 'danger' : 'success')}</td>
                </tr>
              `;
            }),
            vazio: 'Todos os acidentes registrados já têm evento S-2210 gerado.',
          }),
          '<a class="btn btn-sm btn-outline-primary" href="#/acidentes">Registrar CAT</a>',
        )}
      </div>

      <div class="col-lg-6">
        ${cardTabela(
          'ASOs sem evento S-2220',
          table({
            colunas: ['ASO', 'Data do exame'],
            linhas: asosSemEvento.slice(0, 5).map(
              (aso) => `
                <tr>
                  <td>
                    <a href="#/colaboradores/${esc(aso.colaboradorId)}" class="fw-semibold">${esc(aso.medico)}</a>
                    <div class="text-muted small">CRM ${esc(aso.crm)}</div>
                  </td>
                  <td class="text-nowrap">${esc(formatDate(aso.dataExame))}</td>
                </tr>
              `,
            ),
            vazio: 'Todos os ASOs registrados já têm evento gerado.',
          }),
          '<a class="btn btn-sm btn-outline-primary" href="#/asos">Ver ASOs</a>',
        )}
      </div>
    </div>
  `;
};
