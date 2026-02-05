'use client';

import { format } from 'date-fns';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
  minDate,
  maxDate,
  disabled = false,
}: DateSelectorProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (dateStr) {
      const newDate = new Date(dateStr);
      newDate.setHours(0, 0, 0, 0);
      onDateChange(newDate);
    }
  };

  const formatDateForInput = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-2">
        Date
      </label>
      <input
        id="date-select"
        type="date"
        value={formatDateForInput(selectedDate)}
        onChange={handleDateChange}
        min={minDate ? formatDateForInput(minDate) : undefined}
        max={maxDate ? formatDateForInput(maxDate) : undefined}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
      />
      <p className="mt-2 text-xs text-gray-500">
        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
      </p>
    </div>
  );
}
