/**
 * Open Meteo API related utility functions.
 */

// Define the types for coordinates if they aren't globally available
interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

/**
 * Builds the URL for the internal geocoding API.
 * @param name Location name to search for.
 * @returns The API URL string or null if name is empty.
 */
export const buildGeocodingUrl = (name: string): string | null => {
  if (!name) return null;
  return `/api/geocoding?name=${encodeURIComponent(name)}`;
};

/**
 * Builds the URL for the internal historical data API.
 * @param coords Latitude and longitude.
 * @param startDate Start date (YYYY-MM-DD).
 * @param endDate End date (YYYY-MM-DD).
 * @param hourlyVariables Comma-separated string of hourly variables.
 * @returns The API URL string or null if params are missing.
 */
export const buildHistoricalUrl = (
  coords: Coordinates,
  startDate: string,
  endDate: string,
  hourlyVariables: string
): string | null => {
  if (!coords.latitude || !coords.longitude || !startDate || !endDate || !hourlyVariables) {
    return null;
  }
  return `/api/historical?latitude=${coords.latitude}&longitude=${coords.longitude}&start_date=${startDate}&end_date=${endDate}&hourly=${hourlyVariables}`;
};

/**
 * Builds the URL for the internal projection API.
 * @param coords Latitude and longitude.
 * @param hoursAhead Number of hours to project ahead.
 * @returns The API URL string or null if params are missing.
 */
export const buildProjectionUrl = (
  coords: Coordinates,
  hoursAhead: number
): string | null => {
  if (!coords.latitude || !coords.longitude || !hoursAhead) {
    return null;
  }
  return `/api/projection?latitude=${coords.latitude}&longitude=${coords.longitude}&hoursAhead=${hoursAhead}`;
};

/**
 * Builds the URL for the internal forecast API.
 * @param coords Latitude and longitude.
 * @returns The API URL string or null if coordinates are missing.
 */
export const buildForecastUrl = (
  coords: Coordinates
): string | null => {
  if (!coords.latitude || !coords.longitude) {
    return null;
  }
  // No need for hoursAhead here, the forecast API endpoint fetches a fixed range (e.g., 24 hours)
  return `/api/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}`;
};

// Add more utility functions as needed, e.g., for formatting data 