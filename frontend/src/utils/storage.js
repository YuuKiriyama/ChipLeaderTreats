// storage.js - Backend API storage wrapper
// Dynamic API address detection with mobile device support

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  const candidates = [
    'http://localhost:3001/api',
    `http://${hostname}:3001/api`,
    `http://10.245.74.88:3001/api`,
    'http://192.168.1.100:3001/api',
    'http://192.168.0.100:3001/api',
  ];
  
  if (protocol === 'https:') {
    candidates.push(
      'https://localhost:3001/api',
      `https://${hostname}:3001/api`,
      `https://10.245.74.88:3001/api`,
    );
  }
  
  return candidates[0];
};

const API_BASE_URL = getApiBaseUrl();

let currentApiUrl = API_BASE_URL;

const detectApiUrl = async () => {
  const candidates = [
    'http://localhost:3001/api',
    `http://${window.location.hostname}:3001/api`,
    `http://10.245.74.88:3001/api`,
    'http://192.168.1.100:3001/api',
    'http://192.168.0.100:3001/api',
  ];
  
  for (const url of candidates) {
    try {
      const response = await fetch(`${url}/health`, { 
        method: 'GET',
        timeout: 3000 
      });
      if (response.ok) {
        console.log(`Found available API at: ${url}`);
        return url;
      }
    } catch (error) {
      console.log(`API at ${url} unavailable:`, error.message);
    }
  }
  
  console.error('All API addresses are unavailable');
  return null;
};

const getCurrentApiUrl = async () => {
  if (!currentApiUrl) {
    currentApiUrl = await detectApiUrl();
  }
  return currentApiUrl;
};

export const storage = {
  get: async (key) => {
    try {
      const apiUrl = await getCurrentApiUrl();
      if (!apiUrl) {
        throw new Error('Cannot connect to server');
      }
      
      if (key === 'poker-history') {
        const response = await fetch(`${apiUrl}/history`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          return { value: JSON.stringify(result.data) };
        } else {
          console.error('API returned error:', result.error);
          return null;
        }
      } else if (key === 'poker-favorites') {
        const response = await fetch(`${apiUrl}/favorites`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          return { value: JSON.stringify(result.data) };
        } else {
          console.error('API returned error:', result.error);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (key === 'poker-history') {
        return { value: JSON.stringify([]) };
      } else if (key === 'poker-favorites') {
        return { value: JSON.stringify([]) };
      }
      return null;
    }
  },

  set: async (key, value) => {
    try {
      const apiUrl = await getCurrentApiUrl();
      if (!apiUrl) {
        throw new Error('Cannot connect to server');
      }
      
      const data = JSON.parse(value);
      if (key === 'poker-history') {
        const response = await fetch(`${apiUrl}/history`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          console.log('History saved successfully');
          return true;
        } else {
          console.error('Save failed:', result.error);
          return false;
        }
      } else if (key === 'poker-favorites') {
        const response = await fetch(`${apiUrl}/favorites`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          console.log('Favorites saved successfully');
          return true;
        } else {
          console.error('Save failed:', result.error);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to save data:', error);
      return false;
    }
  },

  checkConnection: async () => {
    try {
      const apiUrl = await getCurrentApiUrl();
      if (!apiUrl) {
        return false;
      }
      const response = await fetch(`${apiUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Server connection check failed:', error);
      currentApiUrl = null;
      return false;
    }
  },

  resetApiUrl: () => {
    currentApiUrl = null;
  }
};
