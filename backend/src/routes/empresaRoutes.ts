import { Router } from 'express';
import {
  createEmpresa,
  deleteEmpresa,
  getEmpresaById,
  listEmpresas,
  updateEmpresa,
} from '../controllers/empresaController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Público: permite o cadastro do primeiro tenant (bootstrap) antes de existir usuário.
router.post('/', createEmpresa);

// Leitura: qualquer usuário autenticado do tenant.
router.get('/', authenticate, listEmpresas);
router.get('/:id', authenticate, getEmpresaById);

// Alterar ou excluir o próprio tenant é ação de ADMIN.
router.put('/:id', authenticate, authorize('ADMIN'), updateEmpresa);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteEmpresa);

export default router;
