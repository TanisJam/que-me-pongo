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
  TimeScale, // Import TimeScale for time-based x-axis
  ChartOptions, // Import ChartOptions type
  ChartData // Import ChartData type
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns'; // Import the date adapter

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // Register TimeScale
);

interface WeatherDataPoint {
    time: string; // ISO 8601 format
    temperature_2m?: number | null;
    relative_humidity_2m?: number | null;
    precipitation?: number | null;
    wind_speed_10m?: number | null;
    // Add other potential variables here
}

interface WeatherChartProps {
  forecastData: WeatherDataPoint[];
  projectionData: WeatherDataPoint[];
  variable: keyof Omit<WeatherDataPoint, 'time'>; // Variable to display (e.g., 'temperature_2m')
  label: string; // Label for the dataset (e.g., 'Temperature (°C)')
  hoursAhead: number; // Needed for filtering forecast data
}

// Helper to get variable unit
const getUnit = (variable: keyof Omit<WeatherDataPoint, 'time'>): string => {
    switch (variable) {
        case 'temperature_2m': return '°C';
        case 'relative_humidity_2m': return '%';
        case 'precipitation': return 'mm';
        case 'wind_speed_10m': return 'km/h';
        default: return '';
    }
};

export default function WeatherChart({ forecastData, projectionData, variable, label, hoursAhead }: WeatherChartProps) {

  // --- Data Alignment --- 
  // The projectionData contains the specific hours we need (from current hour + hoursAhead).
  // The forecastData contains a broader range (e.g., next 24 hours).
  // We need to filter forecastData to only include the time points present in projectionData.

  const projectionTimes = new Set(projectionData.map(d => d.time));
  const alignedForecastData = forecastData.filter(d => projectionTimes.has(d.time));

  // Ensure the filtered forecast data matches the projection data length for direct mapping
  // This assumes both APIs return data aligned to the same hourly intervals (e.g., :00)
  // If alignment issues occur, more sophisticated matching might be needed.
  const forecastValues = projectionData.map(projPoint => {
      const matchingForecast = alignedForecastData.find(forecastPoint => forecastPoint.time === projPoint.time);
      return matchingForecast ? (matchingForecast[variable] ?? null) : null; // Use null if no match or data is null/undefined
  });

  const chartData: ChartData<'line'> = {
    labels: projectionData.map(d => d.time), // Use projection times for labels
    datasets: [
      {
        label: `Forecast (${label})`,
        data: forecastValues, // Use aligned forecast values
        borderColor: 'rgb(59, 130, 246)', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
        pointRadius: 3, // Match projection point radius or adjust as desired
      },
      {
        label: `Projection (${label})`,
        data: projectionData.map(d => d[variable] ?? null),
        borderColor: 'rgb(239, 68, 68)', // Red
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.1,
        pointRadius: 3,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${label} - Forecast vs. Projection`,
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
          tooltipFormat: 'PPpp', // Format for tooltip (requires date-fns)
          displayFormats: {
            hour: 'HH:mm' // Format for axis labels
          }
        },
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: `${label} (${getUnit(variable)})`,
        },
        beginAtZero: variable === 'precipitation', // Start y-axis at 0 for precipitation
      },
    },
    interaction: { // Improve hover interaction
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
      <div className="relative h-64 md:h-80 lg:h-96 bg-white dark:bg-neutral-800 p-4 rounded-lg shadow">
          {/* Add ARIA attributes for accessibility */}
          <Line
            options={options}
            data={chartData}
            aria-label={`${label} chart comparing forecast and projection`}
            role="img"
          />
      </div>
  );
} 