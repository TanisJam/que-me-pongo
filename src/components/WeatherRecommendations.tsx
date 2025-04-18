'use client';

import React from 'react';
import { getWeatherConditions, WeatherCondition, WeatherIcon } from './WeatherIcons';

interface WeatherRecommendationsProps {
  data: {
    temperature_2m?: number | null;
    precipitation?: number | null;
    relative_humidity_2m?: number | null;
    wind_speed_10m?: number | null;
  }[];
}

export const WeatherRecommendations: React.FC<WeatherRecommendationsProps> = ({ data }) => {
  // Obtener valores promedio para las próximas horas
  const averages = {
    temperature_2m: average(data.map(d => d.temperature_2m).filter(isDefined)),
    precipitation: average(data.map(d => d.precipitation).filter(isDefined)),
    relative_humidity_2m: average(data.map(d => d.relative_humidity_2m).filter(isDefined)),
    wind_speed_10m: average(data.map(d => d.wind_speed_10m).filter(isDefined)),
  };
  
  // Obtener valores máximos para detectar condiciones extremas
  const maxValues = {
    temperature_2m: max(data.map(d => d.temperature_2m).filter(isDefined)),
    precipitation: max(data.map(d => d.precipitation).filter(isDefined)),
    relative_humidity_2m: max(data.map(d => d.relative_humidity_2m).filter(isDefined)),
    wind_speed_10m: max(data.map(d => d.wind_speed_10m).filter(isDefined)),
  };
  
  // Usar los valores máximos para condiciones extremas
  const conditions = getWeatherConditions(
    maxValues.temperature_2m, 
    maxValues.precipitation, 
    maxValues.relative_humidity_2m, 
    maxValues.wind_speed_10m
  );
  
  // Si no hay condiciones extremas, usar promedios
  if (conditions.length <= 1) {
    const avgConditions = getWeatherConditions(
      averages.temperature_2m, 
      averages.precipitation, 
      averages.relative_humidity_2m, 
      averages.wind_speed_10m
    );
    
    if (avgConditions.length > conditions.length) {
      return <RecommendationsList conditions={avgConditions} />;
    }
  }
  
  return <RecommendationsList conditions={conditions} />;
};

// Componente para mostrar la lista de recomendaciones
interface RecommendationsListProps {
  conditions: WeatherCondition[];
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({ conditions }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-2">¿Qué me pongo?</h3>
      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <div key={index} className="flex items-start">
            <div className="mr-2">
              <WeatherIcon condition={condition} size="md" />
            </div>
            <div>
              <div className="font-medium">{condition.label}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {condition.recommendation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Función auxiliar para calcular el promedio
function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

// Función auxiliar para obtener el valor máximo
function max(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.max(...values);
}

// Función auxiliar para filtrar valores no nulos
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export default WeatherRecommendations; 