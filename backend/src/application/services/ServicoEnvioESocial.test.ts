import type { EventoESocial } from '../../domain/entities/EventoESocial.js';
import { AppError } from '../../domain/errors/AppError.js';
import { ValidadorSchemaS12 } from '../../infrastructure/esocial/ValidadorSchemaS12.js';
import type {
  IClienteESocial,
  RequisicaoEnvio,
  RespostaESocial,
} from '../ports/IClienteESocial.js';
import { MontadorXMLeSocial } from './MontadorXMLeSocial.js';
import { ServicoEnvioESocial } from './ServicoEnvioESocial.js';
import {
  AcidenteRepositoryFake,
  AsoRepositoryFake,
  ColaboradorRepositoryFake,
  EmpresaRepositoryFake,
  EventoRepositoryFake,
  RiscoRepositoryFake,
  TENANT_A,
  TENANT_B,
  acidenteA,
  asoA,
  colaboradorA,
  empresaA,
  riscoA,
} from './__fixtures__/esocial.js';

/** Cliente controlável: permite encenar aceite e rejeição sem rede. */
class ClienteControlavel implements IClienteESocial {
  readonly chamadas: RequisicaoEnvio[] = [];
  constructor(private resposta: RespostaESocial) {}

  responder(resposta: RespostaESocial): void {
    this.resposta = resposta;
  }

  async enviarEvento(requisicao: RequisicaoEnvio): Promise<RespostaESocial> {
    this.chamadas.push(requisicao);
    return this.resposta;
  }
}

const ACEITE: RespostaESocial = { aceito: true, protocolo: '1.2.20260310.abc123' };
const REJEICAO: RespostaESocial = {
  aceito: false,
  codigoErro: '301',
  mensagemErro: 'CPF do trabalhador não consta no cadastro.',
};

const montarCenario = (resposta: RespostaESocial = ACEITE) => {
  const eventoRepository = new EventoRepositoryFake();
  const cliente = new ClienteControlavel(resposta);

  const servico = new ServicoEnvioESocial(
    eventoRepository,
    new AsoRepositoryFake([asoA]),
    new RiscoRepositoryFake([riscoA]),
    new AcidenteRepositoryFake([acidenteA]),
    new ColaboradorRepositoryFake([colaboradorA]),
    new EmpresaRepositoryFake([empresaA]),
    new MontadorXMLeSocial(new ValidadorSchemaS12()),
    cliente,
    'PRODUCAO_RESTRITA',
  );

  return { servico, cliente, eventoRepository };
};

describe('ServicoEnvioESocial — H3.1 (geração)', () => {
  it('cria o evento em PENDENTE, vinculado ao ASO de origem', async () => {
    const { servico } = montarCenario();

    const evento = await servico.gerarDeAso(asoA.id, TENANT_A);

    expect(evento.status).toBe('PENDENTE');
    expect(evento.tipoEvento).toBe('S_2220');
    expect(evento.asoId).toBe(asoA.id);
    expect(evento.riscoId).toBeNull();
    expect(evento.protocolo).toBeNull();
  });

  it('cria o S-2240 vinculado ao risco e ao trabalhador exposto', async () => {
    const { servico } = montarCenario();

    const evento = await servico.gerarDeRisco(
      { riscoId: riscoA.id, colaboradorId: colaboradorA.id },
      TENANT_A,
    );

    expect(evento.tipoEvento).toBe('S_2240');
    expect(evento.riscoId).toBe(riscoA.id);
    expect(evento.colaboradorId).toBe(colaboradorA.id);
  });

  it('cria o S-2210 vinculado ao acidente de origem', async () => {
    const { servico } = montarCenario();

    const evento = await servico.gerarDeAcidente(acidenteA.id, TENANT_A);

    expect(evento.status).toBe('PENDENTE');
    expect(evento.tipoEvento).toBe('S_2210');
    expect(evento.acidenteId).toBe(acidenteA.id);
    expect(evento.asoId).toBeNull();
    expect(evento.riscoId).toBeNull();
  });

  it('não gera evento a partir de ASO de outro tenant (H1.3)', async () => {
    const { servico } = montarCenario();

    await expect(servico.gerarDeAso(asoA.id, TENANT_B)).rejects.toThrow(/não encontrado/);
  });

  it('não gera CAT a partir de acidente de outro tenant (H1.3)', async () => {
    const { servico } = montarCenario();

    await expect(servico.gerarDeAcidente(acidenteA.id, TENANT_B)).rejects.toThrow(
      /não encontrado/,
    );
  });
});

describe('ServicoEnvioESocial — H3.4 (reenvio da CAT)', () => {
  it('remonta o XML do S-2210 a partir do acidente corrigido', async () => {
    const { servico, cliente } = montarCenario(REJEICAO);
    const criado = await servico.gerarDeAcidente(acidenteA.id, TENANT_A);
    await servico.enviar(criado.id, TENANT_A);

    cliente.responder(ACEITE);
    const reenviado = await servico.reenviar(criado.id, TENANT_A);

    expect(reenviado.status).toBe('ACEITO');
    expect(reenviado.acidenteId).toBe(acidenteA.id);
    expect(reenviado.tentativas).toBe(2);
    expect(cliente.chamadas.at(-1)?.xml).toContain('evtCAT');
  });
});

describe('ServicoEnvioESocial — H3.3 (transmissão e retorno)', () => {
  it('percorre PENDENTE → ENVIADO → ACEITO e registra o protocolo', async () => {
    const { servico, cliente } = montarCenario(ACEITE);
    const criado = await servico.gerarDeAso(asoA.id, TENANT_A);

    const enviado = await servico.enviar(criado.id, TENANT_A);

    expect(enviado.status).toBe('ACEITO');
    expect(enviado.protocolo).toBe('1.2.20260310.abc123');
    expect(enviado.dataEnvio).toBeInstanceOf(Date);
    expect(enviado.tentativas).toBe(1);
    expect(cliente.chamadas).toHaveLength(1);
    expect(cliente.chamadas[0]?.ambiente).toBe('PRODUCAO_RESTRITA');
  });

  it('registra a mensagem de erro quando o evento é rejeitado', async () => {
    const { servico } = montarCenario(REJEICAO);
    const criado = await servico.gerarDeAso(asoA.id, TENANT_A);

    const rejeitado = await servico.enviar(criado.id, TENANT_A);

    expect(rejeitado.status).toBe('REJEITADO');
    expect(rejeitado.protocolo).toBeNull();
    expect(rejeitado.mensagemErro).toContain('301');
    expect(rejeitado.mensagemErro).toContain('CPF do trabalhador');
  });

  it('recusa reenvio de um evento já ACEITO', async () => {
    const { servico } = montarCenario(ACEITE);
    const criado = await servico.gerarDeAso(asoA.id, TENANT_A);
    await servico.enviar(criado.id, TENANT_A);

    await expect(servico.enviar(criado.id, TENANT_A)).rejects.toThrow(/Transição inválida/);
  });
});

describe('ServicoEnvioESocial — H3.4 (reenvio após correção)', () => {
  it('reenvia apenas eventos REJEITADOS, preservando o vínculo de origem', async () => {
    const { servico, cliente } = montarCenario(REJEICAO);
    const criado = await servico.gerarDeAso(asoA.id, TENANT_A);
    const rejeitado = await servico.enviar(criado.id, TENANT_A);
    expect(rejeitado.status).toBe('REJEITADO');

    // O dado foi corrigido no eSocial; agora o retorno é de aceite.
    cliente.responder(ACEITE);
    const reenviado = await servico.reenviar(criado.id, TENANT_A);

    expect(reenviado.id).toBe(criado.id);
    expect(reenviado.status).toBe('ACEITO');
    expect(reenviado.asoId).toBe(asoA.id);
    expect(reenviado.protocolo).toBe('1.2.20260310.abc123');
    expect(reenviado.tentativas).toBe(2);
    expect(reenviado.mensagemErro).toBeNull();
  });

  it('recusa reenvio de evento PENDENTE', async () => {
    const { servico } = montarCenario();
    const criado = await servico.gerarDeAso(asoA.id, TENANT_A);

    await expect(servico.reenviar(criado.id, TENANT_A)).rejects.toThrow(
      /Somente eventos REJEITADOS/,
    );
  });

  it('recusa reenvio de evento ACEITO com status 409', async () => {
    const { servico } = montarCenario(ACEITE);
    const criado = await servico.gerarDeAso(asoA.id, TENANT_A);
    await servico.enviar(criado.id, TENANT_A);

    try {
      await servico.reenviar(criado.id, TENANT_A);
      throw new Error('deveria ter lançado');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(409);
    }
  });
});

describe('ServicoEnvioESocial — isolamento entre empresas', () => {
  it('não lista nem devolve eventos de outro tenant', async () => {
    const { servico } = montarCenario();
    const criado: EventoESocial = await servico.gerarDeAso(asoA.id, TENANT_A);

    await expect(servico.list(TENANT_B)).resolves.toEqual([]);
    await expect(servico.getById(criado.id, TENANT_B)).rejects.toThrow(/não encontrado/);
  });
});
