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
      <h3 className="text-lg font-bold mb-4">¿Qué me pongo?</h3>
      <div className="space-y-4">
        {conditions.map((condition, index) => (
          <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start mb-2">
              <div className="mr-3 mt-1">
                <span className={condition.color}>
                  {condition.icon}
                </span>
              </div>
              <div>
                <div className="font-semibold text-base mb-1">{condition.condition}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {getSugerenciaDetallada(condition)}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-700 dark:text-gray-300">
              <div className="mr-2">{condition.clothingIcon}</div>
              <div><span className="font-medium">Sugerencia:</span> {condition.clothing}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Función para generar una sugerencia más detallada basada en la condición
function getSugerenciaDetallada(condition: WeatherCondition): string {
  switch (condition.condition) {
    case 'Muy caluroso':
      return 'Las temperaturas son muy altas. Usa ropa ligera y transpirable. No olvides protegerte del sol y mantenerte hidratado.';
    case 'Caluroso':
      return 'Hace calor, considera usar ropa ligera y cómoda. Es buena idea tener a mano algo para el sol.';
    case 'Temperatura agradable':
      return 'El clima es agradable. Puedes vestir con comodidad sin preocuparte por el frío o el calor.';
    case 'Frío':
      return 'Hay temperatura baja. Considera llevar un abrigo o chaqueta para mantenerte cómodo.';
    case 'Muy frío':
      return 'Las temperaturas son muy bajas. Abrígate bien con varias capas y no olvides guantes y gorro.';
    case 'Lluvia intensa':
      return 'Hay mucha lluvia prevista. Es esencial llevar impermeable y calzado adecuado para evitar mojarse.';
    case 'Lluvia moderada':
      return 'Se espera lluvia moderada. Un paraguas o impermeable será necesario.';
    case 'Lluvia ligera':
      return 'Hay posibilidad de lluvia ligera. Ten a mano algo para cubrirte en caso necesario.';
    case 'Cielo despejado':
      return 'El día se presenta despejado. Disfruta del buen tiempo, pero considera protección solar si pasarás tiempo al aire libre.';
    case 'Humedad alta':
      return 'La humedad es alta. La ropa transpirable te ayudará a sentirte más cómodo.';
    case 'Ambiente seco':
      return 'El ambiente está seco. Mantente hidratado y considera usar humectante para la piel.';
    case 'Viento fuerte':
      return 'Hay viento fuerte. Una chaqueta cortavientos ayudará a protegerte de las ráfagas.';
    case 'Viento moderado':
      return 'Hay algo de viento. Considera llevar una chaqueta ligera o prenda que te proteja.';
    case 'Condiciones normales':
      return 'Las condiciones meteorológicas son normales. Puedes vestir con ropa cómoda acorde a la estación.';
    default:
      return 'Viste de acuerdo con la temperatura actual y lleva contigo lo necesario para cualquier cambio en el clima.';
  }
}

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