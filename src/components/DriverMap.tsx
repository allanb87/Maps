'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GPSPoint, Stop, Delivery, TimeRange } from '@/types';
import 'leaflet/dist/leaflet.css';

const pickupIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #f59e0b; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const deliveredIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const selectedPickupIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #f59e0b; width: 30px; height: 30px; border-radius: 50%; border: 4px solid #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.35), 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const selectedDeliveredIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #22c55e; width: 30px; height: 30px; border-radius: 50%; border: 4px solid #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.35), 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const startIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #000; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">S</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface DriverMapProps {
  gpsTrack: GPSPoint[];
  stops: Stop[];
  deliveries: Delivery[];
  timeRange: TimeRange | null;
  selectedStopId: string | null;
  onStopSelect: (stopId: string | null) => void;
}

function MapBoundsUpdater({ points, stops }: { points: GPSPoint[]; stops: Stop[] }) {
  const map = useMap();

  useEffect(() => {
    const allCoords: [number, number][] = [
      ...points.map(p => [p.lat, p.lng] as [number, number]),
      ...stops.map(s => [s.lat, s.lng] as [number, number]),
    ];
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points, stops]);

  return null;
}

export default function DriverMap({
  gpsTrack,
  stops,
  deliveries,
  timeRange,
  selectedStopId,
  onStopSelect,
}: DriverMapProps) {
  const filteredTrack = useMemo(() => {
    if (!timeRange) return gpsTrack;
    return gpsTrack.filter(
      point => point.timestamp >= timeRange.start && point.timestamp <= timeRange.end
    );
  }, [gpsTrack, timeRange]);

  const filteredStops = useMemo(() => {
    if (!timeRange) return stops;
    return stops.filter(
      stop => stop.arrivalTime >= timeRange.start && stop.arrivalTime <= timeRange.end
    );
  }, [stops, timeRange]);

  const routePositions = filteredTrack.map(point => [point.lat, point.lng] as [number, number]);

  const getDeliveryForStop = (stopId: string) => {
    return deliveries.find(d => d.stopId === stopId);
  };

  const getStopIcon = (stop: Stop, isSelected: boolean) => {
    if (isSelected) {
      return stop.type === 'pickup' ? selectedPickupIcon : selectedDeliveredIcon;
    }
    return stop.type === 'pickup' ? pickupIcon : deliveredIcon;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  if (typeof window === 'undefined') {
    return <div className="h-full w-full bg-gray-200 flex items-center justify-center">Loading map...</div>;
  }

  return (
    <MapContainer
      center={[51.5074, -0.1278]}
      zoom={13}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsUpdater points={filteredTrack} stops={filteredStops} />

      {/* Route polyline */}
      {routePositions.length > 1 && (
        <Polyline
          positions={routePositions}
          pathOptions={{
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
          }}
        />
      )}

      {/* Start marker */}
      {filteredTrack.length > 0 && (
        <Marker position={[filteredTrack[0].lat, filteredTrack[0].lng]} icon={startIcon}>
          <Popup>
            <div className="text-sm">
              <strong>Start</strong>
              <br />
              {formatTime(filteredTrack[0].timestamp)}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Stop markers */}
      {filteredStops.map(stop => {
        const delivery = getDeliveryForStop(stop.id);
        const isSelected = stop.id === selectedStopId;

        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={getStopIcon(stop, isSelected)}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{
              click: () => onStopSelect(stop.id === selectedStopId ? null : stop.id),
            }}
          >
            <Popup>
              <div className="text-sm min-w-[150px]">
                <strong className={stop.type === 'pickup' ? 'text-amber-600' : 'text-green-600'}>
                  {stop.type === 'pickup' ? 'Pickup (In Transit)' : 'Delivered'}
                </strong>
                {delivery && (
                  <>
                    <br />
                    <span className="text-gray-600">Job #{delivery.jobId}</span>
                  </>
                )}
                <hr className="my-1" />
                <span className="text-gray-500">
                  {formatTime(stop.arrivalTime)}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
