'use client';

import React from 'react';

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

interface DateRangePickerProps {
  selectedDate: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
}

export default function DateRangePicker({ selectedDate, onDateChange }: DateRangePickerProps) {

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(event.target.value); // Pass YYYY-MM-DD string directly
  };

  return (
    <div className="w-full max-w-xs">
      <label htmlFor="date-picker" className="block text-sm font-medium mb-1">
        Select Date
      </label>
      <input
        id="date-picker"
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
        // Optional: Set min/max if needed
        // max={formatDate(new Date())} // Example: Don't allow future dates
      />
    </div>
  );
} 