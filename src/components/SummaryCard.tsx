'use client';

import React from 'react';
import { format } from 'date-fns'; // Use date-fns for formatting

interface WeatherDataPoint {
    time: string; // ISO 8601 format
    temperature_2m?: number | null;
    relative_humidity_2m?: number | null;
    precipitation?: number | null;
    wind_speed_10m?: number | null;
    // Add other potential variables here
}

interface SummaryCardProps {
  projectionData: WeatherDataPoint[];
  hoursToShow?: number; // How many hours to display in the summary
}

// Helper to format value or return placeholder
const formatValue = (value: number | null | undefined, unit: string, precision: number = 0): string => {
    if (value === null || value === undefined) return '--';
    return `${value.toFixed(precision)}${unit}`;
};

export default function SummaryCard({ projectionData, hoursToShow = 3 }: SummaryCardProps) {

  if (!projectionData || projectionData.length === 0) {
    return (
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Next Hours Summary</h3>
            <p className="text-neutral-500 dark:text-neutral-400">No projection data available.</p>
        </div>
    );
  }

  const relevantHours = projectionData.slice(0, hoursToShow);

  return (
    <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">Next {hoursToShow} Hours</h3>
      <div className="space-y-3">
        {relevantHours.map((hourData, index) => (
          <div key={index} className="flex justify-between items-center text-sm border-b border-neutral-200 dark:border-neutral-700 pb-2 last:border-b-0 last:pb-0">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {format(new Date(hourData.time), 'HH:mm')} {/* Format time */}
            </span>
            <div className="flex space-x-3 text-right">
              <span title="Temperature">🌡️ {formatValue(hourData.temperature_2m, '°C', 0)}</span>
              <span title="Precipitation">💧 {formatValue(hourData.precipitation, 'mm', 1)}</span>
              <span title="Wind Speed">💨 {formatValue(hourData.wind_speed_10m, 'km/h', 0)}</span>
              {/* Add Humidity if desired */}
              {/* <span title="Humidity">💧 {formatValue(hourData.relative_humidity_2m, '%', 0)}</span> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 