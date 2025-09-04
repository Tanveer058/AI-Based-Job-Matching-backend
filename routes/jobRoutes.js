import express from 'express';
import { postJob, getAllJobs, deleteJob, updateJob, getJobById, getJobsByEmployerId } from '../controllers/jobController.js';
import verifyRole from '../middlewares/verifyRoleMiddleware.js';
import { getMatchedJobs } from '../controllers/jobController.js';



const router = express.Router();
router.post('/', verifyRole(['employer']), postJob);

// empoyer delete a job
router.delete('/:jobId', verifyRole([ 'employer']), deleteJob);

// get a single job by id (for update form autofill)
router.get('/get-job-by-id/:jobId', getJobById);

// employer update a job
router.put('/:jobId', verifyRole(['employer']), updateJob);

router.get('/', verifyRole(['candidate']), getAllJobs);

router.get('/jobsByEmployer', verifyRole(['employer']), getJobsByEmployerId);


router.get('/match/:userId', verifyRole(['candidate']), getMatchedJobs);


export default router;
