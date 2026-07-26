import type { Empresa } from '../../domain/entities/Empresa.js';
import { AppError } from '../../domain/errors/AppError.js';
import { BcryptPasswordHasher } from '../../infrastructure/security/BcryptPasswordHasher.js';
import { AuthService } from './AuthService.js';
import { TENANT_A, TENANT_B, empresaA } from './__fixtures__/esocial.js';
import {
  EmpresaRepositoryMemoria,
  HasherFake,
  TokenServiceFake,
  UsuarioRepositoryMemoria,
} from './__fixtures__/repositorios.js';

const empresaB: Empresa = { ...empresaA, id: TENANT_B, cnpj: '98765432000198' };

const REGISTRO = {
  empresaId: TENANT_A,
  nome: 'Maria Silva',
  email: 'maria@exemplo.com',
  senha: 'senha123',
};

const montarCenario = (hasher = new HasherFake()) => {
  const usuarios = new UsuarioRepositoryMemoria();
  const tokens = new TokenServiceFake();
  const servico = new AuthService(
    usuarios,
    new EmpresaRepositoryMemoria([empresaA, empresaB]),
    hasher,
    tokens,
  );
  return { servico, usuarios, tokens };
};

const capturar = async (acao: Promise<unknown>): Promise<AppError> => {
  try {
    await acao;
  } catch (error) {
    if (error instanceof AppError) {
      return error;
    }
    throw error;
  }
  throw new Error('Esperava um AppError, mas a operação teve sucesso.');
};

describe('AuthService — H2.1 (registro de usuário)', () => {
  it('nunca armazena nem devolve a senha em texto puro', async () => {
    const { servico, usuarios } = montarCenario(new BcryptPasswordHasher());

    const { usuario } = await servico.bootstrap(REGISTRO);

    expect(usuario).not.toHaveProperty('senha');
    expect(usuario).not.toHaveProperty('senhaHash');

    const armazenado = usuarios.usuarios[0];
    expect(armazenado?.senhaHash).not.toBe(REGISTRO.senha);
    expect(armazenado?.senhaHash).toMatch(/^\$2[aby]\$/); // formato bcrypt
  });

  it('recusa e-mail em formato inválido', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(servico.bootstrap({ ...REGISTRO, email: 'maria(arroba)x' }));

    expect(erro.status).toBe(400);
  });

  it('recusa senha abaixo do tamanho mínimo', async () => {
    const { servico } = montarCenario();

    const erro = await capturar(servico.bootstrap({ ...REGISTRO, senha: '123' }));

    expect(erro.status).toBe(400);
  });

  it('recusa e-mail já cadastrado', async () => {
    const { servico } = montarCenario();
    await servico.bootstrap(REGISTRO);

    const erro = await capturar(servico.register({ ...REGISTRO, nome: 'Outra' }, TENANT_A));

    expect(erro.status).toBe(409);
  });

  it('o papel padrão é OPERADOR e o primeiro usuário é sempre ADMIN', async () => {
    const { servico } = montarCenario();

    const primeiro = await servico.bootstrap({ ...REGISTRO, papel: 'OPERADOR' });
    const segundo = await servico.register(
      { ...REGISTRO, email: 'jose@exemplo.com' },
      TENANT_A,
    );

    expect(primeiro.usuario.papel).toBe('ADMIN');
    expect(segundo.usuario.papel).toBe('OPERADOR');
  });

  it('o bootstrap só vale enquanto a empresa não tem usuários', async () => {
    const { servico } = montarCenario();
    await servico.bootstrap(REGISTRO);

    const erro = await capturar(servico.bootstrap({ ...REGISTRO, email: 'outro@exemplo.com' }));

    expect(erro.status).toBe(409);
  });

  it('o usuário nasce no tenant de quem registra, ignorando o corpo (H1.3)', async () => {
    const { servico } = montarCenario();
    await servico.bootstrap(REGISTRO);

    const { usuario } = await servico.register(
      { ...REGISTRO, email: 'invasor@exemplo.com', empresaId: TENANT_B },
      TENANT_A,
    );

    expect(usuario.empresaId).toBe(TENANT_A);
  });
});

describe('AuthService — H2.2 (login e sessão)', () => {
  it('credenciais válidas devolvem token e usuário', async () => {
    const { servico } = montarCenario();
    await servico.bootstrap(REGISTRO);

    const resultado = await servico.login({ email: REGISTRO.email, senha: REGISTRO.senha });

    expect(resultado.token).toBeTruthy();
    expect(resultado.usuario.email).toBe(REGISTRO.email);
  });

  it('o token identifica o usuário, a empresa e o papel', async () => {
    const { servico, tokens } = montarCenario();
    const { usuario } = await servico.bootstrap(REGISTRO);

    await servico.login({ email: REGISTRO.email, senha: REGISTRO.senha });

    expect(tokens.assinados.at(-1)).toEqual({
      sub: usuario.id,
      empresaId: TENANT_A,
      papel: 'ADMIN',
    });
  });

  it('e-mail inexistente e senha errada produzem a mesma resposta', async () => {
    const { servico } = montarCenario();
    await servico.bootstrap(REGISTRO);

    const senhaErrada = await capturar(
      servico.login({ email: REGISTRO.email, senha: 'outra-senha' }),
    );
    const emailInexistente = await capturar(
      servico.login({ email: 'ninguem@exemplo.com', senha: REGISTRO.senha }),
    );

    // Mensagens distintas revelariam quais e-mails existem na base.
    expect(senhaErrada.status).toBe(401);
    expect(emailInexistente.status).toBe(401);
    expect(senhaErrada.message).toBe(emailInexistente.message);
  });

  it('o e-mail é normalizado, então maiúsculas não impedem o login', async () => {
    const { servico } = montarCenario();
    await servico.bootstrap(REGISTRO);

    const resultado = await servico.login({
      email: REGISTRO.email.toUpperCase(),
      senha: REGISTRO.senha,
    });

    expect(resultado.usuario.email).toBe(REGISTRO.email);
  });
});
