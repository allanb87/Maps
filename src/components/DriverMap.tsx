'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker, Polyline, useLoadScript } from '@react-google-maps/api';
import {
  MapContainer as LeafletMap,
  TileLayer as LeafletTileLayer,
  Polyline as LeafletPolyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { GPSPoint, Stop, Delivery, TimeRange } from '@/types';
import 'leaflet/dist/leaflet.css';

interface DriverMapProps {
  gpsTrack: GPSPoint[];
  stops: Stop[];
  deliveries: Delivery[];
  timeRange: TimeRange | null;
  selectedStopId: string | null;
  onStopSelect: (stopId: string | null) => void;
}

function LeafletBoundsUpdater({ points, stops }: { points: GPSPoint[]; stops: Stop[] }) {
  const map = useMap();

  useEffect(() => {
    const allCoords: [number, number][] = [
      ...points.map(p => [p.lat, p.lng] as [number, number]),
      ...stops.map(s => [s.lat, s.lng] as [number, number]),
    ];
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
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
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const hasApiKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  });

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFieldName = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const jobDetailKeys = useMemo(
    () => [
      'master_account_name',
      'pickup_location_name',
      'delivery_location_name',
      'service_name',
      'order_eta',
    ],
    []
  );

  const selectedStop = useMemo(
    () => stops.find(stop => stop.id === selectedStopId) ?? null,
    [stops, selectedStopId]
  );

  const selectedDelivery = useMemo(
    () => deliveries.find(delivery => delivery.stopId === selectedStopId) ?? null,
    [deliveries, selectedStopId]
  );

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const allCoords = [
      ...filteredTrack.map(point => ({ lat: point.lat, lng: point.lng })),
      ...filteredStops.map(stop => ({ lat: stop.lat, lng: stop.lng })),
    ];
    if (allCoords.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    allCoords.forEach((coord) => bounds.extend(coord));
    mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    const zoom = mapRef.current.getZoom();
    if (typeof zoom === 'number' && zoom > 16) {
      mapRef.current.setZoom(16);
    }
  }, [filteredTrack, filteredStops, mapReady]);

  if (typeof window === 'undefined') {
    return <div className="h-full w-full bg-gray-200 flex items-center justify-center">Loading map...</div>;
  }

  if (loadError) {
    return (
      <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-600">
        Failed to load Google Maps
      </div>
    );
  }

  if (!isLoaded && hasApiKey) {
    return (
      <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-600">
        Loading map...
      </div>
    );
  }

  const detailsPanel = selectedStop ? (
    <div className="absolute top-4 right-4 w-80 max-w-[90%] bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[1000]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4
            className={`text-sm font-semibold ${
              selectedStop.type === 'pickup' ? 'text-amber-600' : 'text-green-600'
            }`}
          >
            {selectedStop.type === 'pickup' ? 'Pickup (In Transit)' : 'Delivered'}
          </h4>
          {selectedDelivery && (
            <p className="text-xs text-gray-500 mt-1">Job #{selectedDelivery.jobId}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onStopSelect(null)}
          className="text-xs text-gray-500 hover:text-gray-700"
          aria-label="Close details"
        >
          Close
        </button>
      </div>

      {selectedDelivery?.jobDetails && (
        <div className="mt-3 space-y-1 text-xs text-gray-600">
          {jobDetailKeys
            .map((key) => [key, selectedDelivery.jobDetails?.[key]] as const)
            .filter(([, value]) => value !== null && value !== undefined)
            .map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-2">
                <span className="text-gray-400">{formatFieldName(key)}:</span>
                <span className="text-right text-gray-700">{String(value)}</span>
              </div>
            ))}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        {formatTime(selectedStop.arrivalTime)}
      </div>
    </div>
  ) : null;

  if (!hasApiKey) {
    return (
      <div className="h-full w-full relative">
        <LeafletMap
          center={[-25.2744, 133.7751]}
          zoom={4}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <LeafletTileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LeafletBoundsUpdater points={filteredTrack} stops={filteredStops} />

          {/* Route polyline */}
          {routePositions.length > 1 && (
            <LeafletPolyline
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
            <CircleMarker
              center={[filteredTrack[0].lat, filteredTrack[0].lng]}
              radius={8}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#000000', fillOpacity: 1 }}
            />
          )}

          {/* Stop markers */}
          {filteredStops.map((stop) => {
            const isSelected = stop.id === selectedStopId;
            const isDelivery = stop.type === 'delivered';

            return (
              <CircleMarker
                key={stop.id}
                center={[stop.lat, stop.lng]}
                radius={isSelected ? 10 : 7}
                pathOptions={{
                  color: isSelected ? '#2563eb' : '#ffffff',
                  weight: isSelected ? 3 : 2,
                  fillColor: isDelivery ? '#22c55e' : '#f59e0b',
                  fillOpacity: 1,
                }}
                eventHandlers={{
                  click: () => onStopSelect(stop.id === selectedStopId ? null : stop.id),
                }}
              />
            );
          })}
        </LeafletMap>

        <div className="absolute top-4 left-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-md px-3 py-2 shadow-sm">
          Using fallback map. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable Google Maps.
        </div>

        {detailsPanel}
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <GoogleMap
        center={{ lat: -25.2744, lng: 133.7751 }}
        zoom={4}
        mapContainerClassName="h-full w-full"
        options={{
          mapTypeId: 'roadmap',
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
        onLoad={(map) => {
          mapRef.current = map;
          setMapReady(true);
        }}
        onUnmount={() => {
          mapRef.current = null;
          setMapReady(false);
        }}
      >
        {/* Route polyline */}
        {routePositions.length > 1 && (
          <Polyline
            path={routePositions.map(([lat, lng]) => ({ lat, lng }))}
            options={{
              strokeColor: '#3b82f6',
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}

        {/* Start marker */}
        {filteredTrack.length > 0 && (
          <Marker
            position={{ lat: filteredTrack[0].lat, lng: filteredTrack[0].lng }}
            label={{ text: 'S', color: '#ffffff', fontWeight: '700' }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#000000',
              fillOpacity: 1,
              scale: 10,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        )}

        {/* Stop markers */}
        {filteredStops.map((stop) => {
          const isSelected = stop.id === selectedStopId;
          const isDelivery = stop.type === 'delivered';

          return (
            <Marker
              key={stop.id}
              position={{ lat: stop.lat, lng: stop.lng }}
              zIndex={isSelected ? 1000 : 0}
              onClick={() => onStopSelect(stop.id === selectedStopId ? null : stop.id)}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: isDelivery ? '#22c55e' : '#f59e0b',
                fillOpacity: 1,
                scale: isSelected ? 12 : 9,
                strokeColor: isSelected ? '#2563eb' : '#ffffff',
                strokeWeight: isSelected ? 3 : 2,
              }}
            />
          );
        })}
      </GoogleMap>

      {detailsPanel}
    </div>
  );
}
