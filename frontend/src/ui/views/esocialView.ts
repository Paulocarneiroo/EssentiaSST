import { colaboradorService } from '../../services/colaboradorService.js';
import { eventoService } from '../../services/eventoService.js';
import { formatDateTime } from '../../services/format.js';
import {
  LABEL_AMBIENTE,
  LABEL_STATUS_EVENTO,
  LABEL_TIPO_EVENTO,
  SIGLA_TIPO_EVENTO,
  VARIANT_AMBIENTE,
  VARIANT_STATUS_EVENTO,
} from '../../services/labels.js';
import { isAdmin } from '../../state/session.js';
import type { Colaborador } from '../../types/colaborador.js';
import {
  STATUS_EVENTO,
  type EventoESocial,
  type StatusEventoESocial,
} from '../../types/evento.js';
import { alertBox, badge, cardTabela, pageHeader, statCard, table } from '../components.js';
import { bindAction } from '../forms.js';
import { baixarArquivo, esc } from '../html.js';
import { openInfoModal } from '../modal.js';
import { showToast, toastErro } from '../toast.js';

const origem = (evento: EventoESocial): string => {
  if (evento.asoId) return 'ASO (monitoramento da saúde)';
  if (evento.acidenteId) return 'Acidente de trabalho';
  if (evento.riscoId) return 'Risco do PGR';
  return 'Sem fato de origem';
};

const verXml = async (evento: EventoESocial): Promise<void> => {
  const xml = await eventoService.xml(evento.id);
  const arquivo = `${SIGLA_TIPO_EVENTO[evento.tipoEvento]}-${evento.id}.xml`;

  openInfoModal({
    titulo: `XML do evento ${SIGLA_TIPO_EVENTO[evento.tipoEvento]}`,
    tamanho: 'xl',
    corpo: `
      <p class="text-muted small">
        Payload montado pelo backend conforme o leiaute S-1.2 e validado contra o schema antes de ficar apto ao envio.
      </p>
      <pre class="xml-viewer"><code>${esc(xml)}</code></pre>
    `,
    acoes: '<button type="button" class="btn btn-outline-primary" data-role="baixar">Baixar XML</button>',
    onMount: (elemento) => {
      elemento
        .querySelector('[data-role="baixar"]')
        ?.addEventListener('click', () => baixarArquivo(xml, arquivo, 'application/xml'));
    },
  });
};

export const renderESocialView = async (root: HTMLElement): Promise<void> => {
  let [eventos, colaboradores] = await Promise.all([
    eventoService.listar(),
    colaboradorService.listar(),
  ]);

  let filtroStatus: StatusEventoESocial | '' = '';

  const nomePorId = (id: string | null): string => {
    if (!id) return '—';
    const colaborador: Colaborador | undefined = colaboradores.find((item) => item.id === id);
    return colaborador?.nome ?? 'Colaborador removido';
  };

  const recarregar = async (): Promise<void> => {
    [eventos, colaboradores] = await Promise.all([
      eventoService.listar(),
      colaboradorService.listar(),
    ]);
    desenhar();
  };

  const linha = (evento: EventoESocial): string => {
    const retorno = evento.protocolo
      ? `<span class="mono small">${esc(evento.protocolo)}</span>`
      : evento.mensagemErro
        ? `<span class="text-danger small">${esc(evento.mensagemErro)}</span>`
        : '<span class="text-muted small">—</span>';

    const acoes = [
      `<button type="button" class="btn btn-sm btn-outline-secondary" data-action="ver-xml" data-id="${esc(evento.id)}">XML</button>`,
      isAdmin() && eventoService.podeEnviar(evento)
        ? `<button type="button" class="btn btn-sm btn-primary ms-2" data-action="enviar" data-id="${esc(evento.id)}">Enviar</button>`
        : '',
      isAdmin() && eventoService.podeReenviar(evento)
        ? `<button type="button" class="btn btn-sm btn-warning ms-2" data-action="reenviar" data-id="${esc(evento.id)}">Reenviar</button>`
        : '',
    ].join('');

    return `
      <tr>
        <td>
          <span class="fw-semibold mono">${esc(SIGLA_TIPO_EVENTO[evento.tipoEvento])}</span>
          <div class="text-muted small">${esc(origem(evento))}</div>
        </td>
        <td>${esc(nomePorId(evento.colaboradorId))}</td>
        <td>
          ${badge(LABEL_STATUS_EVENTO[evento.status], VARIANT_STATUS_EVENTO[evento.status])}
          ${evento.tentativas > 1 ? `<div class="text-muted small">${evento.tentativas} tentativas</div>` : ''}
        </td>
        <td>${retorno}</td>
        <td>${badge(evento.ambiente === 'PRODUCAO' ? 'Produção' : 'Homologação', VARIANT_AMBIENTE[evento.ambiente])}</td>
        <td class="text-nowrap text-muted small">${esc(formatDateTime(evento.dataEnvio))}</td>
        <td class="text-end text-nowrap">${acoes}</td>
      </tr>
    `;
  };

  const desenhar = (): void => {
    const resumo = root.querySelector('#resumo-eventos');
    const container = root.querySelector('#tabela-eventos');
    if (!resumo || !container) return;

    const contagem = eventoService.contarPorStatus(eventos);

    resumo.innerHTML = `
      ${statCard({ label: 'Pendentes de envio', valor: contagem.PENDENTE })}
      ${statCard({ label: 'Enviados', valor: contagem.ENVIADO, variant: contagem.ENVIADO ? 'info' : undefined })}
      ${statCard({ label: 'Aceitos', valor: contagem.ACEITO, variant: contagem.ACEITO ? 'success' : undefined })}
      ${statCard({ label: 'Rejeitados', valor: contagem.REJEITADO, variant: contagem.REJEITADO ? 'danger' : undefined })}
    `;

    const visiveis = filtroStatus
      ? eventos.filter((evento) => evento.status === filtroStatus)
      : eventos;

    container.innerHTML = table({
      colunas: ['Evento', 'Trabalhador', 'Status', 'Retorno', 'Ambiente', 'Envio', ''],
      linhas: visiveis.map(linha),
      vazio:
        eventos.length === 0
          ? 'Nenhum evento gerado. Gere a partir de um ASO, risco ou acidente já cadastrado.'
          : 'Nenhum evento com o status selecionado.',
    });

    bindAction(container, 'ver-xml', async (elemento) => {
      const evento = eventos.find((item) => item.id === elemento.dataset.id);
      if (!evento) return;
      try {
        await verXml(evento);
      } catch (error) {
        toastErro(error, 'Não foi possível carregar o XML.');
      }
    });

    bindAction(container, 'enviar', async (elemento) => {
      const evento = eventos.find((item) => item.id === elemento.dataset.id);
      if (!evento) return;

      const botao = elemento as HTMLButtonElement;
      botao.disabled = true;
      try {
        const atualizado = await eventoService.enviar(evento.id);
        // O retorno do webservice já vem processado: ACEITO com protocolo ou REJEITADO com erro.
        if (atualizado.status === 'ACEITO') {
          showToast(`Evento aceito. Protocolo ${atualizado.protocolo ?? '—'}.`);
        } else {
          showToast(atualizado.mensagemErro ?? 'Evento rejeitado pelo eSocial.', 'danger');
        }
        await recarregar();
      } catch (error) {
        botao.disabled = false;
        toastErro(error, 'Não foi possível enviar o evento.');
      }
    });

    bindAction(container, 'reenviar', async (elemento) => {
      const evento = eventos.find((item) => item.id === elemento.dataset.id);
      if (!evento) return;

      const botao = elemento as HTMLButtonElement;
      botao.disabled = true;
      try {
        const atualizado = await eventoService.reenviar(evento.id);
        if (atualizado.status === 'ACEITO') {
          showToast(`Reenvio aceito. Protocolo ${atualizado.protocolo ?? '—'}.`);
        } else {
          showToast(atualizado.mensagemErro ?? 'Evento rejeitado novamente.', 'danger');
        }
        await recarregar();
      } catch (error) {
        botao.disabled = false;
        toastErro(error, 'Não foi possível reenviar o evento.');
      }
    });
  };

  const ambienteCorrente = eventos[0]?.ambiente;

  root.innerHTML = `
    ${pageHeader({
      titulo: 'Mensageria eSocial',
      subtitulo: 'Ciclo de vida dos eventos: PENDENTE → ENVIADO → ACEITO ou REJEITADO.',
      acoes: ambienteCorrente
        ? `<span class="ambiente-tag">Destino: ${badge(LABEL_AMBIENTE[ambienteCorrente], VARIANT_AMBIENTE[ambienteCorrente])}</span>`
        : '',
    })}

    <div class="stat-grid mb-4" id="resumo-eventos"></div>

    <div class="mb-4">
      ${alertBox(
        'O ambiente de destino (produção ou produção restrita/homologação) é definido na configuração do servidor. A troca de ambiente altera apenas para onde o evento é transmitido — as regras de negócio, a montagem e a validação do XML permanecem as mesmas.',
        'info',
      )}
    </div>

    <div class="toolbar mb-3">
      <select class="form-select form-select-sm toolbar-search" id="filtro-status" aria-label="Filtrar por status">
        <option value="">Todos os status</option>
        ${STATUS_EVENTO.map((status) => `<option value="${status}">${esc(LABEL_STATUS_EVENTO[status])}</option>`).join('')}
      </select>
      ${
        isAdmin()
          ? ''
          : '<span class="text-muted small align-self-center">Transmitir e reenviar são ações restritas a administradores.</span>'
      }
    </div>

    ${cardTabela('Eventos', '<div id="tabela-eventos"></div>')}

    <p class="text-muted small mt-3 mb-0">
      Tipos suportados: ${Object.values(LABEL_TIPO_EVENTO).map(esc).join(' · ')}.
    </p>
  `;

  desenhar();

  root.querySelector<HTMLSelectElement>('#filtro-status')?.addEventListener('change', (event) => {
    filtroStatus = (event.target as HTMLSelectElement).value as StatusEventoESocial | '';
    desenhar();
  });
};
