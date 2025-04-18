'use client';

import React, { useRef, useEffect } from 'react';
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
import { WeatherIconsGroup } from './WeatherIcons';
import { getWeatherConditions } from './WeatherIcons';

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
  
  // Referencia al chart para acceder a sus métodos
  const chartRef = useRef<ChartJS<"line">>(null);
  
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

  // Efecto para renderizar los iconos después de que el gráfico se haya actualizado
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    
    const renderIcons = () => {
      const ctx = chart.ctx;
      if (!ctx) return;
      
      const meta0 = chart.getDatasetMeta(0); // Forecast
      const meta1 = chart.getDatasetMeta(1); // Projection
      
      // Limpiar íconos anteriores
      const iconContainers = document.querySelectorAll('.weather-icon-container');
      iconContainers.forEach(container => container.remove());
      
      // Crear contenedor principal para los íconos
      const chartContainer = chart.canvas.parentNode as HTMLElement;
      if (!chartContainer) return;
      
      chartContainer.style.position = 'relative';
      
      // Renderizar íconos para forecast
      meta0.data.forEach((point, index) => {
        if (forecastValues[index] === null) return;
        
        const data = {
          temperature_2m: forecastValues[index],
          precipitation: forecastData[index]?.precipitation,
          relative_humidity_2m: forecastData[index]?.relative_humidity_2m,
          wind_speed_10m: forecastData[index]?.wind_speed_10m
        };
        
        renderIconAtPoint(chartContainer, point, data, true);
      });
      
      // Renderizar íconos para projection
      meta1.data.forEach((point, index) => {
        if (projectionValues[index] === null) return;
        
        const data = {
          temperature_2m: projectionValues[index],
          precipitation: projectionData[index]?.precipitation,
          relative_humidity_2m: projectionData[index]?.relative_humidity_2m,
          wind_speed_10m: projectionData[index]?.wind_speed_10m
        };
        
        renderIconAtPoint(chartContainer, point, data, false);
      });
    };
    
    // Renderizar íconos después de que el gráfico se actualice
    chart.options.animation = {
      ...chart.options.animation,
      onComplete: renderIcons
    };
    
    // También renderizar íconos cuando cambian los datos
    renderIcons();
    
    // Limpiar íconos al desmontar
    return () => {
      const iconContainers = document.querySelectorAll('.weather-icon-container');
      iconContainers.forEach(container => {
        // Primero desmontar cualquier root de React
        try {
          const reactRoot = (container as any)._reactRootContainer;
          if (reactRoot) {
            reactRoot.unmount();
          }
        } catch (e) {
          console.error("Error unmounting React component", e);
        }
        // Luego eliminar el contenedor
        container.remove();
      });
    };
  }, [forecastData, projectionData, forecastValues, projectionValues]);
  
  // Función para renderizar un ícono en la posición de un punto
  const renderIconAtPoint = (
    container: HTMLElement, 
    point: any, 
    data: any, 
    isForecast: boolean
  ) => {
    const pos = point.getCenterPoint();
    
    // Crear contenedor para el ícono
    const iconContainer = document.createElement('div');
    iconContainer.className = 'weather-icon-container absolute';
    iconContainer.style.left = `${pos.x}px`;
    iconContainer.style.top = `${pos.y - 25}px`; // Posicionarlo encima del punto
    iconContainer.style.transform = 'translate(-50%, -100%)';
    iconContainer.style.pointerEvents = 'none';
    
    // Renderizar componente React en el contenedor
    if (typeof window !== 'undefined') {
      const ReactDOM = require('react-dom/client');
      // Crear root
      const root = ReactDOM.createRoot(iconContainer);
      // Renderizar el componente usando la nueva API
      root.render(
        <WeatherIconsGroup 
          temperature={data.temperature_2m}
          precipitation={data.precipitation}
          humidity={data.relative_humidity_2m}
          windSpeed={data.wind_speed_10m}
          size="sm"
        />
      );
    }
    
    container.appendChild(iconContainer);
  };
  
  return (
    <div className="relative h-64 md:h-80 lg:h-96 bg-white dark:bg-neutral-800 p-4 rounded-lg shadow">
      <Line
        ref={chartRef}
        options={options}
        data={chartData}
        aria-label={`${label} chart comparing forecast and projection`}
        role="img"
      />
    </div>
  );
} 