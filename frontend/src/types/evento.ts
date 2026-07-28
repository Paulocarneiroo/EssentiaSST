export type TipoEventoESocial = 'S_2210' | 'S_2220' | 'S_2240';

export type StatusEventoESocial = 'PENDENTE' | 'ENVIADO' | 'ACEITO' | 'REJEITADO';

export type AmbienteESocial = 'PRODUCAO' | 'PRODUCAO_RESTRITA';

export const STATUS_EVENTO: readonly StatusEventoESocial[] = [
  'PENDENTE',
  'ENVIADO',
  'ACEITO',
  'REJEITADO',
];

export const TIPOS_EVENTO: readonly TipoEventoESocial[] = ['S_2210', 'S_2220', 'S_2240'];

export interface EventoESocial {
  id: string;
  empresaId: string;
  colaboradorId: string | null;
  asoId: string | null;
  riscoId: string | null;
  acidenteId: string | null;
  tipoEvento: TipoEventoESocial;
  payloadXml: string;
  status: StatusEventoESocial;
  ambiente: AmbienteESocial;
  protocolo: string | null;
  mensagemErro: string | null;
  dataEnvio: string | null;
  tentativas: number;
  createdAt: string;
  updatedAt: string;
}
