import type { OpenAPIV3 } from 'openapi-types';

const errorSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    error: { type: 'string', example: 'ValidationError' },
    message: { type: 'string', example: 'CNPJ deve conter exatamente 14 dígitos.' },
    stack: { type: 'string', description: 'Presente apenas fora de produção.' },
  },
  required: ['error', 'message'],
};

const empresaSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    cnpj: { type: 'string', example: '12345678000199' },
    razaoSocial: { type: 'string', example: 'Empresa Exemplo LTDA' },
    nomeFantasia: { type: 'string', example: 'Exemplo SST' },
    cnae: { type: 'string', example: '6201500' },
    grauRisco: { type: 'integer', minimum: 1, maximum: 4, example: 2 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'cnpj', 'razaoSocial', 'nomeFantasia', 'cnae', 'grauRisco', 'createdAt', 'updatedAt'],
};

const createEmpresaSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    cnpj: { type: 'string', example: '12345678000199' },
    razaoSocial: { type: 'string', example: 'Empresa Exemplo LTDA' },
    nomeFantasia: { type: 'string', example: 'Exemplo SST' },
    cnae: { type: 'string', example: '6201500' },
    grauRisco: { type: 'integer', minimum: 1, maximum: 4, example: 2 },
  },
  required: ['cnpj', 'razaoSocial', 'nomeFantasia', 'cnae', 'grauRisco'],
};

const updateEmpresaSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    cnpj: { type: 'string', example: '12345678000199' },
    razaoSocial: { type: 'string' },
    nomeFantasia: { type: 'string' },
    cnae: { type: 'string' },
    grauRisco: { type: 'integer', minimum: 1, maximum: 4 },
  },
};

const colaboradorSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    empresaId: { type: 'string', format: 'uuid' },
    cpf: { type: 'string', example: '12345678901' },
    nome: { type: 'string', example: 'Maria Silva' },
    dataNascimento: { type: 'string', format: 'date' },
    cargo: { type: 'string', example: 'Analista de SST' },
    dataAdmissao: { type: 'string', format: 'date' },
    dataDemissao: { type: 'string', format: 'date', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: [
    'id',
    'empresaId',
    'cpf',
    'nome',
    'dataNascimento',
    'cargo',
    'dataAdmissao',
    'dataDemissao',
    'createdAt',
    'updatedAt',
  ],
};

const createColaboradorSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    empresaId: { type: 'string', format: 'uuid' },
    cpf: { type: 'string', example: '12345678901' },
    nome: { type: 'string', example: 'Maria Silva' },
    dataNascimento: { type: 'string', format: 'date', example: '1990-05-15' },
    cargo: { type: 'string', example: 'Analista de SST' },
    dataAdmissao: { type: 'string', format: 'date', example: '2024-01-10' },
    dataDemissao: { type: 'string', format: 'date', nullable: true },
  },
  required: ['empresaId', 'cpf', 'nome', 'dataNascimento', 'cargo', 'dataAdmissao'],
};

const updateColaboradorSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    empresaId: { type: 'string', format: 'uuid' },
    cpf: { type: 'string' },
    nome: { type: 'string' },
    dataNascimento: { type: 'string', format: 'date' },
    cargo: { type: 'string' },
    dataAdmissao: { type: 'string', format: 'date' },
    dataDemissao: { type: 'string', format: 'date', nullable: true },
  },
};

const healthSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['ok', 'degraded'] },
    uptime: { type: 'number' },
    database: { type: 'boolean' },
    timestamp: { type: 'string', format: 'date-time' },
  },
  required: ['status', 'uptime', 'database', 'timestamp'],
};

const uuidParam: OpenAPIV3.ParameterObject = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
  description: 'Identificador UUID do recurso.',
};

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'EssentiaSST API',
    version: '0.1.0',
    description:
      'API REST do EssentiaSST — Gestão de Segurança e Saúde no Trabalho integrada ao eSocial.',
  },
  servers: [{ url: '/api', description: 'API base path' }],
  tags: [
    { name: 'Health', description: 'Verificação de saúde da API e do banco.' },
    { name: 'Empresas', description: 'CRUD de empresas (tenants).' },
    { name: 'Colaboradores', description: 'CRUD de colaboradores vinculados a empresas.' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Retorna status da API e conectividade com o PostgreSQL.',
        responses: {
          '200': {
            description: 'API e banco operacionais.',
            content: { 'application/json': { schema: healthSchema } },
          },
          '503': {
            description: 'API degradada (banco indisponível).',
            content: { 'application/json': { schema: healthSchema } },
          },
        },
      },
    },
    '/empresas': {
      get: {
        tags: ['Empresas'],
        summary: 'Listar empresas',
        responses: {
          '200': {
            description: 'Lista de empresas.',
            content: {
              'application/json': {
                schema: { type: 'array', items: empresaSchema },
              },
            },
          },
        },
      },
      post: {
        tags: ['Empresas'],
        summary: 'Criar empresa',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: createEmpresaSchema } },
        },
        responses: {
          '201': {
            description: 'Empresa criada.',
            content: { 'application/json': { schema: empresaSchema } },
          },
          '400': {
            description: 'Dados inválidos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '409': {
            description: 'CNPJ já cadastrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/empresas/{id}': {
      get: {
        tags: ['Empresas'],
        summary: 'Buscar empresa por id',
        parameters: [uuidParam],
        responses: {
          '200': {
            description: 'Empresa encontrada.',
            content: { 'application/json': { schema: empresaSchema } },
          },
          '404': {
            description: 'Empresa não encontrada.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
      put: {
        tags: ['Empresas'],
        summary: 'Atualizar empresa',
        parameters: [uuidParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: updateEmpresaSchema } },
        },
        responses: {
          '200': {
            description: 'Empresa atualizada.',
            content: { 'application/json': { schema: empresaSchema } },
          },
          '400': {
            description: 'Dados inválidos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '404': {
            description: 'Empresa não encontrada.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '409': {
            description: 'CNPJ já cadastrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
      delete: {
        tags: ['Empresas'],
        summary: 'Remover empresa',
        parameters: [uuidParam],
        responses: {
          '204': { description: 'Empresa removida.' },
          '404': {
            description: 'Empresa não encontrada.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/colaboradores': {
      get: {
        tags: ['Colaboradores'],
        summary: 'Listar colaboradores',
        parameters: [
          {
            name: 'empresaId',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'uuid' },
            description: 'Filtra colaboradores de uma empresa específica.',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de colaboradores.',
            content: {
              'application/json': {
                schema: { type: 'array', items: colaboradorSchema },
              },
            },
          },
          '404': {
            description: 'Empresa do filtro não encontrada.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
      post: {
        tags: ['Colaboradores'],
        summary: 'Criar colaborador',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: createColaboradorSchema } },
        },
        responses: {
          '201': {
            description: 'Colaborador criado.',
            content: { 'application/json': { schema: colaboradorSchema } },
          },
          '400': {
            description: 'Dados inválidos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '404': {
            description: 'Empresa não encontrada.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '409': {
            description: 'CPF já cadastrado na empresa.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/colaboradores/{id}': {
      get: {
        tags: ['Colaboradores'],
        summary: 'Buscar colaborador por id',
        parameters: [uuidParam],
        responses: {
          '200': {
            description: 'Colaborador encontrado.',
            content: { 'application/json': { schema: colaboradorSchema } },
          },
          '404': {
            description: 'Colaborador não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
      put: {
        tags: ['Colaboradores'],
        summary: 'Atualizar colaborador',
        parameters: [uuidParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: updateColaboradorSchema } },
        },
        responses: {
          '200': {
            description: 'Colaborador atualizado.',
            content: { 'application/json': { schema: colaboradorSchema } },
          },
          '400': {
            description: 'Dados inválidos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '404': {
            description: 'Colaborador ou empresa não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '409': {
            description: 'CPF já cadastrado na empresa.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
      delete: {
        tags: ['Colaboradores'],
        summary: 'Remover colaborador',
        parameters: [uuidParam],
        responses: {
          '204': { description: 'Colaborador removido.' },
          '404': {
            description: 'Colaborador não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
  },
};
