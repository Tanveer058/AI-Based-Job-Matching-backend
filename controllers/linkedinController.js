// import axios from 'axios';
// import Resume from '../models/Resume.js';

// export const getLinkedInJobs = async (req, res) => {
//   try {
//     const resume = await Resume.findOne({ userId: req.user.userId });
//     if (!resume) return res.status(404).json({ error: 'Resume not found' });

//     const keywords = [...resume.skills, ...resume.education].slice(0, 5);
//     const matchedJobs = [];

//     for (const keyword of keywords) {
//       const response = await axios.get('https://api.scrapingdog.com/linkedinjobs', {
//         params: {
//           api_key: process.env.SCRAPINGDOG_API_KEY,
//           field: keyword,
//           geoid: '92000000',
//           page: 1
//         }
//       });

//       const jobs = response.data;
//       jobs.forEach(job => {
//         const matchScore = resume.skills.some(skill =>
//           job.job_position.toLowerCase().includes(skill.toLowerCase())
//         ) ? 1 : 0;

//         if (matchScore) matchedJobs.push(job);
//       });
//     }

//     res.json(matchedJobs);
//   } catch (err) {
//     res.status(500).json({ error: 'LinkedIn job fetch failed' });
//   }
// };







// Apify API for linkedin job scraping
import Resume from '../models/Resume.js';
import { fetchApifyRunDatasetId } from '../utils/fetchApifyRun.js';
import { fetchApifyDatasetItems } from '../utils/fetchApifyDatasetItems.js';

export const getLinkedInJobs = async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.userId });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const keywords = [...resume.skills, ...resume.education].slice(0, 5);
    const matchedJobs = [];

    for (const keyword of keywords) {
      const datasetId = await fetchApifyRunDatasetId(keyword, process.env.APIFY_API_TOKEN);
      if (!datasetId) continue;

      const jobs = await fetchApifyDatasetItems(datasetId, process.env.APIFY_API_TOKEN);
      console.log(`✅ Fetched ${jobs.length} jobs for "${keyword}"`);

      jobs.forEach(job => {
        const matchScore = resume.skills.reduce((score, skill) => {
          const lowerSkill = skill.toLowerCase();
          if (job.title?.toLowerCase().includes(lowerSkill)) score += 2;
          if (job.description?.toLowerCase().includes(lowerSkill)) score += 1;
          return score;
        }, 0);

        if (matchScore >= 2) {
          matchedJobs.push({
            title: job.title || '',
            company: job.company || '',
            location: job.location || '',
            link: job.url || job.link || '',
            description: job.description || '',
            matchScore
          });
        }
      });
    }

    res.json(matchedJobs);
  } catch (err) {
    console.error('❌ LinkedIn job fetch failed:', err.message);
    res.status(500).json({ error: 'LinkedIn job fetch failed' });
  }
};

