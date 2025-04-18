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
        forecast_days: 2
      },
      timeout: 10000 // 10 segundos
    });

    // Transformar los datos al formato esperado
    const hourlyData = response.data.hourly;
    if (!hourlyData || !hourlyData.time || hourlyData.time.length === 0) {
      throw new Error('No hourly forecast data received');
    }

    // Convertir todos los datos a nuestro formato
    const formattedData = hourlyData.time.map((t: string, index: number) => {
      const dataPoint: WeatherDataPoint = { time: t };
      HOURLY_VARIABLES.forEach(variable => {
        dataPoint[variable] = hourlyData[variable]?.[index] ?? null;
      });
      return dataPoint;
    });
    
    // Calculamos el índice y timestamp actual
    const now = new Date();
    const currentTimestamp = now.getTime();
    
    // Encontrar el índice del punto de datos más cercano a la hora actual (un poco antes)
    let startIndex = -1;
    for (let i = 0; i < formattedData.length - 1; i++) {
      const timeA = new Date(formattedData[i].time).getTime();
      const timeB = new Date(formattedData[i + 1].time).getTime();
      
      if (timeA <= currentTimestamp && timeB > currentTimestamp) {
        startIndex = i;
        break;
      }
    }
    
    // Si no encontramos un índice adecuado, comenzamos desde el principio
    if (startIndex === -1) {
      startIndex = 0;
    }
    
    // Tomamos hasta 48 horas de datos (o menos si no hay tantos)
    const hoursToShow = 48;
    const endIndex = Math.min(startIndex + hoursToShow, formattedData.length);
    
    const filteredData = formattedData.slice(startIndex, endIndex);
    
    console.log(`Pronóstico: Mostrando datos desde ${new Date(filteredData[0].time).toLocaleString()} hasta ${new Date(filteredData[filteredData.length-1].time).toLocaleString()}`);
    console.log(`Datos completos: ${formattedData.length}, Datos filtrados: ${filteredData.length}`);
    
    return filteredData;
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
    
    // Incrementamos a 10 años para obtener proyecciones más precisas
    const NUM_YEARS_HISTORY = 10;
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
          timeout: 30000 // Aumentado a 30 segundos para permitir respuestas más lentas
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

    // Calcular promedios para todas las horas disponibles
    const historicalAverages = calculateAverages(allHourlyData);
    
    if (historicalAverages.length === 0) {
      throw new Error('No data after calculating averages');
    }
    
    // Organizar los datos por hora (0-23)
    const hourlyDataMap: { [hour: number]: WeatherDataPoint } = {};
    historicalAverages.forEach(dataPoint => {
      const hour = new Date(dataPoint.time).getHours();
      hourlyDataMap[hour] = dataPoint;
    });
    
    // Crear una secuencia continua de horas empezando por una hora antes de la hora actual
    const currentHour = today.getHours();
    const startHour = currentHour > 0 ? currentHour - 1 : 23; // Si es hora 0, comenzar desde las 23 del día anterior
    const result: WeatherDataPoint[] = [];
    
    // Obtener desde una hora antes hasta hoursAhead+1 horas después de la hora actual
    for (let i = 0; i <= hoursAhead + 2; i++) { // +2 para incluir una hora antes y una hora más al final
      const hourOffset = i - 1; // -1 para comenzar una hora antes
      const hour = ((startHour + hourOffset) % 24 + 24) % 24; // Aseguramos que sea positivo
      
      if (hourlyDataMap[hour]) {
        // Crear una copia del datapoint con la hora actualizada al día correcto
        const newDataPoint = { ...hourlyDataMap[hour] };
        
        // Calcular el día correcto (ayer, hoy o mañana)
        const dateCopy = new Date(today);
        
        if (hourOffset < 0) {
          // Si estamos en la hora anterior y es 23 (cuando la hora actual es 0), hay que ir al día anterior
          if (startHour === 23 && currentHour === 0) {
            dateCopy.setDate(dateCopy.getDate() - 1);
          }
        } else if (hour < currentHour && hourOffset > 0) {
          // Si la hora calculada es menor que la hora actual y no es la hora anterior, significa que pasamos al día siguiente
          dateCopy.setDate(dateCopy.getDate() + 1);
        }
        
        // Establecer la hora correcta
        dateCopy.setHours(hour, 0, 0, 0);
        
        // Asignar el timestamp correcto
        newDataPoint.time = dateCopy.toISOString();
        
        result.push(newDataPoint);
      }
    }
    
    console.log(`Proyección: Mostrando datos desde ${new Date(result[0].time).toLocaleString()} hasta ${new Date(result[result.length-1].time).toLocaleString()}`);
    console.log(`Datos totales: ${result.length} horas`);
    
    return result;
  } catch (error) {
    console.error('Error fetching projection data:', error);
    throw error;
  }
} 