import { Router } from 'express';
import {
  createAcidente,
  deleteAcidente,
  getAcidenteById,
  listAcidentes,
  updateAcidente,
} from '../controllers/acidenteController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', listAcidentes);
router.get('/:id', getAcidenteById);
router.post('/', createAcidente);
router.put('/:id', updateAcidente);

// Exclusão apaga o registro de um acidente já comunicável — restrita a ADMIN.
router.delete('/:id', authorize('ADMIN'), deleteAcidente);

export default router;
