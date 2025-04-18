'use client';

import React from 'react';
import { getWeatherConditions, WeatherCondition, WeatherIcon } from './WeatherIcons';

interface WeatherRecommendationsProps {
  data: {
    temperature_2m?: number | null;
    precipitation?: number | null;
    relative_humidity_2m?: number | null;
    wind_speed_10m?: number | null;
  }[];
}

export const WeatherRecommendations: React.FC<WeatherRecommendationsProps> = ({ data }) => {
  // Obtener valores promedio para las próximas horas
  const averages = {
    temperature_2m: average(data.map(d => d.temperature_2m).filter(isDefined)),
    precipitation: average(data.map(d => d.precipitation).filter(isDefined)),
    relative_humidity_2m: average(data.map(d => d.relative_humidity_2m).filter(isDefined)),
    wind_speed_10m: average(data.map(d => d.wind_speed_10m).filter(isDefined)),
  };
  
  // Obtener valores máximos para detectar condiciones extremas
  const maxValues = {
    temperature_2m: max(data.map(d => d.temperature_2m).filter(isDefined) as number[]),
    precipitation: max(data.map(d => d.precipitation).filter(isDefined) as number[]),
    relative_humidity_2m: max(data.map(d => d.relative_humidity_2m).filter(isDefined) as number[]),
    wind_speed_10m: max(data.map(d => d.wind_speed_10m).filter(isDefined) as number[]),
  };
  
  // Usar los valores máximos para condiciones extremas
  const conditions = getWeatherConditions(
    maxValues.temperature_2m ?? undefined,
    maxValues.precipitation ?? undefined,
    maxValues.relative_humidity_2m ?? undefined,
    maxValues.wind_speed_10m ?? undefined
  );
  
  // Si no hay condiciones extremas, usar promedios
  if (conditions.length <= 1) {
    const avgConditions = getWeatherConditions(
      averages.temperature_2m ?? undefined,
      averages.precipitation ?? undefined,
      averages.relative_humidity_2m ?? undefined,
      averages.wind_speed_10m ?? undefined
    );
    
    if (avgConditions.length > conditions.length) {
      return <RecommendationsList conditions={avgConditions} />;
    }
  }
  
  return <RecommendationsList conditions={conditions} />;
};

// Componente para mostrar la lista de recomendaciones
interface RecommendationsListProps {
  conditions: WeatherCondition[];
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({ conditions }) => {
  return (
    <div className="neobrutal-card" style={{ background: 'var(--primary-blue)', color: 'var(--primary-white)', margin: 0, padding: 0 }}>
      <h3 className="section-title text-center" style={{ background: 'var(--primary-yellow)', color: 'var(--primary-black)', marginBottom: 0, borderRadius: 12 }}>¿Qué me pongo?</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 20 }}>
        {conditions.map((condition, index) => (
          <div
            key={index}
            className="neobrutal-card"
            style={{
              background: 'var(--primary-white)',
              color: 'var(--primary-black)',
              border: '3px solid var(--primary-black)',
              borderRadius: 14,
              padding: 16,
              marginBottom: 0,
              boxShadow: '2px 2px 0 var(--primary-black)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 80,
              gap: 16,
              transition: 'box-shadow 0.15s, background 0.15s',
            }}
            tabIndex={0}
          >
            <div style={{ marginRight: 16, fontSize: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }}>
              <span>{condition.icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{condition.condition}</div>
              <div style={{ fontSize: 15 }}>{getSugerenciaDetallada(condition)}</div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', fontSize: 15 }}>
                <div style={{ marginRight: 8, fontSize: 22 }}>{condition.clothingIcon}</div>
                <div><span style={{ fontWeight: 700 }}>Sugerencia:</span> {condition.clothing}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Función para generar una sugerencia más detallada basada en la condición
function getSugerenciaDetallada(condition: WeatherCondition): string {
  switch (condition.condition) {
    case 'Muy caluroso':
      return 'Las temperaturas son muy altas. Usa ropa ligera y transpirable. No olvides protegerte del sol y mantenerte hidratado.';
    case 'Caluroso':
      return 'Hace calor, considera usar ropa ligera y cómoda. Es buena idea tener a mano algo para el sol.';
    case 'Temperatura agradable':
      return 'El clima es agradable. Puedes vestir con comodidad sin preocuparte por el frío o el calor.';
    case 'Frío':
      return 'Hay temperatura baja. Considera llevar un abrigo o chaqueta para mantenerte cómodo.';
    case 'Muy frío':
      return 'Las temperaturas son muy bajas. Abrígate bien con varias capas y no olvides guantes y gorro.';
    case 'Lluvia intensa':
      return 'Hay mucha lluvia prevista. Es esencial llevar impermeable y calzado adecuado para evitar mojarse.';
    case 'Lluvia moderada':
      return 'Se espera lluvia moderada. Un paraguas o impermeable será necesario.';
    case 'Lluvia ligera':
      return 'Hay posibilidad de lluvia ligera. Ten a mano algo para cubrirte en caso necesario.';
    case 'Cielo despejado':
      return 'El día se presenta despejado. Disfruta del buen tiempo, pero considera protección solar si pasarás tiempo al aire libre.';
    case 'Humedad alta':
      return 'La humedad es alta. La ropa transpirable te ayudará a sentirte más cómodo.';
    case 'Ambiente seco':
      return 'El ambiente está seco. Mantente hidratado y considera usar humectante para la piel.';
    case 'Viento fuerte':
      return 'Hay viento fuerte. Una chaqueta cortavientos ayudará a protegerte de las ráfagas.';
    case 'Viento moderado':
      return 'Hay algo de viento. Considera llevar una chaqueta ligera o prenda que te proteja.';
    case 'Condiciones normales':
      return 'Las condiciones meteorológicas son normales. Puedes vestir con ropa cómoda acorde a la estación.';
    default:
      return 'Viste de acuerdo con la temperatura actual y lleva contigo lo necesario para cualquier cambio en el clima.';
  }
}

// Función auxiliar para calcular el promedio
function average(values: number[]): number | null {
  const filtered = values.filter((v): v is number => typeof v === 'number');
  if (filtered.length === 0) return null;
  return filtered.reduce((sum, val) => sum + val, 0) / filtered.length;
}

// Función auxiliar para obtener el valor máximo
function max(values: number[]): number | null {
  const filtered = values.filter((v): v is number => typeof v === 'number');
  if (filtered.length === 0) return null;
  return Math.max(...filtered);
}

// Función auxiliar para filtrar valores no nulos
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export default WeatherRecommendations; 