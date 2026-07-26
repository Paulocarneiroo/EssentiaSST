import { Router } from 'express';
import { getAptidao } from '../controllers/aptidaoController.js';
import {
  createColaborador,
  deleteColaborador,
  getColaboradorById,
  listColaboradores,
  updateColaborador,
} from '../controllers/colaboradorController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas de colaboradores exigem autenticação.
router.use(authenticate);

// Rotina diária de SST: ADMIN e OPERADOR.
router.get('/', listColaboradores);
router.get('/:id', getColaboradorById);
router.get('/:id/aptidao', getAptidao);
router.post('/', createColaborador);
router.put('/:id', updateColaborador);

// Exclusão apaga o histórico do trabalhador — restrita a ADMIN.
router.delete('/:id', authorize('ADMIN'), deleteColaborador);

export default router;
