import { Router } from 'express';
import {
  createRisco,
  deleteRisco,
  getRiscoById,
  listRiscos,
  updateRisco,
} from '../controllers/riscoController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', listRiscos);
router.get('/:id', getRiscoById);
router.post('/', createRisco);
router.put('/:id', updateRisco);
router.delete('/:id', authorize('ADMIN'), deleteRisco);

export default router;
