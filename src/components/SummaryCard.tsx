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

export default function SummaryCard({ projectionData, hoursToShow = 12 }: SummaryCardProps) {

  if (!projectionData || projectionData.length === 0) {
    return (
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Resumen del clima</h3>
            <p className="text-neutral-500 dark:text-neutral-400">No hay datos de proyección disponibles.</p>
        </div>
    );
  }
  
  // Verificar los datos recibidos
  console.log(`SummaryCard recibió ${projectionData.length} puntos de datos`);
  if (projectionData.length > 0) {
    const hours = projectionData.map(item => new Date(item.time).getHours());
    console.log(`Horas en los datos: ${hours.join(', ')}`);
  }

  // Usar todos los datos recibidos, ya que deben venir filtrados correctamente desde getProjectionData
  const relevantHours = projectionData;

  return (
    <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">Resumen: 1h atrás hasta 12h adelante</h3>
      <div className="max-h-80 overflow-y-auto pr-2">
        <div className="space-y-3">
          {relevantHours.map((hourData, index) => (
            <div key={index} className="flex justify-between items-center text-sm border-b border-neutral-200 dark:border-neutral-700 pb-2 last:border-b-0 last:pb-0">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {format(new Date(hourData.time), 'HH:mm')} {/* Format time */}
              </span>
              <div className="flex space-x-3 text-right">
                <span title="Temperatura">🌡️ {formatValue(hourData.temperature_2m, '°C', 0)}</span>
                <span title="Precipitación">💧 {formatValue(hourData.precipitation, 'mm', 1)}</span>
                <span title="Velocidad del viento">💨 {formatValue(hourData.wind_speed_10m, 'km/h', 0)}</span>
                {/* Add Humidity if desired */}
                {/* <span title="Humedad">💧 {formatValue(hourData.relative_humidity_2m, '%', 0)}</span> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 