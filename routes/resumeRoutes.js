import express from 'express';
import multer from 'multer';
import { createResume, deleteResume, getResume, getResumeById, getResumeFile, updateResume, uploadResume } from '../controllers/resumeController.js';
import verifyRole from '../middlewares/verifyRoleMiddleware.js';
import auth from '../middlewares/authMiddleware.js';
import { get } from 'mongoose';
import { storage } from '../config/cloudinary.js';

const router = express.Router();
const upload = multer({ storage });
router.use(auth); 


router.post('/', verifyRole(['candidate']), upload.single('resumeFile'), createResume);
// router.post('/upload', upload.single('resumeFile'), uploadResume);
router.get('/', verifyRole(['candidate']), getResume);
router.get('/:id', verifyRole(['candidate']), getResumeById); //get resume by ID
router.put('/:id', verifyRole(['candidate']), updateResume);//get resume by ID and update it
router.delete('/:id', verifyRole(['candidate']), deleteResume); // Candidates can delete their resumes
router.get('/file/:id', getResumeFile); // Make sure auth middleware is applied


export default router;
