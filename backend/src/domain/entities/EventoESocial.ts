export type TipoEventoESocial = 'S_2210' | 'S_2220' | 'S_2240';

export type StatusEventoESocial = 'PENDENTE' | 'ENVIADO' | 'ACEITO' | 'REJEITADO';

export type AmbienteESocial = 'PRODUCAO' | 'PRODUCAO_RESTRITA';

/** Código do campo `tpAmb` no leiaute eSocial: 1 = produção, 2 = produção restrita. */
export const codigoAmbiente = (ambiente: AmbienteESocial): '1' | '2' =>
  ambiente === 'PRODUCAO' ? '1' : '2';

/** Evento eSocial: guarda apenas estado; montagem e envio ficam em serviços dedicados (SRP). */
export interface EventoESocial {
  id: string;
  empresaId: string;
  colaboradorId: string | null;
  asoId: string | null;
  riscoId: string | null;
  tipoEvento: TipoEventoESocial;
  payloadXml: string;
  status: StatusEventoESocial;
  ambiente: AmbienteESocial;
  protocolo: string | null;
  mensagemErro: string | null;
  dataEnvio: Date | null;
  tentativas: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventoESocialData {
  empresaId: string;
  colaboradorId: string | null;
  asoId: string | null;
  riscoId: string | null;
  tipoEvento: TipoEventoESocial;
  payloadXml: string;
  ambiente: AmbienteESocial;
}

export interface UpdateEventoESocialData {
  payloadXml?: string;
  status?: StatusEventoESocial;
  ambiente?: AmbienteESocial;
  protocolo?: string | null;
  mensagemErro?: string | null;
  dataEnvio?: Date | null;
  tentativas?: number;
}

/**
 * Transições permitidas do ciclo de vida do evento (H3.3 e H3.4).
 * Um evento ACEITO é terminal; um REJEITADO só volta a PENDENTE via reenvio.
 */
const TRANSICOES: Record<StatusEventoESocial, readonly StatusEventoESocial[]> = {
  PENDENTE: ['ENVIADO'],
  ENVIADO: ['ACEITO', 'REJEITADO'],
  ACEITO: [],
  REJEITADO: ['PENDENTE'],
};

export const podeTransicionar = (
  de: StatusEventoESocial,
  para: StatusEventoESocial,
): boolean => TRANSICOES[de].includes(para);
