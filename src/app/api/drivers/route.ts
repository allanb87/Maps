import { NextResponse } from 'next/server';
import { getAllDrivers } from '@/lib/repositories/driverRepository';

export async function GET() {
  try {
    const drivers = await getAllDrivers();
    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Failed to fetch drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}
