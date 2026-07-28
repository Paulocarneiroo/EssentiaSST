import { acidenteService } from '../../services/acidenteService.js';
import { asoService } from '../../services/asoService.js';
import { colaboradorService } from '../../services/colaboradorService.js';
import { eventoService } from '../../services/eventoService.js';
import { formatCpf, formatDate, formatDateTime, formatHora } from '../../services/format.js';
import {
  LABEL_RESULTADO_ASO,
  LABEL_SITUACAO_APTIDAO,
  LABEL_STATUS_EVENTO,
  LABEL_TIPO_ACIDENTE,
  LABEL_TIPO_EXAME,
  SIGLA_TIPO_EVENTO,
  VARIANT_RESULTADO_ASO,
  VARIANT_SITUACAO_APTIDAO,
  VARIANT_STATUS_EVENTO,
} from '../../services/labels.js';
import type { Acidente } from '../../types/acidente.js';
import type { Aso } from '../../types/aso.js';
import type { EventoESocial } from '../../types/evento.js';
import { badge, card, cardTabela, definitionList, pageHeader, table } from '../components.js';
import { bindAction } from '../forms.js';
import { esc } from '../html.js';
import { showToast, toastErro } from '../toast.js';
import { abrirModalAcidente, celulaCatDoAcidente } from './acidenteView.js';
import { abrirModalAso, celulaEventoDoAso } from './asoView.js';
import { abrirModalColaborador, abrirModalDesligamento } from './colaboradorView.js';

const cartaoAptidao = (
  situacao: string,
  variante: Parameters<typeof badge>[1],
  itens: { termo: string; valor: string }[],
  motivo: string,
): string =>
  card(`
    <div class="d-flex justify-content-between align-items-start mb-3">
      <h2 class="h6 mb-0">Aptidão para a função</h2>
      ${badge(situacao, variante)}
    </div>
    <p class="text-muted small">${esc(motivo)}</p>
    ${definitionList(itens)}
  `);

export const renderColaboradorDetalheView = async (
  root: HTMLElement,
  params: Record<string, string>,
): Promise<void> => {
  const { id } = params;

  const carregar = async () => {
    const [colaborador, asos, acidentes, eventos] = await Promise.all([
      colaboradorService.buscar(id),
      asoService.listar(id),
      acidenteService.listar(id),
      eventoService.listar(),
    ]);
    const aptidao = await colaboradorService.aptidao(id);
    return {
      colaborador,
      asos,
      acidentes,
      eventos: eventos.filter((evento) => evento.colaboradorId === id),
      aptidao,
    };
  };

  const desenhar = async (): Promise<void> => {
    const { colaborador, asos, acidentes, eventos, aptidao } = await carregar();
    const ativo = colaboradorService.ativo(colaborador);

    const eventoDoAso = (asoId: string): EventoESocial | undefined =>
      eventos.find((evento) => evento.asoId === asoId);
    const eventoDoAcidente = (acidenteId: string): EventoESocial | undefined =>
      eventos.find((evento) => evento.acidenteId === acidenteId);

    const linhaAso = (aso: Aso): string => `
      <tr>
        <td class="text-nowrap">${esc(formatDate(aso.dataExame))}</td>
        <td>${esc(LABEL_TIPO_EXAME[aso.tipoExame])}</td>
        <td>${badge(LABEL_RESULTADO_ASO[aso.resultado], VARIANT_RESULTADO_ASO[aso.resultado])}</td>
        <td>
          ${esc(aso.medico)}
          <div class="text-muted small">CRM ${esc(aso.crm)}</div>
        </td>
        <td>${celulaEventoDoAso(aso, eventoDoAso(aso.id))}</td>
      </tr>
    `;

    const linhaAcidente = (acidente: Acidente): string => `
      <tr>
        <td class="text-nowrap">
          ${esc(formatDate(acidente.dataAcidente))}
          <div class="text-muted small">${esc(formatHora(acidente.horaAcidente))}</div>
        </td>
        <td>
          ${esc(LABEL_TIPO_ACIDENTE[acidente.tipoAcidente])}
          <div class="text-muted small">${esc(acidente.localAcidente)}</div>
        </td>
        <td>${acidenteService.prazoExpirado(acidente) ? badge('Prazo expirado', 'danger') : badge('No prazo', 'success')}</td>
        <td>${celulaCatDoAcidente(acidente, eventoDoAcidente(acidente.id))}</td>
      </tr>
    `;

    const linhaEvento = (evento: EventoESocial): string => `
      <tr>
        <td class="mono">${esc(SIGLA_TIPO_EVENTO[evento.tipoEvento])}</td>
        <td>${badge(LABEL_STATUS_EVENTO[evento.status], VARIANT_STATUS_EVENTO[evento.status])}</td>
        <td class="text-muted small">${esc(evento.protocolo ?? evento.mensagemErro ?? '—')}</td>
        <td class="text-nowrap text-muted small">${esc(formatDateTime(evento.dataEnvio))}</td>
      </tr>
    `;

    root.innerHTML = `
      ${pageHeader({
        titulo: colaborador.nome,
        subtitulo: `${colaborador.cargo} · CPF ${formatCpf(colaborador.cpf)}`,
        voltar: { href: '#/colaboradores', label: 'Colaboradores' },
        acoes: `
          <button type="button" class="btn btn-outline-secondary" data-action="editar">Editar</button>
          ${
            ativo
              ? '<button type="button" class="btn btn-outline-warning ms-2" data-action="desligar">Desligar</button>'
              : ''
          }
        `,
      })}

      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          ${card(`
            <h2 class="h6 mb-3">Dados cadastrais</h2>
            ${definitionList([
              { termo: 'CPF', valor: esc(formatCpf(colaborador.cpf)) },
              { termo: 'Cargo', valor: esc(colaborador.cargo) },
              { termo: 'Nascimento', valor: esc(formatDate(colaborador.dataNascimento)) },
              { termo: 'Admissão', valor: esc(formatDate(colaborador.dataAdmissao)) },
              {
                termo: 'Vínculo',
                valor: ativo
                  ? badge('Ativo', 'success')
                  : badge(`Desligado em ${formatDate(colaborador.dataDemissao)}`, 'dark'),
              },
            ])}
          `)}
        </div>
        <div class="col-lg-6">
          ${cartaoAptidao(
            LABEL_SITUACAO_APTIDAO[aptidao.situacao],
            VARIANT_SITUACAO_APTIDAO[aptidao.situacao],
            [
              {
                termo: 'ASO vigente',
                valor: aptidao.asoVigente
                  ? `${esc(LABEL_TIPO_EXAME[aptidao.asoVigente.tipoExame])} · ${esc(formatDate(aptidao.asoVigente.dataExame))}`
                  : '—',
              },
              {
                termo: 'Periodicidade (NR-07)',
                valor: aptidao.periodicidadeMeses ? `${aptidao.periodicidadeMeses} meses` : '—',
              },
              { termo: 'Próximo vencimento', valor: esc(formatDate(aptidao.proximoVencimento)) },
              {
                termo: 'Dias para vencer',
                valor:
                  aptidao.diasParaVencimento === null
                    ? '—'
                    : aptidao.diasParaVencimento < 0
                      ? badge(`${Math.abs(aptidao.diasParaVencimento)} dias em atraso`, 'danger')
                      : String(aptidao.diasParaVencimento),
              },
            ],
            aptidao.motivo,
          )}
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-7">
          ${cardTabela(
            'Histórico de ASOs',
            table({
              colunas: ['Data', 'Tipo', 'Resultado', 'Médico', 'eSocial'],
              linhas: asos.map(linhaAso),
              vazio: 'Nenhum ASO registrado para este trabalhador.',
            }),
            '<button type="button" class="btn btn-sm btn-primary" data-action="novo-aso">Registrar ASO</button>',
          )}
        </div>

        <div class="col-lg-5">
          ${cardTabela(
            'Eventos eSocial',
            table({
              colunas: ['Evento', 'Status', 'Retorno', 'Envio'],
              linhas: eventos.map(linhaEvento),
              vazio: 'Nenhum evento gerado para este trabalhador.',
            }),
            '<a class="btn btn-sm btn-outline-primary" href="#/esocial">Acompanhar</a>',
          )}
        </div>

        <div class="col-12">
          ${cardTabela(
            'Acidentes de trabalho',
            table({
              colunas: ['Ocorrência', 'Natureza', 'Comunicação', 'eSocial'],
              linhas: acidentes.map(linhaAcidente),
              vazio: 'Nenhum acidente registrado para este trabalhador.',
            }),
            '<button type="button" class="btn btn-sm btn-outline-danger" data-action="novo-acidente">Registrar acidente</button>',
          )}
        </div>
      </div>
    `;

    bindAction(root, 'editar', () => abrirModalColaborador(colaborador, desenhar));
    bindAction(root, 'desligar', () => abrirModalDesligamento(colaborador, desenhar));

    bindAction(root, 'novo-aso', () =>
      abrirModalAso({ colaboradores: [colaborador], colaboradorId: colaborador.id, aoConcluir: desenhar }),
    );

    bindAction(root, 'novo-acidente', () =>
      abrirModalAcidente({
        colaboradores: [colaborador],
        colaboradorId: colaborador.id,
        aoConcluir: desenhar,
      }),
    );

    bindAction(root, 'gerar-evento', async (elemento) => {
      const botao = elemento as HTMLButtonElement;
      botao.disabled = true;
      try {
        await eventoService.gerarDeAso(elemento.dataset.id ?? '');
        showToast('Evento S-2220 gerado e validado contra o schema.');
        await desenhar();
      } catch (error) {
        botao.disabled = false;
        toastErro(error, 'Não foi possível gerar o evento.');
      }
    });

    bindAction(root, 'gerar-cat', async (elemento) => {
      const botao = elemento as HTMLButtonElement;
      botao.disabled = true;
      try {
        await eventoService.gerarDeAcidente(elemento.dataset.id ?? '');
        showToast('CAT (S-2210) gerada e validada contra o schema.');
        await desenhar();
      } catch (error) {
        botao.disabled = false;
        toastErro(error, 'Não foi possível gerar a CAT.');
      }
    });
  };

  await desenhar();
};
