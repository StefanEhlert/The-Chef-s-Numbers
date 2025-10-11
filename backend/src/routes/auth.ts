import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented later
router.post('/login', (_req, res) => {
  res.json({ message: 'Auth endpoint - not implemented yet' });
});

router.post('/register', (_req, res) => {
  res.json({ message: 'Auth endpoint - not implemented yet' });
});

export default router;
