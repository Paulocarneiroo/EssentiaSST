import { Router } from 'express';
import {
  createColaborador,
  deleteColaborador,
  getColaboradorById,
  listColaboradores,
  updateColaborador,
} from '../controllers/colaboradorController.js';

const router = Router();

router.get('/', listColaboradores);
router.get('/:id', getColaboradorById);
router.post('/', createColaborador);
router.put('/:id', updateColaborador);
router.delete('/:id', deleteColaborador);

export default router;
