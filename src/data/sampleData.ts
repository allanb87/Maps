import { DriverDay, GPSPoint, Stop, Delivery } from '@/types';

// Generate GPS points for a realistic delivery route
function generateGPSTrack(date: Date): GPSPoint[] {
  const points: GPSPoint[] = [];
  const baseDate = new Date(date);
  baseDate.setHours(8, 0, 0, 0);

  // Starting point (depot)
  const startLat = 51.5074;
  const startLng = -0.1278;

  // Route waypoints simulating a delivery route through London
  const waypoints = [
    { lat: 51.5074, lng: -0.1278 }, // Start - depot
    { lat: 51.5124, lng: -0.1200 }, // First delivery area
    { lat: 51.5180, lng: -0.1100 }, // Second delivery area
    { lat: 51.5220, lng: -0.0950 }, // Third delivery area
    { lat: 51.5150, lng: -0.0850 }, // Fourth delivery area
    { lat: 51.5080, lng: -0.0900 }, // Fifth delivery area
    { lat: 51.5000, lng: -0.1000 }, // Sixth delivery area
    { lat: 51.4950, lng: -0.1150 }, // Seventh delivery area
    { lat: 51.5074, lng: -0.1278 }, // Return to depot
  ];

  let currentTime = baseDate.getTime();

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];

    // Generate points between waypoints
    const segmentPoints = 20 + Math.floor(Math.random() * 10);

    for (let j = 0; j <= segmentPoints; j++) {
      const progress = j / segmentPoints;
      const lat = start.lat + (end.lat - start.lat) * progress + (Math.random() - 0.5) * 0.001;
      const lng = start.lng + (end.lng - start.lng) * progress + (Math.random() - 0.5) * 0.001;

      // Add some time variation (30 seconds to 2 minutes between points)
      currentTime += 30000 + Math.random() * 90000;

      // Add longer stops at delivery points (beginning of each segment after first)
      if (j === 0 && i > 0) {
        currentTime += 5 * 60 * 1000 + Math.random() * 10 * 60 * 1000; // 5-15 min stop
      }

      points.push({
        lat,
        lng,
        timestamp: new Date(currentTime),
        speed: j === 0 ? 0 : 15 + Math.random() * 35, // 0 at stops, 15-50 km/h while moving
      });
    }
  }

  return points;
}

function generateStops(gpsTrack: GPSPoint[]): Stop[] {
  const stops: Stop[] = [];
  let stopId = 1;

  // Find clusters where speed is 0 or very low
  let inStop = false;
  let stopStart: GPSPoint | null = null;
  let stopPoints: GPSPoint[] = [];

  for (const point of gpsTrack) {
    if ((point.speed ?? 0) < 5) {
      if (!inStop) {
        inStop = true;
        stopStart = point;
        stopPoints = [point];
      } else {
        stopPoints.push(point);
      }
    } else {
      if (inStop && stopStart && stopPoints.length > 2) {
        const lastPoint = stopPoints[stopPoints.length - 1];
        const duration = (lastPoint.timestamp.getTime() - stopStart.timestamp.getTime()) / 60000;

        if (duration >= 3) { // Only count stops longer than 3 minutes
          const avgLat = stopPoints.reduce((sum, p) => sum + p.lat, 0) / stopPoints.length;
          const avgLng = stopPoints.reduce((sum, p) => sum + p.lng, 0) / stopPoints.length;

          stops.push({
            id: `stop-${stopId++}`,
            lat: avgLat,
            lng: avgLng,
            arrivalTime: stopStart.timestamp,
            departureTime: lastPoint.timestamp,
            duration: Math.round(duration),
            type: stopId <= 8 ? 'delivery' : 'break',
          });
        }
      }
      inStop = false;
      stopStart = null;
      stopPoints = [];
    }
  }

  return stops;
}

function generateDeliveries(stops: Stop[]): Delivery[] {
  const deliveryStops = stops.filter(s => s.type === 'delivery');
  const addresses = [
    '123 Baker Street',
    '45 Oxford Street',
    '78 Regent Street',
    '12 Piccadilly',
    '89 Fleet Street',
    '34 Strand',
    '56 Whitehall',
    '90 Victoria Street',
  ];

  const customerNames = [
    'John Smith',
    'Emma Wilson',
    'James Brown',
    'Sarah Davis',
    'Michael Johnson',
    'Lisa Anderson',
    'David Taylor',
    'Jennifer White',
  ];

  return deliveryStops.map((stop, index) => ({
    id: `delivery-${index + 1}`,
    stopId: stop.id,
    address: addresses[index % addresses.length],
    customerName: customerNames[index % customerNames.length],
    status: Math.random() > 0.1 ? 'completed' : 'failed',
    completedAt: stop.departureTime,
    notes: Math.random() > 0.7 ? 'Left with neighbor' : undefined,
  }));
}

export function getSampleDriverDay(): DriverDay {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const gpsTrack = generateGPSTrack(today);
  const stops = generateStops(gpsTrack);
  const deliveries = generateDeliveries(stops);

  return {
    driverId: 'driver-001',
    driverName: 'Alex Thompson',
    date: today,
    gpsTrack,
    stops,
    deliveries,
  };
}
