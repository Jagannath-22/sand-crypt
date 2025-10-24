// frontend/src/utils/fetchClient.js
import toast from 'react-hot-toast';

/**
 * Custom fetch utility that includes httpOnly cookie credentials and handles API responses.
 * @param {string} url - The API endpoint URL.
 * @param {RequestInit} options - Standard fetch options (method, headers, body, etc.).
 * @returns {Promise<any>} - The parsed JSON response.
 * @throws {Error} - Throws an error if the request fails or the response is not OK.
 */
const fetchClient = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // 🔥 CRITICAL: This tells the browser to send the httpOnly cookie.
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage = errorData.error || errorData.message || `API request failed with status ${response.status}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    console.error("fetchClient error:", error);
    // Only show a generic network error if it's not an API-specific message
    if (!error.message.includes('API request failed')) {
      toast.error("Network error or server unreachable.");
    }
    throw error;
  }
};

export default fetchClient;