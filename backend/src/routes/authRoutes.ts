import { Router } from 'express';
import { bootstrap, login, me, register } from '../controllers/authController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Público: primeiro ADMIN de uma empresa que ainda não tem usuários.
router.post('/bootstrap', bootstrap);
router.post('/login', login);

// Somente um ADMIN registra novos usuários, e sempre dentro do próprio tenant.
router.post('/register', authenticate, authorize('ADMIN'), register);
router.get('/me', authenticate, me);

export default router;
