'use client';

import React from 'react';

interface ProjectionHoursSelectorProps {
  selectedHours: number;
  onHoursChange: (hours: number) => void;
  options?: number[]; // Optional: Allow customizing options
}

const DEFAULT_OPTIONS = [3, 6, 12, 24];

export default function ProjectionHoursSelector({
  selectedHours,
  onHoursChange,
  options = DEFAULT_OPTIONS
}: ProjectionHoursSelectorProps) {

  const handleHoursChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onHoursChange(parseInt(event.target.value, 10));
  };

  return (
    <div className="w-full max-w-xs">
      <label htmlFor="hours-selector" className="block text-sm font-medium mb-1">
        Horas de proyección
      </label>
      <select
        id="hours-selector"
        value={selectedHours}
        onChange={handleHoursChange}
        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
      >
        {options.map(hours => (
          <option key={hours} value={hours}>
            {hours} horas
          </option>
        ))}
      </select>
    </div>
  );
} 