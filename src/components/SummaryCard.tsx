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
  forecastData?: WeatherDataPoint[];
  hoursToShow?: number; // How many hours to display in the summary
}

// Helper to format value or return placeholder
const formatValue = (value: number | null | undefined, unit: string, precision: number = 0): string => {
    if (value === null || value === undefined) return '--';
    return `${value.toFixed(precision)}${unit}`;
};

// Helper para encontrar el valor de forecast para una hora
function findForecastValue(forecastData: WeatherDataPoint[] | undefined, time: string, key: keyof WeatherDataPoint) {
  if (!forecastData) return null;
  const hour = new Date(time).getHours();
  const found = forecastData.find(item => new Date(item.time).getHours() === hour);
  return found && found[key] !== undefined && found[key] !== null ? found[key] : null;
}

export default function SummaryCard({ projectionData, forecastData, hoursToShow = 12 }: SummaryCardProps) {

  if (!projectionData || projectionData.length === 0) {
    return (
        <div className="card">
            <h3 className="section-title">Resumen del clima</h3>
            <p style={{ color: 'var(--primary-black)' }}>No hay datos de proyección disponibles.</p>
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

  // Calcular min y max de temperatura para normalizar la barra
  const temps: number[] = [];
  relevantHours.forEach((hourData) => {
    const forecastTemp = findForecastValue(forecastData, hourData.time, 'temperature_2m');
    if (forecastTemp !== null && forecastTemp !== undefined) temps.push(Number(forecastTemp));
    if (hourData.temperature_2m !== null && hourData.temperature_2m !== undefined) temps.push(Number(hourData.temperature_2m));
  });
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  function getBarPercent(temp: number | null | undefined) {
    if (temp === null || temp === undefined) return 0;
    if (maxTemp === minTemp) return 50;
    return 100 * ((Number(temp) - minTemp) / (maxTemp - minTemp));
  }

  return (
    <div className="neobrutal-card" style={{ background: 'var(--primary-yellow)', border: '4px solid var(--primary-black)', boxShadow: '4px 4px 0 var(--primary-red)', padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 8px 24px' }}>
        <span className="section-title" style={{ background: 'var(--primary-yellow)', color: 'var(--primary-black)', border: '3px solid var(--primary-black)', borderRadius: 10, fontSize: 22, fontWeight: 800, padding: '6px 18px', margin: 0 }}>
          Proyección para las próximas horas
        </span>
        <span className="badge-soft" style={{ fontSize: 13, alignSelf: 'flex-start' }}>Proyección</span>
      </div>
      <div style={{ fontSize: 14, color: '#888', fontWeight: 400, marginLeft: 24, marginBottom: 8, fontStyle: 'italic' }}>
        Estimación generada por el sistema a partir de datos recientes y tendencias locales.
      </div>
      <div className="overflow-y-auto pr-2" style={{ padding: '0 8px 18px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {relevantHours.map((hourData, index) => {
            const forecastTemp = findForecastValue(forecastData, hourData.time, 'temperature_2m');
            const projTemp = hourData.temperature_2m;
            const diffTemp = forecastTemp !== null && projTemp !== null ? Number(projTemp) - Number(forecastTemp) : 0;
            const absDiff = Math.abs(diffTemp);
            let badgeColor = '#bbb';
            if (absDiff > 0.5) badgeColor = diffTemp > 0 ? 'var(--primary-red)' : 'var(--primary-blue)';
            const showBadge = absDiff > 0.1;
            const rowClass = index % 2 === 0 ? '' : 'alt-row';
            return (
              <div
                key={index}
                className={rowClass}
                style={{
                  color: 'var(--primary-black)',
                  fontSize: '1.08rem',
                  margin: 0,
                  padding: '7px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--primary-black)',
                  minHeight: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'box-shadow 0.2s',
                  background: undefined,
                }}
              >
                <span style={{ fontWeight: 700, minWidth: 44 }}>{format(new Date(hourData.time), 'HH:mm')}</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary-blue)', minWidth: 48, textAlign: 'right', flex: 1 }}>
                  {forecastTemp !== null && forecastTemp !== undefined ? `${Number(forecastTemp).toFixed(0)}°C` : '--'}
                </span>
                {showBadge && (
                  <span className="badge" style={{ background: badgeColor, color: '#fff', marginLeft: 8, minWidth: 56, textAlign: 'center' }}>
                    {diffTemp > 0 ? `+${diffTemp.toFixed(1)}°C` : `${diffTemp.toFixed(1)}°C`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 