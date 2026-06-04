import { Router } from 'express';
import colaboradorRoutes from './colaboradorRoutes.js';
import empresaRoutes from './empresaRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/empresas', empresaRoutes);
router.use('/colaboradores', colaboradorRoutes);

export default router;
