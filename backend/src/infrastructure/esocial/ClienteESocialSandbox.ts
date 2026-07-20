import { createHash } from 'node:crypto';
import type {
  IClienteESocial,
  RequisicaoEnvio,
  RespostaESocial,
} from '../../application/ports/IClienteESocial.js';
import { logger } from '../../utils/logger.js';

/**
 * `ClienteESocialSandbox` — simula o webservice do eSocial de forma determinística,
 * sem tráfego de rede nem certificado ICP-Brasil.
 *
 * O aceite é derivado de um hash do XML: o mesmo evento produz sempre a mesma
 * resposta, o que torna o comportamento reprodutível em testes e demonstrações.
 * A troca por `ClienteWSeSocialGovBr` não altera nenhuma regra de negócio (DIP).
 */
export class ClienteESocialSandbox implements IClienteESocial {
  /** Proporção aproximada de rejeições simuladas (0 = sempre aceita). */
  constructor(private readonly taxaRejeicao = 0) {}

  async enviarEvento(requisicao: RequisicaoEnvio): Promise<RespostaESocial> {
    const digest = createHash('sha256').update(requisicao.xml).digest('hex');

    logger.info(
      `[eSocial:sandbox] ${requisicao.tipoEvento} evento=${requisicao.eventoId} ambiente=${requisicao.ambiente}`,
    );

    // Byte inicial do digest como sorteio estável entre 0 e 1.
    const sorteio = parseInt(digest.slice(0, 2), 16) / 255;
    if (sorteio < this.taxaRejeicao) {
      return {
        aceito: false,
        codigoErro: '301',
        mensagemErro: 'Erro de preenchimento simulado pelo ambiente de homologação.',
      };
    }

    return {
      aceito: true,
      // Formato do recibo eSocial: 1.x.aaaammdd.nnnnnnnnnnnnnnn
      protocolo: `1.2.${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${digest.slice(0, 15)}`,
    };
  }
}
