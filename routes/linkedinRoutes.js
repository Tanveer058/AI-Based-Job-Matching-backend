import express from 'express';
import { getLinkedInJobs } from '../controllers/linkedinController.js';
import verifyRole from '../middlewares/verifyRoleMiddleware.js';

const router = express.Router();
router.get('/', verifyRole(['candidate']), getLinkedInJobs);

export default router;
