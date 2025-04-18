'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { buildGeocodingUrl } from '@/lib/openMeteo';
import { useDebounce } from '@/hooks/useDebounce'; // We'll create this hook next

interface LocationSuggestion {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

interface LocationSearchProps {
  onLocationSelect: (coords: { lat: number; lon: number }) => void;
  fullWidth?: boolean;
}

export default function LocationSearch({ onLocationSelect, fullWidth = false }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce input by 300ms

  const apiUrl = buildGeocodingUrl(debouncedSearchTerm);

  const { data: suggestions, error, isLoading } = useSWR<LocationSuggestion[]>(apiUrl, fetcher, {
    shouldRetryOnError: false, // Don't hammer the API on error
    revalidateOnFocus: false, // Avoid revalidating when focusing input
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    if (event.target.value.length > 0) {
        setShowSuggestions(true);
    } else {
        setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (location: LocationSuggestion) => {
    setSearchTerm(location.name); // Update input field to show selected location
    setShowSuggestions(false);
    onLocationSelect({ lat: location.lat, lon: location.lon });
  };

  // Handle clicking outside the component to close suggestions
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    // Use relatedTarget to check if the new focus is inside the component
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setShowSuggestions(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        margin: 0,
        padding: 0,
        background: 'none',
        boxShadow: 'none',
        maxWidth: fullWidth ? '100%' : 340,
      }}
      onBlur={handleBlur}
    >
      <input
        id="location-search"
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => searchTerm && setShowSuggestions(true)}
        placeholder="Buscar ubicación..."
        style={{
          width: '100%',
          height: 48,
          padding: '0 18px',
          border: '3px solid var(--primary-black)',
          borderRadius: 14,
          fontSize: 20,
          fontWeight: 700,
          background: 'var(--primary-white)',
          color: 'var(--primary-black)',
          outline: 'none',
          marginBottom: 0,
          boxShadow: showSuggestions ? '0 0 0 3px var(--primary-yellow)' : 'none',
          transition: 'box-shadow 0.2s',
        }}
      />
      {showSuggestions && (
        <div style={{
          position: 'absolute',
          zIndex: 10,
          top: 50,
          left: 0,
          width: '100%',
          background: 'var(--primary-white)',
          border: '3px solid var(--primary-black)',
          borderTop: 'none',
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
          boxShadow: '2px 2px 0 var(--primary-black)',
          maxHeight: 220,
          overflowY: 'auto',
        }}>
          {isLoading && <div style={{ padding: '10px 16px', fontSize: 15, color: 'var(--primary-blue)' }}>Cargando...</div>}
          {error && <div style={{ padding: '10px 16px', fontSize: 15, color: 'var(--primary-red)' }}>Error al buscar ubicaciones.</div>}
          {suggestions && suggestions.length > 0 && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {suggestions.map((location) => (
                <li
                  key={location.id}
                  onClick={() => handleSuggestionClick(location)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSuggestionClick(location)}
                  style={{
                    padding: '12px 18px',
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--primary-black)',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--primary-yellow)',
                    background: 'var(--primary-white)',
                  }}
                >
                  {location.name}
                </li>
              ))}
            </ul>
          )}
          {suggestions && suggestions.length === 0 && debouncedSearchTerm && !isLoading && (
            <div style={{ padding: '10px 16px', fontSize: 15, color: 'var(--primary-blue)' }}>No se encontraron ubicaciones.</div>
          )}
        </div>
      )}
    </div>
  );
} 