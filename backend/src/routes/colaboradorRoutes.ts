import { Router } from 'express';
import {
  createColaborador,
  deleteColaborador,
  getColaboradorById,
  listColaboradores,
  updateColaborador,
} from '../controllers/colaboradorController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas de colaboradores exigem autenticação.
router.use(authenticate);

router.get('/', listColaboradores);
router.get('/:id', getColaboradorById);
router.post('/', createColaborador);
router.put('/:id', updateColaborador);
router.delete('/:id', deleteColaborador);

export default router;
