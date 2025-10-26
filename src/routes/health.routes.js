import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({ ok: true, status: 'healthy', ts: new Date().toISOString() });
});

export default router;
