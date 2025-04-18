'use client';

import React, { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { getForecastData, getProjectionData, WeatherDataPoint } from '@/lib/openMeteoClient';
import LocationSearch from '@/components/LocationSearch';
import ProjectionHoursSelector from '@/components/ProjectionHoursSelector';
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
  const [hoursAhead, setHoursAhead] = useState<number>(6); // Default to 6 hours
  
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

  // Función para cargar datos de proyección
  const loadProjectionData = useCallback(async () => {
    if (!coords.lat || !coords.lon) return;
    
    setIsProjectionLoading(true);
    setProjectionError(null);
    
    try {
      const data = await getProjectionData(
        { latitude: coords.lat, longitude: coords.lon }, 
        hoursAhead
      );
      setProjectionData(data);
    } catch (error) {
      console.error('Error loading projection data:', error);
      setProjectionError(error instanceof Error ? error : new Error('Failed to load projection data'));
    } finally {
      setIsProjectionLoading(false);
    }
  }, [coords, hoursAhead]);

  // Función para cargar datos de pronóstico
  const loadForecastData = useCallback(async () => {
    if (!coords.lat || !coords.lon) return;
    
    setIsForecastLoading(true);
    setForecastError(null);
    
    try {
      const data = await getForecastData({ latitude: coords.lat, longitude: coords.lon });
      setForecastData(data);
    } catch (error) {
      console.error('Error loading forecast data:', error);
      setForecastError(error instanceof Error ? error : new Error('Failed to load forecast data'));
    } finally {
      setIsForecastLoading(false);
    }
  }, [coords]);

  // Cargar datos cuando cambien las coordenadas o las horas
  React.useEffect(() => {
    if (coords.lat && coords.lon) {
      loadProjectionData();
      loadForecastData();
    }
  }, [coords, hoursAhead, loadProjectionData, loadForecastData]);

  // Manejar cambio en horas de proyección
  const handleHoursChange = (newHours: number) => {
    setHoursAhead(newHours);
  };

  // Combinar estados de carga
  const isLoading = isProjectionLoading || isForecastLoading;

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Que me pongo?</h1>
        <ThemeToggle />
      </header>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <LocationSearch onLocationSelect={handleLocationSelect} />
        <ProjectionHoursSelector selectedHours={hoursAhead} onHoursChange={handleHoursChange} />
      </div>

      <div className="w-full max-w-5xl">
        {isLoading && <p className="text-center">Loading weather data...</p>}
        
        {projectionError && (
          <AlertBanner 
            type="error"
            message={`Error al cargar datos de proyección: ${projectionError.message}`}
            onRetry={loadProjectionData}
            onDismiss={() => setProjectionError(null)}
          />
        )}
        
        {forecastError && (
          <AlertBanner 
            type="error"
            message={`Error al cargar datos de pronóstico: ${forecastError.message}`}
            onRetry={loadForecastData}
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
                     label="Temperature"
                     hoursAhead={hoursAhead}
                   />
                 )}
                 
                 {projectionData && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <SummaryCard projectionData={projectionData} hoursToShow={hoursAhead <= 6 ? hoursAhead : 6} />
                     <WeatherRecommendations data={projectionData} />
                   </div>
                 )}
            </div>
        )}

        {!coords.lat && <p className="text-center text-neutral-500 dark:text-neutral-400">Please search for a location to see the weather projection.</p>}
      </div>
    </main>
  );
}
