import type { AmbienteESocial, TipoEventoESocial } from '../../domain/entities/EventoESocial.js';

export interface RequisicaoEnvio {
  eventoId: string;
  tipoEvento: TipoEventoESocial;
  xml: string;
  ambiente: AmbienteESocial;
}

/** Retorno do webservice, já normalizado — o serviço de negócio não vê SOAP/HTTP. */
export interface RespostaESocial {
  aceito: boolean;
  /** Protocolo de recebimento, presente quando aceito. */
  protocolo?: string;
  /** Código e descrição da ocorrência, presentes quando rejeitado. */
  codigoErro?: string;
  mensagemErro?: string;
}

/**
 * `IClienteESocial` do modelo de domínio: permite trocar o destino do envio
 * (produção, produção restrita, mock de testes) sem tocar na regra de negócio.
 */
export interface IClienteESocial {
  enviarEvento(requisicao: RequisicaoEnvio): Promise<RespostaESocial>;
}
