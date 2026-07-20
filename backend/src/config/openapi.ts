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

const TIPOS_EXAME = [
  'ADMISSIONAL',
  'PERIODICO',
  'RETORNO_TRABALHO',
  'MUDANCA_RISCO',
  'DEMISSIONAL',
];
const RESULTADOS_ASO = ['APTO', 'INAPTO', 'APTO_COM_RESTRICOES'];
const TIPOS_RISCO = ['FISICO', 'QUIMICO', 'BIOLOGICO', 'ERGONOMICO', 'ACIDENTE'];

const asoSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    colaboradorId: { type: 'string', format: 'uuid' },
    tipoExame: { type: 'string', enum: TIPOS_EXAME },
    dataExame: { type: 'string', format: 'date' },
    resultado: { type: 'string', enum: RESULTADOS_ASO },
    medico: { type: 'string', example: 'Dr. João Souza' },
    crm: { type: 'string', example: 'CRM-PE 12345' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'colaboradorId', 'tipoExame', 'dataExame', 'resultado', 'medico', 'crm'],
};

const createAsoSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    colaboradorId: { type: 'string', format: 'uuid' },
    tipoExame: { type: 'string', enum: TIPOS_EXAME, example: 'PERIODICO' },
    dataExame: { type: 'string', format: 'date', example: '2026-02-01' },
    resultado: { type: 'string', enum: RESULTADOS_ASO, example: 'APTO' },
    medico: { type: 'string', example: 'Dr. João Souza' },
    crm: { type: 'string', example: 'CRM-PE 12345' },
  },
  required: ['colaboradorId', 'tipoExame', 'dataExame', 'resultado', 'medico', 'crm'],
};

const updateAsoSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  description: 'Não é possível transferir o ASO para outro colaborador.',
  properties: {
    tipoExame: { type: 'string', enum: TIPOS_EXAME },
    dataExame: { type: 'string', format: 'date' },
    resultado: { type: 'string', enum: RESULTADOS_ASO },
    medico: { type: 'string' },
    crm: { type: 'string' },
  },
};

const riscoSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    empresaId: { type: 'string', format: 'uuid' },
    descricao: { type: 'string', example: 'Ruído contínuo acima de 85 dB(A)' },
    tipo: { type: 'string', enum: TIPOS_RISCO },
    severidade: { type: 'integer', minimum: 1, maximum: 5 },
    probabilidade: { type: 'integer', minimum: 1, maximum: 5 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'empresaId', 'descricao', 'tipo', 'severidade', 'probabilidade'],
};

const createRiscoSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  description: 'A empresa é sempre o tenant do usuário autenticado.',
  properties: {
    descricao: { type: 'string', example: 'Ruído contínuo acima de 85 dB(A)' },
    tipo: { type: 'string', enum: TIPOS_RISCO, example: 'FISICO' },
    severidade: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
    probabilidade: { type: 'integer', minimum: 1, maximum: 5, example: 3 },
  },
  required: ['descricao', 'tipo', 'severidade', 'probabilidade'],
};

const updateRiscoSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    descricao: { type: 'string' },
    tipo: { type: 'string', enum: TIPOS_RISCO },
    severidade: { type: 'integer', minimum: 1, maximum: 5 },
    probabilidade: { type: 'integer', minimum: 1, maximum: 5 },
  },
};

const eventoESocialSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    empresaId: { type: 'string', format: 'uuid' },
    colaboradorId: { type: 'string', format: 'uuid', nullable: true },
    asoId: { type: 'string', format: 'uuid', nullable: true },
    riscoId: { type: 'string', format: 'uuid', nullable: true },
    tipoEvento: { type: 'string', enum: ['S_2210', 'S_2220', 'S_2240'] },
    payloadXml: { type: 'string', description: 'XML no leiaute S-1.2.' },
    status: { type: 'string', enum: ['PENDENTE', 'ENVIADO', 'ACEITO', 'REJEITADO'] },
    ambiente: { type: 'string', enum: ['PRODUCAO', 'PRODUCAO_RESTRITA'] },
    protocolo: { type: 'string', nullable: true, description: 'Preenchido quando ACEITO.' },
    mensagemErro: { type: 'string', nullable: true, description: 'Preenchido quando REJEITADO.' },
    dataEnvio: { type: 'string', format: 'date-time', nullable: true },
    tentativas: { type: 'integer', description: 'Número de transmissões já realizadas.' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'empresaId', 'tipoEvento', 'payloadXml', 'status', 'ambiente', 'tentativas'],
};

const gerarDeAsoSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: { asoId: { type: 'string', format: 'uuid' } },
  required: ['asoId'],
};

const gerarDeRiscoSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  description: 'O S-2240 declara a exposição de um trabalhador específico ao agente nocivo.',
  properties: {
    riscoId: { type: 'string', format: 'uuid' },
    colaboradorId: { type: 'string', format: 'uuid' },
  },
  required: ['riscoId', 'colaboradorId'],
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
    nome: { type: 'string', example: 'Paulo Carneiro' },
    email: { type: 'string', format: 'email', example: 'operador@exemplo.com' },
    senha: { type: 'string', format: 'password', minLength: 6, example: 'senha123' },
    papel: { type: 'string', enum: ['ADMIN', 'OPERADOR'], example: 'OPERADOR' },
  },
  required: ['nome', 'email', 'senha'],
  description:
    'A empresa do novo usuário é sempre a do ADMIN autenticado; `empresaId` enviado no corpo é ignorado.',
};

const bootstrapSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    empresaId: { type: 'string', format: 'uuid' },
    nome: { type: 'string', example: 'Paulo Carneiro' },
    email: { type: 'string', format: 'email', example: 'admin@exemplo.com' },
    senha: { type: 'string', format: 'password', minLength: 6, example: 'senha123' },
  },
  required: ['empresaId', 'nome', 'email', 'senha'],
  description: 'O usuário criado recebe obrigatoriamente o papel ADMIN.',
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
    { name: 'ASO', description: 'Atestados de Saúde Ocupacional dos colaboradores.' },
    { name: 'Riscos', description: 'Riscos ocupacionais catalogados no PGR.' },
    {
      name: 'eSocial',
      description: 'Geração, validação, transmissão e reenvio de eventos (leiaute S-1.2).',
    },
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
    '/auth/bootstrap': {
      post: {
        tags: ['Auth'],
        summary: 'Criar o primeiro ADMIN de uma empresa',
        description:
          'Cria o administrador inicial de uma empresa recém-cadastrada e retorna um JWT. ' +
          'Só funciona enquanto a empresa não possui nenhum usuário.',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: bootstrapSchema } },
        },
        responses: {
          '201': {
            description: 'Administrador criado.',
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
            description: 'E-mail já cadastrado ou empresa já possui usuários.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar usuário (ADMIN)',
        description:
          'Cria um usuário na empresa do ADMIN autenticado e retorna um JWT. Exige papel ADMIN.',
        security: bearerAuth,
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
          '401': unauthorizedResponse,
          '403': {
            description: 'Apenas administradores podem registrar usuários.',
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
    '/asos': {
      get: {
        tags: ['ASO'],
        summary: 'Listar ASOs',
        description: 'Retorna os ASOs dos colaboradores do tenant, do mais recente ao mais antigo.',
        parameters: [
          {
            name: 'colaboradorId',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'uuid' },
            description: 'Filtra pelo histórico de um colaborador específico.',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de ASOs.',
            content: { 'application/json': { schema: { type: 'array', items: asoSchema } } },
          },
          '401': unauthorizedResponse,
        },
      },
      post: {
        tags: ['ASO'],
        summary: 'Registrar ASO',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: createAsoSchema } },
        },
        responses: {
          '201': {
            description: 'ASO registrado.',
            content: { 'application/json': { schema: asoSchema } },
          },
          '400': {
            description: 'Dados inválidos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '401': unauthorizedResponse,
          '404': {
            description: 'Colaborador não encontrado no tenant.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/asos/{id}': {
      get: {
        tags: ['ASO'],
        summary: 'Buscar ASO por id',
        parameters: [uuidParam],
        responses: {
          '200': {
            description: 'ASO encontrado.',
            content: { 'application/json': { schema: asoSchema } },
          },
          '404': {
            description: 'ASO não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
      put: {
        tags: ['ASO'],
        summary: 'Atualizar ASO',
        parameters: [uuidParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: updateAsoSchema } },
        },
        responses: {
          '200': {
            description: 'ASO atualizado.',
            content: { 'application/json': { schema: asoSchema } },
          },
          '400': {
            description: 'Dados inválidos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '404': {
            description: 'ASO não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
      delete: {
        tags: ['ASO'],
        summary: 'Remover ASO (ADMIN)',
        parameters: [uuidParam],
        responses: {
          '204': { description: 'ASO removido.' },
          '401': unauthorizedResponse,
          '403': {
            description: 'Apenas administradores podem excluir histórico médico.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '404': {
            description: 'ASO não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/riscos': {
      get: {
        tags: ['Riscos'],
        summary: 'Listar riscos do PGR',
        description: 'Ordenados por severidade e probabilidade decrescentes.',
        responses: {
          '200': {
            description: 'Lista de riscos do tenant.',
            content: { 'application/json': { schema: { type: 'array', items: riscoSchema } } },
          },
          '401': unauthorizedResponse,
        },
      },
      post: {
        tags: ['Riscos'],
        summary: 'Cadastrar risco',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: createRiscoSchema } },
        },
        responses: {
          '201': {
            description: 'Risco cadastrado.',
            content: { 'application/json': { schema: riscoSchema } },
          },
          '400': {
            description: 'Dados inválidos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '401': unauthorizedResponse,
        },
      },
    },
    '/riscos/{id}': {
      get: {
        tags: ['Riscos'],
        summary: 'Buscar risco por id',
        parameters: [uuidParam],
        responses: {
          '200': {
            description: 'Risco encontrado.',
            content: { 'application/json': { schema: riscoSchema } },
          },
          '404': {
            description: 'Risco não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
      put: {
        tags: ['Riscos'],
        summary: 'Atualizar risco',
        parameters: [uuidParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: updateRiscoSchema } },
        },
        responses: {
          '200': {
            description: 'Risco atualizado.',
            content: { 'application/json': { schema: riscoSchema } },
          },
          '400': {
            description: 'Dados inválidos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '404': {
            description: 'Risco não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
      delete: {
        tags: ['Riscos'],
        summary: 'Remover risco (ADMIN)',
        parameters: [uuidParam],
        responses: {
          '204': { description: 'Risco removido.' },
          '401': unauthorizedResponse,
          '403': {
            description: 'Apenas administradores podem remover riscos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '404': {
            description: 'Risco não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/eventos-esocial': {
      get: {
        tags: ['eSocial'],
        summary: 'Listar eventos',
        description: 'Acompanhamento dos eventos do tenant, do mais recente ao mais antigo.',
        responses: {
          '200': {
            description: 'Lista de eventos.',
            content: {
              'application/json': { schema: { type: 'array', items: eventoESocialSchema } },
            },
          },
          '401': unauthorizedResponse,
        },
      },
    },
    '/eventos-esocial/aso': {
      post: {
        tags: ['eSocial'],
        summary: 'Gerar evento S-2220 a partir de um ASO',
        description:
          'Monta o XML no leiaute S-1.2 e o valida antes de persistir. ' +
          'O evento nasce em PENDENTE; a transmissão é feita em /eventos-esocial/{id}/enviar.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: gerarDeAsoSchema } },
        },
        responses: {
          '201': {
            description: 'Evento gerado em PENDENTE.',
            content: { 'application/json': { schema: eventoESocialSchema } },
          },
          '400': {
            description: 'XML fora do leiaute S-1.2, com indicação do campo problemático.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '401': unauthorizedResponse,
          '404': {
            description: 'ASO não encontrado no tenant.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/eventos-esocial/risco': {
      post: {
        tags: ['eSocial'],
        summary: 'Gerar evento S-2240 a partir de um risco',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: gerarDeRiscoSchema } },
        },
        responses: {
          '201': {
            description: 'Evento gerado em PENDENTE.',
            content: { 'application/json': { schema: eventoESocialSchema } },
          },
          '400': {
            description: 'Dados inválidos ou XML fora do leiaute.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '401': unauthorizedResponse,
          '404': {
            description: 'Risco ou colaborador não encontrado no tenant.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/eventos-esocial/{id}': {
      get: {
        tags: ['eSocial'],
        summary: 'Buscar evento por id',
        parameters: [uuidParam],
        responses: {
          '200': {
            description: 'Evento encontrado.',
            content: { 'application/json': { schema: eventoESocialSchema } },
          },
          '404': {
            description: 'Evento não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/eventos-esocial/{id}/xml': {
      get: {
        tags: ['eSocial'],
        summary: 'Baixar o XML do evento',
        parameters: [uuidParam],
        responses: {
          '200': {
            description: 'Payload XML no leiaute S-1.2.',
            content: { 'application/xml': { schema: { type: 'string' } } },
          },
          '404': {
            description: 'Evento não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/eventos-esocial/{id}/enviar': {
      post: {
        tags: ['eSocial'],
        summary: 'Transmitir evento ao eSocial (ADMIN)',
        description:
          'Transiciona PENDENTE → ENVIADO e, conforme o retorno, para ACEITO (com protocolo) ' +
          'ou REJEITADO (com a mensagem de erro).',
        parameters: [uuidParam],
        responses: {
          '200': {
            description: 'Evento transmitido e retorno processado.',
            content: { 'application/json': { schema: eventoESocialSchema } },
          },
          '401': unauthorizedResponse,
          '403': {
            description: 'Apenas administradores podem transmitir eventos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '404': {
            description: 'Evento não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '409': {
            description: 'Transição de status inválida (ex.: evento já ACEITO).',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
    '/eventos-esocial/{id}/reenviar': {
      post: {
        tags: ['eSocial'],
        summary: 'Reenviar evento rejeitado (ADMIN)',
        description:
          'Remonta o XML a partir do fato de origem já corrigido, preserva o vínculo e ' +
          'retransmite. Apenas eventos em REJEITADO podem ser reenviados.',
        parameters: [uuidParam],
        responses: {
          '200': {
            description: 'Evento reenviado e retorno processado.',
            content: { 'application/json': { schema: eventoESocialSchema } },
          },
          '401': unauthorizedResponse,
          '403': {
            description: 'Apenas administradores podem reenviar eventos.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '404': {
            description: 'Evento não encontrado.',
            content: { 'application/json': { schema: errorSchema } },
          },
          '409': {
            description: 'Evento não está em REJEITADO.',
            content: { 'application/json': { schema: errorSchema } },
          },
        },
      },
    },
  },
};
