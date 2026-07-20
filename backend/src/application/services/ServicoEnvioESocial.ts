import type { Empresa } from '../../domain/entities/Empresa.js';
import {
  podeTransicionar,
  type AmbienteESocial,
  type EventoESocial,
  type StatusEventoESocial,
} from '../../domain/entities/EventoESocial.js';
import { ConflictError, NotFoundError } from '../../domain/errors/AppError.js';
import type { IAsoRepository } from '../ports/IAsoRepository.js';
import type { IClienteESocial, RespostaESocial } from '../ports/IClienteESocial.js';
import type { IColaboradorRepository } from '../ports/IColaboradorRepository.js';
import type { IEmpresaRepository } from '../ports/IEmpresaRepository.js';
import type { IEventoESocialRepository } from '../ports/IEventoESocialRepository.js';
import type { IRiscoRepository } from '../ports/IRiscoRepository.js';
import type { MontadorXMLeSocial } from './MontadorXMLeSocial.js';

export interface GerarDeRiscoData {
  riscoId: string;
  /** S-2240 declara a exposição de um trabalhador específico ao agente. */
  colaboradorId: string;
}

/**
 * `ServicoEnvioESocial` — orquestra geração, envio, retorno e reenvio de eventos.
 *
 * SRP: muda apenas quando mudam as regras de negócio de envio.
 * DIP: depende de `IClienteESocial` e do montador, não do transporte concreto.
 */
export class ServicoEnvioESocial {
  // Depende apenas da fatia que realmente usa (ISP): a busca por id.
  constructor(
    private readonly eventoRepository: IEventoESocialRepository,
    private readonly asoRepository: Pick<IAsoRepository, 'findById'>,
    private readonly riscoRepository: Pick<IRiscoRepository, 'findById'>,
    private readonly colaboradorRepository: Pick<IColaboradorRepository, 'findById'>,
    private readonly empresaRepository: Pick<IEmpresaRepository, 'findById'>,
    private readonly montador: MontadorXMLeSocial,
    private readonly cliente: IClienteESocial,
    private readonly ambiente: AmbienteESocial,
  ) {}

  async list(tenantId: string): Promise<EventoESocial[]> {
    return this.eventoRepository.findAll(tenantId);
  }

  async getById(id: string, tenantId: string): Promise<EventoESocial> {
    const evento = await this.eventoRepository.findById(id);
    if (!evento || evento.empresaId !== tenantId) {
      throw new NotFoundError(`Evento com id "${id}" não encontrado.`);
    }
    return evento;
  }

  /** H3.1 — gera o S-2220 a partir de um ASO já cadastrado. */
  async gerarDeAso(asoId: string, tenantId: string): Promise<EventoESocial> {
    const { empresa, colaborador, aso } = await this.carregarContextoAso(asoId, tenantId);

    const { tipoEvento, xml } = this.montador.montarDeAso({
      empresa,
      colaborador,
      aso,
      ambiente: this.ambiente,
    });

    return this.eventoRepository.create({
      empresaId: tenantId,
      colaboradorId: colaborador.id,
      asoId: aso.id,
      riscoId: null,
      tipoEvento,
      payloadXml: xml,
      ambiente: this.ambiente,
    });
  }

  /** H3.1 — gera o S-2240 a partir de um risco do PGR e do trabalhador exposto. */
  async gerarDeRisco(data: GerarDeRiscoData, tenantId: string): Promise<EventoESocial> {
    const { empresa, colaborador, risco } = await this.carregarContextoRisco(data, tenantId);

    const { tipoEvento, xml } = this.montador.montarDeRisco({
      empresa,
      colaborador,
      risco,
      ambiente: this.ambiente,
    });

    return this.eventoRepository.create({
      empresaId: tenantId,
      colaboradorId: colaborador.id,
      asoId: null,
      riscoId: risco.id,
      tipoEvento,
      payloadXml: xml,
      ambiente: this.ambiente,
    });
  }

  /** H3.3 — transmite o evento e registra o retorno (protocolo ou erro). */
  async enviar(id: string, tenantId: string): Promise<EventoESocial> {
    const evento = await this.getById(id, tenantId);
    this.assertTransicao(evento, 'ENVIADO');

    const enviado = await this.persistir(evento.id, {
      status: 'ENVIADO',
      dataEnvio: new Date(),
      tentativas: evento.tentativas + 1,
      mensagemErro: null,
    });

    const resposta = await this.cliente.enviarEvento({
      eventoId: enviado.id,
      tipoEvento: enviado.tipoEvento,
      xml: enviado.payloadXml,
      ambiente: enviado.ambiente,
    });

    return this.processarRetorno(enviado, resposta);
  }

  /** H3.3 — interpreta a resposta do webservice e conclui o ciclo do evento. */
  async processarRetorno(
    evento: EventoESocial,
    resposta: RespostaESocial,
  ): Promise<EventoESocial> {
    const proximo: StatusEventoESocial = resposta.aceito ? 'ACEITO' : 'REJEITADO';
    this.assertTransicao(evento, proximo);

    if (resposta.aceito) {
      return this.persistir(evento.id, {
        status: 'ACEITO',
        protocolo: resposta.protocolo ?? null,
        mensagemErro: null,
      });
    }

    const mensagem = [resposta.codigoErro, resposta.mensagemErro].filter(Boolean).join(' — ');
    return this.persistir(evento.id, {
      status: 'REJEITADO',
      mensagemErro: mensagem || 'Evento rejeitado sem detalhamento.',
    });
  }

  /**
   * H3.4 — reenvia um evento rejeitado, remontando o XML a partir do fato de
   * origem (que pode ter sido corrigido) e preservando o vínculo original.
   */
  async reenviar(id: string, tenantId: string): Promise<EventoESocial> {
    const evento = await this.getById(id, tenantId);
    if (evento.status !== 'REJEITADO') {
      throw new ConflictError(
        `Somente eventos REJEITADOS podem ser reenviados. Status atual: ${evento.status}.`,
      );
    }

    const xml = await this.remontarPayload(evento, tenantId);

    // REJEITADO → PENDENTE devolve o evento ao início do ciclo, sem recriá-lo.
    await this.persistir(evento.id, { status: 'PENDENTE', payloadXml: xml, mensagemErro: null });

    return this.enviar(evento.id, tenantId);
  }

  /** Remonta o payload a partir do ASO ou risco vinculado ao evento. */
  private async remontarPayload(evento: EventoESocial, tenantId: string): Promise<string> {
    if (evento.asoId) {
      const { empresa, colaborador, aso } = await this.carregarContextoAso(evento.asoId, tenantId);
      return this.montador.montarDeAso({ empresa, colaborador, aso, ambiente: evento.ambiente })
        .xml;
    }

    if (evento.riscoId && evento.colaboradorId) {
      const { empresa, colaborador, risco } = await this.carregarContextoRisco(
        { riscoId: evento.riscoId, colaboradorId: evento.colaboradorId },
        tenantId,
      );
      return this.montador.montarDeRisco({ empresa, colaborador, risco, ambiente: evento.ambiente })
        .xml;
    }

    throw new ConflictError(
      'Evento não possui fato de origem vinculado; não é possível remontar o XML.',
    );
  }

  private async carregarContextoAso(asoId: string, tenantId: string) {
    const aso = await this.asoRepository.findById(asoId);
    if (!aso) {
      throw new NotFoundError(`ASO com id "${asoId}" não encontrado.`);
    }

    const colaborador = await this.colaboradorRepository.findById(aso.colaboradorId);
    if (!colaborador || colaborador.empresaId !== tenantId) {
      throw new NotFoundError(`ASO com id "${asoId}" não encontrado.`);
    }

    return { empresa: await this.carregarEmpresa(tenantId), colaborador, aso };
  }

  private async carregarContextoRisco(data: GerarDeRiscoData, tenantId: string) {
    const risco = await this.riscoRepository.findById(data.riscoId);
    if (!risco || risco.empresaId !== tenantId) {
      throw new NotFoundError(`Risco com id "${data.riscoId}" não encontrado.`);
    }

    const colaborador = await this.colaboradorRepository.findById(data.colaboradorId);
    if (!colaborador || colaborador.empresaId !== tenantId) {
      throw new NotFoundError(`Colaborador com id "${data.colaboradorId}" não encontrado.`);
    }

    return { empresa: await this.carregarEmpresa(tenantId), colaborador, risco };
  }

  private async carregarEmpresa(tenantId: string): Promise<Empresa> {
    const empresa = await this.empresaRepository.findById(tenantId);
    if (!empresa) {
      throw new NotFoundError(`Empresa com id "${tenantId}" não encontrada.`);
    }
    return empresa;
  }

  private assertTransicao(evento: EventoESocial, destino: StatusEventoESocial): void {
    if (!podeTransicionar(evento.status, destino)) {
      throw new ConflictError(
        `Transição inválida: evento em ${evento.status} não pode ir para ${destino}.`,
      );
    }
  }

  private async persistir(
    id: string,
    patch: Parameters<IEventoESocialRepository['update']>[1],
  ): Promise<EventoESocial> {
    const atualizado = await this.eventoRepository.update(id, patch);
    if (!atualizado) {
      throw new NotFoundError(`Evento com id "${id}" não encontrado.`);
    }
    return atualizado;
  }
}
