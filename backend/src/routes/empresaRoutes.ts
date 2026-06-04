import { Router } from 'express';
import {
  createEmpresa,
  deleteEmpresa,
  getEmpresaById,
  listEmpresas,
  updateEmpresa,
} from '../controllers/empresaController.js';

const router = Router();

router.get('/', listEmpresas);
router.get('/:id', getEmpresaById);
router.post('/', createEmpresa);
router.put('/:id', updateEmpresa);
router.delete('/:id', deleteEmpresa);

export default router;
