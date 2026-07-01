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
  description: 'A empresa é sempre o tenant do usuário autenticado (derivada do token JWT).',
  properties: {
    cpf: { type: 'string', example: '12345678901' },
    nome: { type: 'string', example: 'Maria Silva' },
    dataNascimento: { type: 'string', format: 'date', example: '1990-05-15' },
    cargo: { type: 'string', example: 'Analista de SST' },
    dataAdmissao: { type: 'string', format: 'date', example: '2024-01-10' },
    dataDemissao: { type: 'string', format: 'date', nullable: true },
  },
  required: ['cpf', 'nome', 'dataNascimento', 'cargo', 'dataAdmissao'],
};

const updateColaboradorSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  description: 'Não é possível mover o colaborador para outra empresa.',
  properties: {
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

const usuarioSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    empresaId: { type: 'string', format: 'uuid' },
    nome: { type: 'string', example: 'Paulo Carneiro' },
    email: { type: 'string', format: 'email', example: 'admin@exemplo.com' },
    papel: { type: 'string', enum: ['ADMIN', 'OPERADOR'], example: 'ADMIN' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'empresaId', 'nome', 'email', 'papel', 'createdAt', 'updatedAt'],
};

const registerSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    empresaId: { type: 'string', format: 'uuid' },
    nome: { type: 'string', example: 'Paulo Carneiro' },
    email: { type: 'string', format: 'email', example: 'admin@exemplo.com' },
    senha: { type: 'string', format: 'password', minLength: 6, example: 'senha123' },
    papel: { type: 'string', enum: ['ADMIN', 'OPERADOR'], example: 'ADMIN' },
  },
  required: ['empresaId', 'nome', 'email', 'senha'],
};

const loginSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', example: 'admin@exemplo.com' },
    senha: { type: 'string', format: 'password', example: 'senha123' },
  },
  required: ['email', 'senha'],
};

const authResultSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    token: { type: 'string', description: 'JWT a ser enviado em Authorization: Bearer <token>.' },
    usuario: usuarioSchema,
  },
  required: ['token', 'usuario'],
};

const bearerAuth: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];

const unauthorizedResponse: OpenAPIV3.ResponseObject = {
  description: 'Não autenticado (token ausente, inválido ou expirado).',
  content: { 'application/json': { schema: errorSchema } },
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
    { name: 'Auth', description: 'Autenticação de usuários via JWT.' },
    { name: 'Empresas', description: 'CRUD de empresas (tenants).' },
    { name: 'Colaboradores', description: 'CRUD de colaboradores vinculados a empresas.' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Informe o token retornado por /auth/login ou /auth/register.',
      },
    },
  },
  // Segurança padrão para toda a API; rotas públicas sobrescrevem com `security: []`.
  security: bearerAuth,
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar usuário',
        description: 'Cria um usuário vinculado a uma empresa existente e retorna um JWT.',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: registerSchema } },
        },
        responses: {
          '201': {
            description: 'Usuário criado.',
            content: { 'application/json': { schema: authResultSchema } },
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
            description: 'E-mail já cadastrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Autentica por e-mail e senha e retorna um JWT.',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: loginSchema } },
        },
        responses: {
          '200': {
            description: 'Autenticado.',
            content: { 'application/json': { schema: authResultSchema } },
          },
          '400': {
            description: 'Dados inválidos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '401': {
            description: 'E-mail ou senha inválidos.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Usuário autenticado',
        description: 'Retorna os dados do usuário dono do token.',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'Dados do usuário.',
            content: { 'application/json': { schema: usuarioSchema } },
          },
          '401': unauthorizedResponse,
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Retorna status da API e conectividade com o PostgreSQL.',
        security: [],
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
        description: 'Retorna a empresa do usuário autenticado (o tenant), em formato de lista.',
        responses: {
          '200': {
            description: 'Empresa do tenant.',
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
        description: 'Público — permite cadastrar o primeiro tenant antes de existir usuário.',
        security: [],
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
        description: 'Retorna apenas os colaboradores da empresa do usuário autenticado.',
        responses: {
          '200': {
            description: 'Lista de colaboradores do tenant.',
            content: {
              'application/json': {
                schema: { type: 'array', items: colaboradorSchema },
              },
            },
          },
          '401': unauthorizedResponse,
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
