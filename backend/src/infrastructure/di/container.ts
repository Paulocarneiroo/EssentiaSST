import { ColaboradorService } from '../../application/services/ColaboradorService.js';
import { EmpresaService } from '../../application/services/EmpresaService.js';
import { ColaboradorRepositoryPostgres } from '../repositories/ColaboradorRepositoryPostgres.js';
import { EmpresaRepositoryPostgres } from '../repositories/EmpresaRepositoryPostgres.js';

const empresaRepository = new EmpresaRepositoryPostgres();
const colaboradorRepository = new ColaboradorRepositoryPostgres();

export const empresaService = new EmpresaService(empresaRepository);
export const colaboradorService = new ColaboradorService(colaboradorRepository, empresaRepository);
