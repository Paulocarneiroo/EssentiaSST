import type {
  IClienteESocial,
  RequisicaoEnvio,
  RespostaESocial,
} from '../../application/ports/IClienteESocial.js';

/**
 * `ClienteWSeSocialGovBr` — implementação real contra os webservices do eSocial.
 *
 * NÃO IMPLEMENTADA. Exige, além do transporte SOAP:
 *   1. certificado digital ICP-Brasil A1/A3 do empregador (ou procurador);
 *   2. assinatura XMLDSig (RSA-SHA256, transform enveloped + c14n) de cada evento;
 *   3. envio em lote via `EnviarLoteEventos` e consulta assíncrona do resultado
 *      via `ConsultarLoteEventos` — o retorno do envio traz apenas o protocolo.
 *
 * Está aqui para deixar explícito que a troca de cliente é uma questão de
 * infraestrutura: `ServicoEnvioESocial` depende apenas de `IClienteESocial`,
 * e nada na regra de negócio muda quando esta classe for concluída.
 */
export class ClienteWSeSocialGovBr implements IClienteESocial {
  async enviarEvento(_requisicao: RequisicaoEnvio): Promise<RespostaESocial> {
    throw new Error(
      'ClienteWSeSocialGovBr ainda não implementado: requer certificado ICP-Brasil e assinatura XMLDSig. ' +
        'Use ESOCIAL_CLIENTE=sandbox enquanto a integração real não está disponível.',
    );
  }
}
