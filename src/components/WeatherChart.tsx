'use client';

import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { es } from 'date-fns/locale';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface WeatherDataPoint {
  time: string;
  temperature_2m?: number | null;
  relative_humidity_2m?: number | null;
  precipitation?: number | null;
  wind_speed_10m?: number | null;
  [key: string]: number | string | null | undefined;
}

interface WeatherChartProps {
  forecastData: WeatherDataPoint[];
  projectionData: WeatherDataPoint[];
  variable: string;
  label: string;
  hoursAhead: number;
}

// Helper: busca el valor más cercano con la misma hora, o exacto si existe
function findClosestValue(data: WeatherDataPoint[], labelDate: Date, variable: string): number | null {
  // Exact match (fecha y hora)
  const exact = data.find(point => {
    const pt = new Date(point.time);
    return pt.getFullYear() === labelDate.getFullYear() &&
           pt.getMonth() === labelDate.getMonth() &&
           pt.getDate() === labelDate.getDate() &&
           pt.getHours() === labelDate.getHours();
  });
  if (exact && exact[variable] !== undefined && exact[variable] !== null) {
    return Number(exact[variable]);
  }
  // Si no hay coincidencia exacta, buscar el valor con la misma hora y fecha más cercana
  const candidates = data.filter(point => new Date(point.time).getHours() === labelDate.getHours());
  if (candidates.length === 0) return null;
  let minDiff = Infinity;
  let closest: WeatherDataPoint | null = null;
  candidates.forEach(point => {
    const diff = Math.abs(new Date(point.time).getTime() - labelDate.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  });
  return closest && closest[variable] !== undefined && closest[variable] !== null
    ? Number(closest[variable])
    : null;
}

export default function WeatherChart({ forecastData, projectionData, variable, label, hoursAhead }: WeatherChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Etiquetas del eje X: desde 1h antes hasta hoursAhead después
  const now = new Date();
  const currentHour = now.getHours();
  const hourLabels: Date[] = [];
  for (let i = -1; i <= hoursAhead; i++) {
    const date = new Date(now);
    date.setHours(currentHour + i, 0, 0, 0);
    hourLabels.push(date);
  }

  // Mapeo de datos
  const adjustedForecastValues = hourLabels.map(labelDate =>
    findClosestValue(forecastData, labelDate, variable)
  );
  const adjustedProjectionValues = hourLabels.map(labelDate => {
    const hour = labelDate.getHours();
    const found = projectionData.find(point => new Date(point.time).getHours() === hour);
    return found && found[variable] !== undefined && found[variable] !== null
      ? Number(found[variable])
      : null;
  });

  // Chart.js config
  const chartData: ChartData<'line'> = {
    labels: hourLabels,
    datasets: [
      {
        label: `Pronóstico (${label})`,
        data: adjustedForecastValues,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
        pointRadius: 4,
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
      },
      {
        label: `Proyección (${label})`,
        data: adjustedProjectionValues,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.1,
        pointRadius: 4,
        borderWidth: 2,
        pointBackgroundColor: 'rgb(239, 68, 68)',
      },
    ],
  };

  const unitMap: {[key: string]: string} = {
    temperature_2m: '°C',
    relative_humidity_2m: '%',
    precipitation: 'mm',
    wind_speed_10m: 'km/h'
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 10 },
      },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          displayFormats: { hour: 'HH:00' },
          tooltipFormat: 'dd/MM/yyyy HH:00',
        },
        title: { display: true, text: 'Hora' },
        min: hourLabels[0].toISOString(),
        max: hourLabels[hourLabels.length - 1].toISOString(),
        ticks: {
          autoSkip: true,
          maxTicksLimit: 12,
          callback: value => {
            const date = new Date(value as string);
            return date.getHours() + ':00';
          }
        },
        adapters: { date: { locale: es } },
        bounds: 'ticks'
      },
      y: {
        beginAtZero: variable !== 'temperature_2m',
        title: { display: true, text: unitMap[variable] || '' },
      },
    },
  };

  return (
    <div className="relative h-64 md:h-80 lg:h-96 bg-white dark:bg-neutral-800 p-4 rounded-lg shadow">
      <Line
        ref={chartRef}
        options={options}
        data={chartData}
        aria-label={`Gráfico de ${label} comparando pronóstico y proyección`}
        role="img"
      />
    </div>
  );
} 