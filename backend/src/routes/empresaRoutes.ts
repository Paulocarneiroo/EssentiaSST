import { Router } from 'express';
import {
  createEmpresa,
  deleteEmpresa,
  getEmpresaById,
  listEmpresas,
  updateEmpresa,
} from '../controllers/empresaController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Público: permite o cadastro do primeiro tenant (bootstrap) antes de existir usuário.
router.post('/', createEmpresa);

// Protegidos: exigem autenticação.
router.get('/', authenticate, listEmpresas);
router.get('/:id', authenticate, getEmpresaById);
router.put('/:id', authenticate, updateEmpresa);
router.delete('/:id', authenticate, deleteEmpresa);

export default router;
