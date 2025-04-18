'use client';

import React from 'react';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudDrizzle, 
  Snowflake, 
  Wind, 
  Umbrella, 
  Shirt, 
  Glasses,
  Thermometer, 
  ThermometerSnowflake, 
  Droplets,
  ArrowUpCircle
} from 'lucide-react';

// Definimos las condiciones climáticas y sus recomendaciones
export interface WeatherCondition {
  condition: string;
  icon: React.ReactNode;  // Cambiado a ReactNode en lugar de string
  clothing?: string;
  clothingIcon?: React.ReactNode;
  color: string;
}

/**
 * Determina las condiciones climáticas basadas en los datos meteorológicos
 */
export const getWeatherConditions = (
  temperature?: number,
  precipitation?: number,
  humidity?: number,
  windSpeed?: number,
  size: 'sm' | 'md' | 'lg' = 'md'
): WeatherCondition[] => {
  // Definir dimensiones de los iconos según el tamaño
  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  }[size];
  
  const conditions: WeatherCondition[] = [];

  // Temperature based conditions
  if (temperature !== undefined) {
    if (temperature > 30) {
      conditions.push({ 
        condition: 'Muy caluroso', 
        icon: <Thermometer size={iconSize} className="text-red-600" />,
        clothing: 'Ropa ligera, protector solar',
        clothingIcon: <Shirt size={iconSize} className="text-yellow-300" />,
        color: 'text-red-600'
      });
    } else if (temperature > 25) {
      conditions.push({ 
        condition: 'Caluroso', 
        icon: <Sun size={iconSize} className="text-yellow-500" />,
        clothing: 'Ropa ligera',
        clothingIcon: <Shirt size={iconSize} className="text-blue-300" />,
        color: 'text-yellow-500'
      });
    } else if (temperature < 5) {
      conditions.push({ 
        condition: 'Muy frío', 
        icon: <Snowflake size={iconSize} className="text-blue-300" />,
        clothing: 'Abrigo pesado, guantes',
        clothingIcon: <ArrowUpCircle size={iconSize} className="text-blue-800" />,
        color: 'text-blue-300'
      });
    } else if (temperature < 15) {
      conditions.push({ 
        condition: 'Frío', 
        icon: <ThermometerSnowflake size={iconSize} className="text-blue-500" />,
        clothing: 'Chaqueta o abrigo',
        clothingIcon: <ArrowUpCircle size={iconSize} className="text-blue-500" />,
        color: 'text-blue-500'
      });
    } else {
      // Temperatura templada (entre 15 y 25)
      conditions.push({ 
        condition: 'Temperatura agradable', 
        icon: <Sun size={iconSize} className="text-green-500" />,
        clothing: 'Ropa cómoda de entretiempo',
        clothingIcon: <Shirt size={iconSize} className="text-green-400" />,
        color: 'text-green-500'
      });
    }
  }

  // Precipitation based conditions
  if (precipitation !== undefined) {
    if (precipitation > 7) {
      conditions.push({ 
        condition: 'Lluvia intensa', 
        icon: <CloudRain size={iconSize} className="text-blue-600" stroke="currentColor" strokeWidth={2} />,
        clothing: 'Impermeable, botas',
        clothingIcon: <Umbrella size={iconSize} className="text-blue-600" />,
        color: 'text-blue-600'
      });
    } else if (precipitation > 2) {
      conditions.push({ 
        condition: 'Lluvia moderada', 
        icon: <CloudRain size={iconSize} className="text-blue-500" />,
        clothing: 'Paraguas, zapatos impermeables',
        clothingIcon: <Umbrella size={iconSize} className="text-blue-500" />,
        color: 'text-blue-500'
      });
    } else if (precipitation > 0.1) {
      conditions.push({ 
        condition: 'Lluvia ligera', 
        icon: <CloudDrizzle size={iconSize} className="text-blue-400" />,
        clothing: 'Paraguas o impermeable ligero',
        clothingIcon: <Umbrella size={iconSize} className="text-blue-400" />,
        color: 'text-blue-400'
      });
    } else {
      // Sin lluvia - cielo despejado
      if (conditions.length === 0 || (conditions.length === 1 && conditions[0].condition === 'Temperatura agradable')) {
        conditions.push({ 
          condition: 'Cielo despejado', 
          icon: <Sun size={iconSize} className="text-yellow-400" />,
          clothing: 'Ropa normal, quizás gafas de sol',
          clothingIcon: <Glasses size={iconSize} className="text-gray-800" />,
          color: 'text-yellow-400'
        });
      }
    }
  }

  // Humidity based conditions
  if (humidity !== undefined) {
    if (humidity > 80) {
      conditions.push({ 
        condition: 'Humedad alta', 
        icon: <Droplets size={iconSize} className="text-blue-400" />,
        clothing: 'Ropa transpirable',
        clothingIcon: <Shirt size={iconSize} className="text-green-300" />,
        color: 'text-blue-400'
      });
    } else if (humidity < 30) {
      // Condición de baja humedad
      conditions.push({ 
        condition: 'Ambiente seco', 
        icon: <Sun size={iconSize} className="text-orange-400" />,
        clothing: 'Hidratarse bien, ropa ligera',
        clothingIcon: <Shirt size={iconSize} className="text-orange-300" />,
        color: 'text-orange-400'
      });
    }
  }

  // Wind based conditions
  if (windSpeed !== undefined) {
    if (windSpeed > 30) {
      conditions.push({ 
        condition: 'Viento fuerte', 
        icon: <Wind size={iconSize} className="text-gray-600" />,
        clothing: 'Chaqueta cortavientos',
        clothingIcon: <ArrowUpCircle size={iconSize} className="text-gray-500" />,
        color: 'text-gray-600'
      });
    } else if (windSpeed > 15) {
      conditions.push({ 
        condition: 'Viento moderado', 
        icon: <Wind size={iconSize} className="text-gray-500" />,
        clothing: 'Ropa exterior ligera',
        clothingIcon: <ArrowUpCircle size={iconSize} className="text-gray-400" />,
        color: 'text-gray-500'
      });
    }
  }

  // Si después de todo no hay condiciones, agregar una recomendación genérica
  if (conditions.length === 0) {
    conditions.push({ 
      condition: 'Condiciones normales', 
      icon: <Sun size={iconSize} className="text-green-500" />,
      clothing: 'Ropa cómoda para el día',
      clothingIcon: <Shirt size={iconSize} className="text-green-400" />,
      color: 'text-green-500'
    });
  }

  return conditions;
};

/**
 * Componente para mostrar íconos de clima con tooltip
 */
interface WeatherIconProps {
  condition: WeatherCondition;
  size?: 'sm' | 'md' | 'lg';
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ condition, size = 'md' }) => {
  return (
    <div className="relative group inline-block">
      <span className={`${condition.color} cursor-help`}>
        {condition.icon}
      </span>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-48 bg-white dark:bg-gray-800 p-2 rounded shadow-lg 
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10
                    text-xs">
        <div className="font-bold">{condition.condition}</div>
        {condition.clothing && (
          <div className="text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1">
              {condition.clothingIcon}
              <span>{condition.clothing}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Componente para mostrar múltiples íconos juntos
 */
interface WeatherIconsGroupProps {
  temperature?: number | null;
  precipitation?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showClothing?: boolean;
}

export const WeatherIconsGroup: React.FC<WeatherIconsGroupProps> = ({ 
  temperature, precipitation, humidity, windSpeed, size = 'md', showClothing = false 
}) => {
  const conditions = getWeatherConditions(
    temperature === null ? undefined : temperature,
    precipitation === null ? undefined : precipitation,
    humidity === null ? undefined : humidity,
    windSpeed === null ? undefined : windSpeed,
    size
  );
  
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {conditions.map((condition, index) => (
        <div key={index} className="flex items-center gap-1 text-sm">
          <span className={condition.color}>{condition.icon}</span>
          {showClothing && condition.clothing && (
            <div className="flex items-center gap-1 ml-2">
              {condition.clothingIcon}
              <span>{condition.clothing}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 