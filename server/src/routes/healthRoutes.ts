import express from 'express';
import { getHealthStatus, getDetailedHealth } from '../controllers/healthController';

const router = express.Router();

// GET /api/health - Basic health check
router.get('/', getHealthStatus);

// GET /api/health/detailed - Detailed health check with system info
router.get('/detailed', getDetailedHealth);

export default router;
