'use client';

import React, { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { getForecastData, getProjectionData, WeatherDataPoint } from '@/lib/openMeteoClient';
import LocationSearch from '@/components/LocationSearch';
import WeatherChart from '@/components/WeatherChart';
import SummaryCard from '@/components/SummaryCard';
import ThemeToggle from '@/components/ThemeToggle';
import AlertBanner from '@/components/AlertBanner';
import WeatherRecommendations from '@/components/WeatherRecommendations';

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

interface Coordinates {
  lat: number | null;
  lon: number | null;
}

export default function Home() {
  const [coords, setCoords] = useState<Coordinates>({ lat: null, lon: null });
  // Valor fijo: siempre mostrar 12 horas hacia adelante desde 1 hora antes de la actual
  const hoursAhead = 12;
  
  // Estados para los datos del clima y estados de carga
  const [projectionData, setProjectionData] = useState<WeatherDataPoint[] | null>(null);
  const [forecastData, setForecastData] = useState<WeatherDataPoint[] | null>(null);
  const [isProjectionLoading, setIsProjectionLoading] = useState<boolean>(false);
  const [isForecastLoading, setIsForecastLoading] = useState<boolean>(false);
  const [projectionError, setProjectionError] = useState<Error | null>(null);
  const [forecastError, setForecastError] = useState<Error | null>(null);

  const handleLocationSelect = (selectedCoords: { lat: number; lon: number }) => {
    setCoords(selectedCoords);
    // Reset errors cuando cambia la ubicación
    setProjectionError(null);
    setForecastError(null);
  };

  // Cargar datos cuando cambien las coordenadas
  React.useEffect(() => {
    if (coords.lat && coords.lon) {
      // Función para cargar todos los datos a la vez
      const loadAllData = async () => {
        setIsProjectionLoading(true);
        setIsForecastLoading(true);
        setProjectionError(null);
        setForecastError(null);
        
        try {
          // Usar Promise.all para realizar ambas peticiones en paralelo
          const [projectionResult, forecastResult] = await Promise.all([
            getProjectionData(
              { latitude: coords.lat, longitude: coords.lon }, 
              hoursAhead
            ).catch(error => {
              console.error('Error loading projection data:', error);
              setProjectionError(error instanceof Error ? error : new Error('Failed to load projection data'));
              return null;
            }),
            
            getForecastData(
              { latitude: coords.lat, longitude: coords.lon }
            ).catch(error => {
              console.error('Error loading forecast data:', error);
              setForecastError(error instanceof Error ? error : new Error('Failed to load forecast data'));
              return null;
            })
          ]);
          
          // Actualizar los estados con los resultados
          if (projectionResult) setProjectionData(projectionResult);
          if (forecastResult) setForecastData(forecastResult);
          
        } finally {
          setIsProjectionLoading(false);
          setIsForecastLoading(false);
        }
      };
      
      loadAllData();
    }
  }, [coords]);

  // Función para recargar todos los datos
  const reloadData = useCallback(() => {
    if (!coords.lat || !coords.lon) return;
    
    setIsProjectionLoading(true);
    setIsForecastLoading(true);
    setProjectionError(null);
    setForecastError(null);
    
    Promise.all([
      getProjectionData(
        { latitude: coords.lat, longitude: coords.lon }, 
        hoursAhead
      ).catch(error => {
        console.error('Error loading projection data:', error);
        setProjectionError(error instanceof Error ? error : new Error('Error al cargar datos de proyección'));
        return null;
      }),
      
      getForecastData(
        { latitude: coords.lat, longitude: coords.lon }
      ).catch(error => {
        console.error('Error loading forecast data:', error);
        setForecastError(error instanceof Error ? error : new Error('Error al cargar datos de pronóstico'));
        return null;
      })
    ]).then(([projectionResult, forecastResult]) => {
      if (projectionResult) setProjectionData(projectionResult);
      if (forecastResult) setForecastData(forecastResult);
    }).finally(() => {
      setIsProjectionLoading(false);
      setIsForecastLoading(false);
    });
  }, [coords]); // Eliminado hoursAhead de las dependencias

  // Combinar estados de carga
  const isLoading = isProjectionLoading || isForecastLoading;

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">¿Qué me pongo?</h1>
        <ThemeToggle />
      </header>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <LocationSearch onLocationSelect={handleLocationSelect} />
      </div>

      <div className="w-full max-w-5xl">
        {isLoading && <p className="text-center">Cargando datos meteorológicos...</p>}
        
        {projectionError && (
          <AlertBanner 
            type="error"
            message={`Error al cargar datos de proyección: ${projectionError.message}`}
            onRetry={reloadData}
            onDismiss={() => setProjectionError(null)}
          />
        )}
        
        {forecastError && (
          <AlertBanner 
            type="error"
            message={`Error al cargar datos de pronóstico: ${forecastError.message}`}
            onRetry={reloadData}
            onDismiss={() => setForecastError(null)}
          />
        )}

        {coords.lat && !isLoading && !projectionError && !forecastError && (
            <div className="space-y-8">
                {projectionData && forecastData && (
                   <WeatherChart
                     forecastData={forecastData}
                     projectionData={projectionData}
                     variable="temperature_2m"
                     label="Temperatura"
                     hoursAhead={hoursAhead}
                   />
                 )}
                 
                 {projectionData && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <SummaryCard projectionData={projectionData} hoursToShow={hoursAhead} />
                     <WeatherRecommendations data={projectionData} />
                   </div>
                 )}
            </div>
        )}

        {!coords.lat && <p className="text-center text-neutral-500 dark:text-neutral-400">Busca una ubicación para ver la proyección del tiempo.</p>}
      </div>
    </main>
  );
}
