'use client';

import { Driver } from '@/types';

interface DriverSelectorProps {
  drivers: Driver[];
  selectedDriverId: string | null;
  onDriverChange: (driverId: string) => void;
  disabled?: boolean;
}

export default function DriverSelector({
  drivers,
  selectedDriverId,
  onDriverChange,
  disabled = false,
}: DriverSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <label htmlFor="driver-select" className="block text-sm font-medium text-gray-700 mb-2">
        Driver
      </label>
      <select
        id="driver-select"
        value={selectedDriverId || ''}
        onChange={(e) => onDriverChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
      >
        <option value="" disabled>
          Select a driver
        </option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.name} {driver.vehicleId ? `(${driver.vehicleId})` : ''}
          </option>
        ))}
      </select>
      {drivers.length === 0 && (
        <p className="mt-2 text-xs text-gray-500">No drivers available</p>
      )}
    </div>
  );
}
