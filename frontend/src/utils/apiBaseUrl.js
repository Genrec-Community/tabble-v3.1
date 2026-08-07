const DEV_API_PORT = process.env.REACT_APP_API_PORT || '8001';

const getDefaultBaseUrl = () => `http://localhost:${DEV_API_PORT}`;

/**
 * Resolve the backend API base URL at runtime.
 *
 * Development: if the page was opened from a LAN address (e.g. a phone on the
 * same WiFi scanning a table QR code), point API calls at the same hostname so
 * they reach this machine's backend instead of localhost. Falls back to the
 * configured/localhost URL otherwise. Production always uses
 * REACT_APP_API_BASE_URL.
 */
export const getApiBaseUrl = () => {
  const configured = process.env.REACT_APP_API_BASE_URL;
  if (process.env.NODE_ENV === 'development') {
    const { hostname, protocol } = window.location;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:${DEV_API_PORT}`;
    }
    return configured || getDefaultBaseUrl();
  }
  return configured || getDefaultBaseUrl();
};

export const apiBaseUrl = getApiBaseUrl();