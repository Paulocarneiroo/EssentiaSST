import { Router } from 'express';
import { getRelatorioPgr } from '../controllers/relatorioController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Consulta de conformidade: disponível a ADMIN e OPERADOR.
router.get('/pgr', getRelatorioPgr);

export default router;
