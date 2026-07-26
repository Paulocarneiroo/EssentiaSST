import { AppError } from '../errors/AppError.js';
import { validateCreateColaborador } from './colaboradorValidator.js';
import { isCnpjValido, isCpfValido } from './documentos.js';
import { validateCreateEmpresa } from './empresaValidator.js';

const COLABORADOR = {
  empresaId: '11111111-1111-1111-1111-111111111111',
  cpf: '12345678909',
  nome: 'Maria Silva',
  dataNascimento: '1990-05-15',
  cargo: 'Analista de SST',
  dataAdmissao: '2024-01-10',
};

const EMPRESA = {
  cnpj: '11222333000181',
  razaoSocial: 'Empresa Exemplo LTDA',
  nomeFantasia: 'Exemplo SST',
  cnae: '6201500',
  grauRisco: 2,
};

const capturar = (acao: () => unknown): AppError => {
  try {
    acao();
  } catch (error) {
    if (error instanceof AppError) {
      return error;
    }
    throw error;
  }
  throw new Error('Esperava um AppError, mas a validação passou.');
};

describe('isCpfValido', () => {
  it.each(['12345678909', '11144477735', '52998224725'])('aceita o CPF válido %s', (cpf) => {
    expect(isCpfValido(cpf)).toBe(true);
  });

  it('recusa CPF com dígito verificador trocado', () => {
    expect(isCpfValido('12345678901')).toBe(false);
  });

  it('recusa sequências de dígitos repetidos', () => {
    expect(isCpfValido('11111111111')).toBe(false);
    expect(isCpfValido('00000000000')).toBe(false);
  });

  it('recusa comprimento diferente de 11', () => {
    expect(isCpfValido('1234567890')).toBe(false);
    expect(isCpfValido('123456789099')).toBe(false);
  });
});

describe('isCnpjValido', () => {
  it.each(['11222333000181', '98765432000198', '04572023000121'])(
    'aceita o CNPJ válido %s',
    (cnpj) => {
      expect(isCnpjValido(cnpj)).toBe(true);
    },
  );

  it('recusa CNPJ com dígito verificador trocado', () => {
    expect(isCnpjValido('12345678000199')).toBe(false);
  });

  it('recusa sequências de dígitos repetidos', () => {
    expect(isCnpjValido('11111111111111')).toBe(false);
  });

  it('recusa comprimento diferente de 14', () => {
    expect(isCnpjValido('1122233300018')).toBe(false);
  });
});

describe('validadores de cadastro — H1.1 e H1.2', () => {
  it('aceita documentos válidos e normaliza a máscara', () => {
    const empresa = validateCreateEmpresa({ ...EMPRESA, cnpj: '11.222.333/0001-81' });
    const colaborador = validateCreateColaborador({ ...COLABORADOR, cpf: '123.456.789-09' });

    expect(empresa.cnpj).toBe('11222333000181');
    expect(colaborador.cpf).toBe('12345678909');
  });

  it('recusa CNPJ com dígito verificador inválido', () => {
    const erro = capturar(() => validateCreateEmpresa({ ...EMPRESA, cnpj: '12345678000199' }));

    expect(erro.status).toBe(400);
    expect(erro.message).toContain('dígito verificador');
  });

  it('recusa CPF com dígito verificador inválido', () => {
    const erro = capturar(() => validateCreateColaborador({ ...COLABORADOR, cpf: '12345678901' }));

    expect(erro.status).toBe(400);
    expect(erro.message).toContain('dígito verificador');
  });

  it('a mensagem de comprimento continua distinta da de dígito verificador', () => {
    const erro = capturar(() => validateCreateColaborador({ ...COLABORADOR, cpf: '123' }));

    expect(erro.message).toContain('11 dígitos');
  });
});
