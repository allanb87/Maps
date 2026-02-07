import { NextRequest, NextResponse } from 'next/server';
import { getDriverDay, getAvailableDates } from '@/lib/repositories/driverRepository';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get('driverId');
    const dateStr = searchParams.get('date');

    if (!driverId) {
      return NextResponse.json(
        { error: 'driverId is required' },
        { status: 400 }
      );
    }

    // If only driverId provided, return available dates
    if (!dateStr) {
      const dates = await getAvailableDates(driverId);
      return NextResponse.json({ availableDates: dates });
    }

    // Parse date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const driverDay = await getDriverDay(driverId, date);

    if (!driverDay) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Convert dates to ISO strings for JSON serialization
    const response = {
      ...driverDay,
      date: driverDay.date.toISOString(),
      gpsTrack: driverDay.gpsTrack.map(point => ({
        ...point,
        timestamp: point.timestamp.toISOString(),
      })),
      stops: driverDay.stops.map(stop => ({
        ...stop,
        arrivalTime: stop.arrivalTime.toISOString(),
        departureTime: stop.departureTime.toISOString(),
      })),
      deliveries: driverDay.deliveries.map(delivery => ({
        ...delivery,
        completedAt: delivery.completedAt?.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch driver day:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver data' },
      { status: 500 }
    );
  }
}
