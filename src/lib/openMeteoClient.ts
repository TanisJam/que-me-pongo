/**
 * Cliente para hacer llamadas directas a la API de Open-Meteo desde el frontend.
 * Esto elimina la necesidad de hacer llamadas a través del backend de Next.js.
 */

import axios from 'axios';

// Define tipos para coordenadas y datos del clima
interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export interface WeatherDataPoint {
  time: string;
  temperature_2m?: number | null;
  relative_humidity_2m?: number | null;
  precipitation?: number | null;
  wind_speed_10m?: number | null;
  [key: string]: number | string | null | undefined;
}

// Variables horarias que queremos obtener de las APIs
const HOURLY_VARIABLES = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation',
  'wind_speed_10m',
];

/**
 * Formatea fecha como YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calcula promedios de datos históricos del clima
 */
function calculateAverages(allHourlyData: any[]): WeatherDataPoint[] {
  if (!allHourlyData.length || !allHourlyData[0]?.hourly?.time) {
    return [];
  }

  const referenceYearData = allHourlyData[0].hourly;
  const numTimeSteps = referenceYearData.time.length;
  const averages: WeatherDataPoint[] = [];

  for (let i = 0; i < numTimeSteps; i++) {
    const time = referenceYearData.time[i];
    const avgData: WeatherDataPoint = { time };

    HOURLY_VARIABLES.forEach(variable => {
      let sum = 0;
      let count = 0;
      allHourlyData.forEach(yearData => {
        if (yearData?.hourly?.[variable]?.[i] !== null && yearData?.hourly?.[variable]?.[i] !== undefined) {
          sum += yearData.hourly[variable][i];
          count++;
        }
      });
      // Store average or null if no data points
      avgData[variable] = count > 0 ? parseFloat((sum / count).toFixed(2)) : null;
    });
    averages.push(avgData);
  }
  return averages;
}

/**
 * Obtiene datos de pronóstico directamente de la API de Open-Meteo
 */
export async function getForecastData(coords: Coordinates): Promise<WeatherDataPoint[]> {
  if (!coords.latitude || !coords.longitude) {
    throw new Error('Missing coordinates');
  }

  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        hourly: HOURLY_VARIABLES.join(','),
        timezone: 'America/Argentina/Buenos_Aires',
        forecast_days: 1
      },
      timeout: 10000 // 10 segundos
    });

    // Transformar los datos al formato esperado
    const hourlyData = response.data.hourly;
    if (!hourlyData || !hourlyData.time || hourlyData.time.length === 0) {
      throw new Error('No hourly forecast data received');
    }

    return hourlyData.time.map((t: string, index: number) => {
      const dataPoint: WeatherDataPoint = { time: t };
      HOURLY_VARIABLES.forEach(variable => {
        dataPoint[variable] = hourlyData[variable]?.[index] ?? null;
      });
      return dataPoint;
    });
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw error;
  }
}

/**
 * Obtiene datos históricos para proyección directamente de la API de Open-Meteo
 */
export async function getProjectionData(coords: Coordinates, hoursAhead: number): Promise<WeatherDataPoint[]> {
  if (!coords.latitude || !coords.longitude || !hoursAhead) {
    throw new Error('Missing coordinates or hoursAhead parameter');
  }

  try {
    const today = new Date();
    const targetDate = formatDate(today);
    const currentYear = today.getUTCFullYear();
    
    // Reducimos a solo 3 años para minimizar problemas de timeout
    const NUM_YEARS_HISTORY = 3;
    const allHourlyData = [];

    // Obtener datos históricos para cada año secuencialmente
    for (let i = 0; i < NUM_YEARS_HISTORY; i++) {
      const year = currentYear - 1 - i;
      const dateForYear = `${year}-${targetDate.substring(5)}`; // Keep MM-DD, change year

      try {
        const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
          params: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            start_date: dateForYear,
            end_date: dateForYear,
            hourly: HOURLY_VARIABLES.join(','),
            timezone: 'America/Argentina/Buenos_Aires',
          },
          timeout: 10000 // 10 segundos
        });

        console.log(`Successfully retrieved data for year ${year}`);
        allHourlyData.push(response.data);
      } catch (yearError) {
        console.warn(`Failed to retrieve data for year ${year}:`, yearError);
        // Continuamos con el siguiente año
      }
    }

    if (allHourlyData.length === 0) {
      throw new Error('Failed to fetch any historical data for projection');
    }

    // Calcular promedios y devolver solo las horas solicitadas
    const historicalAverages = calculateAverages(allHourlyData);
    return historicalAverages.slice(0, hoursAhead);
  } catch (error) {
    console.error('Error fetching projection data:', error);
    throw error;
  }
} 