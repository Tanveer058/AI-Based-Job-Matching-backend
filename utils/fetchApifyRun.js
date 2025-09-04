import axios from 'axios';

/**
 * Triggers Apify actor and returns dataset ID once completed.
 */
export const fetchApifyRunDatasetId = async (keyword, token) => {
  try {
    const runRes = await axios.post(
      `https://api.apify.com/v2/acts/forward_dinosaur~linkedin-job-scraper/runs?token=${token}`,
      {
        input: {
          query: keyword,
          location: ['Worldwide'],
          maxJobs: 10,
          proxyConfiguration: { useApifyProxy: true }
        }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const runId = runRes.data.data.id;
    console.log(`🚀 Apify run started for "${keyword}": ${runId}`);

    let status = 'RUNNING';
    let datasetId = null;

    while (status === 'RUNNING' || status === 'READY') {
      const statusRes = await axios.get(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
      );
      status = statusRes.data.data.status;
      if (status === 'SUCCEEDED') {
        datasetId = statusRes.data.data.defaultDatasetId;
        break;
      } else if (status === 'FAILED') {
        console.error(`❌ Actor run failed for "${keyword}"`);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    return datasetId;
  } catch (err) {
    console.error(`❌ Error triggering Apify actor for "${keyword}":`, err.message);
    return null;
  }
};
