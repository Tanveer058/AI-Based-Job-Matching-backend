import axios from 'axios';

/**
 * Fetches job items from Apify dataset.
 */
export const fetchApifyDatasetItems = async (datasetId, token) => {
  try {
    const res = await axios.get(
      `https://api.apify.com/v2/datasets/${datasetId}/items`,
      { params: { token } }
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error(`❌ Failed to fetch dataset ${datasetId}:`, err.message);
    return [];
  }
};
