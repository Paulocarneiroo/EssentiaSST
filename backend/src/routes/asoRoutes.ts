import { Router } from 'express';
import {
  createAso,
  deleteAso,
  getAsoById,
  listAsos,
  updateAso,
} from '../controllers/asoController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', listAsos);
router.get('/:id', getAsoById);
router.post('/', createAso);
router.put('/:id', updateAso);

// Exclusão apaga histórico médico do trabalhador — restrita a ADMIN.
router.delete('/:id', authorize('ADMIN'), deleteAso);

export default router;
