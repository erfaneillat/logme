import express from 'express';
import { AdminExercisesController } from '../controllers/adminExercisesController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();
const controller = new AdminExercisesController();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get all exercises with pagination and filtering
router.get('/', controller.getAllExercises.bind(controller));

// Get exercise statistics
router.get('/stats', controller.getExerciseStats.bind(controller));

// Search exercises
router.get('/search', controller.searchExercises.bind(controller));

// Get exercises by user ID
router.get('/user/:userId', controller.getUserExercises.bind(controller));

export default router;
