'use client';

import React from 'react';
import { WeatherIconsGroup } from './WeatherIcons';

interface WeatherPointLabelProps {
  hour: string;
  data: {
    temperature_2m?: number | null;
    precipitation?: number | null;
    relative_humidity_2m?: number | null;
    wind_speed_10m?: number | null;
  };
  isForecast?: boolean;
}

export const WeatherPointLabel: React.FC<WeatherPointLabelProps> = ({ 
  hour, 
  data, 
  isForecast = false
}) => {
  const formattedHour = new Date(hour).getHours().toString().padStart(2, '0') + ':00';
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-semibold">{formattedHour}</div>
      <WeatherIconsGroup 
        temperature={data.temperature_2m}
        precipitation={data.precipitation}
        humidity={data.relative_humidity_2m}
        windSpeed={data.wind_speed_10m}
        size="sm"
      />
      <div className="text-xs font-medium">
        {isForecast ? 'Pronóstico' : 'Proyección'}
      </div>
    </div>
  );
};

export default WeatherPointLabel; 