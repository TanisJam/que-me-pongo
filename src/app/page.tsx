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
import WaveLoader from '@/components/WaveLoader';

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
      console.log('<<reload forecastResult:>>', forecastResult);
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
    <main className="min-h-screen flex flex-col items-center p-0" style={{ background: 'var(--background)' }}>
      <header className="header-block w-full max-w-4xl mt-8" style={{ marginBottom: 0 }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>¿Qué me pongo?</h1>
        <ThemeToggle />
      </header>

      {/* Si no hay ubicación, solo mostrar la barra de búsqueda centrada y un mensaje */}
      {!coords.lat && (
        <div style={{ width: '100%', maxWidth: 480, margin: '64px auto 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary-black)', marginBottom: 12, textAlign: 'center' }}>
            Busca una ubicación para ver el pronóstico y recomendaciones
          </div>
          <LocationSearch onLocationSelect={handleLocationSelect} fullWidth />
        </div>
      )}

      {/* Si hay ubicación, mostrar el contenedor principal azul y los bloques internos */}
      {coords.lat && (
        <section
          className="w-full max-w-4xl"
          style={{
            background: 'var(--primary-blue)',
            border: '5px solid var(--primary-black)',
            borderRadius: 32,
            marginTop: 0,
            marginBottom: 0,
            padding: '32px 24px',
            boxShadow: '6px 6px 0 var(--primary-black)',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          {/* Recomendaciones */}
          <div className="neobrutal-card" style={{ background: 'var(--primary-white)', margin: 0, padding: 0 }}>
            {projectionData ? (
              <WeatherRecommendations data={projectionData} />
            ) : (
              <div className="section-title text-center" style={{ background: 'var(--primary-yellow)', color: 'var(--primary-black)', marginBottom: 0, borderRadius: 12 }}>¿Qué me pongo?</div>
            )}
          </div>

          {/* Búsqueda de ubicación: fondo amarillo */}
          <div className="neobrutal-card" style={{ width: '100%', margin: 0, background: 'var(--primary-yellow)', padding: 20 }}>
            <LocationSearch onLocationSelect={handleLocationSelect} fullWidth />
          </div>

          {/* Gráfica: fondo blanco */}
          <div className="neobrutal-card" style={{ background: 'var(--primary-white)', margin: 0, padding: 20 }}>
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80 }}>
                <WaveLoader height={48} width={120} />
              </div>
            )}
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
            {projectionData && forecastData && !isLoading && !projectionError && !forecastError && (
              <WeatherChart
                forecastData={forecastData}
                projectionData={projectionData}
                variable="temperature_2m"
                label="Temperatura"
                hoursAhead={hoursAhead}
              />
            )}
          </div>

          {/* Resumen pronóstico: fondo rojo, texto blanco */}
          <div style={{ background: 'var(--primary-red)', border: '3px solid var(--primary-black)', borderRadius: 18, padding: 20, margin: 0, color: 'var(--primary-white)' }}>
            {projectionData && !isLoading && !projectionError && !forecastError && (
              <SummaryCard projectionData={projectionData} forecastData={forecastData ?? undefined} hoursToShow={hoursAhead} />
            )}
          </div>
        </section>
      )}
    </main>
  );
}
