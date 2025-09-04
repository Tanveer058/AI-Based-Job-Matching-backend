import Job from '../models/Job.js';
import Resume from '../models/Resume.js';

// employer post a job
export const postJob = async (req, res) => {
  try {
    const { title, skills, experience, contact } = req.body;
    const job = await Job.create({ postedBy: req.user.userId, title, skills, experience, contact });
    res.status(201).json(job);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = {};
      for (let field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res.status(400).json({ errors });
    }
    res.status(400).json({ error: 'Job posting failed' });
  }
};

// emoloyer update a job
export const updateJob = async (req, res) => {
  try {
    // const jobId = req.params.id;
    const jobId = req.params.jobId;
    const job = await Job.findOneAndUpdate(
      { _id: jobId, postedBy: req.user.userId },
      req.body,
      { new: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found or unauthorized' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update job' });
  }
};
// employer delete a job
export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findOneAndDelete({ _id: jobId, postedBy: req.user.userId });
    if (!job) return res.status(404).json({ error: 'Job not found or unauthorized' });
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
};

// Get a single job posted on portal by ID
export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};


// get all jobs posted by logged in employer
export const getJobsByEmployerId = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: Missing user ID' });
    }

    const employerId = req.user.userId;
    console.log("employerId:", employerId);

    const jobs = await Job.find({ postedBy: employerId });
    console.log("jobs:", jobs);

    res.json(jobs);
  } catch (err) {
    console.error('Error fetching employer jobs:', err.message);
    res.status(500).json({ error: 'Failed to fetch employer jobs' });
  }
};


export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs'});
  }
};

export const getMatchedJobs = async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.params.userId });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const keywords = [...resume.skills, ...resume.education].slice(0, 5);
    const matchedJobs = [];
    if (!resume.skills?.length && !resume.education?.length) {
      return res.status(400).json({ error: 'Resume has no keywords to match' });
    }
    

    for (const keyword of keywords) {
      const response = await axios.get('https://api.scrapingdog.com/linkedinjobs', {
        params: {
          api_key: process.env.SCRAPINGDOG_API_KEY,
          field: keyword,
          geoid: '92000000',
          page: 1
        }
      });

      const jobs = response.data;
      jobs.forEach(job => {
        const matchScore = resume.skills.some(skill =>
          job.job_position.toLowerCase().includes(skill.toLowerCase())
        ) ? 1 : 0;

        if (matchScore) matchedJobs.push(job);
      });
    }

    res.json(matchedJobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch matched jobs' });
  }
};