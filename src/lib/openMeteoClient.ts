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
    
    // Filtrar por hora: mostrar desde una hora antes de la hora actual
    const currentHour = new Date().getHours();
    const startHour = currentHour > 0 ? currentHour - 1 : 23; // Si es hora 0, mostrar desde hora 23
    
    const filteredData = formattedData.filter((dataPoint: WeatherDataPoint) => {
      const dataHour = new Date(dataPoint.time).getHours();
      
      // En caso de que estemos cerca de la medianoche
      if (currentHour < startHour) { // Esto pasa cuando currentHour=0 y startHour=23
        return dataHour >= startHour || dataHour >= 0;
      }
      
      // Caso normal
      return dataHour >= startHour;
    });
    
    console.log(`Pronóstico: Filtrando desde la hora ${startHour} (hora actual: ${currentHour})`);
    console.log(`Datos completos: ${formattedData.length}, Datos filtrados: ${filteredData.length}`);
    
    // Si no hay suficientes datos después de filtrar, devolver todos
    if (filteredData.length === 0) {
      console.log('No hay datos después de filtrar, usando todos los datos disponibles');
      return formattedData;
    }
    
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
    const currentHour = today.getHours();
    
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
    
    // Filtrar por hora: mostrar desde una hora antes de la hora actual
    const startHour = currentHour > 0 ? currentHour - 1 : 23; // Si es hora 0, mostrar desde hora 23
    const endHour = (currentHour + hoursAhead) % 24; // Calcular la hora final (módulo 24 para manejar el ciclo de 24 horas)
    
    console.log(`Filtrando desde hora ${startHour} hasta hora ${endHour} (hora actual: ${currentHour})`);
    
    // Separar los datos por hora para facilitar el filtrado
    const hourToDataMap: { [hour: number]: WeatherDataPoint } = {};
    
    historicalAverages.forEach(dataPoint => {
      const dataHour = new Date(dataPoint.time).getHours();
      hourToDataMap[dataHour] = dataPoint;
    });
    
    // Construir el arreglo de datos filtrados
    const filteredData: WeatherDataPoint[] = [];
    
    // Agregar la hora anterior a la actual
    if (hourToDataMap[startHour]) {
      filteredData.push(hourToDataMap[startHour]);
    }
    
    // Agregar la hora actual y las horas siguientes
    for (let h = 0; h <= hoursAhead; h++) {
      const hourToAdd = (currentHour + h) % 24;
      if (hourToDataMap[hourToAdd]) {
        filteredData.push(hourToDataMap[hourToAdd]);
      }
    }
    
    console.log(`Hora actual: ${currentHour}. Mostrando datos desde hace 1 hora hasta ${hoursAhead} horas adelante`);
    console.log(`Datos completos: ${historicalAverages.length}, Datos filtrados: ${filteredData.length}`);
    
    // Verificar si tenemos suficientes datos (debería ser hoursAhead + 1 para incluir la hora actual)
    if (filteredData.length < hoursAhead + 1) {
      console.log('No hay suficientes datos después de filtrar, usando los primeros datos disponibles');
      return historicalAverages.slice(0, hoursAhead + 2); // +2 para incluir la hora actual y una hora antes
    }
    
    // Devolver los datos filtrados
    return filteredData;
  } catch (error) {
    console.error('Error fetching projection data:', error);
    throw error;
  }
} 