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
}

export default function LocationSearch({ onLocationSelect }: LocationSearchProps) {
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
    <div className="relative w-full max-w-xs" onBlur={handleBlur}> {/* Added onBlur */} 
      <label htmlFor="location-search" className="block text-sm font-medium mb-1">
        Search Location
      </label>
      <input
        id="location-search"
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => searchTerm && setShowSuggestions(true)} // Show on focus if there's text
        placeholder="e.g., London, UK"
        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
      />

      {showSuggestions && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading && <div className="px-3 py-2 text-sm text-neutral-500">Loading...</div>}
          {error && <div className="px-3 py-2 text-sm text-red-500">Error fetching locations.</div>}
          {suggestions && suggestions.length > 0 && (
            <ul>
              {suggestions.map((location) => (
                <li
                  key={location.id}
                  onClick={() => handleSuggestionClick(location)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  // Add tabIndex to make it focusable
                  tabIndex={0} 
                  // Handle selection with Enter key
                  onKeyDown={(e) => e.key === 'Enter' && handleSuggestionClick(location)} 
                >
                  {location.name}
                </li>
              ))}
            </ul>
          )}
          {suggestions && suggestions.length === 0 && debouncedSearchTerm && !isLoading && (
             <div className="px-3 py-2 text-sm text-neutral-500">No locations found.</div>
          )}
        </div>
      )}
    </div>
  );
} 