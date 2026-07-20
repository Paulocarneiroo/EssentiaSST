import { Router } from 'express';
import asoRoutes from './asoRoutes.js';
import authRoutes from './authRoutes.js';
import colaboradorRoutes from './colaboradorRoutes.js';
import empresaRoutes from './empresaRoutes.js';
import eventoESocialRoutes from './eventoESocialRoutes.js';
import healthRoutes from './healthRoutes.js';
import riscoRoutes from './riscoRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/empresas', empresaRoutes);
router.use('/colaboradores', colaboradorRoutes);
router.use('/asos', asoRoutes);
router.use('/riscos', riscoRoutes);
router.use('/eventos-esocial', eventoESocialRoutes);

export default router;
