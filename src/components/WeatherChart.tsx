'use client';

import React from 'react';
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

// Helper to get variable unit
const getUnit = (variable: string): string => {
  switch (variable) {
    case 'temperature_2m': return '°C';
    case 'relative_humidity_2m': return '%';
    case 'precipitation': return 'mm';
    case 'wind_speed_10m': return 'km/h';
    default: return '';
  }
};

export default function WeatherChart({ forecastData, projectionData, variable, label, hoursAhead }: WeatherChartProps) {
  
  // --- Debug logging ---
  console.log('WeatherChart rendering with:');
  console.log(`Projection data (${projectionData.length} items)`);
  console.log(`Forecast data (${forecastData.length} items)`);
  
  // Create arrays for projection values
  const projectionValues: (number | null)[] = [];
  const projectionTimes: string[] = [];
  
  projectionData.forEach(item => {
    projectionTimes.push(item.time);
    const value = item[variable];
    projectionValues.push(value !== undefined && value !== null ? Number(value) : null);
  });
  
  // Find forecast values that correspond to the same hours as projection values
  const forecastValues: (number | null)[] = Array(projectionTimes.length).fill(null);
  
  // Extract hour from time string
  const getHour = (timeString: string): number => {
    return new Date(timeString).getHours();
  };
  
  // Map of hours in projection data
  const projectionHours = projectionTimes.map(getHour);
  
  // Fill in forecast values that match projection hours
  forecastData.forEach(item => {
    const hour = getHour(item.time);
    const index = projectionHours.indexOf(hour);
    
    if (index !== -1) {
      const value = item[variable];
      forecastValues[index] = value !== undefined && value !== null ? Number(value) : null;
    }
  });
  
  // If we don't have any forecast values, use a simpler approach: just take the first N values
  const hasForecastValues = forecastValues.some(v => v !== null);
  
  if (!hasForecastValues && forecastData.length > 0) {
    console.log('No matching forecast hours found. Using sequential values.');
    for (let i = 0; i < Math.min(forecastData.length, projectionTimes.length); i++) {
      const value = forecastData[i][variable];
      forecastValues[i] = value !== undefined && value !== null ? Number(value) : null;
    }
  }
  
  console.log('Projection values:', projectionValues);
  console.log('Forecast values:', forecastValues);
  
  const chartData: ChartData<'line'> = {
    labels: projectionTimes,
    datasets: [
      {
        label: `Forecast (${label})`,
        data: forecastValues,
        borderColor: 'rgb(59, 130, 246)', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
        pointRadius: 4,
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
      },
      {
        label: `Projection (${label})`,
        data: projectionValues,
        borderColor: 'rgb(239, 68, 68)', // Red
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.1,
        pointRadius: 4,
        borderWidth: 2,
        pointBackgroundColor: 'rgb(239, 68, 68)',
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12 }
        }
      },
      title: {
        display: true,
        text: `${label} - Forecast vs. Projection`,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${context.parsed.y} ${getUnit(variable)}`;
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          tooltipFormat: 'PPpp',
          displayFormats: {
            hour: 'HH:mm'
          },
          parser: 'yyyy-MM-dd\'T\'HH:mm'
        },
        title: {
          display: true,
          text: 'Hora del día',
          font: { weight: 'bold' }
        },
        grid: {
          display: true,
          color: 'rgba(200, 200, 200, 0.2)'
        },
        ticks: {
          source: 'auto',
          maxRotation: 0,
          autoSkip: false
        }
      },
      y: {
        title: {
          display: true,
          text: `${label} (${getUnit(variable)})`,
          font: { weight: 'bold' }
        },
        beginAtZero: variable === 'precipitation',
        grid: {
          display: true,
          color: 'rgba(200, 200, 200, 0.2)'
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className="relative h-64 md:h-80 lg:h-96 bg-white dark:bg-neutral-800 p-4 rounded-lg shadow">
      <Line
        options={options}
        data={chartData}
        aria-label={`${label} chart comparing forecast and projection`}
        role="img"
      />
    </div>
  );
} 