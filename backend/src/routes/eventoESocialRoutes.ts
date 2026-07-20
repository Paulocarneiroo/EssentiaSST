import { Router } from 'express';
import {
  enviarEvento,
  gerarDeAso,
  gerarDeRisco,
  getEventoById,
  getEventoXml,
  listEventos,
  reenviarEvento,
} from '../controllers/eventoESocialController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Consulta do acompanhamento: ADMIN e OPERADOR.
router.get('/', listEventos);
router.get('/:id', getEventoById);
router.get('/:id/xml', getEventoXml);

// Geração do evento a partir do fato de origem.
router.post('/aso', gerarDeAso);
router.post('/risco', gerarDeRisco);

// Transmitir ao eSocial cria obrigação legal — restrita a ADMIN.
router.post('/:id/enviar', authorize('ADMIN'), enviarEvento);
router.post('/:id/reenviar', authorize('ADMIN'), reenviarEvento);

export default router;
